import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { estimateCorrections, jobOutcomes, estimates, lineItems } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export const correctionsRouter = router({
  // ── Record a correction (called when user edits an AI-generated line item) ──
  recordCorrection: protectedProcedure.input(z.object({
    estimateId: z.number(),
    lineItemId: z.number().optional(),
    trade: z.string(),
    correctionType: z.enum([
      "quantity_change",
      "rate_change",
      "item_added",
      "item_removed",
      "description_change",
      "unit_change",
      "waste_change",
    ]),
    fieldName: z.string().optional(),
    aiValue: z.string().optional(),
    humanValue: z.string().optional(),
    reason: z.string().optional(),
    itemDescription: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.insert(estimateCorrections).values({
      ...input,
      userId: ctx.user.id,
    });
    return { id: Number((result as any).insertId) };
  }),

  // ── Batch record corrections (for when user saves multiple edits at once) ──
  batchRecord: protectedProcedure.input(z.object({
    corrections: z.array(z.object({
      estimateId: z.number(),
      lineItemId: z.number().optional(),
      trade: z.string(),
      correctionType: z.enum([
        "quantity_change",
        "rate_change",
        "item_added",
        "item_removed",
        "description_change",
        "unit_change",
        "waste_change",
      ]),
      fieldName: z.string().optional(),
      aiValue: z.string().optional(),
      humanValue: z.string().optional(),
      itemDescription: z.string().optional(),
    })),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    let count = 0;
    for (const c of input.corrections) {
      await db.insert(estimateCorrections).values({
        ...c,
        userId: ctx.user.id,
      });
      count++;
    }
    return { recorded: count };
  }),

  // ── Get corrections for an estimate ──────────────────────────────────────
  listForEstimate: protectedProcedure.input(z.object({
    estimateId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    return db.select().from(estimateCorrections)
      .where(and(
        eq(estimateCorrections.estimateId, input.estimateId),
        eq(estimateCorrections.userId, ctx.user.id),
      ))
      .orderBy(desc(estimateCorrections.createdAt));
  }),

  // ── Get learning insights (patterns from corrections) ────────────────────
  getLearningInsights: protectedProcedure.input(z.object({
    trade: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [eq(estimateCorrections.userId, ctx.user.id)];
    if (input.trade) conditions.push(eq(estimateCorrections.trade, input.trade));

    const all = await db.select().from(estimateCorrections)
      .where(and(...conditions))
      .orderBy(desc(estimateCorrections.createdAt));

    // Aggregate patterns
    const patterns: Record<string, { count: number; avgDelta: number; examples: string[] }> = {};
    
    for (const c of all) {
      const key = `${c.correctionType}:${c.fieldName || "general"}`;
      if (!patterns[key]) patterns[key] = { count: 0, avgDelta: 0, examples: [] };
      patterns[key].count++;
      
      // Calculate numeric delta for quantity/rate changes
      if (c.aiValue && c.humanValue && (c.correctionType === "quantity_change" || c.correctionType === "rate_change")) {
        const ai = parseFloat(c.aiValue);
        const human = parseFloat(c.humanValue);
        if (!isNaN(ai) && !isNaN(human) && ai > 0) {
          const delta = ((human - ai) / ai) * 100;
          patterns[key].avgDelta = (patterns[key].avgDelta * (patterns[key].count - 1) + delta) / patterns[key].count;
        }
      }
      
      if (c.itemDescription && patterns[key].examples.length < 5) {
        patterns[key].examples.push(c.itemDescription);
      }
    }

    // Build AI learning prompt context from corrections
    const learningContext: string[] = [];
    for (const [key, data] of Object.entries(patterns)) {
      const [type, field] = key.split(":");
      if (data.count >= 2) {
        if (type === "quantity_change" && Math.abs(data.avgDelta) > 5) {
          learningContext.push(`User typically adjusts ${field} quantities by ${data.avgDelta > 0 ? "+" : ""}${data.avgDelta.toFixed(0)}% (based on ${data.count} corrections). Examples: ${data.examples.slice(0, 3).join(", ")}`);
        } else if (type === "rate_change" && Math.abs(data.avgDelta) > 5) {
          learningContext.push(`User typically adjusts ${field} rates by ${data.avgDelta > 0 ? "+" : ""}${data.avgDelta.toFixed(0)}% (based on ${data.count} corrections). Examples: ${data.examples.slice(0, 3).join(", ")}`);
        } else if (type === "item_added" && data.count >= 3) {
          learningContext.push(`User frequently adds items the AI misses (${data.count} times). Common additions: ${data.examples.slice(0, 3).join(", ")}`);
        } else if (type === "item_removed" && data.count >= 3) {
          learningContext.push(`User frequently removes items the AI includes (${data.count} times). Common removals: ${data.examples.slice(0, 3).join(", ")}`);
        }
      }
    }

    return {
      totalCorrections: all.length,
      patterns: Object.entries(patterns).map(([key, data]) => ({
        key,
        ...data,
      })),
      learningContext,
      recentCorrections: all.slice(0, 10),
    };
  }),

  // ── Job Outcomes ─────────────────────────────────────────────────────────
  recordOutcome: protectedProcedure.input(z.object({
    estimateId: z.number(),
    projectId: z.number(),
    trade: z.string(),
    actualTotal: z.number(),
    actualLabourHours: z.number().optional(),
    actualMaterialsCost: z.number().optional(),
    completionDays: z.number().optional(),
    clientSatisfaction: z.enum(["excellent", "good", "fair", "poor"]).optional(),
    lessonsLearned: z.string().optional(),
    itemVariances: z.array(z.object({
      description: z.string(),
      quoted: z.number(),
      actual: z.number(),
      variance: z.number(),
    })).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    
    // Get the estimate for quoted values
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) throw new Error("Estimate not found");

    const quotedTotal = parseFloat(estimate.total as string) || 0;
    const varianceAmount = input.actualTotal - quotedTotal;
    const variancePercent = quotedTotal > 0 ? (varianceAmount / quotedTotal) * 100 : 0;
    const profitAmount = quotedTotal - input.actualTotal;
    const profitPercent = quotedTotal > 0 ? (profitAmount / quotedTotal) * 100 : 0;

    // Calculate quoted labour/materials from line items
    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.estimateId));
    const quotedLabourHours = items
      .filter(i => i.category === "Labour")
      .reduce((sum, i) => sum + parseFloat(i.quantity as string), 0);
    const quotedMaterialsCost = items
      .filter(i => i.category === "Materials")
      .reduce((sum, i) => sum + parseFloat(i.subtotal as string), 0);

    const result = await db.insert(jobOutcomes).values({
      estimateId: input.estimateId,
      projectId: input.projectId,
      userId: ctx.user.id,
      trade: input.trade,
      quotedTotal: quotedTotal.toString() as any,
      quotedLabourHours: quotedLabourHours.toString() as any,
      quotedMaterialsCost: quotedMaterialsCost.toString() as any,
      actualTotal: input.actualTotal.toString() as any,
      actualLabourHours: input.actualLabourHours?.toString() as any,
      actualMaterialsCost: input.actualMaterialsCost?.toString() as any,
      varianceAmount: varianceAmount.toFixed(2) as any,
      variancePercent: variancePercent.toFixed(2) as any,
      profitAmount: profitAmount.toFixed(2) as any,
      profitPercent: profitPercent.toFixed(2) as any,
      completionDays: input.completionDays,
      clientSatisfaction: input.clientSatisfaction,
      lessonsLearned: input.lessonsLearned,
      itemVariances: input.itemVariances as any,
    });

    return { id: Number((result as any).insertId), variancePercent, profitPercent };
  }),

  listOutcomes: protectedProcedure.input(z.object({
    trade: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [eq(jobOutcomes.userId, ctx.user.id)];
    if (input.trade) conditions.push(eq(jobOutcomes.trade, input.trade));
    return db.select().from(jobOutcomes)
      .where(and(...conditions))
      .orderBy(desc(jobOutcomes.createdAt));
  }),

  getOutcome: protectedProcedure.input(z.object({ estimateId: z.number() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const [outcome] = await db.select().from(jobOutcomes)
      .where(and(eq(jobOutcomes.estimateId, input.estimateId), eq(jobOutcomes.userId, ctx.user.id)))
      .limit(1);
    return outcome ?? null;
  }),

  // ── Accuracy dashboard data ──────────────────────────────────────────────
  getAccuracyDashboard: protectedProcedure.input(z.object({
    trade: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const conditions = [eq(jobOutcomes.userId, ctx.user.id)];
    if (input.trade) conditions.push(eq(jobOutcomes.trade, input.trade));

    const outcomes = await db.select().from(jobOutcomes)
      .where(and(...conditions))
      .orderBy(desc(jobOutcomes.createdAt));

    if (outcomes.length === 0) {
      return {
        totalJobs: 0,
        avgVariance: 0,
        avgProfit: 0,
        accuracyScore: null,
        outcomes: [],
      };
    }

    const avgVariance = outcomes.reduce((sum, o) => sum + parseFloat(o.variancePercent as string || "0"), 0) / outcomes.length;
    const avgProfit = outcomes.reduce((sum, o) => sum + parseFloat(o.profitPercent as string || "0"), 0) / outcomes.length;
    
    // Accuracy score: 100 - avg absolute variance (capped at 0-100)
    const avgAbsVariance = outcomes.reduce((sum, o) => sum + Math.abs(parseFloat(o.variancePercent as string || "0")), 0) / outcomes.length;
    const accuracyScore = Math.max(0, Math.min(100, 100 - avgAbsVariance));

    return {
      totalJobs: outcomes.length,
      avgVariance: Math.round(avgVariance * 10) / 10,
      avgProfit: Math.round(avgProfit * 10) / 10,
      accuracyScore: Math.round(accuracyScore),
      outcomes: outcomes.slice(0, 20).map(o => ({
        id: o.id,
        estimateId: o.estimateId,
        trade: o.trade,
        quotedTotal: parseFloat(o.quotedTotal as string),
        actualTotal: parseFloat(o.actualTotal as string),
        variancePercent: parseFloat(o.variancePercent as string || "0"),
        profitPercent: parseFloat(o.profitPercent as string || "0"),
        clientSatisfaction: o.clientSatisfaction,
        createdAt: o.createdAt,
      })),
    };
  }),
});
