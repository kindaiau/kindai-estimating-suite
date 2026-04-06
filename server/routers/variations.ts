import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { variations } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const variationsRouter = router({
  list: protectedProcedure.input(z.object({
    projectId: z.number().int().positive(),
  })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(variations)
      .where(and(eq(variations.projectId, input.projectId), eq(variations.userId, ctx.user.id)))
      .orderBy(desc(variations.createdAt));
  }),

  create: protectedProcedure.input(z.object({
    projectId: z.number().int().positive(),
    estimateId: z.number().int().positive().optional(),
    title: z.string().min(1).max(255),
    description: z.string().max(2000).optional(),
    reason: z.enum(["client_request", "design_change", "site_condition", "scope_omission", "regulatory", "other"]).default("client_request"),
    costImpact: z.number(), // positive = addition, negative = deduction
    timeImpactDays: z.number().int().default(0),
    notes: z.string().max(2000).optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Auto-generate variation number
    const existing = await db
      .select({ id: variations.id })
      .from(variations)
      .where(and(eq(variations.projectId, input.projectId), eq(variations.userId, ctx.user.id)));

    const variationNumber = `VO-${String(existing.length + 1).padStart(3, "0")}`;

    await db.insert(variations).values({
      projectId: input.projectId,
      estimateId: input.estimateId,
      userId: ctx.user.id,
      variationNumber,
      title: input.title,
      description: input.description,
      reason: input.reason,
      costImpact: String(input.costImpact),
      timeImpactDays: input.timeImpactDays,
      notes: input.notes,
      status: "draft",
    });

    return { variationNumber };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional(),
    reason: z.enum(["client_request", "design_change", "site_condition", "scope_omission", "regulatory", "other"]).optional(),
    costImpact: z.number().optional(),
    timeImpactDays: z.number().int().optional(),
    status: z.enum(["draft", "submitted", "approved", "rejected", "on_hold"]).optional(),
    approvedBy: z.string().max(255).optional(),
    notes: z.string().max(2000).optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [existing] = await db
      .select()
      .from(variations)
      .where(and(eq(variations.id, input.id), eq(variations.userId, ctx.user.id)));

    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Variation not found" });

    const updateData: Record<string, unknown> = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.reason !== undefined) updateData.reason = input.reason;
    if (input.costImpact !== undefined) updateData.costImpact = String(input.costImpact);
    if (input.timeImpactDays !== undefined) updateData.timeImpactDays = input.timeImpactDays;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === "approved") {
        updateData.approvedAt = new Date();
        updateData.approvedBy = input.approvedBy || ctx.user.name || "Owner";
      }
    }

    await db.update(variations).set(updateData).where(eq(variations.id, input.id));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({
    id: z.number().int().positive(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [existing] = await db
      .select()
      .from(variations)
      .where(and(eq(variations.id, input.id), eq(variations.userId, ctx.user.id)));

    if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Variation not found" });

    await db.delete(variations).where(eq(variations.id, input.id));
    return { success: true };
  }),

  // Get running contract sum for a project
  getContractSummary: protectedProcedure.input(z.object({
    projectId: z.number().int().positive(),
    originalContractValue: z.number().default(0),
  })).query(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) return { originalValue: input.originalContractValue, totalVariations: 0, approvedVariations: 0, revisedContractSum: input.originalContractValue, pendingVariations: 0, variationCount: 0 };

    const allVariations = await db
      .select()
      .from(variations)
      .where(and(eq(variations.projectId, input.projectId), eq(variations.userId, ctx.user.id)));

    const approvedTotal = allVariations
      .filter(v => v.status === "approved")
      .reduce((sum, v) => sum + parseFloat(v.costImpact || "0"), 0);

    const pendingTotal = allVariations
      .filter(v => v.status === "submitted" || v.status === "draft")
      .reduce((sum, v) => sum + parseFloat(v.costImpact || "0"), 0);

    return {
      originalValue: input.originalContractValue,
      totalVariations: allVariations.length,
      approvedVariations: allVariations.filter(v => v.status === "approved").length,
      revisedContractSum: input.originalContractValue + approvedTotal,
      pendingVariations: pendingTotal,
      variationCount: allVariations.length,
    };
  }),
});
