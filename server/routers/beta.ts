import { z } from "zod";
import { eq, count, sql } from "drizzle-orm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { betaSignups } from "../../drizzle/schema";
import { notifyOwner } from "../_core/notification";
import { createBetaSignupInHubSpot } from "../hubspot";
import { sendBetaWelcomeEmail } from "../welcomeEmail";
import { sendApologyEmail } from "../apologyEmail";
import { sendPilotLeadEmails } from "../resendEmail";
import { scheduleNurtureForSignup } from "./betaNurture";

const BETA_SPOTS_TOTAL = 25;
const FOUNDING_SETUP_SPOTS_TOTAL = 5;

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
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const isFoundingSetupApplication =
        input.intent === "Paid Pilot Setup" && input.source === "live_plan_evaluation";

      if (!isFoundingSetupApplication) {
        return { success: false, isFull: false, retired: true };
      }

      const normalizedEmail = input.email.trim().toLowerCase();

      // Reuse a legacy lead record instead of letting the unique email constraint block a paid application.
      const existing = await db
        .select({ id: betaSignups.id, status: betaSignups.status, paymentStatus: betaSignups.paymentStatus })
        .from(betaSignups)
        .where(eq(betaSignups.email, normalizedEmail))
        .limit(1);

      if (existing[0]?.status === "active" && existing[0]?.paymentStatus === "paid") {
        return { success: true, alreadyRegistered: true };
      }

      // Check if spots available
      const [countResult] = await db.select({ total: count() }).from(betaSignups);
      const claimed = countResult?.total ?? 0;
      if (!isFoundingSetupApplication && claimed >= BETA_SPOTS_TOTAL) {
        return { success: false, isFull: true };
      }

      const applicationValues = {
        name: input.name,
        email: normalizedEmail,
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
        status: "pending" as const,
      };

      let signupId: number;
      if (existing[0]) {
        await db.update(betaSignups).set(applicationValues).where(eq(betaSignups.id, existing[0].id));
        signupId = existing[0].id;
      } else {
        const insertResult = await db.insert(betaSignups).values(applicationValues);
        signupId = Number((insertResult as any)[0]?.insertId ?? (insertResult as any).insertId ?? claimed + 1);
      }

      // Notify owner
      await notifyOwner({
        title: isFoundingSetupApplication ? "New KindAI Founding Workflow Setup Application" : "New KindAI Pilot Request",
        content: isFoundingSetupApplication
          ? `${input.name} (${input.email}) applied for the A$2,500 plus GST Founding Workflow Setup. No payment has been taken. Phone: ${input.phone ?? "not provided"}. Company: ${input.company ?? "not provided"}. Trade: ${input.trade ?? "not specified"}. Notes: ${input.feedback ?? "none"}.`
          : `${input.name} (${input.email}) requested a KindAI pilot. Phone: ${input.phone ?? "not provided"}. Trade: ${input.trade ?? "not specified"}. Intent: ${input.intent ?? "Pilot Spot Request"}. Spot #${claimed + 1} of ${BETA_SPOTS_TOTAL}.`,
      });

      const spotNumber = claimed + 1;

      sendPilotLeadEmails({
        name: input.name,
        email: input.email,
        phone: input.phone,
        tradeType: input.trade,
        intent: input.intent ?? "Pilot Spot Request",
        source: input.source,
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

      // Founding Workflow Setup applications receive a direct acknowledgement only. They do not
      // enter the legacy beta urgency/social-proof nurture sequence.
      if (!isFoundingSetupApplication) {
        scheduleNurtureForSignup({
          id: signupId,
          name: input.name,
          email: input.email,
          spotNumber,
          trade: input.trade,
        }).catch((err: unknown) => console.error("[Nurture] Failed to schedule nurture sequence:", err));
      }

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

      if (!signup) throw new Error("Application not found");

      if (signup.intent === "Paid Pilot Setup" && signup.status === "pending") {
        const [cohort] = await db
          .select({ total: count() })
          .from(betaSignups)
          .where(sql`${betaSignups.intent} = 'Paid Pilot Setup' AND ${betaSignups.status} IN ('approved', 'active')`);
        if ((cohort?.total ?? 0) >= FOUNDING_SETUP_SPOTS_TOTAL) {
          throw new Error("The five-place Founding Workflow Setup cohort is already full");
        }
      }

      await db
        .update(betaSignups)
        .set({ status: "approved", approvedAt: new Date() })
        .where(eq(betaSignups.id, input.id));

      return { success: true };
    }),

  // Admin: send apology/welcome-back email to a specific signup
  sendApology: protectedProcedure
    .input(z.object({ id: z.number(), ebookUrl: z.string().url().optional(), ebookTitle: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      const [signup] = await db
        .select()
        .from(betaSignups)
        .where(eq(betaSignups.id, input.id))
        .limit(1);

      if (!signup) throw new Error("Signup not found");

      const messageId = await sendApologyEmail({
        name: signup.name,
        email: signup.email,
        spotNumber: signup.id,
        trade: signup.trade ?? undefined,
        ebookUrl: input.ebookUrl,
        ebookTitle: input.ebookTitle,
      });

      return { success: !!messageId, messageId };
    }),

  // Admin: send apology email to ALL approved signups (bulk)
  sendApologyBulk: protectedProcedure
    .input(z.object({ ebookUrl: z.string().url().optional(), ebookTitle: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      const signups = await db
        .select()
        .from(betaSignups)
        .where(eq(betaSignups.status, "approved"));

      const results: Array<{ email: string; success: boolean; messageId?: string | null }> = [];

      for (const signup of signups) {
        // Small delay between sends to avoid rate limiting
        await new Promise((r) => setTimeout(r, 1000));
        const messageId = await sendApologyEmail({
          name: signup.name,
          email: signup.email,
          spotNumber: signup.id,
          trade: signup.trade ?? undefined,
          ebookUrl: input.ebookUrl,
          ebookTitle: input.ebookTitle,
        });
        results.push({ email: signup.email, success: !!messageId, messageId });
      }

      return { sent: results.filter((r) => r.success).length, failed: results.filter((r) => !r.success).length, results };
    }),
});
