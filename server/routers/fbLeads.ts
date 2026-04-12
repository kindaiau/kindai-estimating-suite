/**
 * FB Leads Router — Kindai Estimating Suite
 *
 * Admin-only procedures for viewing and managing Facebook leads
 * captured via the /api/webhooks/fb-lead endpoint.
 *
 * Each lead is a betaSignup with source='fb_ad', enriched with:
 *  - HubSpot contact/deal IDs
 *  - Nurture email progress (4 emails: day1, day3, day7, day14)
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { betaSignups, betaNurtureEmails } from "../../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NurtureEmailSummary = {
  emailKey: string;
  status: string;
  scheduledAt: number;
  sentAt: number | null;
};

export type FbLeadRow = {
  id: number;
  name: string;
  email: string;
  company: string | null;
  trade: string | null;
  state: string | null;
  status: string;
  source: string | null;
  hubspotContactId: string | null;
  hubspotDealId: string | null;
  createdAt: Date;
  approvedAt: Date | null;
  nurtureEmails: NurtureEmailSummary[];
  nurtureProgress: {
    total: number;
    sent: number;
    scheduled: number;
    failed: number;
  };
};

// ─── Router ───────────────────────────────────────────────────────────────────

export const fbLeadsRouter = router({
  /**
   * Admin: list all FB leads (source = 'fb_ad') with nurture progress
   */
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(["all", "pending", "approved", "active", "churned"]).optional().default("all"),
        limit: z.number().min(1).max(200).optional().default(100),
        offset: z.number().min(0).optional().default(0),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      const opts = input ?? { status: "all", limit: 100, offset: 0 };

      // Build the where clause
      const whereClause = opts.status === "all"
        ? eq(betaSignups.source, "fb_ad")
        : and(
            eq(betaSignups.source, "fb_ad"),
            eq(betaSignups.status, opts.status as "pending" | "approved" | "active" | "churned")
          );

      // Fetch FB leads
      const leads = await db
        .select()
        .from(betaSignups)
        .where(whereClause)
        .orderBy(desc(betaSignups.createdAt))
        .limit(opts.limit)
        .offset(opts.offset);

      if (leads.length === 0) return { leads: [], total: 0 };

      // Fetch total count for pagination
      const [countResult] = await db
        .select({ total: sql<number>`count(*)` })
        .from(betaSignups)
        .where(whereClause);
      const total = Number(countResult?.total ?? 0);

      // Fetch all nurture emails for these leads in one query
      const leadIds = leads.map((l) => l.id);
      const allNurtureEmails = leadIds.length > 0
        ? await db
            .select({
              betaSignupId: betaNurtureEmails.betaSignupId,
              emailKey: betaNurtureEmails.emailKey,
              status: betaNurtureEmails.status,
              scheduledAt: betaNurtureEmails.scheduledAt,
              sentAt: betaNurtureEmails.sentAt,
            })
            .from(betaNurtureEmails)
            .where(
              sql`${betaNurtureEmails.betaSignupId} IN (${sql.join(leadIds.map(id => sql`${id}`), sql`, `)})`
            )
            .orderBy(betaNurtureEmails.scheduledAt)
        : [];

      // Group nurture emails by lead ID
      const nurtureByLead = new Map<number, typeof allNurtureEmails>();
      for (const ne of allNurtureEmails) {
        const existing = nurtureByLead.get(ne.betaSignupId) ?? [];
        existing.push(ne);
        nurtureByLead.set(ne.betaSignupId, existing);
      }

      // Enrich leads with nurture progress
      const enrichedLeads: FbLeadRow[] = leads.map((lead) => {
        const emails = nurtureByLead.get(lead.id) ?? [];
        const nurtureProgress = {
          total: emails.length,
          sent: emails.filter((e) => e.status === "sent").length,
          scheduled: emails.filter((e) => e.status === "scheduled").length,
          failed: emails.filter((e) => e.status === "failed").length,
        };
        return {
          ...lead,
          nurtureEmails: emails.map((e) => ({
            emailKey: e.emailKey,
            status: e.status,
            scheduledAt: e.scheduledAt,
            sentAt: e.sentAt,
          })),
          nurtureProgress,
        };
      });

      return { leads: enrichedLeads, total };
    }),

  /**
   * Admin: get a single FB lead with full nurture history
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;

      const [lead] = await db
        .select()
        .from(betaSignups)
        .where(eq(betaSignups.id, input.id))
        .limit(1);

      if (!lead) throw new Error("Lead not found");

      const nurtureEmails = await db
        .select()
        .from(betaNurtureEmails)
        .where(eq(betaNurtureEmails.betaSignupId, input.id))
        .orderBy(betaNurtureEmails.scheduledAt);

      return { lead, nurtureEmails };
    }),

  /**
   * Admin: approve a lead (status → approved)
   */
  approve: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") throw new Error("Forbidden");
      const db = (await getDb())!;
      await db
        .update(betaSignups)
        .set({ status: "approved", approvedAt: new Date() })
        .where(eq(betaSignups.id, input.id));
      return { success: true };
    }),

  /**
   * Admin: summary stats for the FB leads dashboard
   */
  stats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new Error("Forbidden");
    const db = (await getDb())!;

    const [total] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaSignups)
      .where(eq(betaSignups.source, "fb_ad"));

    const [withHubspot] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaSignups)
      .where(
        and(
          eq(betaSignups.source, "fb_ad"),
          sql`${betaSignups.hubspotContactId} IS NOT NULL`
        )
      );

    const [nurtureScheduled] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaNurtureEmails)
      .where(eq(betaNurtureEmails.status, "scheduled"));

    const [nurtureSent] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaNurtureEmails)
      .where(eq(betaNurtureEmails.status, "sent"));

    const [nurtureFailed] = await db
      .select({ count: sql<number>`count(*)` })
      .from(betaNurtureEmails)
      .where(eq(betaNurtureEmails.status, "failed"));

    return {
      totalLeads: Number(total?.count ?? 0),
      hubspotSynced: Number(withHubspot?.count ?? 0),
      nurtureScheduled: Number(nurtureScheduled?.count ?? 0),
      nurtureSent: Number(nurtureSent?.count ?? 0),
      nurtureFailed: Number(nurtureFailed?.count ?? 0),
    };
  }),
});
