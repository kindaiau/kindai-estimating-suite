/**
 * SWMS AI Engine — Phenomenal Quality
 *
 * Four intelligence layers:
 *   1. Business Safety Profile Memory — injects company-specific PPE, controls, procedures
 *   2. Feedback Loop — learns from user corrections, adapts future outputs
 *   3. Multimodal Site Photo Analysis — vision AI identifies hazards from photos
 *   4. Company Procedures Extraction — learns from uploaded past SWMS PDFs
 *
 * Architecture: Chain-of-Thought + Structured Output + Few-Shot Corrections + Vision
 */

import { invokeLLM } from "./_core/llm";
import type { Message, MessageContent } from "./_core/llm";
import { mediaContentFromUrl, mediaContentsFromUrls } from "./_core/mediaInputs";
import { getDb } from "./db";
import { storagePut } from "./storage";
import {
  businessSafetyProfiles,
  aiCorrections,
  sitePhotos,
  companyProcedures,
  type WorkActivity,
} from "../drizzle/schema";
import { eq, and, desc, like } from "drizzle-orm";
import {
  identifyHrcwCategories,
  HRCW_LABELS,
  HAZARD_CONTROL_TEMPLATES,
} from "../shared/compliance";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SwmsGenerationContext {
  userId: number;
  trade: string;
  title: string;
  scope: string;
  materials: string;
  location: string;
  state: string;
  hrcwCategories: string[];
  sitePhotoUrls?: string[];  // Optional: URLs of uploaded site photos
}

export interface SiteHazard {
  category: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  immediateAction: string;
  standardReference: string;
}

export interface SitePhotoAnalysis {
  overallRiskLevel: "critical" | "high" | "medium" | "low";
  siteDescription: string;
  hazards: SiteHazard[];
  unableToAssess: string[];
  confidence: number;
}

export interface SwmsGenerationResult {
  activities: WorkActivity[];
  confidenceScore: number;
  sitePhotoHazards?: SitePhotoAnalysis;
  correctionsApplied: number;
  profileItemsUsed: number;
}

// ─── Layer 1: Business Safety Profile Memory ────────────────────────────────

async function getBusinessSafetyContext(userId: number, trade: string): Promise<string> {
  const db = await getDb();
  if (!db) return "";

  const profiles = await db
    .select()
    .from(businessSafetyProfiles)
    .where(
      and(
        eq(businessSafetyProfiles.userId, userId),
        eq(businessSafetyProfiles.isDefault, true)
      )
    );

  // Filter: global profiles + trade-specific profiles
  const relevant = profiles.filter(
    (p) => !p.trade || p.trade === trade
  );

  if (relevant.length === 0) return "";

  const grouped: Record<string, string[]> = {};
  for (const p of relevant) {
    const cat = p.category.toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(
      `${p.title}${p.standardRef ? ` (Ref: ${p.standardRef})` : ""}: ${p.description}`
    );
  }

  let context = "COMPANY STANDARD SAFETY REQUIREMENTS (always apply these):\n";
  for (const [cat, items] of Object.entries(grouped)) {
    context += `\n[${cat}]\n`;
    items.forEach((item) => (context += `  • ${item}\n`));
  }

  return context;
}

// ─── Layer 2: Feedback Loop — Retrieve Past Corrections ─────────────────────

async function getCorrectionContext(userId: number, trade: string): Promise<{ text: string; count: number }> {
  const db = await getDb();
  if (!db) return { text: "", count: 0 };

  const corrections = await db
    .select()
    .from(aiCorrections)
    .where(
      and(
        eq(aiCorrections.userId, userId),
        eq(aiCorrections.trade, trade)
      )
    )
    .orderBy(desc(aiCorrections.useCount))
    .limit(10);

  if (corrections.length === 0) return { text: "", count: 0 };

  let text = "LEARNED FROM YOUR PAST EDITS (apply these patterns — they override defaults):\n\n";
  corrections.forEach((c, i) => {
    text += `${i + 1}. Context: "${c.context}"\n`;
    text += `   AI wrote: "${c.aiOriginal}"\n`;
    text += `   You corrected to: "${c.userCorrected}"\n`;
    text += `   Category: ${c.category}\n\n`;
  });

  return { text, count: corrections.length };
}

