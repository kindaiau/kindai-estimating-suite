/**
 * orchestratedTakeoff.ts
 * 5-step orchestrated AI workflow for premium takeoff generation.
 * Uses Server-Sent Events (SSE) to stream progress to the client.
 *
 * Steps:
 *   1. Plan Interpretation — detect project type, trades, rooms, complexity
 *   2. Quantity Extraction — per-section quantities with confidence flags
 *   3. Pricing Lookup     — price book first, then market benchmarks
 *   4. Business Rules     — margin floors, compliance, missing-data flags
 *   5. Draft Assembly     — final structured estimate with per-item confidence
 */

import { Router, Request, Response } from "express";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { estimates, tradeProfiles, companyProfiles, priceBookItems, estimateCorrections } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { buildProductivityPromptSection } from "../labourProductivity";
import { sdk } from "../_core/sdk";

export const orchestratedTakeoffRouter = Router();

// ─── Auth helper ───────────────────────────────────────────────────────────────────────────────
async function getUserFromRequest(req: Request): Promise<{ id: number; email: string } | null> {
  try {
    const user = await sdk.authenticateRequest(req);
    return { id: user.id, email: user.email ?? "" };
  } catch {
    return null;
  }
}

// ─── SSE helper ──────────────────────────────────────────────────────────────
function sendEvent(res: Response, event: string, data: unknown) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// ─── Step schemas ─────────────────────────────────────────────────────────────
const STEP_1_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "plan_interpretation",
    strict: true,
    schema: {
      type: "object",
      properties: {
        projectType: { type: "string" },
        detectedTrades: { type: "array", items: { type: "string" } },
        rooms: { type: "array", items: { type: "string" } },
        totalFloorArea: { type: "number" },
        complexity: { type: "string", enum: ["simple", "standard", "complex", "high-end"] },
        dwellingCount: { type: "number" },
        storeys: { type: "number" },
        keyObservations: { type: "array", items: { type: "string" } },
        missingInfo: { type: "array", items: { type: "string" } },
      },
      required: ["projectType", "detectedTrades", "rooms", "totalFloorArea", "complexity", "dwellingCount", "storeys", "keyObservations", "missingInfo"],
      additionalProperties: false,
    },
  },
};

const STEP_2_SCHEMA = {
  type: "json_schema" as const,
  json_schema: {
    name: "quantity_extraction",
    strict: true,
    schema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              section: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    unit: { type: "string" },
                    quantity: { type: "number" },
                    confidence: { type: "number" },
                    basis: { type: "string" },
                  },
                  required: ["description", "unit", "quantity", "confidence", "basis"],
                  additionalProperties: false,
                },
              },
            },
            required: ["section", "items"],
            additionalProperties: false,
          },
        },
        totalItems: { type: "number" },
        lowConfidenceCount: { type: "number" },
      },
      required: ["sections", "totalItems", "lowConfidenceCount"],
      additionalProperties: false,
    },
  },
};

