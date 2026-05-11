/**
 * Run AI Takeoff analysis on Motyl Kitchen plans
 * Uses the same LLM integration as the Kindai app
 */
import 'dotenv/config';

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL;
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY;
const PLAN_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663471157879/vWmVRlZUuZSCGgFL.pdf";

if (!FORGE_API_URL || !FORGE_API_KEY) {
  console.error("Missing FORGE API env vars");
  process.exit(1);
}

console.log("🔍 Running AI Takeoff on Motyl Kitchen Plans...\n");
console.log("Plan: APT 314, Kitchen Type-F, J01-F");
console.log("Client: Motyl Interiors — Apartments Lot 33 & 34, Park TCE Bowden");
console.log("Scope: Multi-apartment kitchen joinery package (Levels 03–10)\n");

const systemPrompt = `You are an expert Australian cabinet making and joinery estimator with 20+ years experience in commercial fitouts and multi-residential projects.

You are analysing architectural joinery drawings for a commercial kitchen joinery package.

Your job is to:
1. Identify every cabinet, panel, benchtop, and joinery item from the plans
2. Extract dimensions and quantities
3. Apply realistic Australian commercial joinery pricing (2024-25 rates)
4. Calculate materials, labour, and total cost
5. Flag any assumptions or items needing clarification

Trade: Cabinet Making / Commercial Joinery
Location: South Australia (Bowden, Adelaide)
Project: Multi-apartment residential (Levels 03-10, same kitchen type repeated)
Scale: 1:20 on both plan and elevation drawings

PRICING BENCHMARKS (Australian commercial rates):
- Cabinet carcass (18mm moisture-resistant MDF/ply): $180-$280/linear metre installed
- Benchtop (stone/laminate/engineered): $350-$900/linear metre
- Door/drawer fronts (polyurethane/laminate): $120-$220 per door
- Hardware (Blum soft-close hinges, drawer runners): $45-$85 per cabinet
- End panels/fillers: $80-$150 per panel
- Splashback (tiled/glass/laminate): $120-$280/m²
- Labour rate: $85-$110/hour commercial joinery installer
- Project management: 8-12% of materials
- Margin/markup: 20-30% for commercial work

Output as structured JSON with:
- projectSummary
- items (array of line items with description, qty, unit, unitPrice, total)
- materialsCost
- labourCost  
- subtotal
- gst (10%)
- total
- assumptions (array of strings)
- confidenceScore (0-100)
- notes`;

const userMessage = `Please analyse these kitchen joinery plans and provide a complete cost estimate.

The plans show:
- Kitchen Type-F for APT 314 (repeated across Levels 03-10 = 8 apartments)
- Plan view (1:20): 6 base cabinet carcasses (JF-06 series), benchtop depth 750mm BH
- Elevation view (1:20): Upper and lower cabinet runs, total width 2400mm
  - Upper cabinets: 760mm high, 1620mm + 1500mm + 1700mm + 100mm runs
  - Lower cabinets: 1850mm base run, 550mm + 950mm + 700mm sections
  - Splashback: 100-150mm (JF-02)
  - End panels (JF-04), fillers, shadow line (JF-03 16mm)
  - Benchtop (JF-01)
  - Overhead panels (JF-05 to all faces)
  - Return shadow line
  - Drawer/door hardware (GH22 handle, GH420 pull)

Please provide a detailed estimate for ONE apartment first, then multiply for the full 8-apartment scope.`;

try {
  const response = await fetch(`${FORGE_API_URL}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FORGE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: userMessage
            },
            {
              type: "file_url",
              file_url: {
                url: PLAN_URL,
                mime_type: "application/pdf"
              }
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "joinery_estimate",
          strict: true,
          schema: {
            type: "object",
            properties: {
              projectSummary: { type: "string" },
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    description: { type: "string" },
                    qty: { type: "number" },
                    unit: { type: "string" },
                    unitPrice: { type: "number" },
                    total: { type: "number" },
                    category: { type: "string" }
                  },
                  required: ["description", "qty", "unit", "unitPrice", "total", "category"],
                  additionalProperties: false
                }
              },
              singleApartmentCost: { type: "number" },
              numberOfApartments: { type: "number" },
              materialsCost: { type: "number" },
              labourCost: { type: "number" },
              projectManagement: { type: "number" },
              subtotal: { type: "number" },
              gst: { type: "number" },
              total: { type: "number" },
              assumptions: {
                type: "array",
                items: { type: "string" }
              },
              confidenceScore: { type: "number" },
              notes: { type: "string" }
            },
            required: [
              "projectSummary", "items", "singleApartmentCost", "numberOfApartments",
              "materialsCost", "labourCost", "projectManagement",
              "subtotal", "gst", "total", "assumptions", "confidenceScore", "notes"
            ],
            additionalProperties: false
          }
        }
      },
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("API Error:", response.status, err);
    process.exit(1);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    console.error("No content in response:", JSON.stringify(data));
    process.exit(1);
  }

  const estimate = JSON.parse(content);
  
  console.log("═══════════════════════════════════════════════════════");
  console.log("  MOTYL INTERIORS — AI TAKEOFF ESTIMATE");
  console.log("  Kitchen Type-F | APT 314 | Park TCE Bowden");
  console.log("═══════════════════════════════════════════════════════\n");
  
  console.log(`📋 ${estimate.projectSummary}\n`);
  console.log(`🎯 Confidence Score: ${estimate.confidenceScore}%\n`);
  
  console.log("LINE ITEMS:");
  console.log("─────────────────────────────────────────────────────");
  
  let currentCategory = "";
  for (const item of estimate.items) {
    if (item.category !== currentCategory) {
      currentCategory = item.category;
      console.log(`\n  [${currentCategory.toUpperCase()}]`);
    }
    console.log(`  ${item.description}`);
    console.log(`    ${item.qty} ${item.unit} × $${item.unitPrice.toFixed(2)} = $${item.total.toFixed(2)}`);
  }
  
  console.log("\n─────────────────────────────────────────────────────");
  console.log(`\nSINGLE APARTMENT COST:     $${estimate.singleApartmentCost.toFixed(2)}`);
  console.log(`NUMBER OF APARTMENTS:      ${estimate.numberOfApartments}`);
  console.log("\n─────────────────────────────────────────────────────");
  console.log(`FULL PROJECT BREAKDOWN:`);
  console.log(`  Materials:               $${estimate.materialsCost.toFixed(2)}`);
  console.log(`  Labour:                  $${estimate.labourCost.toFixed(2)}`);
  console.log(`  Project Management:      $${estimate.projectManagement.toFixed(2)}`);
  console.log(`  Subtotal (ex GST):       $${estimate.subtotal.toFixed(2)}`);
  console.log(`  GST (10%):               $${estimate.gst.toFixed(2)}`);
  console.log(`  ─────────────────────────────────────────────────`);
  console.log(`  TOTAL (inc GST):         $${estimate.total.toFixed(2)}`);
  
  console.log("\n⚠️  ASSUMPTIONS:");
  for (const a of estimate.assumptions) {
    console.log(`  • ${a}`);
  }
  
  console.log(`\n📝 NOTES: ${estimate.notes}`);
  console.log("\n═══════════════════════════════════════════════════════\n");

} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
