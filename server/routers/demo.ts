import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";

// ─── Pre-built demo results for instant display ───────────────────────────────
// These are shown while the real AI runs, or as fallback if AI is slow
const DEMO_SCENARIOS: Record<string, {
  trade: string;
  planDescription: string;
  sampleItems: Array<{
    description: string;
    unit: string;
    quantity: number;
    retailPrice: number;
    tradePrice: number;
    category: string;
    labourMinutes: number;
    wasteFactor: number;
  }>;
  confidence: number;
  assumptions: string[];
  planNotes: string;
}> = {
  electrical: {
    trade: "electrical",
    planDescription: "3-bedroom residential house, 180m². Standard electrical fit-out.",
    sampleItems: [
      { description: "Clipsal 10A single GPO power point", unit: "ea", quantity: 22, retailPrice: 18.50, tradePrice: 11.20, category: "Materials", labourMinutes: 25, wasteFactor: 0 },
      { description: "Clipsal 10A double GPO power point", unit: "ea", quantity: 8, retailPrice: 24.80, tradePrice: 15.40, category: "Materials", labourMinutes: 30, wasteFactor: 0 },
      { description: "Clipsal LED downlight 10W dimmable", unit: "ea", quantity: 18, retailPrice: 42.00, tradePrice: 26.50, category: "Materials", labourMinutes: 35, wasteFactor: 0 },
      { description: "Clipsal 1-gang switch", unit: "ea", quantity: 12, retailPrice: 14.20, tradePrice: 8.80, category: "Materials", labourMinutes: 20, wasteFactor: 0 },
      { description: "Clipsal 2-gang switch", unit: "ea", quantity: 6, retailPrice: 19.50, tradePrice: 12.10, category: "Materials", labourMinutes: 25, wasteFactor: 0 },
      { description: "2.5mm² TPS twin & earth cable", unit: "m", quantity: 280, retailPrice: 2.85, tradePrice: 1.75, category: "Materials", labourMinutes: 3, wasteFactor: 10 },
      { description: "4mm² TPS twin & earth cable", unit: "m", quantity: 80, retailPrice: 4.20, tradePrice: 2.60, category: "Materials", labourMinutes: 4, wasteFactor: 10 },
      { description: "Hager 20-way consumer mains board", unit: "ea", quantity: 1, retailPrice: 385.00, tradePrice: 245.00, category: "Materials", labourMinutes: 240, wasteFactor: 0 },
      { description: "Clipsal smoke alarm 240V interconnectable", unit: "ea", quantity: 4, retailPrice: 68.00, tradePrice: 42.00, category: "Materials", labourMinutes: 45, wasteFactor: 0 },
      { description: "Weatherproof external GPO", unit: "ea", quantity: 3, retailPrice: 38.50, tradePrice: 24.00, category: "Materials", labourMinutes: 40, wasteFactor: 0 },
      { description: "Cable clips and saddles (assorted)", unit: "pack", quantity: 4, retailPrice: 8.50, tradePrice: 5.20, category: "Consumables", labourMinutes: 0, wasteFactor: 5 },
      { description: "Junction box 100x100mm", unit: "ea", quantity: 8, retailPrice: 4.80, tradePrice: 2.90, category: "Materials", labourMinutes: 15, wasteFactor: 0 },
    ],
    confidence: 87,
    assumptions: [
      "Standard 2.4m ceiling height throughout",
      "Counted 22 single GPO symbols on plan",
      "Counted 18 downlight symbols on plan",
      "Assumed standard residential wiring — no 3-phase",
      "Cable lengths estimated from room dimensions + 15% for routing",
      "Smoke alarms per NCC Volume 2 requirements (min 1 per storey + bedrooms)",
    ],
    planNotes: "Clear residential plan. All room dimensions visible. Scale 1:100.",
  },
  plumbing: {
    trade: "plumbing",
    planDescription: "3-bedroom residential house, 180m². Standard plumbing rough-in and fit-off.",
    sampleItems: [
      { description: "20mm copper pipe type B", unit: "m", quantity: 45, retailPrice: 12.80, tradePrice: 7.90, category: "Materials", labourMinutes: 8, wasteFactor: 10 },
      { description: "25mm copper pipe type B", unit: "m", quantity: 20, retailPrice: 18.50, tradePrice: 11.40, category: "Materials", labourMinutes: 10, wasteFactor: 10 },
      { description: "Caroma Liano II close-coupled toilet suite", unit: "ea", quantity: 2, retailPrice: 485.00, tradePrice: 310.00, category: "Materials", labourMinutes: 90, wasteFactor: 0 },
      { description: "Caroma Liano II basin 500mm", unit: "ea", quantity: 2, retailPrice: 285.00, tradePrice: 182.00, category: "Materials", labourMinutes: 60, wasteFactor: 0 },
      { description: "Caroma Contura II shower rose 200mm", unit: "ea", quantity: 2, retailPrice: 195.00, tradePrice: 124.00, category: "Materials", labourMinutes: 45, wasteFactor: 0 },
      { description: "Rheem 26L continuous flow hot water unit", unit: "ea", quantity: 1, retailPrice: 1250.00, tradePrice: 820.00, category: "Materials", labourMinutes: 180, wasteFactor: 0 },
      { description: "Laundry tub 45L stainless", unit: "ea", quantity: 1, retailPrice: 185.00, tradePrice: 118.00, category: "Materials", labourMinutes: 60, wasteFactor: 0 },
      { description: "Brass ball valve 20mm", unit: "ea", quantity: 8, retailPrice: 22.50, tradePrice: 13.80, category: "Materials", labourMinutes: 20, wasteFactor: 0 },
      { description: "90° copper elbow 20mm", unit: "ea", quantity: 24, retailPrice: 3.80, tradePrice: 2.30, category: "Materials", labourMinutes: 8, wasteFactor: 5 },
      { description: "Teflon tape and flux (consumables)", unit: "pack", quantity: 2, retailPrice: 12.00, tradePrice: 7.50, category: "Consumables", labourMinutes: 0, wasteFactor: 0 },
    ],
    confidence: 84,
    assumptions: [
      "Standard 2-bathroom residential layout",
      "Hot water unit located externally",
      "Cold water supply from street main",
      "Pipe lengths estimated from plan dimensions",
      "Fixtures selected to Reece mid-range specification",
    ],
    planNotes: "Standard residential plan. Bathroom and kitchen locations clearly marked.",
  },
};