// ─── Main SSE endpoint ────────────────────────────────────────────────────────
orchestratedTakeoffRouter.get("/api/orchestrated-takeoff", async (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const user = await getUserFromRequest(req);
  if (!user) {
    sendEvent(res, "error", { message: "Unauthorised" });
    return res.end();
  }

  const { estimateId, trade, mode, imageUrl, planDescription, projectDetails, additionalContext, scopeDocUrl } = req.query as Record<string, string>;

  if (!estimateId || !trade || !mode) {
    sendEvent(res, "error", { message: "Missing required parameters" });
    return res.end();
  }

  const db = await getDb();
  if (!db) {
    sendEvent(res, "error", { message: "Database not available" });
    return res.end();
  }

  // Verify estimate ownership
  const [est] = await db.select().from(estimates)
    .where(and(eq(estimates.id, parseInt(estimateId)), eq(estimates.userId, user.id)))
    .limit(1);
  if (!est) {
    sendEvent(res, "error", { message: "Estimate not found" });
    return res.end();
  }

  // Load company memory and custom rates
  let companyProfile: any = null;
  let priceBook: any[] = [];
  let corrections: any[] = [];
  let customRates: any = null;

  try {
    [companyProfile] = await db.select().from(companyProfiles)
      .where(eq(companyProfiles.userId, user.id))
      .limit(1);

    priceBook = await db.select().from(priceBookItems)
      .where(and(eq(priceBookItems.userId, user.id), eq(priceBookItems.trade, trade)))
      .limit(50);

    corrections = await db.select({
      correctionType: estimateCorrections.correctionType,
      fieldName: estimateCorrections.fieldName,
      aiValue: estimateCorrections.aiValue,
      humanValue: estimateCorrections.humanValue,
      itemDescription: estimateCorrections.itemDescription,
      section: estimateCorrections.section,
    }).from(estimateCorrections)
      .where(and(eq(estimateCorrections.userId, user.id), eq(estimateCorrections.trade, trade)))
      .orderBy(desc(estimateCorrections.createdAt))
      .limit(20);

    const [profile] = await db.select({
      defaultLabourRate: tradeProfiles.defaultLabourRate,
      defaultMarkup: tradeProfiles.defaultMarkup,
      materialMarkup: tradeProfiles.materialMarkup,
      overheadPercent: tradeProfiles.overheadPercent,
      profitMargin: tradeProfiles.profitMargin,
      defaultWasteFactor: tradeProfiles.defaultWasteFactor,
    }).from(tradeProfiles)
      .where(and(eq(tradeProfiles.userId, user.id), eq(tradeProfiles.trade, trade)))
      .limit(1);
    customRates = profile ?? null;
  } catch (e) {
    console.warn("[Orchestrated] Failed to load company memory:", e);
  }

  const labourRate = customRates?.defaultLabourRate
    ? { min: customRates.defaultLabourRate, max: customRates.defaultLabourRate }
    : { min: 75, max: 120 };

  const companyContext = companyProfile ? `
Company: ${companyProfile.businessName ?? "Unknown"}
AI Instructions: ${companyProfile.aiInstructions ?? "None"}
Default Inclusions: ${companyProfile.defaultInclusions ?? "Standard"}
Default Exclusions: ${companyProfile.defaultExclusions ?? "None specified"}
Quote Tone: ${companyProfile.quoteTone ?? "professional"}` : "";

  const priceBookContext = priceBook.length > 0
    ? `\nYOUR PRICE BOOK (use these exact rates):\n${priceBook.map(p => `- ${p.description} (${p.unit}): $${p.rate} trade`).join("\n")}`
    : "";

  const correctionContext = corrections.length > 0
    ? `\nLEARNED CORRECTIONS (from past jobs — apply these patterns):\n${corrections.slice(0, 10).map(c => {
      const parts = [];
      if (c.itemDescription) parts.push(`item: "${c.itemDescription}"`);
      if (c.correctionType === "rate_change" && c.aiValue && c.humanValue) {
        parts.push(`rate: AI said $${c.aiValue} → human changed to $${c.humanValue}`);
      } else if (c.correctionType === "quantity_change" && c.aiValue && c.humanValue) {
        parts.push(`qty: AI said ${c.aiValue} → human changed to ${c.humanValue}`);
      } else if (c.correctionType === "item_added") {
        parts.push(`human added this item (AI missed it)`);
      } else if (c.correctionType === "item_removed") {
        parts.push(`human removed this item (AI over-counted)`);
      } else if (c.aiValue && c.humanValue) {
        parts.push(`${c.fieldName ?? c.correctionType}: "${c.aiValue}" → "${c.humanValue}"`);
      }
      return parts.length ? `- ${parts.join(", ")}` : null;
    }).filter(Boolean).join("\n")}`
    : "";

  const productivityData = buildProductivityPromptSection(trade);

  // Build the user content for vision vs text mode
  // scopeDocUrl: optional second document (spec sheet / scope of works)
  const buildUserContent = (step: number, stepContext: string): any => {
    const scopeNote = scopeDocUrl
      ? `\n\nA Scope of Works / Specification document has also been provided. Cross-reference it with the plan for inclusions, exclusions, and specified products.`
      : "";
    if (mode === "vision" && imageUrl) {
      const content: any[] = [
        { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
      ];
      // Attach scope doc as a second image/PDF if provided
      if (scopeDocUrl) {
        const isImage = /\.(jpg|jpeg|png|webp)$/i.test(scopeDocUrl);
        if (isImage) {
          content.push({ type: "image_url", image_url: { url: scopeDocUrl, detail: "high" } });
        } else {
          // PDF — attach as file_url
          content.push({ type: "file_url", file_url: { url: scopeDocUrl, mime_type: "application/pdf" } });
        }
      }
      content.push({ type: "text", text: stepContext + (additionalContext ? `\n\nAdditional context: ${additionalContext}` : "") + scopeNote });
      return content;
    }
    return `${planDescription ?? ""}\n\nProject Details: ${projectDetails ?? "Standard residential project"}\n\n${stepContext}${scopeNote}`;
  };

  try {
    // ─── STEP 1: Plan Interpretation ─────────────────────────────────────────
    sendEvent(res, "step", {
      step: 1,
      title: "Reading your plan",
      description: "Detecting project type, rooms, trades, and complexity...",
      status: "running",
    });

    const step1Response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a senior Australian quantity surveyor and construction estimator with 25+ years experience. 
Your task is STEP 1 of a 5-step estimation process: PLAN INTERPRETATION.
Analyse the provided plan/description and extract structured project information.
Trade being estimated: ${trade}
${companyContext}`,
        },
        {
          role: "user",
          content: buildUserContent(1, "STEP 1: Analyse this plan. Identify the project type, all rooms/areas, trades required, floor area, complexity level, number of dwellings, and any missing information that would affect accuracy."),
        },
      ],
      response_format: STEP_1_SCHEMA,
      thinkingBudget: 2048,
    });

    const step1Raw = step1Response.choices[0]?.message?.content;
    const step1 = JSON.parse(typeof step1Raw === "string" ? step1Raw : JSON.stringify(step1Raw));

    sendEvent(res, "step", {
      step: 1,
      title: "Plan interpreted",
      description: `${step1.projectType} — ${step1.rooms.length} areas detected, complexity: ${step1.complexity}`,
      status: "done",
      data: step1,
    });

    // ─── STEP 2: Quantity Extraction ─────────────────────────────────────────
    sendEvent(res, "step", {
      step: 2,
      title: "Counting items",
      description: "Extracting quantities section by section...",
      status: "running",
    });

    const step2Response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a senior Australian quantity surveyor.
STEP 2: QUANTITY EXTRACTION for ${trade} trade.
Project context from Step 1: ${JSON.stringify(step1)}
${companyContext}
${productivityData}
Extract ALL quantities for this trade. Be precise. Flag low-confidence items (< 70%).`,
        },
        {
          role: "user",
          content: buildUserContent(2, "STEP 2: Extract all quantities for the " + trade + " trade. Group by section. Include confidence score (0-100) and basis for each quantity."),
        },
      ],
      response_format: STEP_2_SCHEMA,
      thinkingBudget: 2048,
    });

    const step2Raw = step2Response.choices[0]?.message?.content;
    const step2 = JSON.parse(typeof step2Raw === "string" ? step2Raw : JSON.stringify(step2Raw));

    sendEvent(res, "step", {
      step: 2,
      title: "Quantities extracted",
      description: `${step2.totalItems} items across ${step2.sections.length} sections${step2.lowConfidenceCount > 0 ? ` — ${step2.lowConfidenceCount} flagged for review` : ""}`,
      status: "done",
      data: step2,
    });

    // ─── STEP 3: Pricing Lookup ───────────────────────────────────────────────
    sendEvent(res, "step", {
      step: 3,
      title: "Looking up your prices",
      description: `Checking your price book${priceBook.length > 0 ? ` (${priceBook.length} items)` : ""}, then market benchmarks...`,
      status: "running",
    });

    const step3SystemPrompt = `You are a senior Australian construction estimator.
STEP 3: PRICING for ${trade} trade.
Labour rate: $${labourRate.min}-${labourRate.max}/hr
${priceBookContext}
${correctionContext}
${productivityData}
Apply 2024-25 Australian trade pricing. Use price book rates where available — they override market rates.`;

    const step3Response = await invokeLLM({
      messages: [
        { role: "system", content: step3SystemPrompt },
        {
          role: "user",
          content: `STEP 3: Price each item from the quantity extraction. For each item provide: retailPrice (AUD), tradePrice (AUD), labourMinutes per unit, wasteFactor (%). 

Quantities to price:
${JSON.stringify(step2.sections, null, 2)}`,
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "pricing_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              pricedItems: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    section: { type: "string" },
                    description: { type: "string" },
                    unit: { type: "string" },
                    quantity: { type: "number" },
                    retailPrice: { type: "number" },
                    tradePrice: { type: "number" },
                    category: { type: "string" },
                    labourMinutes: { type: "number" },
                    wasteFactor: { type: "number" },
                    priceSource: { type: "string", enum: ["price_book", "market_benchmark", "estimated"] },
                  },
                  required: ["section", "description", "unit", "quantity", "retailPrice", "tradePrice", "category", "labourMinutes", "wasteFactor", "priceSource"],
                  additionalProperties: false,
                },
              },
              priceBookHits: { type: "number" },
              marketBenchmarkHits: { type: "number" },
            },
            required: ["pricedItems", "priceBookHits", "marketBenchmarkHits"],
            additionalProperties: false,
          },
        },
      },
    });

    const step3Raw = step3Response.choices[0]?.message?.content;
    const step3 = JSON.parse(typeof step3Raw === "string" ? step3Raw : JSON.stringify(step3Raw));

    const totalMaterials = step3.pricedItems
      .filter((i: any) => i.category === "Materials")
      .reduce((sum: number, i: any) => sum + (i.tradePrice * i.quantity), 0);
    const totalLabour = step3.pricedItems
      .filter((i: any) => i.category === "Labour")
      .reduce((sum: number, i: any) => sum + (i.tradePrice * i.quantity), 0);

    sendEvent(res, "step", {
      step: 3,
      title: "Prices applied",
      description: `Materials: $${Math.round(totalMaterials).toLocaleString()} | Labour: $${Math.round(totalLabour).toLocaleString()}${step3.priceBookHits > 0 ? ` | ${step3.priceBookHits} from your price book` : ""}`,
      status: "done",
      data: { priceBookHits: step3.priceBookHits, marketBenchmarkHits: step3.marketBenchmarkHits },
    });

    // ─── STEP 4: Business Rules ───────────────────────────────────────────────
    sendEvent(res, "step", {
      step: 4,
      title: "Applying your rules",
      description: "Checking margins, compliance, and missing items...",
      status: "running",
    });

    const step4Response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a senior Australian construction estimator reviewing a quote for compliance and completeness.
