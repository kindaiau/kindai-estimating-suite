import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { materials } from "../../drizzle/schema";
import { eq, and, or, isNull, desc } from "drizzle-orm";

export const materialsRouter = router({
  list: protectedProcedure.input(z.object({ trade: z.string().optional() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [or(isNull(materials.userId), eq(materials.userId, ctx.user.id))];
    if (input.trade) conditions.push(eq(materials.trade, input.trade));
    return db.select().from(materials)
      .where(and(...conditions, eq(materials.isActive, true)))
      .orderBy(materials.trade, materials.category, materials.name);
  }),

  create: protectedProcedure.input(z.object({
    trade: z.string().min(1),
    category: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    unit: z.string().min(1),
    unitPrice: z.number().nonnegative(),
    supplier: z.string().optional(),
    supplierCode: z.string().optional(),
    wasteFactor: z.number().min(0).max(100).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.insert(materials).values({
      ...input,
      userId: ctx.user.id,
      unitPrice: input.unitPrice.toString() as any,
      wasteFactor: (input.wasteFactor ?? 5).toString() as any,
    } as any);
    return { id: Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0) };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
    unitPrice: z.number().nonnegative().optional(),
    supplier: z.string().optional(),
    supplierCode: z.string().optional(),
    wasteFactor: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { id, unitPrice, wasteFactor, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (unitPrice !== undefined) data.unitPrice = unitPrice.toString();
    if (wasteFactor !== undefined) data.wasteFactor = wasteFactor.toString();
    await db.update(materials).set(data as any)
      .where(and(eq(materials.id, id), eq(materials.userId, ctx.user.id)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    await db.update(materials).set({ isActive: false })
      .where(and(eq(materials.id, input.id), eq(materials.userId, ctx.user.id)));
    return { success: true };
  }),
});
