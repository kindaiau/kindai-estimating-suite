import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { estimates, quoteFollowups } from "../../drizzle/schema";
import { eq, and, lte, isNull } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Email templates for each follow-up day ──────────────────────────────────
const FOLLOWUP_TEMPLATES = {
  day1: {
    subject: "Your quote from {businessName} — {quoteNumber}",
    label: "Same-day confirmation",
    tone: "warm and professional",
    prompt: `Write a brief, professional follow-up email confirming a quote was sent. 
Tone: warm, confident, Australian trade contractor.
Include: confirmation quote was sent, offer to answer questions, mention quote is valid for {validDays} days.
Keep it under 80 words. No fluff. Sign off from {businessName}.`,
  },
  day3: {
    subject: "Following up on your quote — {quoteNumber}",
    label: "3-day check-in",
    tone: "helpful and curious",
    prompt: `Write a brief follow-up email checking if the client had a chance to review the quote.
Tone: helpful, not pushy, genuine interest in their project.
Include: checking if they had time to review, offer to answer any questions or adjust scope, mention you're keen to get started.
Keep it under 80 words. Australian English. Sign off from {businessName}.`,
  },
  day7: {
    subject: "Still keen to help — {quoteNumber}",
    label: "7-day gentle nudge",
    tone: "direct but friendly",
    prompt: `Write a follow-up email for a quote that hasn't been responded to after 7 days.
Tone: direct, friendly, no pressure but creating mild urgency.
Include: mention quote expires in {remainingDays} days, offer to adjust if budget is a concern, ask if they'd like to proceed.
Keep it under 80 words. Australian English. Sign off from {businessName}.`,
  },
  day14: {
    subject: "Last chance — quote expires soon — {quoteNumber}",
    label: "14-day final follow-up",
    tone: "clear urgency, respectful close",
    prompt: `Write a final follow-up email for a quote expiring soon.
Tone: clear, respectful, creating genuine urgency without being pushy.
Include: quote expires in {remainingDays} days, if they're not proceeding that's okay but you'd love to know, offer a quick call to discuss.
Keep it under 80 words. Australian English. Sign off from {businessName}.`,
  },
};

