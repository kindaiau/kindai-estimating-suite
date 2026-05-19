import { z } from "zod";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getIndustryConfig, industryList, type IndustryKey } from "../../config/industries";
import { requireDatabase } from "../_core/errors";
import { invokeLLM } from "../_core/llm";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  analyticsEvents,
  automationLogs,
  betaSignups,
  businessTasks,
  crmActivities,
  crmLeads,
  deliveryProjects,
  estimates,
  organizations,
} from "../../drizzle/schema";
import { getOrCreateOrganization, updateOrganizationIndustry } from "../saas/organization";
import { buildTransactionalEmail } from "../email/templates";
import { sendEmail } from "../resendSender";

const industryKeySchema = z.enum(["cabinet-makers", "electricians"]);
const leadStageSchema = z.enum(["new_lead", "qualified", "quote_sent", "follow_up", "won", "lost"]);

function scoreLead(input: { jobType?: string; notes?: string; email?: string; phone?: string }) {
  let score = 35;
  if (input.email) score += 15;
  if (input.phone) score += 15;
  if (input.jobType) score += 15;
  if ((input.notes || "").length > 80) score += 20;
  return Math.min(score, 100);
}

function buildFallbackEstimate(industryKey: IndustryKey, scope: string) {
  const industry = getIndustryConfig(industryKey);
  const items = industry.estimateTemplates.slice(0, 6).map((item, index) => ({
    description: item.label,
    category: item.category,
    unit: item.unit,
    quantity: index < 2 ? 1 : 4,
    unitRate: item.defaultRate,
    subtotal: (index < 2 ? 1 : 4) * item.defaultRate,
    notes: item.notes,
  }));
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const gst = subtotal * 0.1;
  return {
    source: "fallback_template",
    title: `${industry.shortName} estimate draft`,
    summary: `Template-based first-pass draft for: ${scope}`,
    assumptions: [
      "Final quantities must be reviewed by the estimator.",
      "Rates should be checked against the business price book.",
      "No quote is sent automatically.",
    ],
    items,
    subtotal,
    gst,
    total: subtotal + gst,
  };
}

