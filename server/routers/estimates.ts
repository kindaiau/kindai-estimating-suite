import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { estimates, lineItems, users, estimateCorrections, tradeProfiles } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { GST_RATE } from "../../shared/trades";
import { generateQuotePdf } from "../pdfGenerator";
import { storagePut } from "../storage";
import { INDUSTRY_BENCHMARKS } from "./ai";

export const estimatesRouter = router({
  list: protectedProcedure.input(z.object({ projectId: z.number().optional() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [eq(estimates.userId, ctx.user.id)];
    if (input.projectId) conditions.push(eq(estimates.projectId, input.projectId));
    return db.select().from(estimates).where(and(...conditions)).orderBy(desc(estimates.createdAt)).limit(500);
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    return result[0] ?? null;
  }),

  getWithLineItems: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
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
    const db = requireDatabase(await getDb());
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
    return { id: Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0), quoteNumber };
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
    const db = requireDatabase(await getDb());
    const { id, margin, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (margin !== undefined) data.margin = margin.toString();
    await db.update(estimates).set(data as any).where(and(eq(estimates.id, id), eq(estimates.userId, ctx.user.id)));
    return { success: true };
  }),

  recalculate: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) throw new Error("Estimate not found");

    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.id));
    const subtotal = items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity as string) || 0;
      const rate = parseFloat(item.unitRate as string) || 0;
      const waste = parseFloat((item.wasteFactor as string) || "0") / 100;
      return sum + qty * rate * (1 + waste);
    }, 0);

    const marginRate = (parseFloat(estimate.margin ?? "0") || 0) / 100;
    const subtotalWithMargin = subtotal * (1 + marginRate);
    const gstAmount = subtotalWithMargin * GST_RATE;
    const total = subtotalWithMargin + gstAmount;

    await db.update(estimates).set({
      subtotal: subtotalWithMargin.toFixed(2) as any,
      gstAmount: gstAmount.toFixed(2) as any,
      total: total.toFixed(2) as any,
    }).where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)));

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
    const db = requireDatabase(await getDb());
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
    return { id: Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0) };
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
    const db = requireDatabase(await getDb());
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const [existing] = await db.select().from(lineItems).where(eq(lineItems.id, input.id)).limit(1);
    if (!existing) throw new Error("Line item not found");

    const qty = input.quantity ?? (parseFloat(existing.quantity as string) || 0);
    const rate = input.unitRate ?? (parseFloat(existing.unitRate as string) || 0);
    const waste = (input.wasteFactor ?? parseFloat((existing.wasteFactor as string) || "0")) / 100;
    const subtotal = qty * rate * (1 + waste);

    await db.update(lineItems).set({
      ...input,
      quantity: qty.toString() as any,
      unitRate: rate.toString() as any,
      wasteFactor: ((input.wasteFactor ?? parseFloat((existing.wasteFactor as string) || "0"))).toString() as any,
      subtotal: subtotal.toFixed(2) as any,
    }).where(eq(lineItems.id, input.id));

    // ── Correction capture: record every human edit to AI-generated items ──
    if (existing.isFromAi) {
      const corrections: any[] = [];
      const oldQty = parseFloat(existing.quantity as string);
      const oldRate = parseFloat(existing.unitRate as string);
      const oldWaste = parseFloat(existing.wasteFactor as string);

      if (input.quantity != null && Math.abs(input.quantity - oldQty) > 0.001) {
        corrections.push({
          estimateId: input.estimateId, lineItemId: input.id, userId: ctx.user.id, trade: est.trade,
          correctionType: "quantity_change", fieldName: "quantity",
          aiValue: oldQty.toString(), humanValue: input.quantity.toString(),
          itemDescription: existing.description, createdAt: new Date(),
        });
      }
      if (input.unitRate != null && Math.abs(input.unitRate - oldRate) > 0.01) {
        corrections.push({
          estimateId: input.estimateId, lineItemId: input.id, userId: ctx.user.id, trade: est.trade,
          correctionType: "rate_change", fieldName: "unitRate",
          aiValue: oldRate.toString(), humanValue: input.unitRate.toString(),
          itemDescription: existing.description, createdAt: new Date(),
        });
      }
      if (input.wasteFactor != null && Math.abs(input.wasteFactor - oldWaste) > 0.1) {
        corrections.push({
          estimateId: input.estimateId, lineItemId: input.id, userId: ctx.user.id, trade: est.trade,
          correctionType: "waste_change", fieldName: "wasteFactor",
          aiValue: oldWaste.toString(), humanValue: input.wasteFactor.toString(),
          itemDescription: existing.description, createdAt: new Date(),
        });
      }
      if (input.description && input.description !== existing.description) {
        corrections.push({
          estimateId: input.estimateId, lineItemId: input.id, userId: ctx.user.id, trade: est.trade,
          correctionType: "description_change", fieldName: "description",
          aiValue: existing.description, humanValue: input.description,
          itemDescription: input.description, createdAt: new Date(),
        });
      }
      if (input.unit && input.unit !== existing.unit) {
        corrections.push({
          estimateId: input.estimateId, lineItemId: input.id, userId: ctx.user.id, trade: est.trade,
          correctionType: "unit_change", fieldName: "unit",
          aiValue: existing.unit, humanValue: input.unit,
          itemDescription: existing.description, createdAt: new Date(),
        });
      }

      // Batch insert all corrections in a single query
      if (corrections.length > 0) {
        await db.insert(estimateCorrections).values(corrections).catch(err =>
          console.warn("[Correction] Failed to record:", err.message)
        );
      }
    }

    return { success: true };
  }),

  deleteLineItem: protectedProcedure.input(z.object({ id: z.number(), estimateId: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");
    await db.delete(lineItems).where(and(eq(lineItems.id, input.id), eq(lineItems.estimateId, input.estimateId)));
    return { success: true };
  }),

  getLineItems: protectedProcedure.input(z.object({ estimateId: z.number() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) return [];
    return db.select().from(lineItems).where(eq(lineItems.estimateId, input.estimateId));
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    // Verify ownership before deleting associated line items
    const [est] = await db.select({ id: estimates.id }).from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");
    await db.delete(lineItems).where(eq(lineItems.estimateId, input.id));
    await db.delete(estimates).where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)));
    return { success: true };
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    // Use SQL aggregation instead of fetching all rows into memory
    const countRows = await db
      .select({ status: estimates.status, count: sql<number>`COUNT(*)` })
      .from(estimates)
      .where(eq(estimates.userId, ctx.user.id))
      .groupBy(estimates.status);
    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of countRows) {
      const n = Number(row.count);
      counts[row.status] = n;
      total += n;
    }
    // Sum accepted estimate values in SQL
    const [valueRow] = await db
      .select({ totalValue: sql<string>`COALESCE(SUM(total), 0)` })
      .from(estimates)
      .where(and(eq(estimates.userId, ctx.user.id), eq(estimates.status, "accepted")));
    return {
      total,
      draft: counts["draft"] ?? 0,
      sent: counts["sent"] ?? 0,
      accepted: counts["accepted"] ?? 0,
      totalValue: parseFloat(valueRow?.totalValue ?? "0"),
    };
  }),

  // Industry benchmarking — compare user's estimate vs market rates
  getBenchmark: protectedProcedure.input(z.object({
    id: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) return null;

    const benchmark = INDUSTRY_BENCHMARKS[estimate.trade];
    if (!benchmark) return null;

    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.id));
    const totalValue = parseFloat(estimate.total as string) || 0;
    const subtotalValue = parseFloat(estimate.subtotal as string) || 0;
    const marginValue = parseFloat(estimate.margin as string) || 0;

    // Calculate labour hours from line items
    const labourItems = items.filter(i => i.category === "Labour");
    const totalLabourCost = labourItems.reduce((sum, i) => sum + parseFloat(i.subtotal as string), 0);
    const totalMaterialsCost = items
      .filter(i => i.category === "Materials")
      .reduce((sum, i) => sum + parseFloat(i.subtotal as string), 0);

    const labourPercent = subtotalValue > 0 ? (totalLabourCost / subtotalValue) * 100 : 0;
    const materialsPercent = subtotalValue > 0 ? (totalMaterialsCost / subtotalValue) * 100 : 0;

    // Determine project size bucket
    let sizeBucket: "small" | "medium" | "large" = "small";
    if (totalValue > benchmark.avgQuoteValue.medium) sizeBucket = "large";
    else if (totalValue > benchmark.avgQuoteValue.small) sizeBucket = "medium";

    const marketAvg = benchmark.avgQuoteValue[sizeBucket];
    const competitiveIndex = marketAvg > 0 ? ((totalValue - marketAvg) / marketAvg) * 100 : 0;

    return {
      trade: estimate.trade,
      totalValue,
      marginPercent: marginValue,
      labourPercent: Math.round(labourPercent),
      materialsPercent: Math.round(materialsPercent),
      benchmark: {
        labourRateRange: benchmark.labourRateRange,
        marginRange: benchmark.marginRange,
        winRateBenchmark: benchmark.winRateBenchmark,
        avgQuoteValue: benchmark.avgQuoteValue,
        sections: benchmark.sections,
      },
      analysis: {
        sizeBucket,
        marketAvg,
        competitiveIndex: Math.round(competitiveIndex),
        marginStatus: marginValue < benchmark.marginRange.min ? "below" : marginValue > benchmark.marginRange.max ? "above" : "within",
        marginMessage: marginValue < benchmark.marginRange.min
          ? `Your margin of ${marginValue}% is below the industry minimum of ${benchmark.marginRange.min}%. You may be underpricing.`
          : marginValue > benchmark.marginRange.max
          ? `Your margin of ${marginValue}% is above the typical range. Ensure your quote is still competitive.`
          : `Your margin of ${marginValue}% is within the industry benchmark range of ${benchmark.marginRange.min}–${benchmark.marginRange.max}%.`,
        competitiveMessage: competitiveIndex < -20
          ? "Your quote is significantly below market average — check for missing items or underpricing."
          : competitiveIndex > 30
          ? "Your quote is above market average — ensure your value proposition is clear to the client."
          : "Your quote is competitively positioned within the market range.",
        recommendations: [
          ...(marginValue < benchmark.marginRange.median ? [`Consider increasing your margin to the industry median of ${benchmark.marginRange.median}% to improve profitability.`] : []),
          ...(labourPercent < 20 && labourItems.length === 0 ? ["No labour items detected — ensure labour costs are included in your estimate."] : []),
          `Industry win rate benchmark for ${estimate.trade}: ${benchmark.winRateBenchmark}% of quotes convert to jobs.`,
        ],
      },
    };
  }),

  generatePdf: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());

    // Load estimate
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) throw new Error("Estimate not found");

    // Load line items
    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.id));

    // Load user profile
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

    // Load trade profile for company logo and brand colour
    const [tradeProfile] = await db.select().from(tradeProfiles)
      .where(and(eq(tradeProfiles.userId, ctx.user.id), eq(tradeProfiles.trade, estimate.trade)))
      .limit(1);

    // Load project for client info
    const { projects } = await import("../../drizzle/schema");
    const [project] = await db.select().from(projects).where(eq(projects.id, estimate.projectId)).limit(1);

    // Build line item rows
    const lineItemRows = items.map(item => ({
      description: item.description,
      category: item.category,
      unit: item.unit,
      quantity: parseFloat(item.quantity as string),
      unitPrice: parseFloat(item.unitRate as string),
      total: parseFloat(item.subtotal as string),
    }));

    const subtotalNum = parseFloat(estimate.subtotal as string);
    const gstNum = parseFloat(estimate.gstAmount as string);
    const totalNum = parseFloat(estimate.total as string);
    const marginNum = parseFloat(estimate.margin as string) || 0;
    const marginAmount = subtotalNum - (subtotalNum / (1 + marginNum / 100));

    const pdfData = {
      businessName: user?.companyName || user?.name || "Kindai Estimating",
      abn: user?.abn || undefined,
      licenseNumber: user?.licenseNumber || undefined,
      phone: user?.phone || undefined,
      email: user?.email || undefined,
      state: user?.state || undefined,
      trade: estimate.trade,
      quoteNumber: estimate.quoteNumber || `KAI-${Date.now()}`,
      quoteDate: new Date().toLocaleDateString("en-AU"),
      quoteValidDays: estimate.quoteValidDays || 30,
      clientName: project?.clientName || undefined,
      clientEmail: project?.clientEmail || undefined,
      clientPhone: project?.clientPhone || undefined,
      projectAddress: project?.address ? `${project.address}${project.suburb ? ", " + project.suburb : ""}${project.state ? " " + project.state : ""}` : undefined,
      projectTitle: estimate.title,
      lineItems: lineItemRows,
      subtotal: subtotalNum,
      margin: marginNum,
      marginAmount,
      gstAmount: gstNum,
      total: totalNum,
      complianceState: estimate.complianceState || undefined,
      complianceNotes: estimate.complianceNotes || undefined,
      quoteTerms: estimate.quoteTerms || undefined,
      notes: estimate.notes || undefined,
      aiConfidenceScore: estimate.aiConfidenceScore || undefined,
      aiAssumptions: (estimate.aiAssumptions as string[]) || undefined,
      companyLogoUrl: tradeProfile?.logoUrl || undefined,
      brandColor: tradeProfile?.brandColour || undefined,
    };

    // Generate PDF
    const pdfBuffer = await generateQuotePdf(pdfData);

    // Upload to S3
    const fileKey = `quotes/${ctx.user.id}/${estimate.quoteNumber || input.id}-${Date.now()}.pdf`;
    const { url } = await storagePut(fileKey, pdfBuffer, "application/pdf");

    // Save URL to estimate
    await db.update(estimates).set({
      quotePdfUrl: url,
      quotePdfKey: fileKey,
    } as any).where(eq(estimates.id, input.id));

    return { url, fileKey };
  }),
});
