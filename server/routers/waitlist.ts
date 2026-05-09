/**
 * Waitlist Router — Kindai Estimating Suite
 *
 * All 25 beta spots are filled. New interested users submit a form
 * explaining what they do and why they want access.
 *
 * Public: waitlist.join — submit name, email, trade, reason
 * Admin:  waitlist.list — view all waitlist entries
 * Admin:  waitlist.stats — aggregate counts
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { waitlist } from "../../drizzle/schema";
import { eq, desc, count } from "drizzle-orm";
import { sendEmail } from "./../../server/resendSender";
import {
  brandedEmailWrap,
  brandedH2,
  brandedP,
  brandedCta,
  brandedSignature,
} from "../emailBrand";
import {
  buildMetaUserData,
  extractMetaClickIdentifiers,
  sendMetaConversionEvent,
} from "../metaCapi";

// ─── Waitlist confirmation email ──────────────────────────────────────────────

function buildWaitlistConfirmationEmail(name: string): string {
  const firstName = name.split(" ")[0] || name;

  const bodyHtml = `
    ${brandedH2(`You're on the list, ${firstName}.`)}
    ${brandedP(`All 25 founding beta spots have been claimed — but you haven't missed out.`)}
    ${brandedP(`We've got your details and we're reviewing applications now. When a spot opens up or we expand access, you'll be one of the first to know.`)}
    ${brandedP(`In the meantime, here's a free guide that shows exactly how Kindai turns construction plans into accurate quotes in under 60 seconds:`)}
    ${brandedCta("Download the Free Guide", "https://kindaiestimator.com/guide")}
    ${brandedP(`If you've got questions or want to tell us more about your business, just reply to this email — I read every one.`)}
    ${brandedSignature()}
  `;

  return brandedEmailWrap({ bodyHtml });
}

// ─── Public: Join waitlist ────────────────────────────────────────────────────

export const waitlistRouter = router({
  join: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        email: z.string().email(),
        trade: z.string().min(2).max(128),
        reason: z.string().min(10).max(2000),
        phone: z.string().max(20).optional(),
        source: z.string().max(128).optional(),
        utmSource: z.string().max(128).optional(),
        utmCampaign: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = (await getDb())!;

      // Check for duplicate
      const existing = await db
        .select({ id: waitlist.id })
        .from(waitlist)
        .where(eq(waitlist.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, alreadyRegistered: true };
      }

      // Insert new waitlist entry
      const [inserted] = await db
        .insert(waitlist)
        .values({
          name: input.name,
          email: input.email.toLowerCase(),
          trade: input.trade,
          reason: input.reason,
          phone: input.phone,
          source: input.source ?? "homepage",
          utmSource: input.utmSource,
          utmCampaign: input.utmCampaign,
        })
        .$returningId();

      console.log(`[Waitlist] New entry: ${input.email} (${input.name}) — ${input.trade}`);

      // Send confirmation email
      const html = buildWaitlistConfirmationEmail(input.name);
      sendEmail({
        to: input.email.toLowerCase(),
        subject: "You're on the Kindai waitlist",
        html,
        fromName: "Matt from Kindai",
      }).then((msgId) => {
        if (msgId) {
          db.update(waitlist)
            .set({ confirmationSentAt: Date.now() })
            .where(eq(waitlist.id, inserted.id))
            .catch(() => {});
        }
      }).catch((err: unknown) => {
        console.error("[Waitlist] Failed to send confirmation:", err instanceof Error ? err.message : String(err));
      });

      // ─── Meta CAPI: Lead event ──
      const fbIds = extractMetaClickIdentifiers(ctx.req.headers.cookie);
      const clientIp =
        (ctx.req.headers["x-forwarded-for"] as string | undefined)
          ?.split(",")
          .map((v) => v.trim())
          .find(Boolean) ?? ctx.req.socket.remoteAddress ?? undefined;

      sendMetaConversionEvent({
        eventName: "Lead",
        eventId: `waitlist_${inserted.id}_${Date.now()}`,
        actionSource: "website",
        eventSourceUrl: ctx.req.headers.referer ?? "https://kindaiestimator.com",
        customData: {
          currency: "AUD",
          value: 0,
          content_name: "Waitlist Signup",
          content_category: "Lead Generation",
          source: input.source ?? "homepage",
          trade: input.trade,
        },
        userData: buildMetaUserData({
          email: input.email,
          name: input.name,
          clientIpAddress: clientIp,
          clientUserAgent: ctx.req.headers["user-agent"] ?? undefined,
          fbp: fbIds.fbp,
          fbc: fbIds.fbc,
        }),
      }).catch((err: unknown) => {
        console.error("[Meta CAPI] Failed to send waitlist Lead event:", err instanceof Error ? err.message : String(err));
      });

      return { success: true, alreadyRegistered: false };
    }),

  // ─── Admin: List all waitlist entries ──────────────────────────────────────

  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(200).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = (await getDb())!;

      const entries = await db
        .select()
        .from(waitlist)
        .orderBy(desc(waitlist.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return entries;
    }),

  // ─── Admin: Stats ──────────────────────────────────────────────────────────

  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = (await getDb())!;

    const [total] = await db.select({ count: count() }).from(waitlist);
    const [approved] = await db
      .select({ count: count() })
      .from(waitlist)
      .where(eq(waitlist.status, "approved"));

    return {
      total: total.count,
      approved: approved.count,
      pending: total.count - approved.count,
    };
  }),
});
