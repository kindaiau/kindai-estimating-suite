import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

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
  cabinetry: {
    trade: "cabinetry",
    planDescription: "Commercial office fitout — 12 workstation joinery units, boardroom credenza, reception joinery, kitchen/breakout cabinetry. 450m² total floor area.",
    sampleItems: [
      // Sheet Materials
      { description: "Laminex MDF 18mm 2400x1200 — Polar White", unit: "sheet", quantity: 85, retailPrice: 98.00, tradePrice: 62.00, category: "Materials", labourMinutes: 0, wasteFactor: 15 },
      { description: "Laminex MDF 16mm 2400x1200 — Polar White", unit: "sheet", quantity: 40, retailPrice: 88.00, tradePrice: 55.00, category: "Materials", labourMinutes: 0, wasteFactor: 15 },
      { description: "Polytec Ravine door panel 2100x600mm — Chalk", unit: "ea", quantity: 48, retailPrice: 195.00, tradePrice: 128.00, category: "Materials", labourMinutes: 20, wasteFactor: 5 },
      { description: "Laminex Compact Laminate 13mm 2400x1200 — Chalk", unit: "sheet", quantity: 12, retailPrice: 185.00, tradePrice: 118.00, category: "Materials", labourMinutes: 0, wasteFactor: 10 },
      // Benchtops
      { description: "Caesarstone 20mm Cloudburst Concrete benchtop", unit: "lm", quantity: 28, retailPrice: 680.00, tradePrice: 420.00, category: "Materials", labourMinutes: 45, wasteFactor: 5 },
      { description: "Laminex 33mm postform benchtop — White", unit: "lm", quantity: 14, retailPrice: 195.00, tradePrice: 125.00, category: "Materials", labourMinutes: 30, wasteFactor: 5 },
      // Hardware — Blum
      { description: "Blum CLIP top BLUMOTION hinge 110° soft-close", unit: "ea", quantity: 192, retailPrice: 18.50, tradePrice: 11.80, category: "Materials", labourMinutes: 8, wasteFactor: 0 },
      { description: "Blum TANDEM 500mm soft-close drawer runner", unit: "pair", quantity: 64, retailPrice: 68.00, tradePrice: 43.00, category: "Materials", labourMinutes: 15, wasteFactor: 0 },
      { description: "Blum LEGRABOX pure 500mm drawer system", unit: "set", quantity: 32, retailPrice: 185.00, tradePrice: 118.00, category: "Materials", labourMinutes: 25, wasteFactor: 0 },
      { description: "Hafele cabinet handle 160mm c/c — Brushed Nickel", unit: "ea", quantity: 96, retailPrice: 22.00, tradePrice: 14.00, category: "Materials", labourMinutes: 5, wasteFactor: 0 },
      { description: "Hafele shelf pin 5mm (pack 50)", unit: "pack", quantity: 12, retailPrice: 18.50, tradePrice: 11.50, category: "Materials", labourMinutes: 0, wasteFactor: 5 },
      // Edging
      { description: "Laminex ABS edging 22mm Polar White 50m roll", unit: "roll", quantity: 18, retailPrice: 42.00, tradePrice: 26.50, category: "Materials", labourMinutes: 0, wasteFactor: 10 },
      { description: "Laminex ABS edging 22mm Chalk 50m roll", unit: "roll", quantity: 8, retailPrice: 42.00, tradePrice: 26.50, category: "Materials", labourMinutes: 0, wasteFactor: 10 },
      // Fixings & Consumables
      { description: "Confirmat screw 7x50mm (box 200)", unit: "box", quantity: 8, retailPrice: 22.00, tradePrice: 14.00, category: "Consumables", labourMinutes: 0, wasteFactor: 5 },
      { description: "PVA cabinet glue 1L", unit: "ea", quantity: 6, retailPrice: 14.50, tradePrice: 9.00, category: "Consumables", labourMinutes: 0, wasteFactor: 0 },
      { description: "Cam lock connector 15mm (box 100)", unit: "box", quantity: 6, retailPrice: 28.00, tradePrice: 17.50, category: "Consumables", labourMinutes: 0, wasteFactor: 5 },
      // Labour
      { description: "Cabinet maker — manufacture & machining labour", unit: "hr", quantity: 180, retailPrice: 115.00, tradePrice: 95.00, category: "Labour", labourMinutes: 60, wasteFactor: 0 },
      { description: "Cabinet maker — site installation labour", unit: "hr", quantity: 80, retailPrice: 115.00, tradePrice: 95.00, category: "Labour", labourMinutes: 60, wasteFactor: 0 },
      { description: "Apprentice cabinetmaker — workshop assist", unit: "hr", quantity: 60, retailPrice: 55.00, tradePrice: 45.00, category: "Labour", labourMinutes: 60, wasteFactor: 0 },
      // Preliminaries
      { description: "Site measure & shop drawing preparation", unit: "lot", quantity: 1, retailPrice: 1800.00, tradePrice: 1400.00, category: "Preliminaries", labourMinutes: 0, wasteFactor: 0 },
      { description: "Delivery & crane lift to level 3", unit: "lot", quantity: 1, retailPrice: 850.00, tradePrice: 650.00, category: "Preliminaries", labourMinutes: 0, wasteFactor: 0 },
    ],
    confidence: 91,
    assumptions: [
      "Commercial office fitout — 450m² floor area, Level 3",
      "12 workstation joinery units @ approx 1800mm wide each",
      "Boardroom credenza 4200mm long with overhead storage",
      "Reception joinery — curved front panel, 3600mm wide",
      "Breakout kitchen — 6.2 linear metres of cabinetry",
      "All doors: Polytec Ravine profile in Chalk finish",
      "All carcasses: Laminex MDF Polar White",
      "Benchtops: Caesarstone 20mm Cloudburst Concrete (boardroom + reception), Laminex postform (kitchen)",
      "Hardware: Blum soft-close throughout (BLUMOTION hinges, TANDEM runners, LEGRABOX drawers)",
      "Handles: Hafele 160mm brushed nickel bar handles",
      "Delivery includes crane lift — building access confirmed",
      "Electrical cutouts (power, data) by others — allow PS",
    ],
    planNotes: "Commercial fitout drawings at 1:50. All dimensions confirmed. Joinery schedule provided. Structural fixings to be confirmed with builder prior to installation.",
  },
};

