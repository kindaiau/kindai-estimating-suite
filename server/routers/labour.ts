import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { labourRates } from "../../drizzle/schema";
import { eq, and, or, isNull } from "drizzle-orm";
import { DEFAULT_LABOUR_RATES } from "../../shared/trades";

export const labourRouter = router({
  list: protectedProcedure.input(z.object({ trade: z.string().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [or(isNull(labourRates.userId), eq(labourRates.userId, ctx.user.id))];
    if (input.trade) conditions.push(eq(labourRates.trade, input.trade));
    const rows = await db.select().from(labourRates)
      .where(and(...conditions, eq(labourRates.isActive, true)));
    return rows;
  }),

  seedDefaults: protectedProcedure.input(z.object({ trade: z.string() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const defaults = DEFAULT_LABOUR_RATES[input.trade];
    if (!defaults) return { seeded: 0 };

    // Check if user already has rates for this trade
    const existing = await db.select().from(labourRates)
      .where(and(eq(labourRates.userId, ctx.user.id), eq(labourRates.trade, input.trade)));
    if (existing.length > 0) return { seeded: 0, message: "Rates already exist" };

    for (const rate of defaults) {
      await db.insert(labourRates).values({
        userId: ctx.user.id,
        trade: input.trade,
        classification: rate.classification,
        baseRate: rate.baseRate.toString() as any,
        overtimeRate: rate.overtimeRate.toString() as any,
        saturdayRate: rate.saturdayRate.toString() as any,
        sundayRate: rate.sundayRate.toString() as any,
        publicHolidayRate: rate.publicHolidayRate.toString() as any,
        travelAllowance: rate.travelAllowance.toString() as any,
        toolAllowance: rate.toolAllowance.toString() as any,
      } as any);
    }
    return { seeded: defaults.length };
  }),

  create: protectedProcedure.input(z.object({
    trade: z.string().min(1),
    classification: z.string().min(1),
    baseRate: z.number().nonnegative(),
    overtimeRate: z.number().nonnegative().optional(),
    saturdayRate: z.number().nonnegative().optional(),
    sundayRate: z.number().nonnegative().optional(),
    publicHolidayRate: z.number().nonnegative().optional(),
    travelAllowance: z.number().nonnegative().optional(),
    toolAllowance: z.number().nonnegative().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db.insert(labourRates).values({
      userId: ctx.user.id,
      trade: input.trade,
      classification: input.classification,
      baseRate: input.baseRate.toString() as any,
      overtimeRate: input.overtimeRate?.toString() as any,
      saturdayRate: input.saturdayRate?.toString() as any,
      sundayRate: input.sundayRate?.toString() as any,
      publicHolidayRate: input.publicHolidayRate?.toString() as any,
      travelAllowance: (input.travelAllowance ?? 0).toString() as any,
      toolAllowance: (input.toolAllowance ?? 0).toString() as any,
    } as any);
    return { id: Number((result as any).insertId) };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    classification: z.string().optional(),
    baseRate: z.number().nonnegative().optional(),
    overtimeRate: z.number().nonnegative().optional(),
    saturdayRate: z.number().nonnegative().optional(),
    sundayRate: z.number().nonnegative().optional(),
    publicHolidayRate: z.number().nonnegative().optional(),
    travelAllowance: z.number().nonnegative().optional(),
    toolAllowance: z.number().nonnegative().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, ...rest } = input;
    const data: Record<string, unknown> = {};
    if (rest.classification) data.classification = rest.classification;
    if (rest.baseRate !== undefined) data.baseRate = rest.baseRate.toString();
    if (rest.overtimeRate !== undefined) data.overtimeRate = rest.overtimeRate.toString();
    if (rest.saturdayRate !== undefined) data.saturdayRate = rest.saturdayRate.toString();
    if (rest.sundayRate !== undefined) data.sundayRate = rest.sundayRate.toString();
    if (rest.publicHolidayRate !== undefined) data.publicHolidayRate = rest.publicHolidayRate.toString();
    if (rest.travelAllowance !== undefined) data.travelAllowance = rest.travelAllowance.toString();
    if (rest.toolAllowance !== undefined) data.toolAllowance = rest.toolAllowance.toString();
    await db.update(labourRates).set(data as any)
      .where(and(eq(labourRates.id, id), eq(labourRates.userId, ctx.user.id)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(labourRates).set({ isActive: false })
      .where(and(eq(labourRates.id, input.id), eq(labourRates.userId, ctx.user.id)));
    return { success: true };
  }),
});