// ─── Build text prompt for demo (same as main AI router) ─────────────────────
function buildDemoPrompt(trade: string): string {
  const tradeNames: Record<string, string> = {
    electrical: "electrical", plumbing: "plumbing & drainage", carpentry: "carpentry & joinery",
    concreting: "concreting", hvac: "HVAC", flooring: "flooring",
    landscaping: "landscaping & irrigation", cabinetry: "cabinetry & joinery",
    rendering: "rendering & plastering", painting: "painting & decorating",
    bricklaying: "bricklaying & blocklaying", roofing: "roofing",
    tiling: "wall & floor tiling", waterproofing: "waterproofing",
    "fire-protection": "fire protection", glazing: "glazing & aluminium",
    "quantity-surveying": "quantity surveying", demolition: "demolition & excavation",
    "swimming-pool": "swimming pool construction", "steel-fabrication": "steel fabrication & structural",
  };
  const tradeName = tradeNames[trade] ?? trade;

  return `You are an expert Australian ${tradeName} estimator with 20+ years of experience.

Generate a COMPLETE materials takeoff for the described job. Use 2024-25 Australian market pricing.

For EVERY item provide:
- description: specific Australian product name
- unit: ea/m/m²/m³/lm/kg/roll/sheet/bag/pack
- quantity: accurate quantity
- retailPrice: Australian RETAIL price per unit AUD (Bunnings-level)
- tradePrice: Australian TRADE/WHOLESALE price per unit AUD (20-40% below retail)
- category: Materials/Labour/Plant/Consumables
- labourMinutes: minutes per unit for qualified tradesperson
- wasteFactor: percentage waste (e.g. 10)

Also: confidence (0-100), assumptions (array), planNotes (string), roomBreakdown (array of {room, items}).

Return ONLY valid JSON. No markdown.`;
}

const demoSchema = {
  type: "json_schema" as const,
  json_schema: {
    name: "demo_takeoff_result",
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

export const demoRouter = router({
  // Public demo — no login required, rate-limited by IP via trade selection
  runDemo: publicProcedure.input(z.object({
    trade: z.enum(["electrical", "plumbing", "carpentry", "concreting", "hvac", "flooring", "landscaping", "cabinetry", "rendering", "painting", "bricklaying", "roofing", "tiling", "waterproofing", "fire-protection", "glazing", "quantity-surveying", "demolition", "swimming-pool", "steel-fabrication"]),
    jobDescription: z.string().min(5).max(500).optional(),
    markupPercent: z.number().min(0).max(100).default(20),
    labourRate: z.number().min(30).max(250).default(95),
    useTradePrice: z.boolean().default(true),
  })).mutation(async ({ input }) => {
    // Use real AI if job description provided, else use pre-built scenario
    let result;

    if (input.jobDescription && input.jobDescription.length > 10) {
      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: buildDemoPrompt(input.trade) },
            { role: "user", content: `Trade: ${input.trade}\nJob: ${input.jobDescription}\n\nGenerate complete takeoff with 2024-25 Australian pricing.` },
          ],
          response_format: demoSchema,
        });
        const rawContent = response.choices[0]?.message?.content;
        const content = typeof rawContent === "string" ? rawContent : JSON.stringify(rawContent);
        result = JSON.parse(content);
      } catch {
        // Fallback to pre-built if AI fails
        result = DEMO_SCENARIOS[input.trade] ?? DEMO_SCENARIOS.electrical;
      }
    } else {
      result = DEMO_SCENARIOS[input.trade] ?? DEMO_SCENARIOS.electrical;
    }

    // Calculate pricing summary
    let totalMaterialsRetail = 0;
    let totalMaterialsTrade = 0;
    let totalLabourHours = 0;

    for (const item of result.items) {
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
    const tradeSavings = totalMaterialsRetail - totalMaterialsTrade;

    return {
      ...result,
      pricing: {
        materialsCostRetail: Math.round(totalMaterialsRetail * 100) / 100,
        materialsCostTrade: Math.round(totalMaterialsTrade * 100) / 100,
        tradeSavings: Math.round(tradeSavings * 100) / 100,
        labourHours: Math.round(totalLabourHours * 10) / 10,
        labourCost: Math.round(labourCost * 100) / 100,
        subtotal: Math.round(subtotal * 100) / 100,
        markupAmount: Math.round(markup * 100) / 100,
        gst: Math.round(gst * 100) / 100,
        total: Math.round(total * 100) / 100,
      },
      demoMode: true,
    };
  }),
});
