/**
 * Ebook Lead Magnet Router — Kindai Estimating Suite
 *
 * Public: ebook.capture — submit name + email, get ebook delivered instantly
 * Admin:  ebook.list   — view all ebook leads + nurture status
 * Admin:  ebook.stats  — aggregate counts
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { ebookLeads } from "../../drizzle/schema";
import { eq, desc, count } from "drizzle-orm";
import { sendEbookDelivery } from "../ebookEmail";
import {
  buildMetaUserData,
  extractMetaClickIdentifiers,
  sendMetaConversionEvent,
} from "../metaCapi";

// ─── Public: Capture lead + send ebook ──────────────────────────────────────

export const ebookRouter = router({
  capture: publicProcedure
    .input(
      z.object({
        name: z.string().min(2).max(255),
        email: z.string().email(),
        trade: z.string().max(64).optional(),
        source: z.string().max(128).optional(),
        utmSource: z.string().max(128).optional(),
        utmCampaign: z.string().max(128).optional(),
        utmMedium: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Check for duplicate
      const db = (await getDb())!;

      const existing = await db
        .select({ id: ebookLeads.id, ebookSentAt: ebookLeads.ebookSentAt })
        .from(ebookLeads)
        .where(eq(ebookLeads.email, input.email.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        // Already signed up — resend the ebook if they haven't received it
        if (!existing[0].ebookSentAt) {
          await sendEbookDelivery({ to: input.email, name: input.name });
          await db
            .update(ebookLeads)
            .set({ ebookSentAt: Date.now() })
            .where(eq(ebookLeads.id, existing[0].id));
        }
        return { success: true, alreadyRegistered: true };
      }

      // Insert new lead
      const [inserted] = await db
        .insert(ebookLeads)
        .values({
          name: input.name,
          email: input.email.toLowerCase(),
          trade: input.trade,
          source: input.source ?? "guide_page",
          utmSource: input.utmSource,
          utmCampaign: input.utmCampaign,
          utmMedium: input.utmMedium,
        })
        .$returningId();

      // Send ebook immediately
      const messageId = await sendEbookDelivery({
        to: input.email,
        name: input.name,
      });

      // Mark ebook as sent
      if (messageId) {
        await db
          .update(ebookLeads)
          .set({ ebookSentAt: Date.now() })
          .where(eq(ebookLeads.id, inserted.id));
      }

      console.log(`[Ebook] New lead captured: ${input.email} (${input.name})`);

      // ─── Meta CAPI: Lead (ebook download = lead capture) ──
      const ebookFbIds = extractMetaClickIdentifiers(ctx.req.headers.cookie);
      const ebookClientIp =
        (ctx.req.headers["x-forwarded-for"] as string | undefined)
          ?.split(",")
          .map((v) => v.trim())
          .find(Boolean) ?? ctx.req.socket.remoteAddress ?? undefined;

      sendMetaConversionEvent({
        eventName: "Lead",
        eventId: `ebook_lead_${inserted.id}_${Date.now()}`,
        actionSource: "website",
        eventSourceUrl: ctx.req.headers.referer ?? "https://kindaiestimator.com/guide",
        customData: {
          currency: "AUD",
          value: 0,
          content_name: "Ebook Lead Magnet",
          content_category: "Lead Generation",
          source: input.source ?? "guide_page",
          trade: input.trade,
        },
        userData: buildMetaUserData({
          email: input.email,
          name: input.name,
          clientIpAddress: ebookClientIp,
          clientUserAgent: ctx.req.headers["user-agent"] ?? undefined,
          fbp: ebookFbIds.fbp,
          fbc: ebookFbIds.fbc,
        }),
      }).catch((err: unknown) => {
        console.error(
          "[Meta CAPI] Failed to send ebook Lead event:",
          err instanceof Error ? err.message : String(err)
        );
      });

      return { success: true, alreadyRegistered: false };
    }),

  // ─── Admin: List all ebook leads ──────────────────────────────────────────

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

      const leads = await db
        .select()
        .from(ebookLeads)
        .orderBy(desc(ebookLeads.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return leads;
    }),

  // ─── Admin: Stats ──────────────────────────────────────────────────────────

  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = (await getDb())!;

    const [total] = await db.select({ count: count() }).from(ebookLeads);
    const [ebookSent] = await db
      .select({ count: count() })
      .from(ebookLeads)
      .where(eq(ebookLeads.ebookSentAt, ebookLeads.ebookSentAt)); // non-null trick

    const [converted] = await db
      .select({ count: count() })
      .from(ebookLeads)
      .where(eq(ebookLeads.convertedToBeta, true));

    return {
      total: total.count,
      ebookSent: ebookSent.count,
      converted: converted.count,
    };
  }),
});
