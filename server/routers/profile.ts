import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const profileRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    return user ?? ctx.user;
  }),

  update: protectedProcedure.input(z.object({
    companyName: z.string().optional(),
    abn: z.string().optional(),
    phone: z.string().optional(),
    state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    licenseNumber: z.string().optional(),
    defaultTrade: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    await db.update(users).set(input as any).where(eq(users.id, ctx.user.id));
    return { success: true };
  }),
});
