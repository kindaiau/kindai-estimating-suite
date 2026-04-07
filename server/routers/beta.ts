import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { betaSignups } from "../../drizzle/schema";
import { eq, count, sql } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

const BETA_SPOTS_TOTAL = 100;

export const betaRouter = router({
  // Public: get current beta stats (spots claimed, spots remaining)
  getStats: publicProcedure.query(async () => {
    const db = (await getDb())!;
    const [result] = await db
      .select({ total: count() })
      .from(betaSignups);
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
        company: z.string().max(255).optional(),
        trade: z.string().max(64).optional(),
        state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
        projectSize: z.enum(["sole_trader", "small_builder", "mid_tier", "enterprise"]).optional(),
        feedback: z.string().max(1000).optional(),
        source: z.string().max(64).optional(),
        utmCampaign: z.string().max(128).optional(),
      })
    )
    .mutation(async ({ input }) => {
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
      await db!.insert(betaSignups).values({
        name: input.name,
        email: input.email,
        company: input.company,
        trade: input.trade,
        state: input.state,
        projectSize: input.projectSize,
        feedback: input.feedback,
        source: input.source ?? "website",
        utmCampaign: input.utmCampaign,
        status: "pending",
      });

      // Notify owner
      await notifyOwner({
        title: "🎉 New Beta Signup!",
        content: `${input.name} (${input.email}) from ${input.company ?? "unknown company"} just joined the Kindai beta. Trade: ${input.trade ?? "not specified"}. State: ${input.state ?? "not specified"}. Spot #${claimed + 1} of ${BETA_SPOTS_TOTAL}.`,
      });

      return { success: true, alreadyRegistered: false, spotNumber: claimed + 1 };
    }),

  // Admin: list all beta signups
  list: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Forbidden");
    }
    const db = (await getDb())!;
    return db
      .select()
      .from(betaSignups)
      .orderBy(sql`${betaSignups.createdAt} DESC`);
  }),

  // Admin: approve a beta signup
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;
      await db
        .update(betaSignups)
        .set({ status: "approved", approvedAt: new Date() })
        .where(eq(betaSignups.id, input.id));
      return { success: true };
    }),
});
