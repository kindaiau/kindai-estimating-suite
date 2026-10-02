import { requireProFeature } from "../entitlements";
import { TRPCError } from "@trpc/server";
import { editEstimate, lockEstimate, saveTotals } from "../estimateEdits";
import { itemFields, markupSchema, priceEstimate, priceLine } from "../estimatePricing";
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
import { buildQuoteAssuranceReport, deriveAssuranceEstimate } from "../assurance";
import { buildAiLineItemRows } from "../routes/insertAiLineItems";
import {
  buildMetaUserData,
  extractMetaClickIdentifiers,
  sendMetaConversionEvent,
} from "../metaCapi";

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
    return db.transaction(async tx => {
      const estimate = await lockEstimate(tx, ctx.user.id, input.id);
      const items = await tx.select().from(lineItems).where(eq(lineItems.estimateId, input.id));
      return { ...estimate, lineItems: items };
    });
  }),

  getAssurance: protectedProcedure.input(z.object({
    estimateId: z.number(),
    pricingContext: z.object({
      marginPercent: z.number().min(0).max(1000),
      labourRate: z.number().min(0).max(10000),
      useTradePrice: z.boolean(),
    }).optional(),
    takeoffItems: z.array(z.object({
      section: z.string().optional(),
      description: z.string(),
      unit: z.string(),
      quantity: z.number().min(0),
      retailPrice: z.number().min(0),
      tradePrice: z.number().min(0),
      category: z.string(),
      labourMinutes: z.number().min(0),
      wasteFactor: z.number().min(0).max(100),
    })).optional(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) return null;

    const items =
      input.pricingContext && input.takeoffItems
        ? buildAiLineItemRows(input.estimateId, input.takeoffItems, {
            labourRate: input.pricingContext.labourRate,
            useTradePrice: input.pricingContext.useTradePrice,
          })
        : await db.select().from(lineItems).where(eq(lineItems.estimateId, input.estimateId));

    return buildQuoteAssuranceReport(
      deriveAssuranceEstimate(
        estimate,
        items,
        input.pricingContext?.marginPercent
      ),
      items
    );
  }),

  create: protectedProcedure.input(z.object({
    projectId: z.number(),
    trade: z.string(),
    title: z.string().min(1),
    margin: markupSchema.optional(),
    complianceState: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { projects } = await import("../../drizzle/schema");
    const [project] = await db.select().from(projects).where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id))).limit(1);
    if (!project) throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
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
    const newEstimateId = Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0);

    // ─── Meta CAPI: ViewContent (new estimate created = viewing estimator) ──
    const { fbp, fbc } = extractMetaClickIdentifiers(ctx.req.headers.cookie);
    const clientIpAddress =
      (ctx.req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")
        .map((v) => v.trim())
        .find(Boolean) ?? ctx.req.socket.remoteAddress ?? undefined;
    const clientUserAgent = ctx.req.headers["user-agent"] ?? undefined;

    sendMetaConversionEvent({
      eventName: "ViewContent",
      eventId: `estimate_create_${newEstimateId}_${Date.now()}`,
      actionSource: "website",
      eventSourceUrl: "https://kindaiestimator.com/ai-takeoff",
      customData: {
        currency: "AUD",
        value: 0,
        content_name: `New Estimate: ${input.title}`,
        content_category: input.trade,
        content_ids: [String(newEstimateId)],
      },
      userData: buildMetaUserData({
        email: ctx.user.email ?? undefined,
        clientIpAddress,
        clientUserAgent,
        fbp,
        fbc,
      }),
    }).catch((err: unknown) => {
      console.error(
        "[Meta CAPI] Failed to send ViewContent event:",
        err instanceof Error ? err.message : String(err)
      );
    });

    return { id: newEstimateId, quoteNumber };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    expectedVersion: z.number().int().positive(),
    title: z.string().optional(),
    status: z.enum(["draft", "review", "sent", "accepted", "declined"]).optional(),
    margin: markupSchema.optional(),
    complianceState: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    complianceChecked: z.boolean().optional(),
    complianceNotes: z.string().optional(),
    quoteValidDays: z.number().optional(),
    quoteTerms: z.string().optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { id, expectedVersion, margin, ...rest } = input;
    return db.transaction(async tx => {
      const estimate = await lockEstimate(tx, ctx.user.id, id, expectedVersion);
      const data = { ...rest, ...(margin !== undefined ? { margin: String(margin) } : {}) };
      await tx.update(estimates).set(data).where(eq(estimates.id, id));
      return saveTotals(tx, { ...estimate, ...data });
    });
  }),

  recalculate: protectedProcedure.input(z.object({ id: z.number().int().positive(), expectedVersion: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    return db.transaction(async tx => saveTotals(tx, await lockEstimate(tx, ctx.user.id, input.id, input.expectedVersion)));
  }),

  addLineItem: protectedProcedure.input(itemFields.extend({ estimateId: z.number().int().positive(), expectedVersion: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { estimateId, expectedVersion, ...values } = input;
    return editEstimate(requireDatabase(await getDb()), ctx.user.id, estimateId, expectedVersion, { kind: "add", values });
  }),
  updateLineItem: protectedProcedure.input(itemFields.partial().extend({ wasteFactor: itemFields.shape.wasteFactor.removeDefault().optional(), id: z.number().int().positive(), estimateId: z.number().int().positive(), expectedVersion: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    const { id, estimateId, expectedVersion, ...values } = input;
    return editEstimate(requireDatabase(await getDb()), ctx.user.id, estimateId, expectedVersion, { kind: "update", id, values });
  }),
  deleteLineItem: protectedProcedure.input(z.object({ id: z.number().int().positive(), estimateId: z.number().int().positive(), expectedVersion: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    return editEstimate(requireDatabase(await getDb()), ctx.user.id, input.estimateId, input.expectedVersion, { kind: "delete", id: input.id });
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
    return db.transaction(async tx => {
      await lockEstimate(tx, ctx.user.id, input.id);
      await tx.delete(lineItems).where(eq(lineItems.estimateId, input.id));
      await tx.delete(estimates).where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id)));
      return { success: true };
    });
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

  generatePdf: protectedProcedure.input(z.object({ id: z.number(), expectedVersion: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await requireProFeature(ctx.user.id);
    const db = requireDatabase(await getDb());

    const { estimate, items } = await db.transaction(async tx => {
      const estimate = await lockEstimate(tx, ctx.user.id, input.id, input.expectedVersion);
      const items = await tx.select().from(lineItems).where(eq(lineItems.estimateId, input.id));
      const totals = priceEstimate(items, estimate.margin);
      await tx.update(estimates).set(totals).where(eq(estimates.id, input.id));
      return { estimate: { ...estimate, ...totals }, items: items.map(item => ({ ...item, subtotal: priceLine(item) })) };
    });

    // Load user profile
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

    // Load trade profile for company logo and brand colour
    const [tradeProfile] = await db.select().from(tradeProfiles)
      .where(and(eq(tradeProfiles.userId, ctx.user.id), eq(tradeProfiles.trade, estimate.trade)))
      .limit(1);

    // Load project for client info
    const { projects } = await import("../../drizzle/schema");
    const [project] = await db.select().from(projects).where(and(eq(projects.id, estimate.projectId), eq(projects.userId, ctx.user.id))).limit(1);

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
    const [pdfSaved] = await db.update(estimates).set({
      quotePdfUrl: url,
      quotePdfKey: fileKey,
    } as any).where(and(eq(estimates.id, input.id), eq(estimates.userId, ctx.user.id), eq(estimates.version, input.expectedVersion)));
    if (!pdfSaved.affectedRows) throw new TRPCError({ code: "CONFLICT", message: "Estimate changed during export. Generate a new PDF from the saved version." });

    // ─── Meta CAPI: Purchase (quote PDF generated = quote sent to client) ──
    const pdfFbIds = extractMetaClickIdentifiers(ctx.req.headers.cookie);
    const pdfClientIp =
      (ctx.req.headers["x-forwarded-for"] as string | undefined)
        ?.split(",")
        .map((v) => v.trim())
        .find(Boolean) ?? ctx.req.socket.remoteAddress ?? undefined;

    sendMetaConversionEvent({
      eventName: "Purchase",
      eventId: `quote_pdf_${input.id}_${Date.now()}`,
      actionSource: "website",
      eventSourceUrl: "https://kindaiestimator.com/dashboard",
      customData: {
        currency: "AUD",
        value: totalNum,
        content_name: `Quote: ${estimate.quoteNumber}`,
        content_category: estimate.trade,
        content_ids: [String(input.id)],
        num_items: items.length,
      },
      userData: buildMetaUserData({
        email: ctx.user.email ?? undefined,
        clientIpAddress: pdfClientIp,
        clientUserAgent: ctx.req.headers["user-agent"] ?? undefined,
        fbp: pdfFbIds.fbp,
        fbc: pdfFbIds.fbc,
      }),
    }).catch((err: unknown) => {
      console.error(
        "[Meta CAPI] Failed to send Purchase event:",
        err instanceof Error ? err.message : String(err)
      );
    });

    return { url, fileKey, version: estimate.version, totals: { subtotal: estimate.subtotal, gstAmount: estimate.gstAmount, total: estimate.total } };
  }),
});