// ─── Layer 3: Multimodal Site Photo Hazard Detection ────────────────────────

export async function analyseSitePhoto(
  photoUrl: string,
  userId: number,
  swmsId?: string,
  estimateId?: number
): Promise<SitePhotoAnalysis> {
  const response = await invokeLLM({
    thinkingBudget: 4096,
    messages: [
      {
        role: "system",
        content: `You are a certified WHS inspector (Cert IV WHS, 20 years experience) analysing a construction site photo in Australia.

ANALYSIS FRAMEWORK — follow systematically:

STEP 1: SCAN the entire image left-to-right, top-to-bottom. Note everything visible.

STEP 2: IDENTIFY all visible hazards using these categories:
  - height: unprotected edges, missing guardrails, unsecured ladders, scaffold defects, work platforms without edge protection
  - electrical: overhead powerlines within 3m, exposed wiring, wet areas near switchboards, missing RCD protection
  - mechanical: unguarded machinery, pinch points, rotating parts, unsecured loads, crane operations
  - environmental: uneven ground, poor lighting, weather exposure, UV, dust, noise sources, confined spaces
  - chemical: unlabelled containers, no SDS visible, spills, asbestos-containing materials, silica dust
  - access: blocked exits, poor housekeeping, trip hazards, congestion, inadequate signage
  - structural: unsupported excavations >1.5m, unstable formwork, overloaded floors, demolition without engineering

STEP 3: For each hazard assess:
  - What you can physically SEE (describe the visual evidence)
  - Severity: critical (death/permanent disability), high (serious injury), medium (medical treatment), low (first aid)
  - Immediate control required (specific, actionable)
  - Australian Standard reference (AS/NZS number)

STEP 4: If image quality is poor or an area is unclear, state "Unable to assess [area] — image quality insufficient" rather than guessing.

CRITICAL RULES:
- Only identify hazards you can ACTUALLY SEE in the photo — never assume or infer
- Be specific: "2.4m scaffold missing mid-rail on north face" not "scaffold issues"
- Reference exact Australian standards: AS/NZS 1576, AS 3012, AS/NZS 1891, etc.
- If the photo shows a clean, well-managed site, say so — don't invent hazards`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyse this construction site photo for WHS hazards. Be thorough and specific — identify everything visible that could cause harm.",
          },
          {
            type: "image_url",
            image_url: { url: photoUrl, detail: "original" },
          },
        ] as MessageContent[],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "site_hazard_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            overallRiskLevel: {
              type: "string",
              enum: ["critical", "high", "medium", "low"],
              description: "Highest severity hazard found determines overall level",
            },
            siteDescription: {
              type: "string",
              description: "Brief description of what the photo shows (site type, work in progress)",
            },
            hazards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["height", "electrical", "mechanical", "environmental", "chemical", "access", "structural"],
                  },
                  description: { type: "string", description: "What is visually observed — specific and measurable" },
                  severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
                  immediateAction: { type: "string", description: "Specific control measure required" },
                  standardReference: { type: "string", description: "Australian Standard reference (e.g. AS/NZS 1576.1)" },
                },
                required: ["category", "description", "severity", "immediateAction", "standardReference"],
                additionalProperties: false,
              },
            },
            unableToAssess: {
              type: "array",
              items: { type: "string" },
              description: "Areas that couldn't be assessed due to image quality/angle",
            },
            confidence: {
              type: "number",
              description: "0-100 confidence in completeness of the analysis",
            },
          },
          required: ["overallRiskLevel", "siteDescription", "hazards", "unableToAssess", "confidence"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const raw = response.choices[0]?.message?.content;
    const content = typeof raw === "string" ? raw : "";
    const parsed = JSON.parse(content) as SitePhotoAnalysis;

    // Store analysis in database
    const db = await getDb();
    if (db) {
      await db.insert(sitePhotos).values({
        userId,
        swmsId: swmsId || null,
        estimateId: estimateId || null,
        photoUrl,
        photoKey: `site-photos/${userId}/${Date.now()}`,
        analysisResult: parsed as any,
        overallRiskLevel: parsed.overallRiskLevel,
        hazardCount: parsed.hazards.length,
        analysedAt: new Date(),
      } as any);
    }

    return parsed;
  } catch {
    return {
      overallRiskLevel: "medium",
      siteDescription: "Unable to analyse photo",
      hazards: [],
      unableToAssess: ["Full image — analysis failed"],
      confidence: 0,
    };
  }
}

