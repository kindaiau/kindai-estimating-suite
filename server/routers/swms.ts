/**
 * Auto-SWMS + Compliance Pack — tRPC Router
 *
 * Endpoints:
 *   swms.generate    — AI-generate a draft SWMS from an estimate (Business tier+)
 *   swms.get         — Get a SWMS by ID (owner only)
 *   swms.list        — List all SWMS for the current user
 *   swms.update      — Update SWMS content (owner only)
 *   swms.finalize    — Finalize SWMS, generate PDF, store in S3
 *   swms.createShareLink — Generate a unique share token for worker signing
 *   swms.getByToken  — Public: Get SWMS by share token (for worker view)
 *   swms.sign        — Public: Record a worker's digital signature
 *   swms.getSignatures — Get all signatures for a SWMS (owner only)
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  swms,
  swmsSignatures,
  estimates,
  lineItems,
  users,
  businessSafetyProfiles,
  aiCorrections,
  sitePhotos,
  companyProcedures,
  type WorkActivity,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import {
  identifyHrcwCategories,
  HRCW_LABELS,
  HAZARD_CONTROL_TEMPLATES,
  SWMS_REQUIRED_TIER,
} from "../../shared/compliance";
import {
  generateSwmsContentV2,
  analyseSitePhoto,
  extractProceduresFromPdf,
  detectAndStoreCorrections,
} from "../swmsAI";

// ─── Tier Gate ────────────────────────────────────────────────────────────────

const TIER_ORDER = ["free", "sole_trader", "small_builder", "mid_builder", "enterprise"];

function hasSWMSAccess(tier: string): boolean {
  const userIdx = TIER_ORDER.indexOf(tier);
  const requiredIdx = TIER_ORDER.indexOf(SWMS_REQUIRED_TIER);
  return userIdx >= requiredIdx;
}

// ─── PDF Generation (HTML → Puppeteer) ───────────────────────────────────────

async function generateSwmsPdf(swmsData: typeof swms.$inferSelect): Promise<Buffer> {
  const puppeteer = await import("puppeteer-core");
  const chromium = await import("@sparticuz/chromium");

  const workActivities = (swmsData.workActivities as WorkActivity[]) || [];
  const hrcwCategories = (swmsData.hrcwCategories as string[]) || [];
  const datePrepared = swmsData.datePrepared
    ? new Date(swmsData.datePrepared).toLocaleDateString("en-AU")
    : new Date().toLocaleDateString("en-AU");
  const reviewDate = swmsData.reviewDate
    ? new Date(swmsData.reviewDate).toLocaleDateString("en-AU")
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString("en-AU");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #1a1a1a; background: #fff; }
    .header { background: linear-gradient(135deg, #FF2D78, #FF6B35); color: #fff; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
    .header h1 { font-size: 18px; font-weight: 700; }
    .header .sub { font-size: 11px; opacity: 0.9; margin-top: 2px; }
    .disclaimer { background: #fff3cd; border: 1px solid #ffc107; padding: 10px 16px; margin: 12px 16px; font-size: 9px; color: #664d03; border-radius: 4px; }
    .section { margin: 12px 16px; }
    .section-title { font-size: 11px; font-weight: 700; color: #FF2D78; border-bottom: 2px solid #FF2D78; padding-bottom: 3px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
    .detail-row { display: flex; gap: 6px; padding: 3px 0; border-bottom: 1px solid #f0f0f0; }
    .detail-label { font-weight: 600; color: #555; min-width: 140px; }
    .detail-value { color: #1a1a1a; }
    .hrcw-list { list-style: none; }
    .hrcw-item { padding: 4px 8px; margin-bottom: 3px; background: #fff3f3; border-left: 3px solid #FF2D78; font-size: 9.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th { background: #1a1a2e; color: #fff; padding: 6px 8px; text-align: left; font-size: 9px; }
    td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
    tr:nth-child(even) td { background: #f9f9f9; }
    .ai-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; font-size: 8px; padding: 1px 4px; border-radius: 3px; margin-left: 4px; }
    .sig-table { width: 100%; border-collapse: collapse; }
    .sig-table th { background: #333; color: #fff; padding: 6px 8px; font-size: 9px; }
    .sig-table td { padding: 8px; border: 1px solid #ddd; height: 32px; }
    .footer { background: #1a1a2e; color: #aaa; padding: 8px 16px; font-size: 8px; text-align: center; margin-top: 16px; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="h1">SAFE WORK METHOD STATEMENT (SWMS)</div>
      <div class="sub">High-Risk Construction Work — Australian WHS Regulation 2011</div>
    </div>
    <div style="text-align:right;font-size:9px;">
      <div style="font-weight:700;font-size:13px;">kindai</div>
      <div>kindaiestimator.com</div>
    </div>
  </div>

  <div class="disclaimer">
    <strong>IMPORTANT DISCLAIMER:</strong> This SWMS has been generated with AI assistance based on estimate data. It is a draft document and is NOT a substitute for professional WHS advice. The PCBU is legally responsible for reviewing, verifying, and ensuring the accuracy, completeness, and site-specific compliance of this SWMS with all relevant WHS legislation before commencing any high-risk construction work. Kindai provides tools for assistance but is not a legal or WHS advisory service.
  </div>

  <div class="section">
    <div class="section-title">1. SWMS Details</div>
    <div class="details-grid">
      <div class="detail-row"><span class="detail-label">PCBU Name:</span><span class="detail-value">${swmsData.pcbuName || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">ABN:</span><span class="detail-value">${swmsData.pcbuAbn || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">PCBU Address:</span><span class="detail-value">${swmsData.pcbuAddress || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Contact:</span><span class="detail-value">${swmsData.pcbuContact || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Principal Contractor:</span><span class="detail-value">${swmsData.principalContractorName || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">PC Address:</span><span class="detail-value">${swmsData.principalContractorAddress || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Work Location:</span><span class="detail-value">${swmsData.workLocation || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Works Manager:</span><span class="detail-value">${swmsData.worksManager || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Date Prepared:</span><span class="detail-value">${datePrepared}</span></div>
      <div class="detail-row"><span class="detail-label">Review Date:</span><span class="detail-value">${reviewDate}</span></div>
      <div class="detail-row"><span class="detail-label">Responsible for Compliance:</span><span class="detail-value">${swmsData.responsibleForCompliance || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Responsible for Review:</span><span class="detail-value">${swmsData.responsibleForReview || "—"}</span></div>
      <div class="detail-row"><span class="detail-label">Worker Consultation Confirmed:</span><span class="detail-value">${swmsData.workerConsultationConfirmed ? "Yes ✓" : "No — Required before commencing"}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. High-Risk Construction Work (HRCW) Identification</div>
    <ul class="hrcw-list">
      ${hrcwCategories.map(cat => `<li class="hrcw-item">✓ ${HRCW_LABELS[cat as keyof typeof HRCW_LABELS] || cat}</li>`).join("")}
      ${hrcwCategories.length === 0 ? '<li class="hrcw-item" style="border-color:#aaa;background:#f5f5f5;">No specific HRCW categories identified — review manually</li>' : ""}
    </ul>
  </div>

  <div class="section page-break">
    <div class="section-title">3. Work Activity Steps, Hazards & Control Measures</div>
    <table>
      <thead>
        <tr>
          <th style="width:20%">Work Activity / Task</th>
          <th style="width:25%">Hazards & Risks</th>
          <th style="width:35%">Control Measures (Hierarchy of Controls)</th>
          <th style="width:12%">Required PPE</th>
          <th style="width:8%">Responsible</th>
        </tr>
      </thead>
      <tbody>
        ${workActivities.map(activity => `
          <tr>
            <td>${activity.task}${activity.isAiGenerated ? '<span class="ai-badge">AI</span>' : ""}</td>
            <td>${activity.hazards.map(h => `• ${h}`).join("<br/>")}</td>
            <td>${activity.controls.map(c => `• ${c}`).join("<br/>")}</td>
            <td>${activity.ppe.join(", ")}</td>
            <td>${activity.responsible || "PCBU"}</td>
          </tr>
        `).join("")}
        ${workActivities.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#999;padding:16px;">No work activities defined — click Edit to add tasks</td></tr>' : ""}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">4. Worker Acknowledgement</div>
    <p style="margin-bottom:8px;font-size:9px;color:#555;">By signing below, workers confirm they have read, understood, and agree to comply with this SWMS before commencing work.</p>
    <table class="sig-table">
      <thead>
        <tr>
          <th>Worker Name (Print)</th>
          <th>Signature</th>
          <th>Date</th>
          <th>Trade / Role</th>
        </tr>
      </thead>
      <tbody>
        ${Array(6).fill(0).map(() => `<tr><td></td><td></td><td></td><td></td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">5. Review & Revision History</div>
    <table>
      <thead>
        <tr>
          <th>Version</th>
          <th>Date</th>
          <th>Changes Made</th>
          <th>Reviewed By</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>v${swmsData.version}</td>
          <td>${datePrepared}</td>
          <td>Initial AI-assisted draft generated</td>
          <td>${swmsData.responsibleForReview || "—"}</td>
        </tr>
        ${Array(3).fill(0).map(() => `<tr><td></td><td></td><td></td><td></td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated by Kindai Estimating Suite — kindaiestimator.com | SWMS ID: ${swmsData.id} | Version ${swmsData.version} | ${datePrepared}<br/>
    This document was created with AI assistance. The PCBU is solely responsible for its accuracy and compliance.
  </div>
</body>
</html>`;

  const browser = await puppeteer.default.launch({
    args: chromium.default.args,
    executablePath: await (chromium.default.executablePath as () => Promise<string>)(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "10mm", bottom: "10mm", left: "8mm", right: "8mm" } });
  await browser.close();
  return Buffer.from(pdfBuffer);
}

// ─── AI Generation ────────────────────────────────────────────────────────────

async function generateSwmsContent(opts: {
  trade: string;
  title: string;
  scope: string;
  materials: string;
  location: string;
  state: string;
  hrcwCategories: string[];
}): Promise<WorkActivity[]> {
  const hrcwList = opts.hrcwCategories
    .map(cat => `- ${HRCW_LABELS[cat as keyof typeof HRCW_LABELS] || cat}`)
    .join("\n");

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are an expert in Australian Work Health and Safety (WHS) regulations for construction. Generate a Safe Work Method Statement (SWMS) for high-risk construction work.

Rules:
- Follow the hierarchy of controls: Elimination → Substitution → Isolation → Engineering → Administrative → PPE
- Be specific — never say "use appropriate PPE" without naming the exact PPE
- Use Australian English and reference Australian standards (AS/NZS) where relevant
- Each task must have at least 3 control measures
- PPE must be specific items (e.g., "P2 respirator", "Class 3 high-vis vest", "steel-cap boots")
- Return ONLY valid JSON, no markdown, no explanation

Return a JSON array of work activities in this exact format:
[
  {
    "id": "unique_id",
    "task": "Task name",
    "hazards": ["Hazard 1", "Hazard 2"],
    "controls": ["Control 1 (Elimination/Substitution/etc)", "Control 2", "Control 3"],
    "ppe": ["PPE item 1", "PPE item 2"],
    "responsible": "PCBU",
    "isAiGenerated": true
  }
]`,
      },
      {
        role: "user" as const,
        content: `Generate SWMS work activities for this job:

Trade: ${opts.trade}
Job Title: ${opts.title}
Scope of Work: ${opts.scope}
Materials: ${opts.materials}
Location: ${opts.location}, ${opts.state}

Identified High-Risk Construction Work (HRCW):
${hrcwList || "- General construction work"}

Generate 4-8 work activity rows covering the main tasks for this job. Focus on the highest-risk activities first.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "swms_activities",
        strict: true,
        schema: {
          type: "object",
          properties: {
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  task: { type: "string" },
                  hazards: { type: "array", items: { type: "string" } },
                  controls: { type: "array", items: { type: "string" } },
                  ppe: { type: "array", items: { type: "string" } },
                  responsible: { type: "string" },
                  isAiGenerated: { type: "boolean" },
                },
                required: ["id", "task", "hazards", "controls", "ppe", "responsible", "isAiGenerated"],
                additionalProperties: false,
              },
            },
          },
          required: ["activities"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const raw = response.choices[0]?.message?.content;
    const content = typeof raw === "string" ? raw : null;
    if (!content) return [];
    const parsed = JSON.parse(content);
    return parsed.activities || parsed || [];
  } catch {
    return [];
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const swmsRouter = router({
  /** Generate a draft SWMS from an estimate (Business tier required) */
  generate: protectedProcedure
    .input(z.object({ estimateId: z.number(), sitePhotoUrls: z.array(z.string()).optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      // Tier gate
      if (!hasSWMSAccess(ctx.user.subscriptionTier)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Auto-SWMS requires the Business plan ($499/mo) or above. Upgrade to unlock this feature.",
        });
      }

      // Load estimate + line items
      const [estimate] = await db
        .select()
        .from(estimates)
        .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
        .limit(1);

      if (!estimate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Estimate not found" });
      }

      const items = await db
        .select()
        .from(lineItems)
        .where(eq(lineItems.estimateId, input.estimateId));

      // Load user profile for PCBU details
      const [user] = await db
        .select({ companyName: users.companyName, abn: users.abn, state: users.state, name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      // Build materials/scope text from line items
      const materialsText = items
        .map(i => i.description)
        .filter(Boolean)
        .slice(0, 30)
        .join(", ");

      const scopeText = estimate.notes || estimate.title || "";
      const locationText = (estimate as any).projectAddress || (estimate as any).suburb || "";
      const stateText = estimate.complianceState || user?.state || "NSW";

      // Identify HRCW categories
      const hrcwCategories = identifyHrcwCategories({
        trade: estimate.trade,
        materials: materialsText,
        scope: scopeText,
      });

      // Generate AI work activities using V2 engine (all intelligence layers)
      const result = await generateSwmsContentV2({
        userId: ctx.user.id,
        trade: estimate.trade,
        title: estimate.title,
        scope: scopeText,
        materials: materialsText,
        location: locationText,
        state: stateText,
        hrcwCategories,
        sitePhotoUrls: input.sitePhotoUrls,
      });
      const workActivities = result.activities;

      // Create SWMS record
      const swmsId = nanoid(16);
      await db.insert(swms).values({
        id: swmsId,
        estimateId: input.estimateId,
        userId: ctx.user.id,
        version: 1,
        status: "draft",
        pcbuName: user?.companyName || ctx.user.name || "",
        pcbuAbn: user?.abn || "",
        workLocation: locationText,
        responsibleForCompliance: user?.name || ctx.user.name || "",
        responsibleForReview: user?.name || ctx.user.name || "",
        datePrepared: Date.now(),
        reviewDate: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
        hrcwCategories: hrcwCategories as any,
        workActivities: workActivities as any,
      } as any);

      const [created] = await db.select().from(swms).where(eq(swms.id, swmsId)).limit(1);
      return created;
    }),

  /** Get a SWMS by ID (owner only) */
  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const [result] = await db
        .select()
        .from(swms)
        .where(and(eq(swms.id, input.id), eq(swms.userId, ctx.user.id)))
        .limit(1);
      return result ?? null;
    }),

  /** List all SWMS for the current user */
  list: protectedProcedure
    .input(z.object({ estimateId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const conditions = [eq(swms.userId, ctx.user.id)];
      if (input.estimateId) conditions.push(eq(swms.estimateId, input.estimateId));
      return db.select().from(swms).where(and(...conditions)).orderBy(desc(swms.createdAt));
    }),

  /** Update SWMS content (owner only) */
  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      pcbuName: z.string().optional(),
      pcbuAbn: z.string().optional(),
      pcbuAddress: z.string().optional(),
      pcbuContact: z.string().optional(),
      principalContractorName: z.string().optional(),
      principalContractorAddress: z.string().optional(),
      workLocation: z.string().optional(),
      worksManager: z.string().optional(),
      responsibleForCompliance: z.string().optional(),
      responsibleForReview: z.string().optional(),
      workerConsultationConfirmed: z.boolean().optional(),
      hrcwCategories: z.array(z.string()).optional(),
      workActivities: z.array(z.any()).optional(),
      status: z.enum(["draft", "pending_review", "approved", "finalized"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const { id, ...updates } = input;

      const [existing] = await db
        .select()
        .from(swms)
        .where(and(eq(swms.id, id), eq(swms.userId, ctx.user.id)))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "SWMS not found" });

      await db.update(swms).set(updates as any).where(eq(swms.id, id));
      const [updated] = await db.select().from(swms).where(eq(swms.id, id)).limit(1);
      return updated;
    }),

  /** Finalize SWMS — generate PDF, store in S3, mark as finalized */
  finalize: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      const [existing] = await db
        .select()
        .from(swms)
        .where(and(eq(swms.id, input.id), eq(swms.userId, ctx.user.id)))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "SWMS not found" });

      // Generate PDF
      const pdfBuffer = await generateSwmsPdf(existing);
      const pdfKey = `swms/${ctx.user.id}/${input.id}-v${existing.version}-${Date.now()}.pdf`;
      const { url: pdfUrl } = await storagePut(pdfKey, pdfBuffer, "application/pdf");

      // Update record
      await db.update(swms).set({
        status: "finalized",
        pdfUrl,
        finalizedAt: Date.now(),
        version: existing.version + 1,
      } as any).where(eq(swms.id, input.id));

      const [updated] = await db.select().from(swms).where(eq(swms.id, input.id)).limit(1);
      return { swms: updated, pdfUrl };
    }),

  /** Generate a unique share token for worker signing */
  createShareLink: protectedProcedure
    .input(z.object({ id: z.string(), origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      const [existing] = await db
        .select()
        .from(swms)
        .where(and(eq(swms.id, input.id), eq(swms.userId, ctx.user.id)))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "SWMS not found" });

      const shareToken = existing.shareToken || nanoid(32);
      await db.update(swms).set({ shareToken } as any).where(eq(swms.id, input.id));

      const shareUrl = `${input.origin}/swms/sign/${shareToken}`;
      return { shareUrl, shareToken };
    }),

  /** Public: Get SWMS by share token (for worker view) */
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = requireDatabase(await getDb());
      const [result] = await db
        .select()
        .from(swms)
        .where(eq(swms.shareToken, input.token))
        .limit(1);

      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "SWMS not found or link has expired" });

      // Load existing signatures
      const signatures = await db
        .select()
        .from(swmsSignatures)
        .where(eq(swmsSignatures.swmsId, result.id));

      return { swms: result, signatures };
    }),

  /** Public: Record a worker's digital signature */
  sign: publicProcedure
    .input(z.object({
      token: z.string(),
      workerName: z.string().min(2),
      workerSignature: z.string().min(10), // base64 image data
    }))
    .mutation(async ({ input }) => {
      const db = requireDatabase(await getDb());

      const [swmsRecord] = await db
        .select()
        .from(swms)
        .where(eq(swms.shareToken, input.token))
        .limit(1);

      if (!swmsRecord) throw new TRPCError({ code: "NOT_FOUND", message: "SWMS not found" });

      await db.insert(swmsSignatures).values({
        swmsId: swmsRecord.id,
        workerName: input.workerName,
        workerSignature: input.workerSignature,
      });

      return { success: true, signedAt: new Date().toISOString() };
    }),

  /** Get all signatures for a SWMS (owner only) */
  getSignatures: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      const [existing] = await db
        .select()
        .from(swms)
        .where(and(eq(swms.id, input.id), eq(swms.userId, ctx.user.id)))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "SWMS not found" });

      return db.select().from(swmsSignatures).where(eq(swmsSignatures.swmsId, input.id));
    }),

  // ─── AI Intelligence Layer Endpoints ──────────────────────────────────────

  /** Analyse a site photo for hazards (multimodal vision) */
  analyseSitePhoto: protectedProcedure
    .input(z.object({
      photoUrl: z.string().url(),
      swmsId: z.string().optional(),
      estimateId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!hasSWMSAccess(ctx.user.subscriptionTier)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Site photo analysis requires the Business plan." });
      }
      const result = await analyseSitePhoto(input.photoUrl, ctx.user.id, input.swmsId, input.estimateId);
      return result;
    }),

  /** Extract company procedures from an uploaded SWMS PDF */
  extractFromPdf: protectedProcedure
    .input(z.object({
      pdfUrl: z.string().url(),
      trade: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!hasSWMSAccess(ctx.user.subscriptionTier)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "PDF extraction requires the Business plan." });
      }
      return extractProceduresFromPdf(input.pdfUrl, ctx.user.id, input.trade);
    }),

  /** Save SWMS with correction detection (feedback loop) */
  saveWithCorrections: protectedProcedure
    .input(z.object({
      id: z.string(),
      workActivities: z.array(z.any()),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      const [existing] = await db
        .select()
        .from(swms)
        .where(and(eq(swms.id, input.id), eq(swms.userId, ctx.user.id)))
        .limit(1);

      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "SWMS not found" });

      // Detect corrections between AI-generated and user-edited content
      const aiActivities = (existing.workActivities as WorkActivity[]) || [];
      const userActivities = input.workActivities as WorkActivity[];

      const correctionsStored = await detectAndStoreCorrections(
        ctx.user.id,
        (existing as any).trade || "general",
        input.id,
        aiActivities.filter(a => a.isAiGenerated),
        userActivities.filter(a => a.isAiGenerated)
      );

      // Update the SWMS with user's edits
      await db.update(swms).set({
        workActivities: userActivities as any,
      } as any).where(eq(swms.id, input.id));

      return { success: true, correctionsDetected: correctionsStored };
    }),

  // ─── Business Safety Profile CRUD ─────────────────────────────────────────

  /** List safety profile items */
  listSafetyProfile: protectedProcedure
    .input(z.object({ trade: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const conditions = [eq(businessSafetyProfiles.userId, ctx.user.id)];
      if (input.trade) conditions.push(eq(businessSafetyProfiles.trade, input.trade));
      return db.select().from(businessSafetyProfiles)
        .where(and(...conditions))
        .orderBy(desc(businessSafetyProfiles.createdAt));
    }),

  /** Add a safety profile item */
  addSafetyProfileItem: protectedProcedure
    .input(z.object({
      trade: z.string().optional(),
      category: z.enum(["ppe", "control", "procedure", "terminology", "emergency"]),
      title: z.string().min(1),
      description: z.string().min(1),
      standardRef: z.string().optional(),
      isDefault: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      await db.insert(businessSafetyProfiles).values({
        userId: ctx.user.id,
        trade: input.trade || null,
        category: input.category,
        title: input.title,
        description: input.description,
        standardRef: input.standardRef || null,
        isDefault: input.isDefault ?? true,
        source: "manual_entry",
      } as any);
      return { success: true };
    }),

  /** Delete a safety profile item */
  deleteSafetyProfileItem: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      await db.delete(businessSafetyProfiles)
        .where(and(eq(businessSafetyProfiles.id, input.id), eq(businessSafetyProfiles.userId, ctx.user.id)));
      return { success: true };
    }),

  /** Check if user has set up their safety profile (for onboarding wizard gate) */
  hasSafetyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const profiles = await db.select().from(businessSafetyProfiles)
      .where(eq(businessSafetyProfiles.userId, ctx.user.id));
    return { hasProfile: profiles.length > 0, itemCount: profiles.length };
  }),

  /** Save standard PPE items from onboarding wizard */
  saveSafetyProfile: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        category: z.enum(["ppe", "control", "procedure", "terminology", "emergency"]),
        title: z.string().min(1),
        description: z.string().min(1),
        standardRef: z.string().optional(),
      })),
      trade: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());
      const inserted = [];
      for (const item of input.items) {
        const [result] = await db.insert(businessSafetyProfiles).values({
          userId: ctx.user.id,
          trade: input.trade || null,
          category: item.category,
          title: item.title,
          description: item.description,
          standardRef: item.standardRef || null,
          isDefault: true,
          source: "manual_entry",
        });
        inserted.push(result.insertId);
      }
      return { saved: inserted.length };
    }),

  /** Get AI learning stats (how many corrections, profile items, procedures) */
  getAIStats: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());

    const corrections = await db.select().from(aiCorrections)
      .where(eq(aiCorrections.userId, ctx.user.id));
    const profiles = await db.select().from(businessSafetyProfiles)
      .where(eq(businessSafetyProfiles.userId, ctx.user.id));
    const procedures = await db.select().from(companyProcedures)
      .where(eq(companyProcedures.userId, ctx.user.id));
    const photos = await db.select().from(sitePhotos)
      .where(eq(sitePhotos.userId, ctx.user.id));

    return {
      totalCorrections: corrections.length,
      totalProfileItems: profiles.length,
      totalProcedures: procedures.length,
      totalPhotosAnalysed: photos.length,
      correctionsByCategory: corrections.reduce((acc, c) => {
        acc[c.category] = (acc[c.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
  }),
});
