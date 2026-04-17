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

// ─── Gasfitting (merged: install + maintenance) ─────────────────────────────
const gasfittingQuestions: ScopingQuestion[] = [
  {
    id: "work_type",
    label: "Type of gas work",
    type: "select",
    options: ["New gas installation", "Appliance replacement", "Gas maintenance / service", "Gas leak investigation", "Compliance certificate", "Emergency repair"],
    required: true,
  },
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
    label: "Which appliances are involved?",
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
  },
  {
    id: "appliance_count",
    label: "Total number of gas points",
    type: "number",
    placeholder: "e.g. 3",
    required: true,
    unit: "points",
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
    id: "pipe_run_estimate",
    label: "Estimated pipe run from meter to furthest appliance",
    type: "select",
    options: ["Under 10m", "10-20m", "20-30m", "30m+", "Not sure"],
    helpText: "Rough distance from the gas meter to the furthest appliance.",
  },
  {
    id: "underground_required",
    label: "Is underground pipe work required?",
    type: "select",
    options: ["Yes", "No", "Not sure"],
    helpText: "Underground PE pipe from meter to building. Common in new builds.",
  },
];

// ─── Electrical Scoping Questions ────────────────────────────────────────────
const electricalQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of electrical work",
    type: "select",
    options: ["New build fit-out", "Renovation / Extension", "Switchboard upgrade", "Lighting upgrade", "Power point additions", "Safety switch / RCD install", "Solar installation", "EV charger install", "Other"],
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
  {
    id: "new_or_existing",
    label: "New build or existing property?",
    type: "select",
    options: ["New build (rough-in)", "Existing property (retrofit)", "Renovation / Extension"],
    required: true,
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
    helpText: "If gas work is needed, create a separate Gasfitting estimate for accurate pricing.",
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
  {
    id: "timber_type",
    label: "Timber type",
    type: "select",
    options: ["Pine (MGP10/12/15)", "Hardwood", "LVL / Engineered", "Mixed / Not sure"],
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
  {
    id: "reinforcement",
    label: "Reinforcement type",
    type: "select",
    options: ["SL72 mesh", "SL82 mesh", "N12 reo bar", "Fibre mesh", "Not sure"],
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

// ─── Flooring Scoping Questions ──────────────────────────────────────────────
const flooringQuestions: ScopingQuestion[] = [
  {
    id: "flooring_type",
    label: "Type of flooring",
    type: "select",
    options: ["Timber / Hardwood", "Engineered timber", "Hybrid / SPC", "Vinyl plank (LVP)", "Carpet", "Tiles (see Tiling trade)", "Polished concrete", "Epoxy", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate floor area",
    type: "number",
    placeholder: "e.g. 120",
    unit: "m²",
    required: true,
  },
  {
    id: "subfloor",
    label: "Subfloor type",
    type: "select",
    options: ["Concrete slab", "Timber / Particle board", "Existing flooring (overlay)", "Not sure"],
    required: true,
  },
  {
    id: "rooms",
    label: "Number of rooms",
    type: "number",
    placeholder: "e.g. 5",
    unit: "rooms",
  },
  {
    id: "includes_removal",
    label: "Does old flooring need removing?",
    type: "select",
    options: ["Yes — remove existing", "No — new install on bare subfloor"],
  },
];

// ─── Landscaping Scoping Questions ───────────────────────────────────────────
const landscapingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of landscaping work",
    type: "select",
    options: ["Full landscape design & build", "Retaining walls", "Paving / Hardscape", "Turf & planting", "Irrigation system", "Fencing", "Outdoor kitchen / BBQ area", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate outdoor area",
    type: "number",
    placeholder: "e.g. 200",
    unit: "m²",
    required: true,
  },
  {
    id: "building_type",
    label: "Property type",
    type: "select",
    options: ["Residential — new build", "Residential — existing", "Commercial", "Strata / Body corporate"],
    required: true,
  },
  {
    id: "access",
    label: "Site access for machinery",
    type: "select",
    options: ["Good — wide driveway / open", "Limited — side access only", "Difficult — rear only / stairs", "Not sure"],
  },
];

// ─── Rendering & Plastering Scoping Questions ────────────────────────────────
const renderingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of rendering/plastering work",
    type: "select",
    options: ["External render (cement)", "External render (acrylic)", "Internal plaster (wet)", "Plasterboard / Drywall", "Feature wall / Texture coat", "Repair / Patch", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate wall area",
    type: "number",
    placeholder: "e.g. 150",
    unit: "m²",
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Commercial", "Renovation"],
    required: true,
  },
  {
    id: "scaffold_required",
    label: "Is scaffolding required?",
    type: "select",
    options: ["Yes", "No", "Not sure"],
  },
];

// ─── Painting Scoping Questions ──────────────────────────────────────────────
const paintingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of painting work",
    type: "select",
    options: ["Interior — full repaint", "Interior — new build", "Exterior — full repaint", "Exterior — new build", "Commercial / Industrial", "Feature wall / Accent", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate paintable area",
    type: "number",
    placeholder: "e.g. 300",
    unit: "m²",
  },
  {
    id: "rooms",
    label: "Number of rooms",
    type: "number",
    placeholder: "e.g. 8",
    unit: "rooms",
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Unit / Apartment", "Commercial"],
    required: true,
  },
  {
    id: "paint_grade",
    label: "Paint grade",
    type: "select",
    options: ["Standard (Dulux Wash & Wear / Taubmans)", "Premium (Dulux Weathershield / Haymes)", "Commercial / Epoxy", "Not sure"],
  },
  {
    id: "prep_required",
    label: "Surface preparation needed?",
    type: "select",
    options: ["Minimal — good condition", "Moderate — patching & sanding", "Heavy — stripping / sealing", "Not sure"],
  },
];

// ─── Bricklaying Scoping Questions ───────────────────────────────────────────
const bricklayingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of brickwork",
    type: "select",
    options: ["House brick veneer", "Double brick", "Blockwork (besser)", "Retaining wall", "Feature wall / Fireplace", "Letterbox / BBQ", "Repair / Repoint", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate wall area",
    type: "number",
    placeholder: "e.g. 200",
    unit: "m²",
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Commercial", "Renovation"],
    required: true,
  },
  {
    id: "brick_type",
    label: "Brick type",
    type: "select",
    options: ["Standard clay brick", "Face brick", "Besser block (190mm)", "Besser block (290mm)", "Stone veneer", "Not sure"],
  },
];

