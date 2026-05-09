import { z } from "zod";
import { eq, count, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { betaSignups } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { createBetaSignupInHubSpot } from "../hubspot";
import { sendBetaWelcomeEmail } from "../welcomeEmail";
import { scheduleNurtureForSignup } from "./betaNurture";
import { sendPilotLeadEmails } from "../resendEmail";
import {
  buildMetaUserData,
  extractMetaClickIdentifiers,
  sendMetaConversionEvent,
} from "../metaCapi";

const BETA_SPOTS_TOTAL = 25;

export const betaRouter = router({
  // Public: get current beta stats (spots claimed, spots remaining)
  getStats: publicProcedure.query(async () => {
    const db = (await getDb())!;
    const [result] = await db.select({ total: count() }).from(betaSignups);
    const claimed = result?.total ?? 0;
    return {
      claimed,
      total: BETA_SPOTS_TOTAL,
      remaining: Math.max(0, BETA_SPOTS_TOTAL - claimed),
      isFull: claimed >= BETA_SPOTS_TOTAL,
    };
  }),

  // Public: submit beta signup
  signup: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        email: z.string().email(),
        phone: z.string().max(30).optional(),
        company: z.string().max(255).optional(),
        trade: z.string().max(64).optional(),
        intent: z.enum(["Pilot Spot Request", "Paid Pilot Setup", "Setup Call Request"]).optional(),
        state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        projectSize: z.enum(["sole_trader", "small_builder", "mid_tier", "enterprise"]).optional(),
        feedback: z.string().max(1000).optional(),
        source: z.string().max(64).optional(),
        utmCampaign: z.string().max(128).optional(),
        utmSource: z.string().max(128).optional(),
        utmMedium: z.string().max(128).optional(),
        utmContent: z.string().max(128).optional(),
        utmTerm: z.string().max(128).optional(),
        landingPath: z.string().max(255).optional(),
        referrerHost: z.string().max(255).optional(),
        sourceUrl: z.string().url().max(2048).optional(),
        leadEventId: z.string().max(255).optional(),
        fbp: z.string().max(255).optional(),
        fbc: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      // Check if already signed up
      const existing = await db
        .select({ id: betaSignups.id })
        .from(betaSignups)
        .where(eq(betaSignups.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, alreadyRegistered: true };
      }

      // Check if spots available
      const [countResult] = await db.select({ total: count() }).from(betaSignups);
      const claimed = countResult?.total ?? 0;
      if (claimed >= BETA_SPOTS_TOTAL) {
        return { success: false, isFull: true };
      }

      // Insert signup
      const insertResult = await db.insert(betaSignups).values({
        name: input.name,
        email: input.email,
        phone: input.phone,
        company: input.company,
        trade: input.trade,
        state: input.state,
        projectSize: input.projectSize,
        feedback: input.feedback,
        source: input.source ?? "website",
        intent: input.intent ?? "Pilot Spot Request",
        utmCampaign: input.utmCampaign,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmContent: input.utmContent,
        utmTerm: input.utmTerm,
        landingPath: input.landingPath,
        referrerHost: input.referrerHost,
        status: "pending",
      });
      const signupId = Number((insertResult as any)[0]?.insertId ?? (insertResult as any).insertId ?? claimed + 1);

      const requestIdentifiers = extractMetaClickIdentifiers(ctx.req.headers.cookie);
      const clientIpAddress = (ctx.req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")
        .map((value) => value.trim())
        .find(Boolean) ?? ctx.req.socket.remoteAddress ?? undefined;
      const clientUserAgent = ctx.req.headers["user-agent"] ?? undefined;
      const eventSourceUrl = input.sourceUrl ?? ctx.req.headers.referer ?? "https://kindaiestimator.com/beta";

      sendMetaConversionEvent({
        eventName: "Lead",
        eventId: input.leadEventId,
        actionSource: "website",
        eventSourceUrl,
        customData: {
          currency: "AUD",
          value: 0,
          content_name: "Beta Sign-up",
          content_category: "Kindai Estimating Suite",
          source: input.source ?? "website",
          intent: input.intent ?? "Pilot Spot Request",
          trade: input.trade,
          state: input.state,
          project_size: input.projectSize,
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
          utm_content: input.utmContent,
          utm_term: input.utmTerm,
          landing_path: input.landingPath,
          spot_number: claimed + 1,
        },
        userData: buildMetaUserData({
          email: input.email,
          name: input.name,
          clientIpAddress,
          clientUserAgent,
          fbp: input.fbp ?? requestIdentifiers.fbp,
          fbc: input.fbc ?? requestIdentifiers.fbc,
        }),
      }).catch((err: unknown) => {
        console.error("[Meta CAPI] Failed to send beta lead event:", err instanceof Error ? err.message : String(err));
      });

      // Notify owner
      await notifyOwner({
        title: "🎉 New Beta Signup!",
        content: `${input.name} (${input.email}) requested a Kindai pilot. Phone: ${input.phone ?? "not provided"}. Trade: ${input.trade ?? "not specified"}. Intent: ${input.intent ?? "Pilot Spot Request"}. Spot #${claimed + 1} of ${BETA_SPOTS_TOTAL}.`,
      });

      const spotNumber = claimed + 1;

      sendPilotLeadEmails({
        name: input.name,
        email: input.email,
        phone: input.phone,
        tradeType: input.trade,
        intent: input.intent ?? "Pilot Spot Request",
      })
        .then((result) => {
          if (result.leadSent) return;
          return sendBetaWelcomeEmail({
            name: input.name,
            email: input.email,
            spotNumber,
            trade: input.trade,
          });
        })
        .catch((err: unknown) => console.error("[Resend] Failed to send pilot lead emails:", err));

      // Schedule nurture email sequence (fire-and-forget)
      scheduleNurtureForSignup({
        id: signupId,
        name: input.name,
        email: input.email,
        spotNumber,
        trade: input.trade,
      }).catch((err: unknown) => console.error("[Nurture] Failed to schedule nurture sequence:", err));

      // Push to HubSpot CRM — save IDs back to DB row so admin dashboard shows them
      createBetaSignupInHubSpot({
        name: input.name,
        email: input.email,
        company: input.company,
        trade: input.trade,
        state: input.state,
        projectSize: input.projectSize,
        spotNumber,
      })
        .then(async (hubspotResult) => {
          if (hubspotResult && signupId) {
            try {
              const dbForUpdate = (await getDb())!;
              await dbForUpdate
                .update(betaSignups)
                .set({
                  hubspotContactId: hubspotResult.contactId,
                  hubspotDealId: hubspotResult.dealId,
                })
                .where(eq(betaSignups.id, signupId));
              console.log(`[HubSpot] Saved contactId=${hubspotResult.contactId}, dealId=${hubspotResult.dealId} for signup #${signupId}`);
            } catch (updateErr: unknown) {
              console.error("[HubSpot] Failed to save IDs to DB:", updateErr instanceof Error ? updateErr.message : String(updateErr));
            }
          }
        })
        .catch((err: unknown) => console.error("[HubSpot] Failed to create CRM record:", err instanceof Error ? err.message : String(err)));

      return { success: true, alreadyRegistered: false, spotNumber };
    }),

  // Admin: list all beta signups
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Forbidden");
    }
    const db = (await getDb())!;
    return db.select().from(betaSignups).orderBy(sql`${betaSignups.createdAt} DESC`);
  }),

  // Admin: approve a beta signup
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      const [signup] = await db
        .select()
        .from(betaSignups)
        .where(eq(betaSignups.id, input.id))
        .limit(1);

      await db
        .update(betaSignups)
        .set({ status: "approved", approvedAt: new Date() })
        .where(eq(betaSignups.id, input.id));

      if (signup?.email) {
        sendMetaConversionEvent({
          eventName: "CompleteRegistration",
          eventId: `beta_approval_${signup.id}_${Date.now()}`,
          actionSource: "system_generated",
          eventSourceUrl: "https://kindaiestimator.com/beta",
          customData: {
            currency: "AUD",
            value: 0,
            content_name: "Beta Founding Member Approved",
            status: "approved",
            source: signup.source ?? "website",
            trade: signup.trade,
            state: signup.state,
            project_size: signup.projectSize,
            hubspot_contact_id: signup.hubspotContactId,
            hubspot_deal_id: signup.hubspotDealId,
          },
          userData: buildMetaUserData({
            email: signup.email,
            name: signup.name,
          }),
        }).catch((err: unknown) => {
          console.error("[Meta CAPI] Failed to send beta approval event:", err instanceof Error ? err.message : String(err));
        });
      }

      return { success: true };
    }),
});
