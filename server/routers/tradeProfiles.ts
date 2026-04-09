import z from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tradeProfiles, emailTemplates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";

// ─── Default email templates per type ────────────────────────────────────────
function getDefaultTemplate(type: string, tradeName: string): { subject: string; bodyHtml: string } {
  const templates: Record<string, { subject: string; bodyHtml: string }> = {
    quote_delivery: {
      subject: `Your {{trade}} Quote — {{quoteNumber}} from {{businessName}}`,
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #FF2D78, #FF6B35); padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
    {{#if logoUrl}}<img src="{{logoUrl}}" alt="{{businessName}}" style="height: 60px; margin-bottom: 16px;" /><br/>{{/if}}
    <h1 style="color: white; margin: 0; font-size: 28px;">Your Quote is Ready</h1>
  </div>
  <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <p style="font-size: 16px; color: #374151;">Hi {{clientName}},</p>
    <p style="color: #6b7280;">Thank you for the opportunity to quote on your {{trade}} work at <strong>{{address}}</strong>.</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="color: #6b7280; padding: 4px 0;">Quote Number:</td><td style="font-weight: bold; text-align: right;">{{quoteNumber}}</td></tr>
        <tr><td style="color: #6b7280; padding: 4px 0;">Total (inc. GST):</td><td style="font-weight: bold; font-size: 20px; color: #FF2D78; text-align: right;">{{totalAmount}}</td></tr>
        <tr><td style="color: #6b7280; padding: 4px 0;">Valid Until:</td><td style="font-weight: bold; text-align: right;">{{validUntil}}</td></tr>
      </table>
    </div>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{{acceptanceUrl}}" style="background: linear-gradient(135deg, #FF2D78, #FF6B35); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View & Accept Quote</a>
    </div>
    <p style="color: #6b7280; font-size: 14px;">If you have any questions, please don't hesitate to call us on <strong>{{phone}}</strong>.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
    <p style="color: #9ca3af; font-size: 12px;">{{emailSignature}}</p>
    <p style="color: #9ca3af; font-size: 11px;">{{businessName}} | ABN: {{abn}} | Licence: {{licenseNumber}}</p>
  </div>
</div>`,
    },
    quote_followup: {
      subject: `Following up on your {{trade}} quote — {{quoteNumber}}`,
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
  <p style="font-size: 16px; color: #374151;">Hi {{clientName}},</p>
  <p style="color: #6b7280;">I just wanted to follow up on the {{trade}} quote I sent you a few days ago (Quote {{quoteNumber}} for <strong>{{totalAmount}}</strong>).</p>
  <p style="color: #6b7280;">Happy to answer any questions or adjust the scope if needed. Just reply to this email or give me a call on <strong>{{phone}}</strong>.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{acceptanceUrl}}" style="background: linear-gradient(135deg, #FF2D78, #FF6B35); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Quote</a>
  </div>
  <p style="color: #6b7280;">Cheers,<br/><strong>{{emailFromName}}</strong><br/>{{businessName}}</p>
  <p style="color: #9ca3af; font-size: 11px;">{{businessName}} | ABN: {{abn}}</p>
</div>`,
    },
    quote_reminder: {
      subject: `Reminder: Your {{trade}} quote expires soon — {{quoteNumber}}`,
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
  <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
    <p style="color: #92400E; font-weight: bold; margin: 0;">⏰ Your quote expires on {{validUntil}}</p>
  </div>
  <p style="font-size: 16px; color: #374151;">Hi {{clientName}},</p>
  <p style="color: #6b7280;">This is a friendly reminder that your {{trade}} quote ({{quoteNumber}}) for <strong>{{totalAmount}}</strong> is valid until <strong>{{validUntil}}</strong>.</p>
  <p style="color: #6b7280;">After this date, material and labour costs may change. To lock in this price, please accept the quote before it expires.</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="{{acceptanceUrl}}" style="background: linear-gradient(135deg, #FF2D78, #FF6B35); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold;">Accept Quote Now</a>
  </div>
  <p style="color: #6b7280;">Cheers,<br/><strong>{{emailFromName}}</strong><br/>{{businessName}}</p>
</div>`,
    },
    quote_accepted: {
      subject: `Quote Accepted — {{quoteNumber}} ✅`,
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
  <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
    <p style="color: #166534; font-weight: bold; font-size: 18px; margin: 0;">✅ Quote Accepted!</p>
  </div>
  <p style="font-size: 16px; color: #374151;">Hi {{clientName}},</p>
  <p style="color: #6b7280;">Fantastic! Thank you for accepting our quote. We're looking forward to getting started on your {{trade}} work.</p>
  <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 24px 0;">
    <p style="margin: 0; color: #374151;"><strong>Quote:</strong> {{quoteNumber}}</p>
    <p style="margin: 8px 0 0; color: #374151;"><strong>Total:</strong> {{totalAmount}}</p>
  </div>
  <p style="color: #6b7280;">We'll be in touch shortly to confirm the start date and any site access requirements.</p>
  <p style="color: #6b7280;">Cheers,<br/><strong>{{emailFromName}}</strong><br/>{{businessName}}</p>
</div>`,
    },
    supplier_order: {
      subject: `Materials Order — {{projectName}} ({{quoteNumber}})`,
      bodyHtml: `<div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px;">
  <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Materials Order Request</h1>
    <p style="color: #94a3b8; margin: 8px 0 0;">From {{businessName}} | ABN: {{abn}}</p>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
    <p>Hi {{supplierName}},</p>
    <p>Please find below our materials order for the following project:</p>
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Project:</strong> {{projectName}}</p>
      <p style="margin: 8px 0 0;"><strong>Site Address:</strong> {{address}}</p>
      <p style="margin: 8px 0 0;"><strong>Our Account:</strong> {{accountNumber}}</p>
      <p style="margin: 8px 0 0;"><strong>Required By:</strong> {{requiredBy}}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
      <thead>
        <tr style="background: #f1f5f9;">
          <th style="text-align: left; padding: 10px; border: 1px solid #e2e8f0;">Item</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Qty</th>
          <th style="text-align: center; padding: 10px; border: 1px solid #e2e8f0;">Unit</th>
          <th style="text-align: right; padding: 10px; border: 1px solid #e2e8f0;">Cat. No.</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td style="padding: 10px; border: 1px solid #e2e8f0;">{{description}}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">{{quantity}}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: center;">{{unit}}</td>
          <td style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">{{supplierCode}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
    <p style="color: #6b7280;">Please confirm receipt of this order and expected delivery date.</p>
    <p>Regards,<br/><strong>{{emailFromName}}</strong><br/>{{businessName}}<br/>{{phone}}</p>
  </div>
</div>`,
    },
  };
  return templates[type] ?? { subject: `${type} — {{businessName}}`, bodyHtml: `<p>{{content}}</p>` };
}

// ─── Supplier schema ──────────────────────────────────────────────────────────
const supplierSchema = z.object({
  name: z.string(),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  accountNumber: z.string().optional(),
  notes: z.string().optional(),
  isPreferred: z.boolean().optional(),
});

// ─── Router ──────────────────────────────────────────────────────────────────
export const tradeProfilesRouter = router({
  // Get trade profile for a specific trade
  get: protectedProcedure.input(z.object({ trade: z.string() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const result = await db.select().from(tradeProfiles)
      .where(and(eq(tradeProfiles.userId, ctx.user.id), eq(tradeProfiles.trade, input.trade)))
      .limit(1);
    return result[0] ?? null;
  }),

  // Get all trade profiles for the user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    return db.select().from(tradeProfiles).where(eq(tradeProfiles.userId, ctx.user.id));
  }),

  // Upsert trade profile (create or update)
  upsert: protectedProcedure.input(z.object({
    trade: z.string(),
    businessName: z.string().optional(),
    abn: z.string().optional(),
    licenseNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    website: z.string().optional(),
    address: z.string().optional(),
    logoUrl: z.string().optional(),
    brandColour: z.string().optional(),
    defaultMarkup: z.number().min(0).max(200).optional(),
    defaultLabourRate: z.number().min(0).optional(),
    defaultValidDays: z.number().min(1).max(365).optional(),
    defaultTerms: z.string().optional(),
    defaultState: z.enum(["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]).optional(),
    emailFromName: z.string().optional(),
    emailFromAddress: z.string().email().optional().or(z.literal("")),
    emailSignature: z.string().optional(),
    sendQuoteAutomatically: z.boolean().optional(),
    followUpEnabled: z.boolean().optional(),
    followUpDays: z.number().min(1).max(30).optional(),
    reminderEnabled: z.boolean().optional(),
    reminderDays: z.number().min(1).max(60).optional(),
    suppliers: z.array(supplierSchema).optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());

    const { trade, ...data } = input;
    const existing = await db.select().from(tradeProfiles)
      .where(and(eq(tradeProfiles.userId, ctx.user.id), eq(tradeProfiles.trade, trade)))
      .limit(1);

    const values: any = {
      ...data,
      userId: ctx.user.id,
      trade,
      defaultMarkup: data.defaultMarkup?.toString(),
      defaultLabourRate: data.defaultLabourRate?.toString(),
      email: data.email || undefined,
      emailFromAddress: data.emailFromAddress || undefined,
    };

    if (existing.length > 0) {
      await db.update(tradeProfiles).set(values)
        .where(and(eq(tradeProfiles.userId, ctx.user.id), eq(tradeProfiles.trade, trade)));
      return { success: true, id: existing[0].id };
    } else {
      const result = await db.insert(tradeProfiles).values(values);
      return { success: true, id: Number((result as any).insertId) };
    }
  }),

  // Get email templates for a trade
  getEmailTemplates: protectedProcedure.input(z.object({ trade: z.string().optional() })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const all = await db.select().from(emailTemplates).where(eq(emailTemplates.userId, ctx.user.id));
    if (input.trade) {
      return all.filter(t => !t.trade || t.trade === input.trade);
    }
    return all;
  }),

  // Upsert email template
  upsertEmailTemplate: protectedProcedure.input(z.object({
    id: z.number().optional(),
    trade: z.string().optional(),
    type: z.enum(["quote_delivery", "quote_followup", "quote_reminder", "quote_accepted", "supplier_order"]),
    subject: z.string().min(1),
    bodyHtml: z.string().min(1),
    isActive: z.boolean().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());

    if (input.id) {
      await db.update(emailTemplates).set({
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        isActive: input.isActive ?? true,
      }).where(and(eq(emailTemplates.id, input.id), eq(emailTemplates.userId, ctx.user.id)));
      return { success: true, id: input.id };
    } else {
      const result = await db.insert(emailTemplates).values({
        userId: ctx.user.id,
        trade: input.trade,
        type: input.type,
        subject: input.subject,
        bodyHtml: input.bodyHtml,
        isActive: input.isActive ?? true,
      });
      return { success: true, id: Number((result as any).insertId) };
    }
  }),

  // Get default template for a type (pre-fills editor with sensible defaults)
  getDefaultTemplate: protectedProcedure.input(z.object({
    type: z.enum(["quote_delivery", "quote_followup", "quote_reminder", "quote_accepted", "supplier_order"]),
    trade: z.string().optional(),
  })).query(({ input }) => {
    return getDefaultTemplate(input.type, input.trade ?? "trade");
  }),

  // AI-generate a custom email template based on business profile
  generateEmailTemplate: protectedProcedure.input(z.object({
    type: z.enum(["quote_delivery", "quote_followup", "quote_reminder", "quote_accepted", "supplier_order"]),
    trade: z.string(),
    businessName: z.string().optional(),
    tone: z.enum(["professional", "friendly", "casual"]).default("friendly"),
  })).mutation(async ({ input }) => {
    const typeLabels: Record<string, string> = {
      quote_delivery: "sending a quote to a client",
      quote_followup: "following up on an unseen quote after 3 days",
      quote_reminder: "reminding a client their quote expires soon",
      quote_accepted: "confirming a client has accepted the quote",
      supplier_order: "ordering materials from a supplier",
    };

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert copywriter for Australian trade businesses. Write email templates that are ${input.tone} and professional. Use {{variableName}} placeholders for dynamic content. Return ONLY valid JSON with "subject" and "bodyHtml" fields.`,
        },
        {
          role: "user",
          content: `Write an email template for an Australian ${input.trade} business called "${input.businessName ?? "the business"}" for the purpose of: ${typeLabels[input.type]}.
          
Tone: ${input.tone}
Include these placeholders where appropriate: {{clientName}}, {{businessName}}, {{quoteNumber}}, {{totalAmount}}, {{phone}}, {{acceptanceUrl}}, {{validUntil}}, {{emailFromName}}

Return JSON: { "subject": "...", "bodyHtml": "..." }`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "email_template",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              bodyHtml: { type: "string" },
            },
            required: ["subject", "bodyHtml"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("AI failed to generate template");
    return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
  }),

  // Preview rendered email with sample data
  previewEmail: protectedProcedure.input(z.object({
    bodyHtml: z.string(),
    subject: z.string(),
    trade: z.string().optional(),
  })).query(async ({ ctx, input }) => {
    const db = await getDb();
    // Get profile for sample data
    let profile: any = null;
    if (db && input.trade) {
      const result = await db.select().from(tradeProfiles)
        .where(and(eq(tradeProfiles.userId, ctx.user.id), eq(tradeProfiles.trade, input.trade)))
        .limit(1);
      profile = result[0] ?? null;
    }

    const sampleData: Record<string, string> = {
      clientName: "John Smith",
      businessName: profile?.businessName ?? "Your Business Name",
      quoteNumber: "KAI-2025-000123",
      totalAmount: "$4,840.00 (inc. GST)",
      phone: profile?.phone ?? "0400 000 000",
      acceptanceUrl: "https://kindai.com.au/quote/accept/sample",
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-AU"),
      emailFromName: profile?.emailFromName ?? ctx.user.name ?? "Your Name",
      abn: profile?.abn ?? "12 345 678 901",
      licenseNumber: profile?.licenseNumber ?? "LIC-12345",
      address: "123 Sample Street, Sydney NSW 2000",
      projectName: "Residential Renovation — 3 Bed House",
      supplierName: "Middy's Electrical",
      accountNumber: "ACC-98765",
      requiredBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-AU"),
      emailSignature: profile?.emailSignature ?? "Licensed & Insured | All work guaranteed",
      logoUrl: profile?.logoUrl ?? "",
      trade: input.trade ?? "trade",
    };

    let rendered = input.bodyHtml;
    let renderedSubject = input.subject;
    for (const [key, value] of Object.entries(sampleData)) {
      rendered = rendered.replaceAll(`{{${key}}}`, value);
      renderedSubject = renderedSubject.replaceAll(`{{${key}}}`, value);
    }

    return { renderedHtml: rendered, renderedSubject };
  }),
});
