/**
 * Australian WHS Compliance Data for Auto-SWMS Generation
 *
 * Based on:
 * - Safe Work Australia: High Risk Construction Work definitions
 * - Work Health and Safety Regulation 2011 (Cth) Schedule 5
 * - State-specific WHS regulations (NSW, VIC, QLD, SA, WA, TAS, NT, ACT)
 */

// ─── High-Risk Construction Work (HRCW) Categories ───────────────────────────
// As defined in WHS Regulation 2011 Schedule 5

export const HRCW_CATEGORIES = [
  "work_at_heights",           // Risk of falling >2m
  "excavation",                // Excavation >1.5m deep
  "confined_spaces",           // Work in confined spaces
  "demolition",                // Demolition of load-bearing structures
  "asbestos",                  // Asbestos disturbance/removal
  "structural_alterations",    // Alterations affecting structural integrity
  "pressurised_pipework",      // Work on pressurised gas/liquid pipework
  "electrical_live_work",      // Work near or on energised electrical installations
  "telecommunications",        // Work on telecommunications infrastructure
  "roads_traffic",             // Work on or near roads with traffic
  "hot_works",                 // Welding, cutting, grinding near flammables
  "chemical_hazardous",        // Use of hazardous chemicals
  "tilt_up_precast",           // Tilt-up or precast concrete elements
  "scaffolding",               // Scaffolding >4m
  "cranes_hoisting",           // Use of cranes or hoisting equipment
  "diving",                    // Diving work
  "explosives",                // Use of explosives
  "contaminated_land",         // Work on contaminated land
  "adjacent_to_water",         // Work adjacent to water with drowning risk
  "remote_isolated",           // Work in remote or isolated locations
] as const;

export type HrcwCategory = typeof HRCW_CATEGORIES[number];

// ─── Trade → HRCW Mapping ────────────────────────────────────────────────────
// Maps each trade to the HRCW categories typically applicable

export const TRADE_HRCW_MAP: Record<string, HrcwCategory[]> = {
  electrical: [
    "electrical_live_work",
    "work_at_heights",
    "hot_works",
    "confined_spaces",
  ],
  plumbing: [
    "pressurised_pipework",
    "hot_works",
    "confined_spaces",
    "excavation",
    "chemical_hazardous",
  ],
  carpentry: [
    "work_at_heights",
    "structural_alterations",
    "scaffolding",
  ],
  concreting: [
    "excavation",
    "tilt_up_precast",
    "chemical_hazardous",
    "work_at_heights",
  ],
  hvac: [
    "work_at_heights",
    "confined_spaces",
    "chemical_hazardous",   // refrigerants
    "hot_works",
    "electrical_live_work",
  ],
  flooring: [
    "chemical_hazardous",   // adhesives, solvents
    "work_at_heights",
  ],
  landscaping: [
    "excavation",
    "adjacent_to_water",
    "chemical_hazardous",   // herbicides, fertilisers
    "roads_traffic",
  ],
  cabinetry: [
    "work_at_heights",
    "structural_alterations",
    "chemical_hazardous",   // finishes, adhesives
  ],
  rendering: [
    "work_at_heights",
    "scaffolding",
    "chemical_hazardous",
  ],
  cabinet_making: [
    "work_at_heights",
    "chemical_hazardous",
  ],
  demolition: [
    "demolition",
    "asbestos",
    "work_at_heights",
    "scaffolding",
    "structural_alterations",
    "chemical_hazardous",
    "contaminated_land",
    "excavation",
    "cranes_hoisting",
    "roads_traffic",
  ],
  roofing: [
    "work_at_heights",
    "scaffolding",
    "hot_works",
  ],
  painting: [
    "work_at_heights",
    "scaffolding",
    "chemical_hazardous",
  ],
  tiling: [
    "work_at_heights",
    "chemical_hazardous",
  ],
  ev_charging: [
    "electrical_live_work",
    "work_at_heights",
    "excavation",
  ],
  solar_power: [
    "work_at_heights",
    "electrical_live_work",
    "hot_works",
    "scaffolding",
    "cranes_hoisting",
  ],
  "solar-power": [
    "work_at_heights",
    "electrical_live_work",
    "hot_works",
    "scaffolding",
    "cranes_hoisting",
  ],
  swimming_pool: [
    "excavation",
    "work_at_heights",
    "cranes_hoisting",
    "chemical_hazardous",
    "adjacent_to_water",
    "roads_traffic",
  ],
  "swimming-pool": [
    "excavation",
    "work_at_heights",
    "cranes_hoisting",
    "chemical_hazardous",
    "adjacent_to_water",
    "roads_traffic",
  ],
};