export const saasRouter = router({
  industries: publicProcedure.query(() => industryList),

  industry: publicProcedure
    .input(z.object({ industryKey: industryKeySchema.optional() }).optional())
    .query(({ input }) => getIndustryConfig(input?.industryKey)),

  captureLandingLead: publicProcedure
    .input(z.object({
      industryKey: industryKeySchema,
      name: z.string().min(2).max(255),
      email: z.string().email(),
      phone: z.string().max(30).optional(),
      company: z.string().max(255).optional(),
      message: z.string().max(2000).optional(),
      source: z.string().max(128).optional(),
      utmSource: z.string().max(128).optional(),
      utmCampaign: z.string().max(128).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = requireDatabase(await getDb());
      const industry = getIndustryConfig(input.industryKey);

      await db.insert(betaSignups).values({
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        company: input.company,
        trade: industry.tradeId,
        intent: "Pilot Spot Request",
        source: input.source ?? industry.key,
        utmSource: input.utmSource,
        utmCampaign: input.utmCampaign,
        landingPath: industry.landingPath,
        feedback: input.message,
      }).onDuplicateKeyUpdate({
        set: {
          phone: input.phone,
          company: input.company,
          trade: industry.tradeId,
          feedback: input.message,
          source: input.source ?? industry.key,
        },
      });

      const email = buildTransactionalEmail("crm_notification", {
        name: input.name,
        industryName: industry.name,
        message: `${input.name} requested a ${industry.name} Kindai pilot. Email: ${input.email}. Phone: ${input.phone || "not supplied"}.`,
        nextAction: "Review the lead and book a setup call.",
      });

      sendEmail({
        to: process.env.MATTHEW_NOTIFICATION_EMAIL || "matt@kindaiestimator.com",
        subject: `New ${industry.name} lead: ${input.name}`,
        html: email.html,
        fromName: "Kindai Estimator",
      }).catch(() => undefined);

      return { success: true };
    }),

  getWorkspace: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const organization = await getOrCreateOrganization(db, ctx.user.id);
    const industry = getIndustryConfig(organization.industryKey);
    return { organization, industry };
  }),

  completeOnboarding: protectedProcedure
    .input(z.object({
      industryKey: industryKeySchema,
      companyName: z.string().min(2).max(255),
      phone: z.string().max(30).optional(),
      website: z.string().max(255).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      await updateOrganizationIndustry(db, ctx.user.id, input.industryKey, {
        name: input.companyName,
        phone: input.phone,
        website: input.website,
      });

      const industry = getIndustryConfig(input.industryKey);
      if (ctx.user.email) {
        const email = buildTransactionalEmail("onboarding", {
          name: ctx.user.name ?? input.companyName,
          industryName: industry.name,
        });
        sendEmail({
          to: ctx.user.email,
          subject: email.subject,
          html: email.html,
          fromName: "Kindai Estimator",
        }).catch(() => undefined);
      }

      return { success: true };
    }),

  createLead: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().max(30).optional(),
      company: z.string().max(255).optional(),
      jobType: z.string().max(128).optional(),
      notes: z.string().max(4000).optional(),
      source: z.string().max(128).optional(),
      tags: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const organization = await getOrCreateOrganization(db, ctx.user.id);
      const score = scoreLead(input);
      const result = await db.insert(crmLeads).values({
        organizationId: organization.id,
        userId: ctx.user.id,
        industryKey: organization.industryKey,
        name: input.name,
        email: input.email || undefined,
        phone: input.phone,
        company: input.company,
        jobType: input.jobType,
        source: input.source ?? "manual",
        score,
        notes: input.notes,
        tags: input.tags ?? [],
        qualification: {
          capturedAt: new Date().toISOString(),
          scoreReason: "Scored from contact details, job type, and scope detail.",
        },
      });
      const id = Number((result as any)[0]?.insertId ?? (result as any).insertId ?? 0);
      await db.insert(crmActivities).values({
        leadId: id,
        organizationId: organization.id,
        userId: ctx.user.id,
        type: "note",
        title: "Lead created",
        body: input.notes || "Lead added to CRM.",
      });
      return { id, score };
    }),

  listLeads: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const organization = await getOrCreateOrganization(db, ctx.user.id);
    return db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.organizationId, organization.id))
      .orderBy(desc(crmLeads.updatedAt))
      .limit(250);
  }),

  updateLeadStage: protectedProcedure
    .input(z.object({ id: z.number(), stage: leadStageSchema }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const organization = await getOrCreateOrganization(db, ctx.user.id);
      const status = input.stage === "won" ? "won" : input.stage === "lost" ? "lost" : "open";
      await db
        .update(crmLeads)
        .set({ pipelineStage: input.stage, status })
        .where(and(eq(crmLeads.id, input.id), eq(crmLeads.organizationId, organization.id)));
      await db.insert(crmActivities).values({
        leadId: input.id,
        organizationId: organization.id,
        userId: ctx.user.id,
        type: "status_change",
        title: `Moved to ${input.stage.replace("_", " ")}`,
      });
      return { success: true };
    }),

  crmStats: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const organization = await getOrCreateOrganization(db, ctx.user.id);
    const rows = await db
      .select({ stage: crmLeads.pipelineStage, count: count() })
      .from(crmLeads)
      .where(eq(crmLeads.organizationId, organization.id))
      .groupBy(crmLeads.pipelineStage);
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.stage] = Number(row.count);
      return acc;
    }, {});
  }),

  generateEstimateDraft: protectedProcedure
    .input(z.object({
      industryKey: industryKeySchema.optional(),
      scope: z.string().min(10).max(6000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const organization = await getOrCreateOrganization(db, ctx.user.id);
      const industry = getIndustryConfig(input.industryKey ?? organization.industryKey);
      const fallback = buildFallbackEstimate(industry.key, input.scope);

      try {
        const result = await invokeLLM({
          messages: [
            { role: "system", content: `${industry.prompts.estimatorSystem}\nReturn concise JSON with title, summary, assumptions, items, subtotal, gst, total. Do not send anything to a customer.` },
            { role: "user", content: input.scope },
          ],
          responseFormat: { type: "json_object" },
          maxTokens: 1800,
        });
        const content = result.choices[0]?.message.content;
        const parsed = typeof content === "string" ? JSON.parse(content) : fallback;
        return { source: "ai", draft: parsed };
      } catch (error) {
        await db.insert(automationLogs).values({
          organizationId: organization.id,
          userId: ctx.user.id,
          agent: "conversion",
          eventType: "estimate_draft_fallback",
          status: "skipped",
          payload: { error: error instanceof Error ? error.message : String(error) },
        });
        return { source: "fallback_template", draft: fallback };
      }
    }),

  analyticsSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const organization = await getOrCreateOrganization(db, ctx.user.id);
    const [leadCount] = await db.select({ value: count() }).from(crmLeads).where(eq(crmLeads.organizationId, organization.id));
    const [taskCount] = await db.select({ value: count() }).from(businessTasks).where(eq(businessTasks.organizationId, organization.id));
    const [projectCount] = await db.select({ value: count() }).from(deliveryProjects).where(eq(deliveryProjects.organizationId, organization.id));
    const [quoteTotal] = await db
      .select({ value: sql<number>`coalesce(sum(${estimates.total}), 0)` })
      .from(estimates)
      .where(eq(estimates.userId, ctx.user.id));

    return {
      leads: Number(leadCount?.value ?? 0),
      tasks: Number(taskCount?.value ?? 0),
      deliveryProjects: Number(projectCount?.value ?? 0),
      quotedValue: Number(quoteTotal?.value ?? 0),
    };
  }),

  logEvent: protectedProcedure
    .input(z.object({
      eventName: z.string().min(2).max(128),
      source: z.string().max(128).optional(),
      properties: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const organization = await getOrCreateOrganization(db, ctx.user.id);
      await db.insert(analyticsEvents).values({
        organizationId: organization.id,
        userId: ctx.user.id,
        industryKey: organization.industryKey,
        eventName: input.eventName,
        source: input.source,
        properties: input.properties ?? {},
        occurredAt: Date.now(),
      });
      return { success: true };
    }),

  createAutomationLog: protectedProcedure
    .input(z.object({
      agent: z.enum(["acquisition", "conversion", "delivery", "system"]),
      eventType: z.string().min(2).max(128),
      status: z.enum(["queued", "drafted", "sent", "skipped", "failed"]).default("queued"),
      payload: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const organization = await getOrCreateOrganization(db, ctx.user.id);
      await db.insert(automationLogs).values({
        organizationId: organization.id,
        userId: ctx.user.id,
        agent: input.agent,
        eventType: input.eventType,
        status: input.status,
        payload: input.payload ?? {},
      });
      return { success: true };
    }),

  listAutomationLogs: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const organization = await getOrCreateOrganization(db, ctx.user.id);
    return db
      .select()
      .from(automationLogs)
      .where(eq(automationLogs.organizationId, organization.id))
      .orderBy(desc(automationLogs.createdAt))
      .limit(100);
  }),
});
