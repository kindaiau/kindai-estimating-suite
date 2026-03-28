import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { estimates, lineItems } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { GST_RATE } from "../../shared/trades";

export const estimatesRouter = router({
  list: protectedProcedure.input(z.object({ projectId: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const conditions = [eq(estimates.userId, ctx.user.id)];
    if (input.projectId) conditions.push(eq(estimates.projectId, input.projectId));
    return db.select().from(estimates).where(and(...conditions)).orderBy(desc(estimates.createdAt));
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    return result[0] ?? null;
  }),

  getWithLineItems: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return null;
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) return null;
    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.id));
    return { ...estimate, lineItems: items };
  }),

  create: protectedProcedure.input(z.object({
    projectId: z.number(),
    trade: z.string(),
    title: z.string().min(1),
    margin: z.number().optional(),
    complianceState: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const quoteNumber = `KAI-${new Date().getFullYear()}-${nanoid(6).toUpperCase()}`;
    const acceptanceToken = nanoid(32);
    const result = await db.insert(estimates).values({
      projectId: input.projectId,
      trade: input.trade,
      title: input.title,
      userId: ctx.user.id,
      quoteNumber,
      acceptanceToken,
      quoteTerms: "Payment terms: 50% deposit required before commencement. Balance due within 14 days of completion. This quote is valid for 30 days from the date of issue.",
      margin: input.margin?.toString() as any,
      complianceState: input.complianceState,
      notes: input.notes,
    } as any);
    return { id: Number((result as any).insertId), quoteNumber };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    status: z.enum(["draft", "review", "sent", "accepted", "declined"]).optional(),
    margin: z.number().optional(),
    complianceState: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    complianceChecked: z.boolean().optional(),
    complianceNotes: z.string().optional(),
    quoteValidDays: z.number().optional(),
    quoteTerms: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const { id, margin, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (margin !== undefined) data.margin = margin.toString();
    await db.update(estimates).set(data as any).where(and(eq(estimates.id, id), eq(estimates.userId, ctx.user.id)));
    return { success: true };
  }),

  recalculate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) throw new Error("Estimate not found");

    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.id));
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity as string);
      const rate = parseFloat(item.unitRate as string);
      const waste = parseFloat(item.wasteFactor as string) / 100;
      return sum + qty * rate * (1 + waste);
    }, 0);

    const marginRate = parseFloat(estimate.margin as string) / 100;
    const subtotalWithMargin = subtotal * (1 + marginRate);
    const gstAmount = subtotalWithMargin * GST_RATE;
    const total = subtotalWithMargin + gstAmount;

    await db.update(estimates).set({
      subtotal: subtotalWithMargin.toFixed(2) as any,
      gstAmount: gstAmount.toFixed(2) as any,
      total: total.toFixed(2) as any,
    }).where(eq(estimates.id, input.id));

    return { subtotal: subtotalWithMargin, gstAmount, total };
  }),

  // Line Items
  addLineItem: protectedProcedure.input(z.object({
    estimateId: z.number(),
    category: z.string(),
    description: z.string().min(1),
    unit: z.string(),
    quantity: z.number().positive(),
    unitRate: z.number().nonnegative(),
    wasteFactor: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
    isFromAi: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    // Verify ownership
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const qty = input.quantity;
    const rate = input.unitRate;
    const waste = (input.wasteFactor ?? 0) / 100;
    const subtotal = qty * rate * (1 + waste);

    const result = await db.insert(lineItems).values({
      ...input,
      wasteFactor: (input.wasteFactor ?? 0).toString() as any,
      quantity: qty.toString() as any,
      unitRate: rate.toString() as any,
      subtotal: subtotal.toFixed(2) as any,
    });
    return { id: Number((result as any).insertId) };
  }),

  updateLineItem: protectedProcedure.input(z.object({
    id: z.number(),
    estimateId: z.number(),
    category: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    quantity: z.number().positive().optional(),
    unitRate: z.number().nonnegative().optional(),
    wasteFactor: z.number().min(0).max(100).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const [existing] = await db.select().from(lineItems).where(eq(lineItems.id, input.id)).limit(1);
    if (!existing) throw new Error("Line item not found");

    const qty = input.quantity ?? parseFloat(existing.quantity as string);
    const rate = input.unitRate ?? parseFloat(existing.unitRate as string);
    const waste = (input.wasteFactor ?? parseFloat(existing.wasteFactor as string)) / 100;
    const subtotal = qty * rate * (1 + waste);

    await db.update(lineItems).set({
      ...input,
      quantity: qty.toString() as any,
      unitRate: rate.toString() as any,
      wasteFactor: ((input.wasteFactor ?? parseFloat(existing.wasteFactor as string))).toString() as any,
      subtotal: subtotal.toFixed(2) as any,
    }).where(eq(lineItems.id, input.id));
    return { success: true };
  }),

  deleteLineItem: protectedProcedure.input(z.object({ id: z.number(), estimateId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");
    await db.delete(lineItems).where(eq(lineItems.id, input.id));
    return { success: true };
  }),

  getLineItems: protectedProcedure.input(z.object({ estimateId: z.number() })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) return [];
    return db.select().from(lineItems).where(eq(lineItems.estimateId, input.estimateId));
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.delete(lineItems).where(eq(lineItems.estimateId, input.id));
    await db.delete(estimates).where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)));
    return { success: true };
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { total: 0, draft: 0, sent: 0, accepted: 0, totalValue: 0 };
    const all = await db.select().from(estimates).where(eq(estimates.userId, ctx.user.id));
    const totalValue = all.filter(e => e.status === "accepted").reduce((sum, e) => sum + parseFloat(e.total as string), 0);
    return {
      total: all.length,
      draft: all.filter(e => e.status === "draft").length,
      sent: all.filter(e => e.status === "sent").length,
      accepted: all.filter(e => e.status === "accepted").length,
      totalValue,
    };
  }),
});
