// ─── Trade Scoping Questions ─────────────────────────────────────────────────
// These questions appear BEFORE the AI runs to help narrow the estimate scope.
// Answers are injected into the AI prompt so it knows exactly what to price.

export type ScopingQuestion = {
  id: string;
  label: string;
  type: "select" | "number" | "text" | "multiselect";
  options?: string[];
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  unit?: string; // e.g. "m", "m²", "units"
};

export type TradeScopingConfig = {
  tradeId: string;
  questions: ScopingQuestion[];
};

// ─── Gas Installation Scoping Questions ──────────────────────────────────────
const gasInstallQuestions: ScopingQuestion[] = [
  {
    id: "gas_type",
    label: "Gas type",
    type: "select",
    options: ["Natural Gas (mains)", "LPG (bottled)", "Not sure"],
    required: true,
    helpText: "Natural gas is piped from the street. LPG uses bottles.",
  },
  {
    id: "appliances",
    label: "Which appliances need gas connected?",
    type: "multiselect",
    options: [
      "Cooktop / Hotplate",
      "Oven",
      "Instantaneous Hot Water",
      "Storage Hot Water",
      "Ducted Heater",
      "Space Heater / Wall Furnace",
      "Gas Fireplace",
      "BBQ Point",
      "Gas Dryer",
      "Commercial Appliance",
    ],
    required: true,
    helpText: "Select all appliances that need a gas connection.",
  },
  {
    id: "appliance_count",
    label: "Total number of gas points",
    type: "number",
    placeholder: "e.g. 3",
    required: true,
    unit: "points",
    helpText: "How many separate gas bayonet/connection points are needed?",
  },
  {
    id: "pipe_run_estimate",
    label: "Estimated pipe run from meter to furthest appliance",
    type: "select",
    options: ["Under 10m", "10-20m", "20-30m", "30m+", "Not sure"],
    helpText: "Rough distance from the gas meter to the furthest appliance.",
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Unit / Apartment", "Commercial / Shop", "Industrial"],
    required: true,
  },
  {
    id: "new_or_existing",
    label: "New build or existing property?",
    type: "select",
    options: ["New build (rough-in)", "Existing property (retrofit)", "Renovation / Extension"],
    required: true,
    helpText: "Retrofit work typically costs more due to access and making good.",
  },
  {
    id: "underground_required",
    label: "Is underground pipe work required?",
    type: "select",
    options: ["Yes", "No", "Not sure"],
    helpText: "Underground PE pipe from meter to building. Common in new builds.",
  },
  {
    id: "meter_location",
    label: "Where is the gas meter?",
    type: "select",
    options: ["Front of property", "Side of property", "Rear of property", "No meter yet (new connection)", "Not sure"],
  },
];

// ─── Gas Maintenance Scoping Questions ───────────────────────────────────────
const gasMaintenanceQuestions: ScopingQuestion[] = [
  {
    id: "service_type",
    label: "What type of service is needed?",
    type: "select",
    options: [
      "Annual gas safety check",
      "Appliance service / tune-up",
      "Gas leak investigation",
      "Appliance replacement",
      "Compliance certificate (change of tenancy)",
      "Emergency repair",
    ],
    required: true,
  },
  {
    id: "appliances_to_service",
    label: "Which appliances need servicing?",
    type: "multiselect",
    options: [
      "Cooktop / Hotplate",
      "Oven",
      "Instantaneous Hot Water",
      "Storage Hot Water",
      "Ducted Heater",
      "Space Heater / Wall Furnace",
      "Gas Fireplace",
      "Gas Dryer",
    ],
    required: true,
  },
  {
    id: "appliance_service_count",
    label: "Number of appliances to service",
    type: "number",
    placeholder: "e.g. 4",
    required: true,
    unit: "appliances",
  },
  {
    id: "property_type",
    label: "Property type",
    type: "select",
    options: ["Residential", "Commercial", "Strata / Body Corporate"],
    required: true,
  },
  {
    id: "known_issues",
    label: "Any known issues?",
    type: "text",
    placeholder: "e.g. Smell of gas near cooktop, pilot light won't stay on",
    helpText: "Describe any symptoms or issues you've noticed.",
  },
  {
    id: "last_service_date",
    label: "When was the last gas service?",
    type: "select",
    options: ["Less than 1 year ago", "1-2 years ago", "2-5 years ago", "Over 5 years / Never", "Not sure"],
  },
];

