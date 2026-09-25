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
import { desc, count, eq } from "drizzle-orm";

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
    .mutation(() => {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "The legacy waitlist is closed. Use the Founding Workflow Setup application.",
      });
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