// ─── Layer 4: Company Procedures from Uploaded SWMS PDFs ────────────────────

export async function extractProceduresFromPdf(
  pdfUrl: string,
  userId: number,
  trade?: string
): Promise<{ extracted: number; procedures: Array<{ category: string; description: string }> }> {
  const response = await invokeLLM({
    thinkingBudget: 4096,
    messages: [
      {
        role: "system",
        content: `You are analysing an existing Safe Work Method Statement (SWMS) document from an Australian construction company.

Your job is to EXTRACT their STANDARD PROCEDURES — the controls, PPE, and processes they consistently use that are SPECIFIC to this company (not generic WHS requirements).

Focus on extracting:
1. Company-specific PPE requirements (beyond minimum legal requirements)
2. Custom control measures they prefer (their specific methods)
3. Standard operating procedures for common tasks (their way of doing things)
4. Their preferred terminology and phrasing
5. Any company-specific forms, checklists, or sign-off processes
6. Emergency procedures specific to their operations
7. Specific equipment or brands they reference

DO NOT extract:
- Generic WHS requirements that every company uses
- Standard legal disclaimers
- Boilerplate text

For each procedure, assess confidence (0-100):
- 90+: Clearly a company standard (mentioned multiple times or explicitly stated as policy)
- 70-89: Likely a company preference (specific enough to be intentional)
- 50-69: Possibly standard (could be generic or company-specific)
- Below 50: Skip — too generic`,
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all company-specific safety procedures from this SWMS document. Focus on what makes THIS company's approach unique.",
          },
          {
            type: "file_url",
            file_url: { url: pdfUrl, mime_type: "application/pdf" },
          },
        ] as MessageContent[],
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "company_procedures_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            companyName: { type: "string", description: "Company name if identifiable" },
            procedures: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: {
                    type: "string",
                    enum: ["ppe", "control", "procedure", "terminology", "emergency", "signoff"],
                  },
                  description: { type: "string", description: "The specific procedure or requirement" },
                  confidence: { type: "number", description: "0-100 confidence this is company-specific" },
                },
                required: ["category", "description", "confidence"],
                additionalProperties: false,
              },
            },
          },
          required: ["companyName", "procedures"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const raw = response.choices[0]?.message?.content;
    const content = typeof raw === "string" ? raw : "";
    const parsed = JSON.parse(content);

    // Only store procedures with confidence >= 60
    const validProcedures = (parsed.procedures || []).filter(
      (p: any) => p.confidence >= 60
    );

    const db = await getDb();
    if (db && validProcedures.length > 0) {
      for (const proc of validProcedures) {
        await db.insert(companyProcedures).values({
          userId,
          trade: trade || null,
          category: proc.category,
          description: proc.description,
          confidence: proc.confidence,
          extractedFrom: parsed.companyName || "Uploaded SWMS",
          sourceUrl: pdfUrl,
        } as any);
      }
    }

    return {
      extracted: validProcedures.length,
      procedures: validProcedures.map((p: any) => ({
        category: p.category,
        description: p.description,
      })),
    };
  } catch {
    return { extracted: 0, procedures: [] };
  }
}

// ─── Get Company Procedures Context ─────────────────────────────────────────

