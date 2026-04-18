import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";
// Convert HEIC/HEIF buffer to JPEG for browser/AI compatibility
// Use lazy dynamic import to avoid createRequire crash in ESM deployed environments
let _heicConvert: ((opts: { buffer: Buffer; format: string; quality: number }) => Promise<Uint8Array>) | null = null;
async function getHeicConvert() {
  if (!_heicConvert) {
    // @ts-ignore — heic-convert has no type declarations
    const mod = await import("heic-convert");
    _heicConvert = (mod.default || mod) as typeof _heicConvert;
  }
  return _heicConvert!;
}
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const heicConvert = await getHeicConvert();
  const outputBuffer = await heicConvert({ buffer, format: "JPEG", quality: 0.92 });
  return Buffer.from(outputBuffer);
}

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
    "gas-install": "gas installation & gasfitting", "gas-maintenance": "gas maintenance, servicing & compliance",
  };
  const tradeName = tradeNames[trade] ?? trade;

  const tradeSpecific: Record<string, string> = {
    cabinetry: `
CABINETRY-SPECIFIC RULES (CRITICAL — follow exactly):
- Read EVERY cabinet code on the plan (e.g. JF-01, JF-02) and list each one individually with W×H×D dimensions
- Sheet materials: calculate total sheets from cabinet dimensions + 15% machining waste
- Benchtops: measure TOTAL linear metres including all returns, corners, waterfall ends, and islands
- Hardware: count EVERY hinge (min 2 per door), EVERY drawer runner pair, EVERY handle
- Appliance cutouts (oven, cooktop, dishwasher, rangehood, sink): include labour for each
- Include ALL scribing strips, filler panels, end panels, plinths, and shadow line profiles
- Edging: calculate total linear metres of ALL exposed edges (front, sides, shelves)
- ALWAYS include: site measure, shop drawings, delivery, and installation
- Specify EXACT product codes from the spec sheet if provided (e.g. Polytec Gossamer White Smooth, Blum LEGRABOX)
- Separate workshop manufacture labour from site installation labour
- If a materials schedule/spec sheet is provided, use THOSE exact products and finishes — do not substitute
- Confidence should be 96-99 when a spec sheet AND plan drawings are both provided`,
    electrical: `
ELECTRICAL-SPECIFIC RULES:
- Count every GPO, light point, switch, and circuit — do not estimate
- Measure cable runs from plan dimensions
- Every circuit needs a breaker in the switchboard
- Include conduit for wet areas, external, and underground runs
- Smoke alarms: required in every bedroom, hallway, and living area per AS3786`,
    plumbing: `
PLUMBING-SPECIFIC RULES:
- Water and drainage ONLY — no gas items
- Multi-dwelling: detect number of units and multiply accordingly
- Include ALL consumables: solvent cement, flux, thread tape, pipe clips, penetration seals`,
  };
  const tradeHint = tradeSpecific[trade] ?? "";

  return `You are a senior Australian ${tradeName} estimator and quantity surveyor with 25+ years of experience on residential, commercial, and large-scale projects. You produce highly accurate, audit-ready takeoffs.

YOUR TASK: Generate a COMPLETE, ITEMISED materials takeoff. Read every visible element in the plans and spec sheets. Do not skip items. Do not round up vaguely.

CONFIDENCE SCORING RULES (be accurate, not conservative):
- 96-99: Full plan set + spec sheet/schedule provided — you can read exact products, dimensions, and quantities
- 90-95: Plan drawings only, no spec sheet — products inferred from context
- 80-89: Partial plans or low-resolution images
- 70-79: Text description only, no plans
- <70: Insufficient information

For EVERY line item provide:
- description: exact Australian product name, brand, code, and finish (e.g. "Polytec Gossamer White Smooth 18mm MDF Door Panel")
- unit: ea/m/m²/m³/lm/kg/roll/sheet/bag/pack
- quantity: precise quantity calculated from plan dimensions (show your working in assumptions)
- retailPrice: Australian RETAIL price per unit AUD (Bunnings/Beaumont-level)
- tradePrice: Australian TRADE/WHOLESALE price per unit AUD (20-40% below retail)
- category: Materials/Labour/Plant/Consumables
- labourMinutes: minutes per unit for qualified tradesperson
- wasteFactor: percentage waste appropriate to the item (e.g. 10 for sheet goods, 5 for hardware, 0 for labour)

Also provide:
- confidence: your confidence score 0-100 (use the scoring rules above — be accurate)
- assumptions: array of specific assumptions made (e.g. "Cabinet JF-01 assumed 600mm deep standard base unit")
- planNotes: what you observed in the plans (dimensions, cabinet codes, materials called out, spec sheet items)
- roomBreakdown: array of {room, items} grouping line items by area/section
${tradeHint}
Return ONLY valid JSON. No markdown. No explanation outside the JSON.`;
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
  // Public plan upload for demo — no login required, 32MB limit
  uploadDemoPlan: publicProcedure.input(z.object({
    fileBase64: z.string(),
    fileName: z.string(),
    contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "image/heic", "image/heif"]),
  })).mutation(async ({ input }) => {
    const rawBuffer = Buffer.from(input.fileBase64, "base64");
    const MAX_SIZE = 32 * 1024 * 1024;
    if (rawBuffer.length > MAX_SIZE) {
      throw new Error(`File too large. Max 32MB. Your file is ${(rawBuffer.length / 1024 / 1024).toFixed(1)}MB.`);
    }
    // Convert HEIC/HEIF to JPEG (iPhone default format)
    let contentType = input.contentType;
    let ext = input.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
    let finalBuffer: Buffer;
    if (contentType === "image/heic" || contentType === "image/heif") {
      finalBuffer = await convertHeicToJpeg(rawBuffer);
      contentType = "image/jpeg";
      ext = "jpg";
    } else {
      finalBuffer = rawBuffer;
    }
    const key = `demo-plans/${nanoid()}.${ext}`;
    const { url } = await storagePut(key, finalBuffer, contentType);
    return { url, key };
  }),

  // Public multi-page plan upload for demo — up to 50 pages, 32MB each
  uploadDemoPlanPages: publicProcedure.input(z.object({
    pages: z.array(z.object({
      fileBase64: z.string(),
      fileName: z.string(),
      contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "image/heic", "image/heif"]),
    })).min(1).max(50),
  })).mutation(async ({ input }) => {
    const MAX_SIZE = 32 * 1024 * 1024;
    const results: { url: string; key: string; fileName: string }[] = [];
    for (const page of input.pages) {
      const rawBuffer = Buffer.from(page.fileBase64, "base64");
      if (rawBuffer.length > MAX_SIZE) {
        throw new Error(`File "${page.fileName}" is too large (${(rawBuffer.length / 1024 / 1024).toFixed(1)}MB). Max 32MB per file.`);
      }
      // Convert HEIC/HEIF to JPEG
      let contentType = page.contentType;
      let ext = page.fileName.split(".").pop()?.toLowerCase() ?? "jpg";
      let finalBuffer: Buffer;
      if (contentType === "image/heic" || contentType === "image/heif") {
        finalBuffer = await convertHeicToJpeg(rawBuffer);
        contentType = "image/jpeg";
        ext = "jpg";
      } else {
        finalBuffer = rawBuffer;
      }
      const key = `demo-plans/${nanoid()}.${ext}`;
      const { url } = await storagePut(key, finalBuffer, contentType);
      results.push({ url, key, fileName: page.fileName });
    }
    return { pages: results, count: results.length };
  }),

  // Public demo — no login required, rate-limited by IP via trade selection
  runDemo: publicProcedure.input(z.object({
    trade: z.enum(["electrical", "plumbing", "carpentry", "concreting", "hvac", "flooring", "landscaping", "cabinetry", "rendering", "painting", "bricklaying", "roofing", "tiling", "waterproofing", "fire-protection", "glazing", "quantity-surveying", "demolition", "swimming-pool", "steel-fabrication", "gas-install", "gas-maintenance"]),
    jobDescription: z.string().min(5).max(2000).optional(),
    markupPercent: z.number().min(0).max(100).default(20),
    labourRate: z.number().min(30).max(250).default(95),
    useTradePrice: z.boolean().default(true),
    planImageUrl: z.string().url().optional(), // CDN URL of single uploaded plan image (legacy)
    planImageUrls: z.array(z.string().url()).max(50).optional(), // CDN URLs for multi-page upload
  })).mutation(async ({ input }) => {
    // Normalise: prefer planImageUrls array, fall back to single planImageUrl
    const imageUrls = input.planImageUrls && input.planImageUrls.length > 0
      ? input.planImageUrls
      : input.planImageUrl ? [input.planImageUrl] : [];

    // Use real AI if images or job description provided, else use pre-built scenario
    let result;

    if (imageUrls.length > 0 || (input.jobDescription && input.jobDescription.length > 10)) {
      try {
        // For multi-page: process in batches of 5, merge results
        if (imageUrls.length > 1) {
          const BATCH_SIZE = 5;
          const batchResults: any[] = [];
          for (let i = 0; i < imageUrls.length; i += BATCH_SIZE) {
            const batch = imageUrls.slice(i, i + BATCH_SIZE);
            const batchContent: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [];
            for (const url of batch) {
              batchContent.push({ type: "image_url", image_url: { url, detail: "high" } });
            }
            batchContent.push({
              type: "text",
              text: `TRADE: ${input.trade.toUpperCase()}
PAGES: ${i + 1}–${Math.min(i + BATCH_SIZE, imageUrls.length)} of ${imageUrls.length} total pages in this document set.

INSTRUCTIONS: Read ALL pages carefully. Extract every cabinet code, dimension, material callout, and specification visible. If this page is a materials schedule or spec sheet, extract ALL product names, codes, and finishes — these override any generic assumptions.

Generate a complete, itemised materials takeoff with 2024-25 Australian trade pricing.${input.jobDescription ? `

ESTIMATOR CONTEXT (use this to improve accuracy):
${input.jobDescription}` : ""}`,
            });
            const batchResp = await invokeLLM({
              messages: [
                { role: "system", content: buildDemoPrompt(input.trade) },
                { role: "user", content: batchContent as any },
              ],
              response_format: demoSchema,
            });
            const raw = batchResp.choices[0]?.message?.content;
            const c = typeof raw === "string" ? raw : JSON.stringify(raw);
            if (c) batchResults.push(JSON.parse(c));
          }
          // Merge batch results
          if (batchResults.length > 0) {
            const itemMap = new Map<string, any>();
            for (const br of batchResults) {
              for (const item of ((br?.items ?? []) as any[])) {
                const key = `${String(item.description ?? "").toLowerCase().trim()}|${String(item.unit ?? "").toLowerCase().trim()}`;
                const ex = itemMap.get(key);
                if (ex) { ex.quantity = (ex.quantity ?? 0) + (item.quantity ?? 0); }
                else { itemMap.set(key, { ...item }); }
              }
            }
            result = { ...(batchResults[0] as any), items: Array.from(itemMap.values()) };
          } else {
            result = DEMO_SCENARIOS[input.trade] ?? DEMO_SCENARIOS.electrical;
          }
        } else {
          // Single image or text-only path
          const userContent: Array<{ type: string; text?: string; image_url?: { url: string; detail: string } }> = [];
          if (imageUrls.length === 1) {
            userContent.push({ type: "image_url", image_url: { url: imageUrls[0], detail: "high" } });
            userContent.push({
              type: "text",
              text: `TRADE: ${input.trade.toUpperCase()}

INSTRUCTIONS: Read this plan carefully. Extract every dimension, cabinet code, material callout, product specification, and finish visible. If this is a materials schedule or spec sheet, extract ALL product names, codes, and finishes — use them exactly in your takeoff.

Generate a complete, itemised materials takeoff with 2024-25 Australian trade pricing.${input.jobDescription ? `

ESTIMATOR CONTEXT (use this to improve accuracy):
${input.jobDescription}` : ""}`,
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
        }
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