// ─── Electrical Scoping Questions ────────────────────────────────────────────
const electricalQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of electrical work",
    type: "select",
    options: ["New build fit-out", "Renovation / Extension", "Switchboard upgrade", "Lighting upgrade", "Power point additions", "Safety switch / RCD install", "Other"],
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Unit / Apartment", "Commercial / Shop", "Industrial"],
    required: true,
  },
  {
    id: "floor_area",
    label: "Approximate floor area",
    type: "number",
    placeholder: "e.g. 180",
    unit: "m²",
  },
  {
    id: "rooms",
    label: "Number of rooms / areas",
    type: "number",
    placeholder: "e.g. 8",
    unit: "rooms",
  },
  {
    id: "three_phase",
    label: "Is 3-phase power required?",
    type: "select",
    options: ["No (standard single phase)", "Yes (3-phase)", "Not sure"],
  },
];

// ─── Plumbing Scoping Questions ──────────────────────────────────────────────
const plumbingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of plumbing work",
    type: "select",
    options: ["New build rough-in + fit-off", "Bathroom renovation", "Kitchen renovation", "Laundry fit-out", "Hot water replacement", "Drainage / Sewer", "Other"],
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Unit / Apartment", "Multi-dwelling", "Commercial"],
    required: true,
  },
  {
    id: "bathrooms",
    label: "Number of bathrooms / wet areas",
    type: "number",
    placeholder: "e.g. 2",
    unit: "bathrooms",
    required: true,
  },
  {
    id: "hot_water_type",
    label: "Hot water system type",
    type: "select",
    options: ["Electric storage", "Gas instantaneous", "Gas storage", "Heat pump", "Solar", "Existing (no change)", "Not sure"],
  },
  {
    id: "includes_gas",
    label: "Does this job include any gas work?",
    type: "select",
    options: ["No — water and drainage only", "Yes — gas connections needed too"],
    helpText: "If gas work is needed, create a separate Gas Installation estimate for accurate pricing.",
    required: true,
  },
];

// ─── HVAC Scoping Questions ──────────────────────────────────────────────────
const hvacQuestions: ScopingQuestion[] = [
  {
    id: "system_type",
    label: "Type of HVAC system",
    type: "select",
    options: ["Ducted reverse-cycle", "Split system(s)", "Multi-head split", "VRV/VRF commercial", "Evaporative cooling", "Gas ducted heating", "Other"],
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Unit / Apartment", "Commercial / Office", "Retail"],
    required: true,
  },
  {
    id: "floor_area",
    label: "Approximate floor area",
    type: "number",
    placeholder: "e.g. 200",
    unit: "m²",
  },
  {
    id: "zones",
    label: "Number of zones / outlets",
    type: "number",
    placeholder: "e.g. 5",
    unit: "zones",
  },
  {
    id: "new_or_replacement",
    label: "New installation or replacement?",
    type: "select",
    options: ["New installation", "Replacement of existing", "Addition to existing"],
  },
];

// ─── Carpentry Scoping Questions ─────────────────────────────────────────────
const carpentryQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of carpentry work",
    type: "select",
    options: ["Wall framing", "Roof framing / trusses", "Flooring / subfloor", "Internal fit-out (doors, architraves)", "Decking", "Pergola / Carport", "Other"],
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Commercial", "Renovation / Extension"],
    required: true,
  },
  {
    id: "floor_area",
    label: "Approximate area",
    type: "number",
    placeholder: "e.g. 200",
    unit: "m²",
  },
];

