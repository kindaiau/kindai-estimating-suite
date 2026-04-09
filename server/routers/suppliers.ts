import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { supplierConnections, lineItems, estimates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { AUSTRALIAN_SUPPLIERS } from "./ai";

export const suppliersRouter = router({
  // List user's connected suppliers
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    return db.select().from(supplierConnections)
      .where(and(eq(supplierConnections.userId, ctx.user.id), eq(supplierConnections.isActive, true)));
  }),

  // Add a supplier connection
  add: protectedProcedure.input(z.object({
    supplierName: z.string().min(1),
    supplierWebsite: z.string().url().optional(),
    supplierType: z.enum(["trade_account", "retail", "direct", "custom"]).default("trade_account"),
    trades: z.array(z.string()).optional(),
    accountNumber: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    discountPercent: z.number().min(0).max(60).default(0),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.insert(supplierConnections).values({
      ...input,
      userId: ctx.user.id,
      trades: input.trades as any,
      discountPercent: input.discountPercent.toString() as any,
    });
    return { id: Number((result as any).insertId) };
  }),

  // Update a supplier connection
  update: protectedProcedure.input(z.object({
    id: z.number(),
    supplierName: z.string().optional(),
    supplierWebsite: z.string().url().optional(),
    accountNumber: z.string().optional(),
    contactName: z.string().optional(),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().optional(),
    discountPercent: z.number().min(0).max(60).optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { id, discountPercent, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (discountPercent !== undefined) data.discountPercent = discountPercent.toString();
    await db.update(supplierConnections).set(data as any)
      .where(and(eq(supplierConnections.id, id), eq(supplierConnections.userId, ctx.user.id)));
    return { success: true };
  }),

  // Delete a supplier connection
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    await db.update(supplierConnections).set({ isActive: false } as any)
      .where(and(eq(supplierConnections.id, input.id), eq(supplierConnections.userId, ctx.user.id)));
    return { success: true };
  }),

  // Get recommended suppliers for a trade (from built-in database)
  getRecommended: protectedProcedure.input(z.object({
    trade: z.string(),
    state: z.string().optional(),
  })).query(({ input }) => {
    const suppliers = AUSTRALIAN_SUPPLIERS[input.trade] ?? [];
    if (input.state) {
      return suppliers.filter((s: { regions: string[] }) => s.regions.includes(input.state!));
    }
    return suppliers;
  }),

  // Generate a materials order list for an estimate
  generateOrderList: protectedProcedure.input(z.object({
    estimateId: z.number(),
    supplierId: z.number().optional(), // if specified, apply that supplier's discount
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());

    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) return null;

    const items = await db.select().from(lineItems)
      .where(and(
        eq(lineItems.estimateId, input.estimateId),
        eq(lineItems.category, "Materials"),
      ));

    let supplierDiscount = 0;
    let supplierInfo = null;
    if (input.supplierId) {
      const [supplier] = await db.select().from(supplierConnections)
        .where(and(eq(supplierConnections.id, input.supplierId), eq(supplierConnections.userId, ctx.user.id)))
        .limit(1);
      if (supplier) {
        supplierDiscount = parseFloat(supplier.discountPercent as string) || 0;
        supplierInfo = {
          name: supplier.supplierName,
          website: supplier.supplierWebsite,
          accountNumber: supplier.accountNumber,
          contactName: supplier.contactName,
          contactEmail: supplier.contactEmail,
          contactPhone: supplier.contactPhone,
        };
      }
    }

    const orderItems = items.map(item => {
      const qty = parseFloat(item.quantity as string);
      const unitRate = parseFloat(item.unitRate as string);
      const waste = parseFloat(item.wasteFactor as string) / 100;
      const orderQty = qty * (1 + waste);
      const discountedRate = unitRate * (1 - supplierDiscount / 100);
      return {
        section: item.section || "General",
        description: item.description,
        unit: item.unit,
        quantity: Math.ceil(orderQty * 100) / 100,
        unitRate,
        discountedRate: Math.round(discountedRate * 100) / 100,
        totalCost: Math.round(orderQty * discountedRate * 100) / 100,
        notes: item.notes,
      };
    });

    const totalCost = orderItems.reduce((sum, i) => sum + i.totalCost, 0);
    const totalRetail = orderItems.reduce((sum, i) => sum + i.quantity * i.unitRate, 0);
    const savings = totalRetail - totalCost;

    // Group by section
    const bySection: Record<string, typeof orderItems> = {};
    for (const item of orderItems) {
      if (!bySection[item.section]) bySection[item.section] = [];
      bySection[item.section].push(item);
    }

    return {
      estimateTitle: est.title,
      quoteNumber: est.quoteNumber,
      trade: est.trade,
      supplier: supplierInfo,
      discountPercent: supplierDiscount,
      sections: Object.entries(bySection).map(([section, items]) => ({
        section,
        items,
        sectionTotal: items.reduce((sum, i) => sum + i.totalCost, 0),
      })),
      totalRetail: Math.round(totalRetail * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      savings: Math.round(savings * 100) / 100,
      itemCount: orderItems.length,
    };
  }),
});