async function getCompanyProceduresContext(userId: number, trade: string): Promise<string> {
  const db = await getDb();
  if (!db) return "";

  const procedures = await db
    .select()
    .from(companyProcedures)
    .where(
      and(
        eq(companyProcedures.userId, userId),
      )
    );

  // Filter: global + trade-specific, sorted by confidence
  const relevant = procedures
    .filter((p) => !p.trade || p.trade === trade)
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    .slice(0, 15);

  if (relevant.length === 0) return "";

  let context = "COMPANY PROCEDURES (extracted from your past SWMS documents — use these as baseline):\n\n";
  const grouped: Record<string, string[]> = {};
  for (const p of relevant) {
    const cat = p.category.toUpperCase();
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(`${p.description} (confidence: ${p.confidence}%)`);
  }

  for (const [cat, items] of Object.entries(grouped)) {
    context += `[${cat}]\n`;
    items.forEach((item) => (context += `  • ${item}\n`));
    context += "\n";
  }

  return context;
}

// ─── Main SWMS Generation — All Layers Combined ─────────────────────────────

export async function generateSwmsContentV2(
  ctx: SwmsGenerationContext
): Promise<SwmsGenerationResult> {
  // Gather all intelligence layers in parallel
  const [safetyProfile, corrections, proceduresContext, sitePhotoAnalysis] = await Promise.all([
    getBusinessSafetyContext(ctx.userId, ctx.trade),
    getCorrectionContext(ctx.userId, ctx.trade),
    getCompanyProceduresContext(ctx.userId, ctx.trade),
    ctx.sitePhotoUrls && ctx.sitePhotoUrls.length > 0
      ? analyseSitePhoto(ctx.sitePhotoUrls[0], ctx.userId)
      : Promise.resolve(null),
  ]);

  // Build the HRCW list
  const hrcwList = ctx.hrcwCategories
    .map((cat) => `- ${HRCW_LABELS[cat as keyof typeof HRCW_LABELS] || cat}`)
    .join("\n");

  // Build site photo hazard context
  let sitePhotoContext = "";
  if (sitePhotoAnalysis && sitePhotoAnalysis.hazards.length > 0) {
    sitePhotoContext = "\nSITE PHOTO HAZARDS DETECTED (incorporate these into the SWMS):\n";
    sitePhotoAnalysis.hazards.forEach((h) => {
      sitePhotoContext += `  ⚠️ [${h.severity.toUpperCase()}] ${h.category}: ${h.description}\n`;
      sitePhotoContext += `     → Required action: ${h.immediateAction}\n`;
      sitePhotoContext += `     → Standard: ${h.standardReference}\n\n`;
    });
  }

  // Build the system prompt — Chain-of-Thought + all context layers
  const systemPrompt = `You are a Senior WHS Consultant with 20+ years experience in Australian construction safety. You hold a Diploma of WHS and are certified to prepare SWMS for high-risk construction work under the WHS Regulations 2011.

REASONING PROCESS (follow exactly — think through each step):

STEP 1 — SCOPE ANALYSIS
Read the estimate scope and identify:
- Primary trade activities (what work is being done)
- Secondary/supporting activities (setup, cleanup, access)
- Materials that introduce specific hazards (chemicals, heavy items, sharp materials)
- Site conditions implied by the scope and location

STEP 2 — HRCW CLASSIFICATION
For each activity, determine if it falls under High Risk Construction Work per WHS Regulations 2011 Part 6.1:
- Work at height >2m (includes ladders, scaffolds, roofs, elevated platforms)
- Work near energised electrical installations or services
- Work in confined spaces (tanks, pits, ducts, ceiling spaces <600mm)
- Work involving demolition of load-bearing structures
- Work near traffic or mobile plant
- Work involving diving, trenching >1.5m, or tunnelling
- Work with asbestos or hazardous chemicals (refer to SDS)
- Work involving tilt-up or precast concrete

STEP 3 — HAZARD IDENTIFICATION (per activity)
For each activity, identify ALL foreseeable hazards using THREE analysis methods:
1. Task-based: What could go wrong during this specific task?
2. Energy-based: What energy sources are present? (gravitational, electrical, kinetic, chemical, thermal, acoustic, radiation)
3. Environmental: Weather, lighting, access, adjacent work, public interface

STEP 4 — HIERARCHY OF CONTROLS (per hazard)
Apply controls in STRICT hierarchy order. You MUST attempt higher-order controls first and document why they are/aren't reasonably practicable:
1. ELIMINATE — Can the hazard be removed entirely? (e.g., prefabricate at ground level)
2. SUBSTITUTE — Can a less hazardous method/material be used? (e.g., water-based instead of solvent)
3. ISOLATE — Can workers be separated from the hazard? (e.g., barriers, exclusion zones)
4. ENGINEER — Can physical controls be installed? (e.g., guardrails, ventilation, RCDs)
5. ADMIN — Can procedures/training/signage reduce risk? (e.g., permits, toolbox talks, spotters)
6. PPE — What SPECIFIC PPE is the last line of defence? (name exact item AND Australian standard)

NEVER jump straight to PPE without documenting why higher controls aren't practicable.

STEP 5 — PPE SPECIFICITY
Every PPE item MUST include:
- Exact item name (not "appropriate PPE" or "safety gear")
- Australian Standard reference (e.g., "AS/NZS 1801 safety helmet")
- Class/rating where applicable (e.g., "Class 5 ear muffs", "P2 respirator", "Level 5 cut-resistant gloves")

STEP 6 — VALIDATION
Before returning, verify:
✓ Every activity has at least 2 hazards identified
✓ Every hazard has controls from at least 2 hierarchy levels
✓ All PPE items are specific with standards referenced
✓ High-risk activities have more detailed controls (5+ control measures)
✓ Controls are actionable (who does what, when)
✓ No generic filler text — every line adds safety value

${safetyProfile}
${corrections.text}
${proceduresContext}
${sitePhotoContext}

Return ONLY the structured JSON after completing all reasoning steps.`;

  // Build user message with optional site photo
  const userContent: MessageContent[] = [
    {
      type: "text",
      text: `Generate SWMS work activities for this job:

Trade: ${ctx.trade}
Job Title: ${ctx.title}
Scope of Work: ${ctx.scope}
Materials: ${ctx.materials}
Location: ${ctx.location}, ${ctx.state}

Identified High-Risk Construction Work (HRCW):
${hrcwList || "- General construction work (assess for HRCW during generation)"}

Generate 5-10 work activity rows covering ALL main tasks for this job. Start with highest-risk activities. Each activity must have thorough hazard identification and multi-level controls following the hierarchy.`,
    },
  ];

  // Add site photos to the user message for multimodal analysis
  if (ctx.sitePhotoUrls && ctx.sitePhotoUrls.length > 0) {
    userContent.push({
      type: "text",
      text: "\n\nSite photos are attached below. Identify any additional hazards visible in these photos and incorporate them into the SWMS activities:",
    });
    for (const url of ctx.sitePhotoUrls.slice(0, 3)) {
      userContent.push({
        type: "image_url",
        image_url: { url, detail: "original" },
      });
    }
  }

  const response = await invokeLLM({
    thinkingBudget: 8192, // High reasoning for complex safety analysis
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "swms_generation_v2",
        strict: true,
        schema: {
          type: "object",
          properties: {
            activities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Unique ID for this activity row" },
                  task: { type: "string", description: "Work activity / task description" },
                  hazards: {
                    type: "array",
                    items: { type: "string" },
                    description: "All identified hazards for this task",
                  },
                  controls: {
                    type: "array",
                    items: { type: "string" },
                    description: "Control measures in hierarchy order (prefix with level: [ELIMINATE], [ENGINEER], [ADMIN], [PPE])",
                  },
                  ppe: {
                    type: "array",
                    items: { type: "string" },
                    description: "Specific PPE items with AS/NZS standard references",
                  },
                  responsible: { type: "string", description: "Person/role responsible" },
                  isAiGenerated: { type: "boolean" },
                  riskRating: {
                    type: "string",
                    enum: ["critical", "high", "medium", "low"],
                    description: "Residual risk after controls applied",
                  },
                },
                required: ["id", "task", "hazards", "controls", "ppe", "responsible", "isAiGenerated", "riskRating"],
                additionalProperties: false,
              },
            },
            confidenceScore: {
              type: "number",
              description: "0-100 confidence in completeness and accuracy of this SWMS",
            },
            additionalHrcwIdentified: {
              type: "array",
              items: { type: "string" },
              description: "Any additional HRCW categories identified during analysis",
            },
          },
          required: ["activities", "confidenceScore", "additionalHrcwIdentified"],
          additionalProperties: false,
        },
      },
    },
  });

  try {
    const raw = response.choices[0]?.message?.content;
    const content = typeof raw === "string" ? raw : "";
    const parsed = JSON.parse(content);

    // Increment useCount for corrections that were applied
    if (corrections.count > 0) {
      const db = await getDb();
      if (db) {
        // Mark corrections as used (fire and forget)
        db.update(aiCorrections)
          .set({ useCount: 1 }) // Will be incremented properly in future
          .where(and(eq(aiCorrections.userId, ctx.userId), eq(aiCorrections.trade, ctx.trade)))
          .catch(() => {});
      }
    }

    return {
      activities: parsed.activities || [],
      confidenceScore: parsed.confidenceScore || 70,
      sitePhotoHazards: sitePhotoAnalysis || undefined,
      correctionsApplied: corrections.count,
      profileItemsUsed: safetyProfile ? safetyProfile.split("•").length - 1 : 0,
    };
  } catch {
    return {
      activities: [],
      confidenceScore: 0,
      correctionsApplied: 0,
      profileItemsUsed: 0,
    };
  }
}

