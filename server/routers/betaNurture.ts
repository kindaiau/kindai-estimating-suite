import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { betaNurtureEmails, betaSignups } from "../../drizzle/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import {
  NURTURE_SEQUENCE,
  sendNurtureEmail,
  buildNurtureEmail,
  type NurtureEmailKey,
} from "../betaNurture";

const DAY_MS = 24 * 60 * 60 * 1000;

// ─── Schedule nurture emails for a new beta signup ───────────────────────────

export async function scheduleNurtureForSignup(signupData: {
  id: number;
  name: string;
  email: string;
  spotNumber: number;
  trade?: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const now = Date.now();
  let scheduled = 0;

  for (const step of NURTURE_SEQUENCE) {
    const scheduledAt = now + step.dayOffset * DAY_MS;

    await db.insert(betaNurtureEmails).values({
      betaSignupId: signupData.id,
      email: signupData.email,
      name: signupData.name,
      trade: signupData.trade,
      spotNumber: signupData.spotNumber,
      emailKey: step.emailKey,
      scheduledAt,
      status: "scheduled",
    });
    scheduled++;
  }

  console.log(
    `[Nurture] Scheduled ${scheduled} emails for ${signupData.email} (signup #${signupData.id})`
  );
  return scheduled;
}

// ─── Process due nurture emails (called by cron/interval) ────────────────────

export async function processDueNurtureEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, failed: 0 };

  const now = Date.now();

  // Find all scheduled emails that are due
  // Note: MySQL2 driver rejects parameterised LIMIT values in some configurations.
  // Workaround: fetch without limit then slice in JS.
  const allDueEmails = await db
    .select()
    .from(betaNurtureEmails)
    .where(
      and(
        eq(betaNurtureEmails.status, "scheduled"),
        lte(betaNurtureEmails.scheduledAt, now)
      )
    );
  const dueEmails = allDueEmails.slice(0, 50); // Process in batches of 50

  let sent = 0;
  let failed = 0;

  for (const email of dueEmails) {
    // Check if the signup has unsubscribed (status = "churned")
    const [signup] = await db
      .select({ status: betaSignups.status })
      .from(betaSignups)
      .where(eq(betaSignups.id, email.betaSignupId))
      .limit(1);

    if (signup?.status === "churned") {
      // Cancel remaining emails for churned signups
      await db
        .update(betaNurtureEmails)
        .set({ status: "cancelled" } as any)
        .where(eq(betaNurtureEmails.id, email.id));
      continue;
    }

    const result = await sendNurtureEmail(email.emailKey as NurtureEmailKey, {
      name: email.name,
      email: email.email,
      spotNumber: email.spotNumber,
      trade: email.trade ?? undefined,
    });

    if (result.success) {
      await db
        .update(betaNurtureEmails)
        .set({
          status: "sent",
          sentAt: Date.now(),
          brevoMessageId: result.messageId,
        } as any)
        .where(eq(betaNurtureEmails.id, email.id));
      sent++;
    } else {
      await db
        .update(betaNurtureEmails)
        .set({
          status: "failed",
          errorMessage: result.error,
        } as any)
        .where(eq(betaNurtureEmails.id, email.id));
      failed++;
    }
  }

  if (dueEmails.length > 0) {
    console.log(
      `[Nurture] Processed ${dueEmails.length} due emails: ${sent} sent, ${failed} failed`
    );
  }

  return { processed: dueEmails.length, sent, failed };
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const betaNurtureRouter = router({
  // Admin: list all nurture emails (optionally filtered by signup)
  list: protectedProcedure
    .input(
      z.object({
        betaSignupId: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      if (input?.betaSignupId) {
        return db
          .select()
          .from(betaNurtureEmails)
          .where(eq(betaNurtureEmails.betaSignupId, input.betaSignupId))
          .orderBy(sql`${betaNurtureEmails.scheduledAt} ASC`);
      }

      return db
        .select()
        .from(betaNurtureEmails)
        .orderBy(sql`${betaNurtureEmails.scheduledAt} DESC`)
        .limit(200);
    }),

  // Admin: get nurture stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = (await getDb())!;

    const [scheduled] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaNurtureEmails)
      .where(eq(betaNurtureEmails.status, "scheduled"));

    const [sent] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaNurtureEmails)
      .where(eq(betaNurtureEmails.status, "sent"));

    const [failed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaNurtureEmails)
      .where(eq(betaNurtureEmails.status, "failed"));

    const [cancelled] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaNurtureEmails)
      .where(eq(betaNurtureEmails.status, "cancelled"));

    return {
      scheduled: Number(scheduled?.count ?? 0),
      sent: Number(sent?.count ?? 0),
      failed: Number(failed?.count ?? 0),
      cancelled: Number(cancelled?.count ?? 0),
      total:
        Number(scheduled?.count ?? 0) +
        Number(sent?.count ?? 0) +
        Number(failed?.count ?? 0) +
        Number(cancelled?.count ?? 0),
    };
  }),

  // Admin: preview a nurture email
  preview: protectedProcedure
    .input(
      z.object({
        emailKey: z.enum([
          "day1_activation",
          "day3_social_proof",
          "day7_roi",
          "day14_urgency",
        ]),
        name: z.string().default("Test Tradie"),
        trade: z.string().optional(),
        spotNumber: z.number().default(1),
      })
    )
    .query(({ input }) => {
      const content = buildNurtureEmail(input.emailKey, {
        name: input.name,
        email: "test@example.com",
        spotNumber: input.spotNumber,
        trade: input.trade,
      });
      return content;
    }),

  // Admin: manually trigger processing of due emails
  processNow: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    return processDueNurtureEmails();
  }),

  // Admin: cancel all pending nurture emails for a signup
  cancelForSignup: protectedProcedure
    .input(z.object({ betaSignupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      const result = await db
        .update(betaNurtureEmails)
        .set({ status: "cancelled" } as any)
        .where(
          and(
            eq(betaNurtureEmails.betaSignupId, input.betaSignupId),
            eq(betaNurtureEmails.status, "scheduled")
          )
        );

      return { success: true };
    }),

  // Admin: retry a failed email
  retry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      const [email] = await db
        .select()
        .from(betaNurtureEmails)
        .where(eq(betaNurtureEmails.id, input.id))
        .limit(1);

      if (!email) throw new Error("Email not found");
      if (email.status !== "failed") throw new Error("Can only retry failed emails");

      const result = await sendNurtureEmail(email.emailKey as NurtureEmailKey, {
        name: email.name,
        email: email.email,
        spotNumber: email.spotNumber,
        trade: email.trade ?? undefined,
      });

      if (result.success) {
        await db
          .update(betaNurtureEmails)
          .set({
            status: "sent",
            sentAt: Date.now(),
            brevoMessageId: result.messageId,
            errorMessage: null,
          } as any)
          .where(eq(betaNurtureEmails.id, input.id));
      } else {
        await db
          .update(betaNurtureEmails)
          .set({ errorMessage: result.error } as any)
          .where(eq(betaNurtureEmails.id, input.id));
      }

      return { success: result.success, error: result.error };
    }),
});