STEP 4: BUSINESS RULES for ${trade} trade.
${companyContext}
Custom rates: ${customRates ? `Labour $${customRates.defaultLabourRate}/hr, Markup ${customRates.defaultMarkup}%, Overhead ${customRates.overheadPercent}%, Profit ${customRates.profitMargin}%` : "Using defaults"}
Check: missing items, compliance requirements (AS standards, BCA), provisional sums needed, items that should be excluded per company rules.`,
        },
        {
          role: "user",
          content: `STEP 4: Review this priced estimate and apply business rules.

Current items: ${JSON.stringify(step3.pricedItems.slice(0, 30), null, 2)}

Return JSON with:
- missingItems: array of items that should be added
- complianceFlags: array of compliance/AS standard requirements
- provisionalSums: items that need PS treatment
- exclusions: items to flag as excluded
- qualityChecks: any pricing anomalies to flag
- overallConfidence: 0-100`,
        },
      ],
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "business_rules_result",
          strict: true,
          schema: {
            type: "object",
            properties: {
              missingItems: { type: "array", items: { type: "string" } },
              complianceFlags: { type: "array", items: { type: "string" } },
              provisionalSums: { type: "array", items: { type: "string" } },
              exclusions: { type: "array", items: { type: "string" } },
              qualityChecks: { type: "array", items: { type: "string" } },
              overallConfidence: { type: "number" },
            },
            required: ["missingItems", "complianceFlags", "provisionalSums", "exclusions", "qualityChecks", "overallConfidence"],
            additionalProperties: false,
          },
        },
      },
    });

    const step4Raw = step4Response.choices[0]?.message?.content;
    const step4 = JSON.parse(typeof step4Raw === "string" ? step4Raw : JSON.stringify(step4Raw));

    const flagCount = step4.missingItems.length + step4.complianceFlags.length + step4.provisionalSums.length;
    sendEvent(res, "step", {
      step: 4,
      title: "Rules applied",
      description: `${flagCount > 0 ? `${flagCount} items flagged` : "All checks passed"} — confidence: ${step4.overallConfidence}%`,
      status: "done",
      data: step4,
    });

    // ─── CROSS-CHECK: Anomaly Detection ─────────────────────────────────────
    // Run a lightweight cross-check pass to catch inconsistencies between passes
    const anomalies: string[] = [];
    try {
      const crossCheckResponse = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a senior Australian QS performing a cross-check audit.
You have the plan interpretation (Step 1) and the extracted quantities (Step 2).
Your job is to flag anomalies — inconsistencies between what the plan shows and what was extracted.`,
          },
          {
            role: "user",
            content: `Cross-check these two outputs and identify anomalies:

STEP 1 (Plan Interpretation):
- Rooms detected: ${step1.rooms.join(", ")}
- Project type: ${step1.projectType}
- Complexity: ${step1.complexity}
- Missing info: ${step1.missingInfo.join(", ") || "none"}

STEP 2 (Quantities extracted): ${step2.totalItems} items across ${step2.sections.length} sections
Sections: ${step2.sections.map((s: any) => s.section).join(", ")}

Flag anomalies such as:
- Room count mismatch (Step 1 says 4 bedrooms but Step 2 only has 2)
- Missing fixture schedules referenced in plan
- Unusually high or low quantities for the project type
- Sections in Step 1 rooms not covered in Step 2

Return JSON: { "anomalies": ["string"], "severity": "none" | "minor" | "major" }`,
          },
        ],
        response_format: {
          type: "json_schema" as const,
          json_schema: {
            name: "cross_check_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                anomalies: { type: "array", items: { type: "string" } },
                severity: { type: "string", enum: ["none", "minor", "major"] },
              },
              required: ["anomalies", "severity"],
              additionalProperties: false,
            },
          },
        },
        thinkingBudget: 512,
      });
      const crossCheckRaw = crossCheckResponse.choices[0]?.message?.content;
      const crossCheck = JSON.parse(typeof crossCheckRaw === "string" ? crossCheckRaw : JSON.stringify(crossCheckRaw));
      anomalies.push(...(crossCheck.anomalies ?? []));
      if (crossCheck.severity !== "none" && anomalies.length > 0) {
        sendEvent(res, "anomaly", { anomalies, severity: crossCheck.severity });
      }
    } catch {
      // Cross-check is non-blocking — if it fails, continue with assembly
    }

    // ─── STEP 5: Draft Assembly ───────────────────────────────────────────────
    sendEvent(res, "step", {
      step: 5,
      title: "Building your quote",
      description: "Assembling final estimate with all items, labour, and flags...",
      status: "running",
    });

    // Combine all steps into the final estimate
    const finalItems = step3.pricedItems.map((item: any) => ({
      section: item.section,
      description: item.description,
      unit: item.unit,
      quantity: item.quantity,
      retailPrice: item.retailPrice,
      tradePrice: item.tradePrice,
      category: item.category,
      labourMinutes: item.labourMinutes,
      wasteFactor: item.wasteFactor,
    }));

    const totalTrade = finalItems.reduce((sum: number, i: any) => {
      const qty = i.quantity * (1 + (i.wasteFactor ?? 0) / 100);
      return sum + (i.tradePrice * qty);
    }, 0);

    const result = {
      items: finalItems,
      confidence: step4.overallConfidence,
      assumptions: [
        ...step1.keyObservations,
        ...step1.missingInfo.map((m: string) => `MISSING: ${m}`),
        ...anomalies.map((a: string) => `⚠️ ANOMALY: ${a}`),
      ],
      roomBreakdown: step1.rooms.map((room: string) => ({
        room,
        items: finalItems
          .filter((i: any) => i.section.toLowerCase().includes(room.toLowerCase()))
          .map((i: any) => i.description)
          .slice(0, 5),
      })),
      planNotes: `Project: ${step1.projectType} | Complexity: ${step1.complexity} | ${step2.totalItems} items | ${step4.complianceFlags.length} compliance flags${anomalies.length > 0 ? ` | ${anomalies.length} anomaly${anomalies.length > 1 ? "ies" : ""} detected` : ""}`,
      orchestrationMeta: {
        step1,
        step4,
        priceBookHits: step3.priceBookHits,
        totalTrade: Math.round(totalTrade),
        anomalies,
      },
    };

    // Save to database
    await db.update(estimates).set({
      aiConfidenceScore: result.confidence,
      aiAssumptions: result.assumptions as any,
      aiTakeoffData: result.items as any,
    }).where(eq(estimates.id, parseInt(estimateId)));

    sendEvent(res, "step", {
      step: 5,
      title: "Quote ready",
      description: `${finalItems.length} line items — estimated trade total: $${Math.round(totalTrade).toLocaleString()}`,
      status: "done",
    });

    sendEvent(res, "complete", result);
  } catch (err: any) {
    console.error("[Orchestrated] Error:", err);
    sendEvent(res, "error", { message: err.message ?? "AI processing failed" });
  }

  res.end();
});