// ─── Material → HRCW Trigger Keywords ────────────────────────────────────────
// If these keywords appear in materials/scope, add the corresponding HRCW

export const MATERIAL_HRCW_TRIGGERS: Array<{
  keywords: string[];
  hrcw: HrcwCategory;
}> = [
  { keywords: ["asbestos", "fibro", "fibre cement (old)", "AC sheet"], hrcw: "asbestos" },
  { keywords: ["scaffold", "scaffolding", "kwikstage", "ringlock"], hrcw: "scaffolding" },
  { keywords: ["crane", "hoist", "elevated work platform", "EWP", "scissor lift", "boom lift"], hrcw: "cranes_hoisting" },
  { keywords: ["excavat", "trenching", "earthwork", "dig"], hrcw: "excavation" },
  { keywords: ["confined space", "tank", "pit", "sewer", "manhole"], hrcw: "confined_spaces" },
  { keywords: ["welding", "cutting torch", "angle grinder", "grinding"], hrcw: "hot_works" },
  { keywords: ["refrigerant", "R410A", "R32", "R22", "ammonia"], hrcw: "chemical_hazardous" },
  { keywords: ["acid", "solvent", "adhesive", "epoxy", "resin", "paint", "primer"], hrcw: "chemical_hazardous" },
  { keywords: ["tilt-up", "precast", "tilt up panel"], hrcw: "tilt_up_precast" },
  { keywords: ["demolish", "demolition", "remove wall", "strip out", "knock down", "wrecking"], hrcw: "demolition" },
  { keywords: ["earthmoving", "earthworks", "grading", "bulk excavation", "cut and fill", "site scrape", "topsoil strip", "rock breaking", "rock hammer"], hrcw: "excavation" },
  { keywords: ["piling", "bored pile", "driven pile", "screw pile", "sheet pile"], hrcw: "excavation" },
  { keywords: ["skip bin", "waste removal", "demolition waste", "C&D waste"], hrcw: "demolition" },
  { keywords: ["asbestos removal", "ACM", "bonded asbestos", "friable asbestos", "Class A removal", "Class B removal"], hrcw: "asbestos" },
  { keywords: ["live wire", "energised", "switchboard", "HV", "high voltage"], hrcw: "electrical_live_work" },
  { keywords: ["gas pipe", "LPG", "natural gas", "pressurised"], hrcw: "pressurised_pipework" },
  { keywords: ["road", "traffic", "footpath", "kerb", "driveway crossing"], hrcw: "roads_traffic" },
  { keywords: ["roof", "roofing", "gutter", "fascia", "eave"], hrcw: "work_at_heights" },
  { keywords: ["solar", "panel", "inverter", "battery", "PV", "photovoltaic"], hrcw: "electrical_live_work" },
  { keywords: ["pool", "swimming", "fibreglass", "concrete pool", "pool shell"], hrcw: "adjacent_to_water" },
  { keywords: ["pool equipment", "pump", "filter", "heater", "chlorinator"], hrcw: "chemical_hazardous" },
  { keywords: ["pool fencing", "pool barrier", "safety gate"], hrcw: "work_at_heights" },
];

// ─── HRCW Human-Readable Labels ──────────────────────────────────────────────