// ─── Roofing Scoping Questions ───────────────────────────────────────────────
const roofingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of roofing work",
    type: "select",
    options: ["New roof — metal (Colorbond)", "New roof — tiles", "Re-roof / Replacement", "Roof repair / Leak fix", "Roof plumbing (gutters, downpipes)", "Insulation", "Other"],
    required: true,
  },
  {
    id: "roof_area",
    label: "Approximate roof area",
    type: "number",
    placeholder: "e.g. 200",
    unit: "m²",
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Single storey house", "Double storey house", "Commercial / Industrial", "Carport / Patio"],
    required: true,
  },
  {
    id: "pitch",
    label: "Roof pitch",
    type: "select",
    options: ["Low pitch (under 15°)", "Standard (15-25°)", "Steep (over 25°)", "Not sure"],
  },
];

// ─── Tiling Scoping Questions ────────────────────────────────────────────────
const tilingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of tiling work",
    type: "select",
    options: ["Bathroom floor & walls", "Kitchen splashback", "Laundry", "Living area floor", "Outdoor / Balcony", "Pool tiles", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate tile area",
    type: "number",
    placeholder: "e.g. 40",
    unit: "m²",
    required: true,
  },
  {
    id: "tile_size",
    label: "Tile size",
    type: "select",
    options: ["Small (mosaic / subway)", "Standard (300x300 / 300x600)", "Large format (600x600+)", "Mixed sizes", "Not sure"],
  },
  {
    id: "waterproofing",
    label: "Does this area need waterproofing?",
    type: "select",
    options: ["Yes — wet area (bathroom, shower, laundry)", "No — dry area", "Already waterproofed", "Not sure"],
    required: true,
  },
];

