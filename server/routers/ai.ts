import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { estimates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// ─── Australian Supplier Database ────────────────────────────────────────────
const AUSTRALIAN_SUPPLIERS: Record<string, Array<{
  name: string;
  type: "retail" | "trade";
  website: string;
  trades: string[];
  regions: string[];
  notes: string;
}>> = {
  electrical: [
    { name: "Middy's", type: "trade", website: "https://www.middys.com.au", trades: ["electrical"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Australia's largest independent electrical wholesaler. Trade pricing 20-40% below retail." },
    { name: "L&H Electrical", type: "trade", website: "https://www.lh.com.au", trades: ["electrical"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "National electrical wholesaler with competitive trade pricing." },
    { name: "Rexel", type: "trade", website: "https://www.rexel.com.au", trades: ["electrical"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Global electrical distributor with strong Australian presence." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["electrical"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail pricing. Good for small quantities and emergency supplies." },
  ],
  plumbing: [
    { name: "Reece Plumbing", type: "trade", website: "https://www.reece.com.au", trades: ["plumbing"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Australia's largest plumbing supplier. Trade accounts with 15-35% discount." },
    { name: "Tradelink", type: "trade", website: "https://www.tradelink.com.au", trades: ["plumbing"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "National plumbing wholesaler. Competitive on fixtures and fittings." },
    { name: "Samios", type: "trade", website: "https://www.samios.net.au", trades: ["plumbing"], regions: ["QLD", "NSW", "VIC"], notes: "Specialist plumbing wholesaler with strong QLD presence." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["plumbing"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail pricing. Limited trade range." },
  ],
  carpentry: [
    { name: "Bowens", type: "trade", website: "https://www.bowens.com.au", trades: ["carpentry", "concreting"], regions: ["VIC"], notes: "Victoria's leading timber and building supplies. Trade pricing available." },
    { name: "Dahlsens", type: "trade", website: "https://www.dahlsens.com.au", trades: ["carpentry", "concreting"], regions: ["VIC", "NSW"], notes: "Regional building supplies with competitive timber pricing." },
    { name: "Mitre 10 Trade", type: "trade", website: "https://www.mitre10.com.au", trades: ["carpentry", "concreting", "landscaping"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "National trade supplier with builder accounts." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["carpentry"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail pricing. Wide range of timber and hardware." },
  ],
  concreting: [
    { name: "Boral Concrete", type: "trade", website: "https://www.boral.com.au", trades: ["concreting"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Australia's largest concrete supplier. Delivery and pump hire available." },
    { name: "Holcim", type: "trade", website: "https://www.holcim.com.au", trades: ["concreting"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Major concrete supplier with national coverage." },
    { name: "Hanson", type: "trade", website: "https://www.hanson.com.au", trades: ["concreting"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "National concrete and aggregates supplier." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["concreting"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail bagged concrete and tools only." },
  ],
  hvac: [
    { name: "Beijer Ref Australia", type: "trade", website: "https://www.beijerref.com.au", trades: ["hvac"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Specialist HVAC wholesaler with competitive trade pricing." },
    { name: "HiFrost", type: "trade", website: "https://www.hifrost.com.au", trades: ["hvac"], regions: ["NSW", "VIC", "QLD"], notes: "HVAC and refrigeration specialist supplier." },
    { name: "National Refrigeration", type: "trade", website: "https://www.?"  , trades: ["hvac"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "National HVAC parts and equipment supplier." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["hvac"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Limited HVAC range. Split systems only." },
  ],
  flooring: [
    { name: "Flooring Xtra", type: "trade", website: "https://www.flooringxtra.com.au", trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "National flooring specialist with trade pricing." },
    { name: "Carpet Court", type: "retail", website: "https://www.carpetcourt.com.au", trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail flooring with some trade accounts." },
    { name: "Beaumont Tiles", type: "trade", website: "https://www.?"  , trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Tile specialist with trade pricing." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail flooring range." },
  ],
  landscaping: [
    { name: "Landscape Centre", type: "trade", website: "https://www.?"  , trades: ["landscaping"], regions: ["NSW", "VIC", "QLD"], notes: "Specialist landscaping supplies — soil, mulch, stone." },
    { name: "Nuway Landscape Supplies", type: "trade", website: "https://www.?"  , trades: ["landscaping"], regions: ["VIC"], notes: "Melbourne-based landscape supplier with delivery." },
    { name: "Mitre 10 Trade", type: "trade", website: "https://www.mitre10.com.au", trades: ["landscaping"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "National supplier with landscaping range." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["landscaping"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail landscaping supplies." },
  ],
  cabinetry: [
    { name: "Laminex", type: "trade", website: "https://www.laminex.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Australia's leading laminate and panel supplier. Trade pricing available." },
    { name: "Polytec", type: "trade", website: "https://www.polytec.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Premium decorative surfaces and panels." },
    { name: "Hafele", type: "trade", website: "https://www.?"  , trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Cabinet hardware and fittings specialist." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail hardware and basic panel products." },
  ],
  rendering: [
    { name: "CSR Gyprock", type: "trade", website: "https://www.csr.com.au", trades: ["rendering"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Australia's leading plasterboard and render supplier." },
    { name: "Boral Plasterboard", type: "trade", website: "https://www.boral.com.au", trades: ["rendering"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "National plasterboard and render products." },
    { name: "Dulux AcraTex", type: "trade", website: "https://www.dulux.com.au", trades: ["rendering"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Specialist texture and render coatings." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["rendering"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail render and plaster products." },
  ],
  "cabinet-making": [
    { name: "Laminex", type: "trade", website: "https://www.laminex.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Australia's leading laminate and panel supplier." },
    { name: "Polytec", type: "trade", website: "https://www.polytec.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Premium decorative surfaces and panels." },
    { name: "Blum", type: "trade", website: "https://www.blum.com/au", trades: ["cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Premium cabinet hardware — hinges, drawer systems, lift systems." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail hardware and basic panel products." },
  ],
};

// ─── Vision Takeoff Prompts (per trade) ──────────────────────────────────────
function buildVisionPrompt(trade: string): string {
  const tradeNames: Record<string, string> = {
    electrical: "electrical", plumbing: "plumbing", carpentry: "carpentry",
    concreting: "concreting", hvac: "HVAC", flooring: "flooring",
    landscaping: "landscaping", cabinetry: "cabinetry",
    rendering: "rendering and plastering", "cabinet-making": "cabinet making",
  };
  const tradeName = tradeNames[trade] ?? trade;

  return `You are an expert Australian ${tradeName} estimator with 20+ years of experience reading construction plans and blueprints.

TASK: Analyze this construction plan image and extract a COMPLETE materials takeoff for ${tradeName} work.

For EVERY material item you identify, provide:
1. description — specific product name (e.g. "Clipsal 10A single power point" not just "power point")
2. unit — measurement unit (ea, m, m², m³, lm, kg, roll, sheet, bag, pack)
3. quantity — accurate count from the plan. If you can see symbols, count them precisely. If measuring areas/lengths, calculate from dimensions shown.
4. retailPrice — current Australian RETAIL price per unit (Bunnings-level pricing, AUD)
5. tradePrice — current Australian TRADE/WHOLESALE price per unit (trade supplier pricing, typically 20-40% below retail, AUD)
6. category — one of: "Materials", "Labour", "Plant", "Consumables"
7. labourMinutes — estimated minutes of labour to install/apply this item (for a qualified tradesperson)
8. wasteFactor — percentage waste factor to add (e.g. 10 for 10% waste on tiles, 5 for 5% on cable)

Also provide:
- confidence: 0-100 how confident you are in the accuracy of this takeoff
- assumptions: list every assumption you made (e.g. "Assumed standard 2.4m ceiling height", "Counted 12 power point symbols on plan")
- roomBreakdown: array of { room: string, items: string[] } showing which items go in which room
- planNotes: any observations about the plan quality, scale, or missing information

CRITICAL RULES:
- Use 2024-25 Australian market pricing
- Trade prices should be 20-40% below retail depending on the product category
- Include waste factors (typically 5-15% depending on material)
- Count EVERY symbol on the plan — do not estimate, count precisely
- If dimensions are shown, calculate areas and lengths mathematically
- If you cannot determine something precisely, state it as an assumption
- Labour minutes should reflect a qualified tradesperson working at normal pace
- Include consumables (screws, adhesive, tape, etc.) that are often forgotten

Return ONLY valid JSON matching the schema. No markdown, no explanation outside the JSON.`;
}

// ─── Text-based Takeoff Prompts (existing, enhanced) ─────────────────────────
function buildTextPrompt(trade: string): string {
  const tradeNames: Record<string, string> = {
    electrical: "electrical", plumbing: "plumbing", carpentry: "carpentry",
    concreting: "concreting", hvac: "HVAC", flooring: "flooring",
    landscaping: "landscaping", cabinetry: "cabinetry",
    rendering: "rendering and plastering", "cabinet-making": "cabinet making",
  };
  const tradeName = tradeNames[trade] ?? trade;

  return `You are an expert Australian ${tradeName} estimator with 20+ years of experience.

TASK: Based on the job description provided, generate a COMPLETE materials takeoff.

For EVERY material item, provide:
1. description — specific Australian product name
2. unit — measurement unit (ea, m, m², m³, lm, kg, roll, sheet, bag, pack)
3. quantity — accurate quantity based on the description
4. retailPrice — current Australian RETAIL price per unit (AUD)
5. tradePrice — current Australian TRADE/WHOLESALE price per unit (20-40% below retail, AUD)
6. category — one of: "Materials", "Labour", "Plant", "Consumables"
7. labourMinutes — estimated minutes of labour per unit for a qualified tradesperson
8. wasteFactor — percentage waste factor (e.g. 10 for 10%)

Also provide:
- confidence: 0-100
- assumptions: list every assumption
- roomBreakdown: array of { room: string, items: string[] }
- planNotes: any observations

Use 2024-25 Australian market pricing. Include consumables. Be thorough.
Return ONLY valid JSON.`;
}

// ─── JSON Schema for structured AI response ──────────────────────────────────
const takeoffResponseSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "vision_takeoff_result",
    strict: true,
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              description: { type: "string" },
              unit: { type: "string" },
              quantity: { type: "number" },
              retailPrice: { type: "number" },
              tradePrice: { type: "number" },
              category: { type: "string" },
              labourMinutes: { type: "number" },
              wasteFactor: { type: "number" },
            },
            required: ["description", "unit", "quantity", "retailPrice", "tradePrice", "category", "labourMinutes", "wasteFactor"],
            additionalProperties: false,
          },
        },
        confidence: { type: "number" },
        assumptions: { type: "array", items: { type: "string" } },
        roomBreakdown: {
          type: "array",
          items: {
            type: "object",
            properties: {
              room: { type: "string" },
              items: { type: "array", items: { type: "string" } },
            },
            required: ["room", "items"],
            additionalProperties: false,
          },
        },
        planNotes: { type: "string" },
      },
      required: ["items", "confidence", "assumptions", "roomBreakdown", "planNotes"],
      additionalProperties: false,
    },
  },
};

// ─── Type for the AI response ────────────────────────────────────────────────
type TakeoffItem = {
  description: string;
  unit: string;
  quantity: number;
  retailPrice: number;
  tradePrice: number;
  category: string;
  labourMinutes: number;
  wasteFactor: number;
};

type TakeoffResult = {
  items: TakeoffItem[];
  confidence: number;
  assumptions: string[];
  roomBreakdown: { room: string; items: string[] }[];
  planNotes: string;
};

// ─── Router ──────────────────────────────────────────────────────────────────
export const aiRouter = router({
  // Upload plan image/PDF to S3
  uploadPlan: protectedProcedure.input(z.object({
    fileName: z.string(),
    fileBase64: z.string(),
    contentType: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const ext = input.fileName.split(".").pop() ?? "png";
    const key = `plans/${ctx.user.id}/${nanoid()}.${ext}`;
    const buffer = Buffer.from(input.fileBase64, "base64");
    const { url } = await storagePut(key, buffer, input.contentType);
    return { url, key };
  }),

  // AI Vision Takeoff — analyse an uploaded plan image
  visionTakeoff: protectedProcedure.input(z.object({
    estimateId: z.number(),
    trade: z.string(),
    imageUrl: z.string().url(),
    additionalContext: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Verify ownership
    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const systemPrompt = buildVisionPrompt(input.trade);
    const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }> = [
      {
        type: "image_url",
        image_url: { url: input.imageUrl, detail: "high" },
      },
    ];
    if (input.additionalContext) {
      userContent.push({ type: "text", text: `Additional context from the tradie: ${input.additionalContext}` });
    }

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent as any },
      ],
      response_format: takeoffResponseSchema,
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    if (!content) throw new Error("No response from AI");

    const result = JSON.parse(content) as TakeoffResult;

    // Save AI data to estimate
    await db.update(estimates).set({
      aiConfidenceScore: result.confidence,
      aiAssumptions: result.assumptions as any,
      aiTakeoffData: result.items as any,
    }).where(eq(estimates.id, input.estimateId));

    return result;
  }),

  // Text-based takeoff (enhanced with dual pricing)
  analyzePlan: protectedProcedure.input(z.object({
    estimateId: z.number(),
    trade: z.string(),
    planDescription: z.string().min(10),
    projectDetails: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [est] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!est) throw new Error("Estimate not found");

    const systemPrompt = buildTextPrompt(input.trade);
    const userMessage = `Project Details: ${input.projectDetails ?? "Standard residential project"}

Job Description:
${input.planDescription}

Generate a complete takeoff with accurate 2024-25 Australian market pricing (both retail and trade).`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      response_format: takeoffResponseSchema,
    });

    const rawContent = response.choices[0]?.message?.content;
    const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
    if (!content) throw new Error("No response from AI");

    const result = JSON.parse(content) as TakeoffResult;

    await db.update(estimates).set({
      aiConfidenceScore: result.confidence,
      aiAssumptions: result.assumptions as any,
      aiTakeoffData: result.items as any,
    }).where(eq(estimates.id, input.estimateId));

    return result;
  }),

  // Get supplier recommendations for a trade + state
  getSuppliers: protectedProcedure.input(z.object({
    trade: z.string(),
    state: z.string().optional(),
  })).query(({ input }) => {
    const suppliers = AUSTRALIAN_SUPPLIERS[input.trade] ?? [];
    if (input.state) {
      return suppliers.filter(s => s.regions.includes(input.state!));
    }
    return suppliers;
  }),

  // Calculate pricing summary with markup
  calculatePricing: protectedProcedure.input(z.object({
    items: z.array(z.object({
      quantity: z.number(),
      retailPrice: z.number(),
      tradePrice: z.number(),
      labourMinutes: z.number(),
      wasteFactor: z.number(),
    })),
    labourRate: z.number().default(85), // $/hr
    markupPercent: z.number().default(20),
    useTradePrice: z.boolean().default(true),
  })).mutation(({ input }) => {
    let totalMaterialsRetail = 0;
    let totalMaterialsTrade = 0;
    let totalLabourHours = 0;

    for (const item of input.items) {
      const wasteMultiplier = 1 + (item.wasteFactor / 100);
      const qty = item.quantity * wasteMultiplier;
      totalMaterialsRetail += qty * item.retailPrice;
      totalMaterialsTrade += qty * item.tradePrice;
      totalLabourHours += (item.quantity * item.labourMinutes) / 60;
    }

    const materialsCost = input.useTradePrice ? totalMaterialsTrade : totalMaterialsRetail;
    const labourCost = totalLabourHours * input.labourRate;
    const subtotal = materialsCost + labourCost;
    const markup = subtotal * (input.markupPercent / 100);
    const subtotalWithMarkup = subtotal + markup;
    const gst = subtotalWithMarkup * 0.1;
    const total = subtotalWithMarkup + gst;

    const savings = totalMaterialsRetail - totalMaterialsTrade;

    return {
      materialsCostRetail: Math.round(totalMaterialsRetail * 100) / 100,
      materialsCostTrade: Math.round(totalMaterialsTrade * 100) / 100,
      tradeSavings: Math.round(savings * 100) / 100,
      labourHours: Math.round(totalLabourHours * 10) / 10,
      labourCost: Math.round(labourCost * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      markupAmount: Math.round(markup * 100) / 100,
      subtotalWithMarkup: Math.round(subtotalWithMarkup * 100) / 100,
      gst: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }),

  // Generate quote summary
  generateQuoteSummary: protectedProcedure.input(z.object({
    trade: z.string(),
    clientName: z.string().optional(),
    projectAddress: z.string().optional(),
    lineItemsSummary: z.string(),
    total: z.number(),
  })).mutation(async ({ input }) => {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a professional Australian trade contractor. Write a concise, professional quote summary paragraph (2-3 sentences) that describes the scope of work for the client. Be specific about what is included. Use professional Australian English.",
        },
        {
          role: "user",
          content: `Trade: ${input.trade}
Client: ${input.clientName ?? "Client"}
Address: ${input.projectAddress ?? "Project site"}
Work items: ${input.lineItemsSummary}
Total value: $${input.total.toFixed(2)} inc. GST

Write a professional scope of works summary.`,
        },
      ],
    });
    const summaryContent = response.choices[0]?.message?.content;
    return { summary: typeof summaryContent === "string" ? summaryContent : "" };
  }),
});
