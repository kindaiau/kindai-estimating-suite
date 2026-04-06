import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { estimates } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { storagePut } from "../storage";
import { nanoid } from "nanoid";

// ─── Australian Supplier Database ────────────────────────────────────────────
export const AUSTRALIAN_SUPPLIERS: Record<string, Array<{
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
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["hvac"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Limited HVAC range. Split systems only." },
  ],
  flooring: [
    { name: "Flooring Xtra", type: "trade", website: "https://www.flooringxtra.com.au", trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "National flooring specialist with trade pricing." },
    { name: "Carpet Court", type: "retail", website: "https://www.carpetcourt.com.au", trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail flooring with some trade accounts." },
    { name: "Beaumont Tiles", type: "trade", website: "https://www.beaumont-tiles.com.au", trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Tile specialist with trade pricing." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["flooring"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail flooring range." },
  ],
  landscaping: [
    { name: "Mitre 10 Trade", type: "trade", website: "https://www.mitre10.com.au", trades: ["landscaping"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "National supplier with landscaping range." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["landscaping"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail landscaping supplies." },
  ],
  cabinetry: [
    { name: "Laminex", type: "trade", website: "https://www.laminex.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Australia's leading laminate and panel supplier. Trade pricing available." },
    { name: "Polytec", type: "trade", website: "https://www.polytec.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Premium decorative surfaces and panels." },
    { name: "Hafele", type: "trade", website: "https://www.hafele.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA"], notes: "Cabinet hardware and fittings specialist." },
    { name: "Bunnings Warehouse", type: "retail", website: "https://www.bunnings.com.au", trades: ["cabinetry", "cabinet-making"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"], notes: "Retail hardware and basic panel products." },
  ],
  rendering: [
    { name: "CSR Gyprock", type: "trade", website: "https://www.csr.com.au", trades: ["rendering"], regions: ["NSW", "VIC", "QLD", "SA", "WA", "TAS"], notes: "Australia's leading plasterboard and render supplier." },
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

// ─── Industry Benchmark Data (2024-25 Australian market) ─────────────────────
export const INDUSTRY_BENCHMARKS: Record<string, {
  labourRateRange: { min: number; max: number; median: number };
  marginRange: { min: number; max: number; median: number };
  costPerM2: { residential: { min: number; max: number }; commercial?: { min: number; max: number } };
  winRateBenchmark: number; // % of quotes that typically convert
  avgQuoteValue: { small: number; medium: number; large: number };
  sections: string[];
}> = {
  electrical: {
    labourRateRange: { min: 85, max: 130, median: 105 },
    marginRange: { min: 15, max: 35, median: 22 },
    costPerM2: { residential: { min: 65, max: 120 }, commercial: { min: 95, max: 180 } },
    winRateBenchmark: 62,
    avgQuoteValue: { small: 2800, medium: 12000, large: 85000 },
    sections: ["Preliminaries", "Switchboard & Mains", "Power (GPOs & Circuits)", "Lighting", "Data & Communications", "Safety Systems", "External & Outdoor", "Commissioning & Testing"],
  },
  plumbing: {
    labourRateRange: { min: 95, max: 130, median: 110 },
    marginRange: { min: 18, max: 38, median: 25 },
    costPerM2: { residential: { min: 55, max: 110 }, commercial: { min: 85, max: 160 } },
    winRateBenchmark: 58,
    avgQuoteValue: { small: 3200, medium: 18000, large: 120000 },
    sections: ["Preliminaries", "Sewer Drainage", "Stormwater Drainage", "Trenching & Excavation", "Cold Water Rough-In", "Hot Water System", "Internal Fixtures & Fittings", "Appliance Connections", "Commissioning & Testing"],
  },
  carpentry: {
    labourRateRange: { min: 75, max: 115, median: 92 },
    marginRange: { min: 15, max: 30, median: 20 },
    costPerM2: { residential: { min: 180, max: 380 }, commercial: { min: 220, max: 480 } },
    winRateBenchmark: 55,
    avgQuoteValue: { small: 4500, medium: 28000, large: 180000 },
    sections: ["Preliminaries", "Structural Framing", "Roof Framing & Trusses", "External Cladding", "Internal Linings", "Doors & Frames", "Windows & Glazing", "Stairs & Balustrades", "Joinery & Trim", "Commissioning"],
  },
  concreting: {
    labourRateRange: { min: 70, max: 110, median: 88 },
    marginRange: { min: 15, max: 28, median: 20 },
    costPerM2: { residential: { min: 85, max: 180 }, commercial: { min: 120, max: 280 } },
    winRateBenchmark: 60,
    avgQuoteValue: { small: 3800, medium: 22000, large: 150000 },
    sections: ["Preliminaries", "Earthworks & Site Preparation", "Formwork", "Reinforcement (Reo & Mesh)", "Concrete Supply & Pour", "Finishing & Curing", "Waterproofing & Sealing", "Commissioning"],
  },
  hvac: {
    labourRateRange: { min: 95, max: 140, median: 115 },
    marginRange: { min: 20, max: 40, median: 28 },
    costPerM2: { residential: { min: 120, max: 280 }, commercial: { min: 180, max: 420 } },
    winRateBenchmark: 52,
    avgQuoteValue: { small: 4200, medium: 32000, large: 250000 },
    sections: ["Preliminaries", "Equipment Supply & Procurement", "Refrigerant Pipework", "Ductwork & Diffusers", "Electrical Connections", "Controls & BMS", "Commissioning & Testing"],
  },
  flooring: {
    labourRateRange: { min: 55, max: 90, median: 70 },
    marginRange: { min: 18, max: 35, median: 25 },
    costPerM2: { residential: { min: 65, max: 180 }, commercial: { min: 85, max: 220 } },
    winRateBenchmark: 65,
    avgQuoteValue: { small: 2200, medium: 12000, large: 65000 },
    sections: ["Preliminaries", "Subfloor Preparation", "Waterproofing (Wet Areas)", "Tiling", "Timber / Laminate / Hybrid", "Carpet", "Skirting & Trims", "Commissioning"],
  },
  landscaping: {
    labourRateRange: { min: 55, max: 90, median: 72 },
    marginRange: { min: 20, max: 40, median: 28 },
    costPerM2: { residential: { min: 120, max: 350 }, commercial: { min: 180, max: 480 } },
    winRateBenchmark: 58,
    avgQuoteValue: { small: 3500, medium: 18000, large: 95000 },
    sections: ["Preliminaries", "Demolition & Clearing", "Earthworks & Drainage", "Retaining Walls", "Paving & Paths", "Turf & Planting", "Irrigation", "Fencing", "Outdoor Lighting", "Commissioning"],
  },
  cabinetry: {
    labourRateRange: { min: 75, max: 110, median: 90 },
    marginRange: { min: 20, max: 40, median: 30 },
    costPerM2: { residential: { min: 800, max: 2200 } },
    winRateBenchmark: 60,
    avgQuoteValue: { small: 4500, medium: 22000, large: 85000 },
    sections: ["Preliminaries", "Kitchen Cabinets", "Bathroom Vanities", "Laundry Cabinets", "Wardrobes & Robes", "Benchtops", "Splashbacks", "Hardware & Accessories", "Installation Labour"],
  },
  rendering: {
    labourRateRange: { min: 60, max: 95, median: 78 },
    marginRange: { min: 18, max: 32, median: 24 },
    costPerM2: { residential: { min: 45, max: 120 }, commercial: { min: 65, max: 160 } },
    winRateBenchmark: 62,
    avgQuoteValue: { small: 2800, medium: 14000, large: 75000 },
    sections: ["Preliminaries", "Substrate Preparation", "Scratch Coat", "Base Coat", "Finish Coat", "Texture & Decorative Finish", "External Insulation (EPS)", "Commissioning"],
  },
  "cabinet-making": {
    labourRateRange: { min: 80, max: 120, median: 98 },
    marginRange: { min: 25, max: 45, median: 35 },
    costPerM2: { residential: { min: 900, max: 2800 } },
    winRateBenchmark: 55,
    avgQuoteValue: { small: 5500, medium: 28000, large: 120000 },
    sections: ["Preliminaries", "Sheet Material & Panels", "Doors & Drawer Fronts", "Hardware (Hinges, Runners, Handles)", "Benchtops & Surfaces", "Assembly Labour", "Installation Labour", "Commissioning"],
  },
};

// ─── Shared prompt structure for all trades ──────────────────────────────────
function buildTradePrompt(mode: "vision" | "text", trade: string): string {
  const inputDesc = mode === "vision"
    ? "Analyze this construction plan image (architectural drawings, trade-specific drawings, or site plans)"
    : "Based on the job description provided";

  const benchmark = INDUSTRY_BENCHMARKS[trade];
  const sections = benchmark?.sections ?? [];
  const labourRate = benchmark?.labourRateRange ?? { min: 75, max: 120, median: 95 };

  const tradeConfigs: Record<string, {
    title: string;
    specialist: string;
    pricingBenchmarks: string;
    criticalRules: string;
  }> = {
    electrical: {
      title: "electrical",
      specialist: "licensed Australian electrician and electrical estimator with 20+ years experience on residential and commercial projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- 2.5mm² twin & earth cable: $1.80-2.20/m trade
- 4mm² twin & earth cable: $2.80-3.50/m trade
- 6mm² twin & earth cable: $4.20-5.50/m trade
- Clipsal 10A single GPO: $8-12 trade
- Clipsal 10A double GPO: $14-18 trade
- Clipsal Saturn GPO (premium): $28-45 trade
- LED downlight (complete with driver): $22-38 trade
- 20A circuit breaker (MCB): $18-28 trade
- RCD/RCBO 20A: $35-55 trade
- 3-phase switchboard (12-way): $280-420 trade
- Smoke alarm (interconnectable): $45-65 trade
- Licensed electrician labour: $${labourRate.min}-${labourRate.max}/hr
- Apprentice labour: $38-55/hr`,
      criticalRules: `- Count every GPO, light point, switch, and circuit on the plan
- Include all cable runs — measure lengths from plan dimensions
- Every circuit needs a breaker in the switchboard
- Include conduit where required (wet areas, external, underground)
- Safety systems: smoke alarms required in every bedroom, hallway, and living area per AS3786
- Data points: include Cat6 cable, wall plates, and patch panel
- All labour as separate line items per section`,
    },
    plumbing: {
      title: "plumbing",
      specialist: "senior Australian licensed plumber and hydraulic estimator with 25+ years experience on residential and commercial developments, specialising in multi-dwelling projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- uPVC 100mm sewer pipe: $18-22/lm trade
- uPVC 150mm sewer pipe: $32-40/lm trade
- Copper 15mm pipe: $12-16/lm trade
- Copper 20mm pipe: $18-24/lm trade
- PEX 16mm: $4-6/lm trade
- Toilet suite (mid-range Caroma/Fowler): $280-420 trade
- Basin (mid-range): $120-220 trade
- Shower set (rail + head): $85-150 trade
- Rheem 250L electric hot water: $680-820 trade
- Rinnai 26L continuous flow: $920-1,100 trade
- Dux 270L heat pump: $1,400-1,700 trade
- Trenching (machine): $180-250/hr
- Licensed plumber labour: $${labourRate.min}-${labourRate.max}/hr
- Apprentice labour: $38-55/hr`,
      criticalRules: `- Multi-dwelling: detect number of units and multiply quantities accordingly
- Include ALL consumables: solvent cement, flux, solder, thread tape, pipe clips, brackets, penetration seals
- Include ALL labour as separate line items in the relevant section
- Provisional sums: if rock excavation or unusual site conditions are possible, add a PS item
- Exclusions to flag: gas work, electrical to hot water, council fees, hydraulic engineer fees`,
    },
    carpentry: {
      title: "carpentry and timber framing",
      specialist: "senior Australian builder and carpentry estimator with 25+ years experience on residential and commercial construction projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- 90x45 MGP10 framing timber: $4.50-6.00/lm trade
- 140x45 MGP10 framing timber: $7.00-9.50/lm trade
- 190x45 LVL beam: $18-26/lm trade
- 17mm structural plywood (2400x1200): $65-85/sheet trade
- Colorbond roofing (Trimdek): $18-26/lm trade
- Hardiflex 6mm sheet (2400x1200): $28-38/sheet trade
- Gyprock 10mm plasterboard (2400x1200): $18-24/sheet trade
- Solid core door (2040x820): $180-280 trade
- Aluminium window (standard): $280-450 trade
- Roof truss (per truss, standard pitch): $180-380 trade
- Carpenter labour: $${labourRate.min}-${labourRate.max}/hr
- Apprentice labour: $38-55/hr`,
      criticalRules: `- Calculate all areas from plan dimensions — don't estimate
- Framing: include top plates, bottom plates, studs at 450 or 600 centres
- Roof: include rafters, ridge, purlins, battens, roofing, gutters, fascia, soffit
- Include all fixings: nails, screws, joist hangers, hurricane ties, brackets
- Multi-dwelling: multiply by number of units for repeated elements`,
    },
    concreting: {
      title: "concreting",
      specialist: "senior Australian concreter and civil estimator with 25+ years experience on residential slabs, driveways, and commercial concrete structures",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- Ready-mix concrete 25MPa: $185-220/m³ delivered
- Ready-mix concrete 32MPa: $200-240/m³ delivered
- Ready-mix concrete 40MPa: $220-265/m³ delivered
- Concrete pump hire: $850-1,400/day
- N12 reinforcing bar: $1.20-1.60/kg trade
- SL82 mesh sheet (6x2.4m): $85-110/sheet trade
- 2400x1200 formply: $65-85/sheet trade
- 90x45 formwork timber: $4.50-6.00/lm trade
- Excavation (machine): $120-180/hr
- Concreter labour: $${labourRate.min}-${labourRate.max}/hr
- Labourer: $45-65/hr`,
      criticalRules: `- Calculate concrete volumes precisely: area × depth × 1.05 (5% waste)
- Reinforcement: calculate from reo schedule or assume N12 @ 200 centres each way
- Formwork: calculate perimeter × height for walls, area for slabs
- Include pump hire for any pour over 10m³ or difficult access
- Provisional sum for rock excavation if site conditions unknown`,
    },
    hvac: {
      title: "HVAC (heating, ventilation, and air conditioning)",
      specialist: "senior Australian HVAC engineer and estimator with 25+ years experience on residential and commercial air conditioning and ventilation projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- Daikin 2.5kW split system (supply only): $680-820 trade
- Daikin 5kW split system (supply only): $980-1,200 trade
- Daikin 7.1kW split system (supply only): $1,350-1,650 trade
- Mitsubishi ducted system 10kW: $3,200-4,500 trade
- Refrigerant copper pipe 1/4" (6.35mm): $8-12/lm trade
- Refrigerant copper pipe 3/8" (9.52mm): $12-18/lm trade
- Flexible duct 200mm: $8-14/lm trade
- Rigid ductwork (per m²): $45-80/m² trade
- Linear diffuser (600mm): $85-140 trade
- Round diffuser (200mm): $35-55 trade
- HVAC technician labour: $${labourRate.min}-${labourRate.max}/hr
- Apprentice labour: $38-55/hr`,
      criticalRules: `- Calculate cooling/heating loads from floor area (rule of thumb: 125W/m² residential, 160W/m² commercial)
- Refrigerant pipe: measure actual run length including vertical drops
- Ductwork: calculate from plan — include all branches, bends, and transitions
- Electrical: note that electrical connection is a separate trade (exclude or flag as PS)
- Include condensate drain lines and insulation`,
    },
    flooring: {
      title: "flooring",
      specialist: "senior Australian flooring contractor and estimator with 20+ years experience on residential and commercial flooring projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- Hybrid flooring (mid-range): $28-45/m² trade
- Engineered timber flooring: $65-120/m² trade
- Solid hardwood flooring: $85-160/m² trade
- Laminate flooring (AC4): $18-32/m² trade
- Carpet (mid-range residential): $28-55/m² trade
- Porcelain tile 600x600: $35-65/m² trade
- Travertine/natural stone: $65-150/m² trade
- Tile adhesive (20kg bag): $28-38 trade
- Tile grout (2kg): $12-18 trade
- Waterproofing membrane (wet areas): $18-28/m² trade
- Flooring installer labour: $${labourRate.min}-${labourRate.max}/hr`,
      criticalRules: `- Measure all floor areas from plan — add 10% waste for tiles, 7% for timber/laminate, 5% for carpet
- Wet areas (bathrooms, laundry): include waterproofing membrane and primer
- Include subfloor preparation: levelling compound, grinding, moisture barrier
- Skirting boards: measure perimeter of each room
- Transitions: include threshold strips at doorways and material changes`,
    },
    landscaping: {
      title: "landscaping",
      specialist: "senior Australian landscape contractor and estimator with 20+ years experience on residential and commercial landscaping projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- Turf (couch/kikuyu): $8-14/m² supply and lay trade
- Turf (Sir Walter/Buffalo): $12-18/m² supply and lay trade
- Garden soil/topsoil: $45-75/m³ delivered
- Mulch (pine bark): $55-85/m³ delivered
- Concrete paving (600x600): $28-45/m² trade
- Natural stone paving: $65-150/m² trade
- Retaining wall block (200x400): $8-14/block trade
- Timber sleeper (200x75x2400): $28-45 trade
- Irrigation drip line: $1.80-2.80/lm trade
- Colorbond fencing (per panel): $180-280 trade
- Landscaper labour: $${labourRate.min}-${labourRate.max}/hr
- Bobcat hire: $85-130/hr`,
      criticalRules: `- Calculate all areas from plan dimensions
- Earthworks: estimate volumes for cut and fill — include disposal if required
- Irrigation: include controller, solenoid valves, pressure regulator, backflow preventer
- Retaining walls: include drainage behind wall (ag pipe, gravel, geofabric)
- Plants: list species, pot size, and quantity from landscape plan`,
    },
    cabinetry: {
      title: "cabinetry and joinery",
      specialist: "senior Australian cabinet maker and joinery estimator with 20+ years experience on residential kitchen, bathroom, and commercial joinery projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- Flat-pack cabinet (600mm base): $85-140 trade
- Flat-pack cabinet (900mm base): $120-180 trade
- Custom cabinet (per linear metre): $350-650 trade
- 40mm Caesarstone benchtop: $380-580/lm trade
- 20mm laminate benchtop: $120-220/lm trade
- Blum soft-close hinge (pair): $8-14 trade
- Blum Tandembox drawer system: $85-140 trade
- Laminex MDF board (2400x1200x18mm): $55-75/sheet trade
- Polytec door (per door): $85-180 trade
- Cabinetmaker labour: $${labourRate.min}-${labourRate.max}/hr`,
      criticalRules: `- Count every cabinet from the plan — list each one with dimensions
- Benchtops: measure total linear metres including corners and returns
- Hardware: count every hinge, drawer runner, and handle
- Appliance cutouts: include labour for oven, cooktop, dishwasher, rangehood
- Include scribing, filler panels, and end panels`,
    },
    rendering: {
      title: "rendering and plastering",
      specialist: "senior Australian renderer and plasterer with 20+ years experience on residential and commercial rendering projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- Cement render (3-coat system): $45-75/m² trade labour + materials
- Acrylic render (2-coat): $35-55/m² trade labour + materials
- Rockcote render (20kg bag): $28-38 trade
- Dulux AcraTex texture coat (15L): $85-120 trade
- EPS insulation board (50mm): $18-28/m² trade
- Fibreglass mesh (50m roll): $45-65 trade
- Render primer (15L): $55-80 trade
- Renderer labour: $${labourRate.min}-${labourRate.max}/hr
- Labourer: $45-65/hr`,
      criticalRules: `- Measure all wall areas from plan — deduct openings (doors and windows)
- External render: include all walls, columns, and feature elements
- EPS systems: include adhesive, mesh, primer, and finish coat
- Include scaffolding for anything above 3m
- Expansion joints: include at 6m centres and at all corners`,
    },
    "cabinet-making": {
      title: "custom cabinet making",
      specialist: "senior Australian cabinet maker and custom joinery estimator with 20+ years experience on bespoke residential and commercial joinery projects",
      pricingBenchmarks: `PRICING BENCHMARKS (2024-25 Australian trade pricing):
- Laminex MDF (2400x1200x18mm): $55-75/sheet trade
- Laminex MDF (2400x1200x25mm): $75-95/sheet trade
- Polytec door (per door): $85-180 trade
- Blum Tandembox drawer (500mm): $95-150 trade
- Blum Aventos lift system: $120-220 trade
- Blum Hinge (Clip-Top): $8-14/pair trade
- Caesarstone 40mm benchtop: $380-580/lm trade
- Edge banding (50m roll): $28-45 trade
- Cabinet maker labour: $${labourRate.min}-${labourRate.max}/hr
- CNC cutting (per sheet): $25-45 trade`,
      criticalRules: `- List every cabinet, door, and drawer individually
- Sheet material: calculate from cutting list — include 15% waste for offcuts
- Hardware: count every hinge, runner, handle, and lift system
- Benchtops: include all cutouts (sink, cooktop) as separate labour items
- Include delivery and installation as separate line items`,
    },
  };

  const config = tradeConfigs[trade] ?? tradeConfigs["electrical"];
  const sectionList = sections.map((s, i) => `${i + 1}. "${s}"`).join("\n");

  return `You are a ${config.specialist}.

TASK: ${inputDesc} and generate a COMPLETE, SECTION-BY-SECTION ${config.title} takeoff for the ENTIRE project.

You MUST organise every item into one of these sections:
${sectionList}

For EVERY item provide:
1. section — one of the sections above (REQUIRED — never null or empty)
2. description — specific Australian product name, brand, size, and spec (be precise: "Clipsal 10A double GPO" not "power point")
3. unit — measurement unit: ea, lm, m², m³, hr, day, lot, set, kg, sheet, bag, roll
4. quantity — accurate total quantity for the ENTIRE project. For multi-dwelling: show TOTAL (e.g. 5 units × 2 toilets = 10 ea)
5. retailPrice — current Australian RETAIL price per unit (AUD 2024-25)
6. tradePrice — current Australian TRADE price per unit (AUD 2024-25, typically 20-35% below retail)
7. category — one of: "Materials", "Labour", "Plant & Equipment", "Subcontract", "Preliminaries", "Provisional Sum"
8. labourMinutes — minutes of labour per unit for a qualified tradesperson at normal pace
9. wasteFactor — percentage waste to add (e.g. 10 for 10%, 0 for fixtures/equipment)

Also provide:
- confidence: 0-100 (be honest — flag if plan quality limits accuracy)
- assumptions: EVERY assumption made. Always state: number of units/buildings detected, floor area assumed, ceiling height assumed, fixture grades assumed, anything not visible on plan
- roomBreakdown: group by BUILDING/UNIT then room (e.g. "Unit 1 — Kitchen", "Unit 3 — Bathroom", "External — Main Entry")
- planNotes: plan quality assessment, what's missing, what the engineer/certifier needs to confirm

${config.pricingBenchmarks}

CRITICAL RULES:
${config.criticalRules}
- NEVER use a single generic section — use ALL relevant sections from the list above
- Multi-dwelling projects: always state the number of units detected and show TOTAL quantities
- Include ALL consumables and small items that are commonly forgotten
- Include ALL labour as separate line items within each section
- Provisional Sums: add PS items for anything that cannot be accurately quantified from the plans
- Margin/markup is NOT included in your pricing — the estimator will apply their own margin
- Industry benchmark for this trade: labour rate $${labourRate.min}-${labourRate.max}/hr, typical margin ${benchmark?.marginRange.min ?? 15}-${benchmark?.marginRange.max ?? 35}%

Return ONLY valid JSON matching the schema. No markdown, no explanation outside the JSON.`;
}

// ─── Vision Takeoff Prompts (per trade) ──────────────────────────────────────
function buildVisionPrompt(trade: string): string {
  return buildTradePrompt("vision", trade);
}

// ─── Text-based Takeoff Prompts ───────────────────────────────────────────────
function buildTextPrompt(trade: string): string {
  return buildTradePrompt("text", trade);
}

// ─── JSON Schema for structured AI response (includes section field) ──────────
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
              section: { type: "string" },
              description: { type: "string" },
              unit: { type: "string" },
              quantity: { type: "number" },
              retailPrice: { type: "number" },
              tradePrice: { type: "number" },
              category: { type: "string" },
              labourMinutes: { type: "number" },
              wasteFactor: { type: "number" },
            },
            required: ["section", "description", "unit", "quantity", "retailPrice", "tradePrice", "category", "labourMinutes", "wasteFactor"],
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
  section: string;
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
      userContent.push({ type: "text", text: `Additional context from the estimator: ${input.additionalContext}` });
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

  // Text-based takeoff (enhanced with section-by-section output)
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

Generate a complete, section-by-section takeoff with accurate 2024-25 Australian market pricing (both retail and trade). Include all labour, materials, plant, and consumables.`;

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

  // Get industry benchmarks for a trade
  getBenchmarks: protectedProcedure.input(z.object({
    trade: z.string(),
  })).query(({ input }) => {
    return INDUSTRY_BENCHMARKS[input.trade] ?? null;
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
    labourRate: z.number().default(95), // $/hr
    markupPercent: z.number().default(22),
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

Write a professional scope of works summary for the quote document.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    return { summary: typeof content === "string" ? content : "Professional trade services as detailed in this quote." };
  }),
});