// ─── Waterproofing Scoping Questions ─────────────────────────────────────────
const waterproofingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of waterproofing",
    type: "select",
    options: ["Bathroom / Shower", "Laundry", "Balcony / Terrace", "Basement / Below slab", "Planter box", "Roof membrane", "Remedial / Repair", "Other"],
    required: true,
  },
  {
    id: "area",
    label: "Approximate area to waterproof",
    type: "number",
    placeholder: "e.g. 15",
    unit: "m²",
    required: true,
  },
  {
    id: "membrane_type",
    label: "Membrane type",
    type: "select",
    options: ["Liquid applied (standard)", "Sheet membrane", "Cementitious", "Not sure — recommend for me"],
  },
  {
    id: "wet_areas_count",
    label: "Number of wet areas",
    type: "number",
    placeholder: "e.g. 2",
    unit: "areas",
  },
];

// ─── Fire Protection Scoping Questions ───────────────────────────────────────
const fireProtectionQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of fire protection work",
    type: "select",
    options: ["Fire sprinkler system", "Fire alarm / Detection", "Emergency lighting", "Passive fire (walls, doors, penetrations)", "Fire extinguishers / Equipment", "Annual compliance inspection", "Other"],
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Residential (Class 1)", "Multi-residential (Class 2)", "Commercial / Office (Class 5)", "Retail (Class 6)", "Industrial / Warehouse (Class 7/8)", "Other"],
    required: true,
  },
  {
    id: "floor_area",
    label: "Approximate floor area",
    type: "number",
    placeholder: "e.g. 500",
    unit: "m²",
  },
  {
    id: "storeys",
    label: "Number of storeys",
    type: "number",
    placeholder: "e.g. 3",
    unit: "levels",
  },
];

// ─── Glazing Scoping Questions ───────────────────────────────────────────────
const glazingQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of glazing work",
    type: "select",
    options: ["Windows — new build", "Windows — replacement", "Sliding / Stacking doors", "Shopfront", "Shower screens", "Mirrors", "Curtain wall / Commercial", "Other"],
    required: true,
  },
  {
    id: "window_count",
    label: "Number of windows / openings",
    type: "number",
    placeholder: "e.g. 12",
    unit: "openings",
  },
  {
    id: "frame_material",
    label: "Frame material",
    type: "select",
    options: ["Aluminium (standard)", "Aluminium (thermally broken)", "Timber", "uPVC", "Steel", "Not sure"],
    required: true,
  },
  {
    id: "glass_type",
    label: "Glass type",
    type: "select",
    options: ["Single glazed (standard)", "Double glazed (IGU)", "Low-E coated", "Tinted / Toned", "Laminated (safety)", "Not sure"],
  },
];

// ─── Quantity Surveying Scoping Questions ────────────────────────────────────
const quantitySurveyingQuestions: ScopingQuestion[] = [
  {
    id: "service_type",
    label: "Type of QS service",
    type: "select",
    options: ["Full bill of quantities", "Cost plan / Budget estimate", "Progress claim assessment", "Variation assessment", "Tax depreciation schedule", "Insurance replacement cost", "Other"],
    required: true,
  },
  {
    id: "project_type",
    label: "Project type",
    type: "select",
    options: ["Residential — new build", "Residential — renovation", "Commercial — new build", "Commercial — fitout", "Industrial", "Civil / Infrastructure"],
    required: true,
  },
  {
    id: "project_value",
    label: "Estimated project value",
    type: "select",
    options: ["Under $250k", "$250k - $500k", "$500k - $1M", "$1M - $5M", "$5M+", "Not sure"],
  },
];