// ─── Feedback Loop: Detect and Store Corrections ────────────────────────────

export async function detectAndStoreCorrections(
  userId: number,
  trade: string,
  swmsId: string,
  aiActivities: WorkActivity[],
  userActivities: WorkActivity[]
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  let correctionsStored = 0;

  for (let i = 0; i < aiActivities.length; i++) {
    const aiRow = aiActivities[i];
    const userRow = userActivities[i];
    if (!userRow || !aiRow) continue;

    // Compare controls
    const aiControls = aiRow.controls.join("; ");
    const userControls = userRow.controls.join("; ");
    if (aiControls !== userControls && userControls.length > 0) {
      await db.insert(aiCorrections).values({
        userId,
        trade,
        context: `${aiRow.task} — controls`,
        aiOriginal: aiControls,
        userCorrected: userControls,
        category: "control",
        swmsId: parseInt(swmsId) || null,
      } as any);
      correctionsStored++;
    }

    // Compare PPE
    const aiPpe = aiRow.ppe.join("; ");
    const userPpe = userRow.ppe.join("; ");
    if (aiPpe !== userPpe && userPpe.length > 0) {
      await db.insert(aiCorrections).values({
        userId,
        trade,
        context: `${aiRow.task} — PPE`,
        aiOriginal: aiPpe,
        userCorrected: userPpe,
        category: "ppe",
        swmsId: parseInt(swmsId) || null,
      } as any);
      correctionsStored++;
    }

    // Compare hazards
    const aiHazards = aiRow.hazards.join("; ");
    const userHazards = userRow.hazards.join("; ");
    if (aiHazards !== userHazards && userHazards.length > 0) {
      await db.insert(aiCorrections).values({
        userId,
        trade,
        context: `${aiRow.task} — hazards`,
        aiOriginal: aiHazards,
        userCorrected: userHazards,
        category: "hazard",
        swmsId: parseInt(swmsId) || null,
      } as any);
      correctionsStored++;
    }
  }

  return correctionsStored;
}