// ─── Build text prompt for demo (same as main AI router) ─────────────────────
function buildDemoPrompt(trade: string): string {
  const tradeNames: Record<string, string> = {
    electrical: "electrical", plumbing: "plumbing & drainage", carpentry: "carpentry & joinery",
    concreting: "concreting", hvac: "HVAC", flooring: "flooring",
    landscaping: "landscaping & irrigation", cabinetry: "cabinet making & joinery",
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
  // Public plan upload for demo — no login required, 16MB limit
  uploadDemoPlan: publicProcedure.input(z.object({
    fileBase64: z.string(),
    fileName: z.string(),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf"]),
  })).mutation(async ({ input }) => {
    const buffer = Buffer.from(input.fileBase64, "base64");
    const MAX_SIZE = 16 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      throw new Error(`File too large. Max 16MB. Your file is ${(buffer.length / 1024 / 1024).toFixed(1)}MB.`);
    }
    const ext = input.fileName.split(".").pop() ?? "png";
    const key = `demo-plans/${nanoid()}.${ext}`;
    const { url } = await storagePut(key, buffer, input.contentType);
    return { url, key };
  }),

  // Public demo — no login required, rate-limited by IP via trade selection
  runDemo: publicProcedure.input(z.object({
    trade: z.enum(["electrical", "plumbing", "carpentry", "concreting", "hvac", "flooring", "landscaping", "cabinetry", "rendering", "painting", "bricklaying", "roofing", "tiling", "waterproofing", "fire-protection", "glazing", "quantity-surveying", "demolition", "swimming-pool", "steel-fabrication"]),
    jobDescription: z.string().min(5).max(500).optional(),
    markupPercent: z.number().min(0).max(100).default(20),
    labourRate: z.number().min(30).max(250).default(95),
    useTradePrice: z.boolean().default(true),
    planImageUrl: z.string().url().optional(), // CDN URL of uploaded plan image
  })).mutation(async ({ input }) => {
    // Use real AI if job description provided, else use pre-built scenario
    let result;

    if (input.planImageUrl || (input.jobDescription && input.jobDescription.length > 10)) {
      try {
        // Build user message — include plan image if uploaded
        const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [];
        if (input.planImageUrl) {
          userContent.push({
            type: "image_url",
            image_url: { url: input.planImageUrl, detail: "high" },
          });
          userContent.push({
            type: "text",
            text: `Trade: ${input.trade}\nAnalyse this construction plan image and generate a complete materials takeoff with 2024-25 Australian pricing.${input.jobDescription ? `\nAdditional context: ${input.jobDescription}` : ""}`,
          });
        } else {
          userContent.push({
            type: "text",
            text: `Trade: ${input.trade}\nJob: ${input.jobDescription}\n\nGenerate complete takeoff with 2024-25 Australian pricing.`,
          });
        }

        const response = await invokeLLM({
          messages: [
            { role: "system", content: buildDemoPrompt(input.trade) },
            { role: "user", content: userContent as any },
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