// ─── Demolition Scoping Questions ────────────────────────────────────────────
const demolitionQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of demolition work",
    type: "select",
    options: ["Full house demolition", "Partial demolition (internal strip)", "Shed / Garage removal", "Pool removal", "Excavation / Earthworks", "Asbestos removal", "Other"],
    required: true,
  },
  {
    id: "building_type",
    label: "Structure type",
    type: "select",
    options: ["Timber frame house", "Brick veneer house", "Double brick house", "Commercial building", "Shed / Outbuilding", "Concrete structure"],
    required: true,
  },
  {
    id: "floor_area",
    label: "Approximate floor area",
    type: "number",
    placeholder: "e.g. 150",
    unit: "m²",
  },
  {
    id: "asbestos",
    label: "Is asbestos present?",
    type: "select",
    options: ["Yes — confirmed", "Suspected (pre-1990 building)", "No — tested clear", "Not sure"],
    required: true,
    helpText: "Buildings built before 1990 may contain asbestos. Testing is required before demolition.",
  },
];

// ─── Swimming Pool Scoping Questions ─────────────────────────────────────────
const swimmingPoolQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of pool work",
    type: "select",
    options: ["New pool — concrete/shotcrete", "New pool — fibreglass", "Pool renovation / resurface", "Pool equipment (pump, filter, heater)", "Pool fencing", "Pool landscaping / surrounds", "Other"],
    required: true,
  },
  {
    id: "pool_size",
    label: "Pool size",
    type: "select",
    options: ["Small (under 25m²)", "Medium (25-50m²)", "Large (50m²+)", "Plunge / Spa", "Not sure"],
    required: true,
  },
  {
    id: "heating",
    label: "Pool heating required?",
    type: "select",
    options: ["No heating", "Solar heating", "Heat pump", "Gas heater", "Not sure"],
  },
  {
    id: "fencing_required",
    label: "Does pool fencing need to be included?",
    type: "select",
    options: ["Yes — new fence required", "No — existing compliant fence", "Not sure"],
    helpText: "Pool fencing is mandatory in all Australian states.",
  },
];

// ─── Steel Fabrication Scoping Questions ─────────────────────────────────────
const steelFabricationQuestions: ScopingQuestion[] = [
  {
    id: "job_type",
    label: "Type of steel work",
    type: "select",
    options: ["Structural steel (beams, columns)", "Steel framing", "Balustrades / Handrails", "Stairs", "Mezzanine floor", "Awning / Canopy", "Custom fabrication", "Other"],
    required: true,
  },
  {
    id: "building_type",
    label: "Building type",
    type: "select",
    options: ["Residential", "Commercial", "Industrial / Warehouse", "Multi-storey"],
    required: true,
  },
  {
    id: "steel_weight",
    label: "Estimated steel tonnage (if known)",
    type: "text",
    placeholder: "e.g. 5 tonnes, or 'not sure'",
    helpText: "If you have engineering drawings, the tonnage should be noted.",
  },
  {
    id: "finish",
    label: "Steel finish",
    type: "select",
    options: ["Hot-dip galvanised", "Painted (standard primer)", "Powder coated", "Raw / Unfinished", "Not sure"],
  },
];

// ─── Default questions for any new trades ────────────────────────────────────
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
  gasfitting: gasfittingQuestions,
  electrical: electricalQuestions,
  plumbing: plumbingQuestions,
  hvac: hvacQuestions,
  carpentry: carpentryQuestions,
  concreting: concretingQuestions,
  cabinetry: cabinetryQuestions,
  flooring: flooringQuestions,
  landscaping: landscapingQuestions,
  rendering: renderingQuestions,
  painting: paintingQuestions,
  bricklaying: bricklayingQuestions,
  roofing: roofingQuestions,
  tiling: tilingQuestions,
  waterproofing: waterproofingQuestions,
  "fire-protection": fireProtectionQuestions,
  glazing: glazingQuestions,
  "quantity-surveying": quantitySurveyingQuestions,
  demolition: demolitionQuestions,
  "swimming-pool": swimmingPoolQuestions,
  "steel-fabrication": steelFabricationQuestions,
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