// ─── Concreting Scoping Questions ────────────────────────────────────────────
const concretingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of concrete work",
    type: "select",
    options: ["House slab", "Shed slab", "Driveway", "Footpath / Paving", "Retaining wall footings", "Pool surrounds", "Exposed aggregate", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate area",
    type: "number",
    placeholder: "e.g. 180",
    unit: "m²",
    required: true,
  },
  {
    id: "thickness",
    label: "Slab thickness",
    type: "select",
    options: ["100mm", "150mm", "200mm", "Varies", "Not sure"],
  },
  {
    id: "finish",
    label: "Surface finish",
    type: "select",
    options: ["Standard broom finish", "Exposed aggregate", "Polished", "Coloured", "Stamped / Stenciled", "Not sure"],
  },
];

// ─── Cabinetry Scoping Questions ─────────────────────────────────────────────
const cabinetryQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of cabinetry work",
    type: "select",
    options: ["Kitchen", "Bathroom vanity", "Laundry", "Wardrobe / Built-in robe", "Commercial fitout", "Office joinery", "Other"],
    required: true,
  },
  {
    id: "linear_metres",
    label: "Approximate linear metres of cabinetry",
    type: "number",
    placeholder: "e.g. 8",
    unit: "lm",
  },
  {
    id: "benchtop_material",
    label: "Benchtop material",
    type: "select",
    options: ["Laminate / Postform", "Caesarstone / Engineered stone", "Natural stone (granite/marble)", "Timber", "Stainless steel", "Not sure"],
  },
  {
    id: "door_style",
    label: "Door style",
    type: "select",
    options: ["Flat / Slab", "Shaker", "Profiled / Routed", "Polyurethane painted", "Vinyl wrap", "Timber veneer", "Not sure"],
  },
  {
    id: "hardware_grade",
    label: "Hardware grade",
    type: "select",
    options: ["Standard (Hettich/generic)", "Premium (Blum soft-close)", "Commercial grade", "Not sure"],
  },
];

// ─── Default questions for trades without specific scoping ───────────────────
const defaultQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of work",
    type: "text",
    placeholder: "Briefly describe the scope of work",
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Residential", "Commercial", "Industrial", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate area or quantity",
    type: "text",
    placeholder: "e.g. 200m², 3 rooms, 50 linear metres",
  },
];

// ─── Master map ──────────────────────────────────────────────────────────────
export const SCOPING_QUESTIONS: Record<string, ScopingQuestion[]> = {
  "gas-install": gasInstallQuestions,
  "gas-maintenance": gasMaintenanceQuestions,
  electrical: electricalQuestions,
  plumbing: plumbingQuestions,
  hvac: hvacQuestions,
  carpentry: carpentryQuestions,
  concreting: concretingQuestions,
  cabinetry: cabinetryQuestions,
  // All other trades get the default questions
};

export function getScopingQuestions(tradeId: string): ScopingQuestion[] {
  return SCOPING_QUESTIONS[tradeId] ?? defaultQuestions;
}

// ─── Format scoping answers into a prompt-friendly string ────────────────────
export function formatScopingAnswers(
  questions: ScopingQuestion[],
  answers: Record<string, string | string[] | number>
): string {
  const lines: string[] = [];
  for (const q of questions) {
    const val = answers[q.id];
    if (val === undefined || val === "" || (Array.isArray(val) && val.length === 0)) continue;
    const displayVal = Array.isArray(val) ? val.join(", ") : String(val);
    lines.push(`- ${q.label}: ${displayVal}${q.unit ? ` ${q.unit}` : ""}`);
  }
  return lines.length > 0
    ? `\n\nSCOPING DETAILS (provided by the user):\n${lines.join("\n")}`
    : "";
}
