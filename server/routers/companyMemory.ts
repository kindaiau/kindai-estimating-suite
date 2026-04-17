import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companyProfiles, priceBookItems, jobTemplates, estimateCorrections } from "../../drizzle/schema";
import { eq, and, desc, like, sql } from "drizzle-orm";

// ─── Company Profile Router ─────────────────────────────────────────────────
export const companyMemoryRouter = router({
  // ── Company Profile ──────────────────────────────────────────────────────
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const [profile] = await db.select().from(companyProfiles)
      .where(eq(companyProfiles.userId, ctx.user.id))
      .limit(1);
    return profile ?? null;
  }),

  upsertProfile: protectedProcedure.input(z.object({
    businessName: z.string().optional(),
    abn: z.string().optional(),
    acn: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    address: z.string().optional(),
    suburb: z.string().optional(),
    state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    postcode: z.string().optional(),
    logoUrl: z.string().optional(),
    defaultExclusions: z.string().optional(),
    defaultInclusions: z.string().optional(),
    quoteTone: z.enum(["professional", "friendly", "detailed", "concise"]).optional(),
    paymentTerms: z.string().optional(),
    warrantyTerms: z.string().optional(),
    insuranceDetails: z.string().optional(),
    aiInstructions: z.string().optional(),
    preferredSuppliers: z.array(z.string()).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [existing] = await db.select({ id: companyProfiles.id }).from(companyProfiles)
      .where(eq(companyProfiles.userId, ctx.user.id))
      .limit(1);

    const data: any = {
      ...input,
      preferredSuppliers: input.preferredSuppliers ? JSON.stringify(input.preferredSuppliers) : undefined,
    };
    // Remove undefined values
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k]);

    if (existing) {
      await db.update(companyProfiles).set(data).where(eq(companyProfiles.id, existing.id));
      return { id: existing.id };
    } else {
      const result = await db.insert(companyProfiles).values({ userId: ctx.user.id, ...data });
      return { id: Number((result as any).insertId) };
    }
  }),

  // ── Price Book ───────────────────────────────────────────────────────────
  listPriceBook: protectedProcedure.input(z.object({
    trade: z.string().optional(),
    category: z.string().optional(),
    search: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [eq(priceBookItems.userId, ctx.user.id), eq(priceBookItems.isActive, true)];
    if (input.trade) conditions.push(eq(priceBookItems.trade, input.trade));
    if (input.category) conditions.push(eq(priceBookItems.category, input.category));
    if (input.search) conditions.push(like(priceBookItems.name, `%${input.search}%`));
    return db.select().from(priceBookItems)
      .where(and(...conditions))
      .orderBy(desc(priceBookItems.updatedAt));
  }),

  addPriceBookItem: protectedProcedure.input(z.object({
    trade: z.string().optional(),
    category: z.string(),
    itemCode: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    unit: z.string(),
    unitPrice: z.number().nonnegative(),
    supplierName: z.string().optional(),
    supplierAccountNumber: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.insert(priceBookItems).values({
      userId: ctx.user.id,
      ...input,
      unitPrice: input.unitPrice.toString() as any,
    });
    return { id: Number((result as any).insertId) };
  }),

  updatePriceBookItem: protectedProcedure.input(z.object({
    id: z.number(),
    trade: z.string().optional(),
    category: z.string().optional(),
    itemCode: z.string().optional(),
    name: z.string().optional(),
    description: z.string().optional(),
    unit: z.string().optional(),
    unitPrice: z.number().nonnegative().optional(),
    supplierName: z.string().optional(),
    supplierAccountNumber: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { id, unitPrice, ...rest } = input;
    const data: any = { ...rest };
    if (unitPrice !== undefined) data.unitPrice = unitPrice.toString();
    await db.update(priceBookItems).set(data)
      .where(and(eq(priceBookItems.id, id), eq(priceBookItems.userId, ctx.user.id)));
    return { success: true };
  }),

  deletePriceBookItem: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    // Soft delete
    await db.update(priceBookItems).set({ isActive: false })
      .where(and(eq(priceBookItems.id, input.id), eq(priceBookItems.userId, ctx.user.id)));
    return { success: true };
  }),

  bulkImportPriceBook: protectedProcedure.input(z.object({
    items: z.array(z.object({
      trade: z.string().optional(),
      category: z.string(),
      itemCode: z.string().optional(),
      name: z.string(),
      description: z.string().optional(),
      unit: z.string(),
      unitPrice: z.number().nonnegative(),
      supplierName: z.string().optional(),
    })),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    let imported = 0;
    for (const item of input.items) {
      await db.insert(priceBookItems).values({
        userId: ctx.user.id,
        ...item,
        unitPrice: item.unitPrice.toString() as any,
      });
      imported++;
    }
    return { imported };
  }),

  // ── Job Templates ────────────────────────────────────────────────────────
  listTemplates: protectedProcedure.input(z.object({
    trade: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [eq(jobTemplates.userId, ctx.user.id), eq(jobTemplates.isActive, true)];
    if (input.trade) conditions.push(eq(jobTemplates.trade, input.trade));
    return db.select().from(jobTemplates)
      .where(and(...conditions))
      .orderBy(desc(jobTemplates.timesUsed));
  }),

  createTemplate: protectedProcedure.input(z.object({
    trade: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    lineItems: z.array(z.object({
      section: z.string().optional(),
      category: z.string(),
      description: z.string(),
      unit: z.string(),
      quantity: z.number(),
      unitRate: z.number(),
      wasteFactor: z.number().optional(),
    })),
    estimatedTotal: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.insert(jobTemplates).values({
      userId: ctx.user.id,
      trade: input.trade,
      name: input.name,
      description: input.description,
      lineItems: input.lineItems as any,
      estimatedTotal: input.estimatedTotal?.toString() as any,
    });
    return { id: Number((result as any).insertId) };
  }),

  saveEstimateAsTemplate: protectedProcedure.input(z.object({
    estimateId: z.number(),
    name: z.string().min(1),
    description: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { estimates, lineItems } = await import("../../drizzle/schema");
    
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) throw new Error("Estimate not found");

    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.estimateId));
    const templateItems = items.map(i => ({
      section: (i as any).section || "",
      category: i.category,
      description: i.description,
      unit: i.unit,
      quantity: parseFloat(i.quantity as string),
      unitRate: parseFloat(i.unitRate as string),
      wasteFactor: parseFloat(i.wasteFactor as string),
    }));

    const result = await db.insert(jobTemplates).values({
      userId: ctx.user.id,
      trade: estimate.trade,
      name: input.name,
      description: input.description,
      lineItems: templateItems as any,
      estimatedTotal: estimate.total?.toString() as any,
    });
    return { id: Number((result as any).insertId) };
  }),

  useTemplate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [template] = await db.select().from(jobTemplates)
      .where(and(eq(jobTemplates.id, input.id), eq(jobTemplates.userId, ctx.user.id)))
      .limit(1);
    if (!template) throw new Error("Template not found");

    // Increment usage counter
    await db.update(jobTemplates).set({
      timesUsed: (template.timesUsed ?? 0) + 1,
    }).where(eq(jobTemplates.id, input.id));

    return { lineItems: template.lineItems, trade: template.trade, name: template.name };
  }),

  deleteTemplate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    await db.update(jobTemplates).set({ isActive: false })
      .where(and(eq(jobTemplates.id, input.id), eq(jobTemplates.userId, ctx.user.id)));
    return { success: true };
  }),

  // ── Correction Stats (for AI learning dashboard) ─────────────────────────
  getCorrectionStats: protectedProcedure.input(z.object({
    trade: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [eq(estimateCorrections.userId, ctx.user.id)];
    if (input.trade) conditions.push(eq(estimateCorrections.trade, input.trade));

    const corrections = await db.select().from(estimateCorrections)
      .where(and(...conditions))
      .orderBy(desc(estimateCorrections.createdAt));

    const total = corrections.length;
    const byType: Record<string, number> = {};
    corrections.forEach(c => {
      byType[c.correctionType] = (byType[c.correctionType] || 0) + 1;
    });

    // Calculate AI accuracy trend (% of items NOT corrected)
    // Group by month
    const monthlyStats: Record<string, { corrections: number; month: string }> = {};
    corrections.forEach(c => {
      const month = new Date(c.createdAt).toISOString().slice(0, 7);
      if (!monthlyStats[month]) monthlyStats[month] = { corrections: 0, month };
      monthlyStats[month].corrections++;
    });

    return {
      totalCorrections: total,
      byType,
      recentCorrections: corrections.slice(0, 20),
      monthlyTrend: Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month)),
    };
  }),

  // ── Get company memory context for AI prompts ────────────────────────────
  getAIContext: protectedProcedure.input(z.object({
    trade: z.string(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());

    // 1. Company profile
    const [profile] = await db.select().from(companyProfiles)
      .where(eq(companyProfiles.userId, ctx.user.id))
      .limit(1);

    // 2. Price book items for this trade
    const priceItems = await db.select().from(priceBookItems)
      .where(and(
        eq(priceBookItems.userId, ctx.user.id),
        eq(priceBookItems.isActive, true),
        eq(priceBookItems.trade, input.trade),
      ));

    // 3. Recent corrections for this trade (learning from mistakes)
    const recentCorrections = await db.select().from(estimateCorrections)
      .where(and(
        eq(estimateCorrections.userId, ctx.user.id),
        eq(estimateCorrections.trade, input.trade),
      ))
      .orderBy(desc(estimateCorrections.createdAt))
      .limit(50);

    return {
      profile,
      priceBookItems: priceItems,
      recentCorrections,
    };
  }),
});
