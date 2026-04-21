import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { projects } from "../../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    return db.select().from(projects)
      .where(eq(projects.userId, ctx.user.id))
      .orderBy(desc(projects.createdAt))
      .limit(500); // Prevent unbounded queries
  }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.select().from(projects)
      .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)))
      .limit(1);
    return result[0] ?? null;
  }),

  create: protectedProcedure.input(z.object({
    name: z.string().min(1),
    clientName: z.string().optional(),
    clientEmail: z.string().email().optional().or(z.literal("")),
    clientPhone: z.string().optional(),
    address: z.string().optional(),
    suburb: z.string().optional(),
    state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    postcode: z.string().optional(),
    trade: z.string().min(1),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.insert(projects).values({
      ...input,
      userId: ctx.user.id,
      clientEmail: input.clientEmail || undefined,
    });
    const id = Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0);
    return { id };
  }),

  update: protectedProcedure.input(z.object({
    id: z.number(),
    name: z.string().min(1).optional(),
    clientName: z.string().optional(),
    clientEmail: z.string().optional(),
    clientPhone: z.string().optional(),
    address: z.string().optional(),
    suburb: z.string().optional(),
    state: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    postcode: z.string().optional(),
    status: z.enum(["draft", "quoted", "accepted", "declined", "invoiced", "completed"]).optional(),
    notes: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { id, ...data } = input;
    await db.update(projects).set(data).where(and(eq(projects.id, id), eq(projects.userId, ctx.user.id)));
    return { success: true };
  }),

  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    await db.delete(projects).where(and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id)));
    return { success: true };
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    // Use SQL aggregation instead of fetching all rows into memory
    const rows = await db
      .select({ status: projects.status, count: sql<number>`COUNT(*)` })
      .from(projects)
      .where(eq(projects.userId, ctx.user.id))
      .groupBy(projects.status);
    const counts: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      const n = Number(row.count);
      counts[row.status] = n;
      total += n;
    }
    return {
      total,
      draft: counts["draft"] ?? 0,
      quoted: counts["quoted"] ?? 0,
      accepted: counts["accepted"] ?? 0,
      completed: counts["completed"] ?? 0,
    };
  }),
});