export const HRCW_LABELS: Record<HrcwCategory, string> = {
  work_at_heights: "Work involving a risk of a person falling more than 2 metres",
  excavation: "Excavation to a depth greater than 1.5 metres",
  confined_spaces: "Work in or near a confined space",
  demolition: "Demolition of an element of a structure that is load-bearing or otherwise related to the physical integrity of the structure",
  asbestos: "Work that involves disturbance of asbestos",
  structural_alterations: "Structural alterations or repairs that require temporary support to prevent collapse",
  pressurised_pipework: "Work on or near pressurised gas distribution mains or piping",
  electrical_live_work: "Work on or near energised electrical installations or services",
  telecommunications: "Work on telecommunications infrastructure",
  roads_traffic: "Work on, in or adjacent to a road, railway, shipping lane or other traffic corridor that is in use by traffic other than pedestrians",
  hot_works: "Work in an area that may have a contaminated or flammable atmosphere",
  chemical_hazardous: "Work involving the use of explosives or hazardous chemicals",
  tilt_up_precast: "Work involving tilt-up or precast concrete",
  scaffolding: "Work on or adjacent to scaffolding higher than 4 metres",
  cranes_hoisting: "Work involving the use of a crane or hoist",
  diving: "Work involving diving",
  explosives: "Work involving the use of explosives",
  contaminated_land: "Work on or near contaminated land",
  adjacent_to_water: "Work in or adjacent to water or other liquids that involves a risk of drowning",
  remote_isolated: "Work in an area at a workplace in which the work environment may endanger the health or safety of a worker who may not have access to assistance",
};

// ─── Common Hazard/Control Templates by Task Type ────────────────────────────
// Pre-built hazard/control rows for common construction tasks

export interface HazardControlTemplate {
  task: string;
  hazards: string[];
  controls: string[];
  ppe: string[];
}