// ─── Generate email content using AI ─────────────────────────────────────────
async function generateEmailContent(
  template: typeof FOLLOWUP_TEMPLATES.day1,
  context: {
    businessName: string;
    clientName: string;
    projectAddress: string;
    quoteNumber: string;
    totalAmount: string;
    trade: string;
    validDays: number;
    remainingDays: number;
  }
): Promise<{ subject: string; body: string }> {
  const subject = template.subject
    .replace("{businessName}", context.businessName)
    .replace("{quoteNumber}", context.quoteNumber);

  const promptWithContext = template.prompt
    .replace("{businessName}", context.businessName)
    .replace("{validDays}", context.validDays.toString())
    .replace("{remainingDays}", context.remainingDays.toString());

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are writing a follow-up email on behalf of an Australian trade contractor. Write only the email body — no subject line, no "Dear" header. Start directly with the content. Sign off with "Kind regards,\n${context.businessName}"`,
      },
      {
        role: "user",
        content: `${promptWithContext}

Context:
- Client name: ${context.clientName}
- Project: ${context.projectAddress}
- Quote number: ${context.quoteNumber}
- Quote total: $${context.totalAmount} inc. GST
- Trade: ${context.trade}`,
      },
    ],
  });

  const body = (response.choices[0]?.message?.content as string) ?? "";
  return { subject, body };
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const emailFollowupRouter = router({
  // Get all follow-ups for an estimate
  getFollowups: protectedProcedure.input(z.object({
    estimateId: z.number(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) return [];
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) return [];
    return db.select().from(quoteFollowups).where(eq(quoteFollowups.estimateId, input.estimateId));
  }),

  // Schedule follow-up sequence when a quote is sent
  scheduleSequence: protectedProcedure.input(z.object({
    estimateId: z.number(),
    clientEmail: z.string().email(),
    clientName: z.string(),
    projectAddress: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    const sequence = [
      { dayOffset: 1, templateKey: "day1" as const, label: "Same-day confirmation" },
      { dayOffset: 3, templateKey: "day3" as const, label: "3-day check-in" },
      { dayOffset: 7, templateKey: "day7" as const, label: "7-day gentle nudge" },
      { dayOffset: 14, templateKey: "day14" as const, label: "14-day final follow-up" },
    ];

    const inserted = [];
    for (const step of sequence) {
      const scheduledAt = now + step.dayOffset * dayMs;
      const result = await db.insert(quoteFollowups).values({
        estimateId: input.estimateId,
        userId: ctx.user.id,
        clientEmail: input.clientEmail,
        clientName: input.clientName,
        dayOffset: step.dayOffset,
        label: step.label,
        scheduledAt,
        status: "scheduled",
      } as any);
      inserted.push({ id: Number((result as any).insertId), dayOffset: step.dayOffset, label: step.label });
    }

    return { scheduled: inserted.length, followups: inserted };
  }),

  // Preview an email before sending
  previewEmail: protectedProcedure.input(z.object({
    estimateId: z.number(),
    dayOffset: z.number(),
    clientName: z.string(),
    projectAddress: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const { users } = await import("../../drizzle/schema");
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const templateKey = input.dayOffset === 1 ? "day1"
      : input.dayOffset === 3 ? "day3"
      : input.dayOffset === 7 ? "day7"
      : "day14";

    const template = FOLLOWUP_TEMPLATES[templateKey];
    const validDays = est.quoteValidDays || 30;
    const sentDaysAgo = input.dayOffset;
    const remainingDays = Math.max(0, validDays - sentDaysAgo);

    const content = await generateEmailContent(template, {
      businessName: user?.companyName || user?.name || "Your Trade Business",
      clientName: input.clientName,
      projectAddress: input.projectAddress || "your project",
      quoteNumber: est.quoteNumber || `KAI-${est.id}`,
      totalAmount: parseFloat(est.total as string).toFixed(2),
      trade: est.trade,
      validDays,
      remainingDays,
    });

    return content;
  }),

  // Send a follow-up email (marks as sent, generates content)
  sendFollowup: protectedProcedure.input(z.object({
    followupId: z.number(),
    estimateId: z.number(),
    customBody: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [followup] = await db.select().from(quoteFollowups)
      .where(and(eq(quoteFollowups.id, input.followupId), eq(quoteFollowups.userId, ctx.user.id)))
      .limit(1);
    if (!followup) throw new Error("Follow-up not found");

    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const { users } = await import("../../drizzle/schema");
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

    const templateKey = followup.dayOffset === 1 ? "day1"
      : followup.dayOffset === 3 ? "day3"
      : followup.dayOffset === 7 ? "day7"
      : "day14";

    const template = FOLLOWUP_TEMPLATES[templateKey];
    const validDays = est.quoteValidDays || 30;
    const remainingDays = Math.max(0, validDays - (followup.dayOffset || 1));

    let emailContent;
    if (input.customBody) {
      emailContent = {
        subject: template.subject
          .replace("{businessName}", user?.companyName || user?.name || "Your Business")
          .replace("{quoteNumber}", est.quoteNumber || `KAI-${est.id}`),
        body: input.customBody,
      };
    } else {
      emailContent = await generateEmailContent(template, {
        businessName: user?.companyName || user?.name || "Your Trade Business",
        clientName: followup.clientName || "Client",
        projectAddress: "your project",
        quoteNumber: est.quoteNumber || `KAI-${est.id}`,
        totalAmount: parseFloat(est.total as string).toFixed(2),
        trade: est.trade,
        validDays,
        remainingDays,
      });
    }

    // Mark as sent
    await db.update(quoteFollowups).set({
      status: "sent",
      sentAt: Date.now(),
      emailSubject: emailContent.subject,
      emailBody: emailContent.body,
    } as any).where(eq(quoteFollowups.id, input.followupId));

    return {
      success: true,
      subject: emailContent.subject,
      body: emailContent.body,
      sentTo: followup.clientEmail,
    };
  }),

  // Cancel a follow-up
  cancelFollowup: protectedProcedure.input(z.object({
    followupId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    await db.update(quoteFollowups).set({ status: "cancelled" } as any)
      .where(and(eq(quoteFollowups.id, input.followupId), eq(quoteFollowups.userId, ctx.user.id)));
    return { success: true };
  }),

  // Get follow-up templates (for display in UI)
  getTemplates: protectedProcedure.query(() => {
    return Object.entries(FOLLOWUP_TEMPLATES).map(([key, t]) => ({
      key,
      dayOffset: key === "day1" ? 1 : key === "day3" ? 3 : key === "day7" ? 7 : 14,
      label: t.label,
      subject: t.subject,
      tone: t.tone,
    }));
  }),
});