export const HAZARD_CONTROL_TEMPLATES: Record<string, HazardControlTemplate[]> = {
  work_at_heights: [
    {
      task: "Working at height (>2m)",
      hazards: [
        "Fall from height resulting in serious injury or death",
        "Falling objects striking persons below",
        "Unstable work platform",
      ],
      controls: [
        "Elimination: Assess whether work can be performed from ground level",
        "Engineering: Install edge protection (guardrails min. 900mm high) or safety mesh",
        "Engineering: Use elevated work platform (EWP) with harness anchor points",
        "Administrative: Ensure workers are trained and competent in working at heights",
        "Administrative: Conduct pre-start inspection of all equipment",
        "PPE: Full-body harness with double-action lanyard attached to rated anchor point",
      ],
      ppe: ["Full-body harness", "Hard hat", "Safety boots (steel cap)", "High-vis vest"],
    },
  ],
  electrical_live_work: [
    {
      task: "Electrical installation / connection",
      hazards: [
        "Electric shock from contact with live conductors",
        "Arc flash / arc blast",
        "Fire from electrical fault",
      ],
      controls: [
        "Elimination: De-energise circuits before commencing work (lockout/tagout)",
        "Isolation: Apply LOTO (Lockout/Tagout) procedure — lock off at switchboard, test for dead",
        "Engineering: Use insulated tools rated to appropriate voltage",
        "Administrative: Only licensed electricians to perform electrical work",
        "Administrative: Test with approved voltage tester before touching any conductor",
        "PPE: Insulated gloves (rated to voltage), arc-rated face shield for switchboard work",
      ],
      ppe: ["Insulated gloves", "Arc-rated face shield", "Safety glasses", "Hard hat", "Safety boots"],
    },
  ],
  excavation: [
    {
      task: "Excavation / trenching",
      hazards: [
        "Cave-in or collapse of trench walls",
        "Striking underground services (gas, electrical, water, telecommunications)",
        "Workers falling into excavation",
      ],
      controls: [
        "Elimination: Obtain Dial Before You Dig (1100) service locates before excavating",
        "Engineering: Shore, batter or bench trench walls for depths >1.5m",
        "Engineering: Install barricades and signage around excavation perimeter",
        "Administrative: Inspect excavation daily and after rain events",
        "Administrative: Spoil to be placed minimum 600mm from trench edge",
        "Administrative: Provide safe means of entry/exit (ladder) for trenches >1.2m",
      ],
      ppe: ["Hard hat", "Safety boots (steel cap)", "High-vis vest", "Safety glasses"],
    },
  ],
  hot_works: [
    {
      task: "Hot works (welding / grinding / cutting)",
      hazards: [
        "Fire from sparks igniting flammable materials",
        "Burns from molten metal or sparks",
        "Fumes inhalation from welding/cutting",
        "Eye injury from UV radiation or flying particles",
      ],
      controls: [
        "Elimination: Remove all flammable materials within 10m of work area",
        "Isolation: Use fire-resistant welding blankets to contain sparks",
        "Engineering: Ensure adequate ventilation or use LEV (local exhaust ventilation)",
        "Administrative: Obtain Hot Works Permit before commencing",
        "Administrative: Have fire extinguisher (CO2 or dry powder) within 3m",
        "Administrative: Conduct fire watch for 30 minutes after work completion",
      ],
      ppe: ["Welding helmet (auto-darkening, shade 10+)", "Leather welding gloves", "Leather apron", "Safety boots", "Hearing protection"],
    },
  ],
  chemical_hazardous: [
    {
      task: "Use of hazardous chemicals / substances",
      hazards: [
        "Skin or eye contact with corrosive/irritant chemicals",
        "Inhalation of vapours, fumes or dust",
        "Chemical spill contaminating site or waterways",
      ],
      controls: [
        "Substitution: Use less hazardous product where available (e.g., water-based instead of solvent-based)",
        "Engineering: Ensure adequate ventilation in work area",
        "Administrative: Obtain and read SDS (Safety Data Sheet) for all chemicals before use",
        "Administrative: Store chemicals in original labelled containers",
        "Administrative: Provide spill kit and know spill response procedure",
        "PPE: Chemical-resistant gloves, safety glasses/goggles, P2 respirator where required by SDS",
      ],
      ppe: ["Chemical-resistant gloves", "Safety glasses / goggles", "P2 respirator (if vapours present)", "Safety boots"],
    },
  ],
  demolition: [
    {
      task: "Structural demolition (load-bearing elements)",
      hazards: [
        "Uncontrolled collapse of structure",
        "Falling debris striking workers",
        "Dust inhalation (silica, concrete, timber)",
        "Hidden asbestos-containing materials (ACM)",
        "Noise exposure from hydraulic breakers/excavators",
      ],
      controls: [
        "Engineering: Prepare demolition work plan per AS 2601 — identify structural sequence",
        "Engineering: Install exclusion zones (minimum 1.5x building height from perimeter)",
        "Engineering: Wet-down demolition area to suppress dust",
        "Administrative: Asbestos survey by licensed assessor before ANY demolition commences",
        "Administrative: Notify SafeWork/WorkSafe of demolition >3 days or >$250K value",
        "Administrative: Only licensed demolition contractors (Class 1 or 2) to perform structural demolition",
        "PPE: P2 respirator, hard hat, safety glasses, steel-cap boots, hearing protection, hi-vis",
      ],
      ppe: ["P2 respirator", "Hard hat", "Safety glasses", "Steel-cap boots", "Hearing protection (Class 5)", "Hi-vis vest", "Leather gloves"],
    },
    {
      task: "Earthmoving / bulk excavation",
      hazards: [
        "Plant rollover on unstable ground",
        "Striking underground services (gas, power, water, comms)",
        "Workers struck by moving plant",
        "Trench collapse during cut operations",
        "Dust generation affecting visibility and respiratory health",
      ],
      controls: [
        "Elimination: Obtain Dial Before You Dig (1100) service locates before ANY ground-breaking",
        "Engineering: Establish exclusion zones around operating plant (minimum swing radius + 2m)",
        "Engineering: Batter or bench excavation walls to safe angle of repose",
        "Administrative: Plant pre-start inspection daily (hydraulics, tracks, visibility)",
        "Administrative: Spotter required when plant operating near people or structures",
        "Administrative: Dust suppression via water cart when conditions require",
        "PPE: Hard hat, hi-vis vest, safety boots, hearing protection, safety glasses",
      ],
      ppe: ["Hard hat", "Hi-vis vest (Day/Night)", "Steel-cap boots", "Hearing protection", "Safety glasses", "P2 mask (dusty conditions)"],
    },
    {
      task: "Asbestos removal (bonded — Class B)",
      hazards: [
        "Inhalation of asbestos fibres causing mesothelioma/asbestosis",
        "Contamination of surrounding areas",
        "Improper disposal leading to environmental harm",
      ],
      controls: [
        "Elimination: Only licensed Class B (bonded) or Class A (friable) removalists to handle ACM",
        "Engineering: Wet ACM before removal — never dry-cut, sand, or drill",
        "Engineering: Wrap ACM in 200μm poly sheeting, double-bag, label as asbestos waste",
        "Administrative: Notify regulator 5 days before removal (>10m² bonded)",
        "Administrative: Air monitoring during removal (PCM method)",
        "Administrative: Dispose at licensed asbestos waste facility only",
        "PPE: P3 half-face respirator (minimum), disposable coveralls, safety glasses, gloves",
      ],
      ppe: ["P3 half-face respirator", "Disposable coveralls (Type 5/6)", "Safety glasses", "Nitrile gloves", "Safety boots", "Hard hat"],
    },
  ],
  confined_spaces: [
    {
      task: "Work in or near confined space",
      hazards: [
        "Oxygen deficiency or enrichment",
        "Toxic or flammable atmosphere",
        "Engulfment or entrapment",
        "Difficulty of rescue in emergency",
      ],
      controls: [
        "Elimination: Assess whether work can be performed without entering confined space",
        "Engineering: Atmospheric testing before entry (oxygen 19.5-23.5%, LEL <5%)",
        "Engineering: Continuous forced ventilation during occupation",
        "Administrative: Confined Space Entry Permit required before entry",
        "Administrative: Standby person stationed outside at all times",
        "Administrative: Emergency rescue plan in place before entry",
        "PPE: SCBA or supplied-air respirator if atmosphere cannot be guaranteed safe",
      ],
      ppe: ["SCBA or supplied-air respirator", "Full-body harness with retrieval line", "Hard hat", "Safety boots"],
    },
  ],
};

// ─── Subscription Tier Gate ───────────────────────────────────────────────────
// SWMS is a Business tier ($499/mo) and above feature

export const SWMS_REQUIRED_TIER = "small_builder"; // maps to $499/mo in products.ts
export const SWMS_TIER_LABEL = "Business ($499/mo)";

// ─── Helper: Identify HRCW from trade + materials/scope ──────────────────────

export function identifyHrcwCategories(opts: {
  trade: string;
  materials?: string;
  scope?: string;
}): HrcwCategory[] {
  const identified = new Set<HrcwCategory>();

  // Add trade-based HRCW
  const tradeLower = opts.trade.toLowerCase().replace(/[^a-z_]/g, "_");
  const tradeHrcw = TRADE_HRCW_MAP[tradeLower] || TRADE_HRCW_MAP[opts.trade.toLowerCase()] || [];
  tradeHrcw.forEach(h => identified.add(h));

  // Add material/scope-based HRCW
  const searchText = `${opts.materials || ""} ${opts.scope || ""}`.toLowerCase();
  for (const trigger of MATERIAL_HRCW_TRIGGERS) {
    if (trigger.keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
      identified.add(trigger.hrcw);
    }
  }

  return Array.from(identified);
}
