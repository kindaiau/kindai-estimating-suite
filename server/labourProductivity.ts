/**
 * labourProductivity.ts
 * Real task-level labour productivity benchmarks for Australian construction trades.
 * Sources: Methvin Production Rates, Resene NZ/AU Painting Tables, WireWise Electrical Guide,
 *          Blacktown Council QS Report (2018 adjusted +28% for 2025), Fair Work Award MA000020
 *
 * All times are in MINUTES per unit for a qualified tradesperson at normal pace.
 * Apply complexity multipliers as needed.
 */

export interface ProductivityRate {
  task: string;
  unit: string;
  minutesMin: number;
  minutesAvg: number;
  minutesMax: number;
  notes?: string;
}

export interface ComplexityMultipliers {
  newConstruction: number;
  renovation: number;
  highEnd: number;
  difficultAccess: number;
  industrial: number;
}

export const COMPLEXITY_MULTIPLIERS: ComplexityMultipliers = {
  newConstruction: 1.0,
  renovation: 1.4,
  highEnd: 1.6,
  difficultAccess: 1.75,
  industrial: 1.85,
};

// ─── ELECTRICAL ────────────────────────────────────────────────────────────────
// Source: WireWise Electrical Labour Guide (Dec 2024), Trade Heroes AU (Dec 2025)
export const ELECTRICAL_PRODUCTIVITY: ProductivityRate[] = [
  // Outlets & Switches
  { task: "Standard GPO / power point (new construction)", unit: "ea", minutesMin: 30, minutesAvg: 40, minutesMax: 45, notes: "0.5-0.75 hrs; renovation multiply by 1.4x" },
  { task: "Double GPO / power point (new construction)", unit: "ea", minutesMin: 35, minutesAvg: 45, minutesMax: 55 },
  { task: "GFCI / RCD protected outlet", unit: "ea", minutesMin: 45, minutesAvg: 55, minutesMax: 60 },
  { task: "Light switch (single)", unit: "ea", minutesMin: 30, minutesAvg: 40, minutesMax: 45 },
  { task: "Light switch (double/triple)", unit: "ea", minutesMin: 35, minutesAvg: 45, minutesMax: 55 },
  { task: "Three-way / two-way switch", unit: "ea", minutesMin: 60, minutesAvg: 75, minutesMax: 90 },
  { task: "USB outlet / data point", unit: "ea", minutesMin: 35, minutesAvg: 45, minutesMax: 55 },
  // Lighting
  { task: "Standard ceiling light fixture", unit: "ea", minutesMin: 60, minutesAvg: 75, minutesMax: 90 },
  { task: "LED downlight / recessed light", unit: "ea", minutesMin: 90, minutesAvg: 105, minutesMax: 120, notes: "Includes cutting, wiring, and fitting" },
  { task: "Exhaust fan (bathroom)", unit: "ea", minutesMin: 90, minutesAvg: 120, minutesMax: 150 },
  { task: "Chandelier / feature pendant", unit: "ea", minutesMin: 120, minutesAvg: 150, minutesMax: 180 },
  { task: "Under-cabinet lighting (per lm)", unit: "lm", minutesMin: 45, minutesAvg: 55, minutesMax: 60 },
  { task: "External wall light", unit: "ea", minutesMin: 60, minutesAvg: 75, minutesMax: 90 },
  // Panels & Circuits
  { task: "Main switchboard / panel installation", unit: "ea", minutesMin: 480, minutesAvg: 600, minutesMax: 720, notes: "8-12 hrs" },
  { task: "Sub-panel installation", unit: "ea", minutesMin: 240, minutesAvg: 300, minutesMax: 360, notes: "4-6 hrs" },
  { task: "Circuit breaker / MCB installation", unit: "ea", minutesMin: 15, minutesAvg: 22, minutesMax: 30 },
  { task: "RCD / safety switch installation", unit: "ea", minutesMin: 20, minutesAvg: 30, minutesMax: 40 },
  // Rough-in
  { task: "Electrical rough-in (residential)", unit: "m²", minutesMin: 5, minutesAvg: 6.5, minutesMax: 8, notes: "~1 hr per 9-10m² (100 sqft); new construction baseline" },
  { task: "Cable run (per lm, open ceiling/wall)", unit: "lm", minutesMin: 3, minutesAvg: 4, minutesMax: 5 },
  { task: "Cable run (per lm, concealed/conduit)", unit: "lm", minutesMin: 7, minutesAvg: 9, minutesMax: 12 },
  { task: "Conduit installation EMT (per lm)", unit: "lm", minutesMin: 9, minutesAvg: 12, minutesMax: 15 },
  // Smoke alarms & data
  { task: "Smoke alarm (hardwired)", unit: "ea", minutesMin: 45, minutesAvg: 55, minutesMax: 70 },
  { task: "Data point Cat6 (new construction)", unit: "ea", minutesMin: 45, minutesAvg: 55, minutesMax: 65 },
  { task: "TV aerial point", unit: "ea", minutesMin: 45, minutesAvg: 55, minutesMax: 70 },
];

// ─── PLUMBING ──────────────────────────────────────────────────────────────────
// Source: Methvin Production Rates (Apr 2026), Scribd MEP Productivity Rates
export const PLUMBING_PRODUCTIVITY: ProductivityRate[] = [
  // Fixtures (fix only — supply and connect)
  { task: "Vanity basin (fix only)", unit: "ea", minutesMin: 90, minutesAvg: 102, minutesMax: 120 },
  { task: "Wall basin (fix only)", unit: "ea", minutesMin: 95, minutesAvg: 105, minutesMax: 120 },
  { task: "Bath pressed steel (fix only)", unit: "ea", minutesMin: 75, minutesAvg: 84, minutesMax: 100 },
  { task: "Bidet (fix only, excl. heater)", unit: "ea", minutesMin: 100, minutesAvg: 120, minutesMax: 140 },
  { task: "WC suite complete", unit: "ea", minutesMin: 120, minutesAvg: 141, minutesMax: 160 },
  { task: "WC pan floor mounted", unit: "ea", minutesMin: 50, minutesAvg: 60, minutesMax: 75 },
  { task: "WC pan wall mounted", unit: "ea", minutesMin: 200, minutesAvg: 240, minutesMax: 280 },
  { task: "Cistern wall type", unit: "ea", minutesMin: 50, minutesAvg: 60, minutesMax: 75 },
  { task: "Kitchen sink (fix only)", unit: "ea", minutesMin: 75, minutesAvg: 90, minutesMax: 110 },
  { task: "Laundry trough (fix only)", unit: "ea", minutesMin: 50, minutesAvg: 60, minutesMax: 75 },
  { task: "Cleaner's sink (fix only)", unit: "ea", minutesMin: 90, minutesAvg: 108, minutesMax: 125 },
  { task: "Urinal single stall", unit: "ea", minutesMin: 180, minutesAvg: 210, minutesMax: 250 },
  { task: "Shower base / tray (fix only)", unit: "ea", minutesMin: 60, minutesAvg: 75, minutesMax: 90 },
  { task: "Tapware set (basin/bath)", unit: "ea", minutesMin: 45, minutesAvg: 55, minutesMax: 70 },
  { task: "Shower mixer (fix only)", unit: "ea", minutesMin: 60, minutesAvg: 75, minutesMax: 90 },
  // Hot water
  { task: "Electric hot water unit (storage)", unit: "ea", minutesMin: 120, minutesAvg: 150, minutesMax: 180 },
  { task: "Continuous flow hot water (gas)", unit: "ea", minutesMin: 150, minutesAvg: 180, minutesMax: 210 },
  { task: "Heat pump hot water unit", unit: "ea", minutesMin: 180, minutesAvg: 210, minutesMax: 240 },
  // Pipe work
  { task: "Water supply pipe copper 15mm (per lm)", unit: "lm", minutesMin: 6, minutesAvg: 8, minutesMax: 10 },
  { task: "Water supply pipe copper 20mm (per lm)", unit: "lm", minutesMin: 7, minutesAvg: 9, minutesMax: 12 },
  { task: "PEX pipe 16mm (per lm)", unit: "lm", minutesMin: 4, minutesAvg: 5, minutesMax: 7 },
  { task: "uPVC sewer pipe 100mm (per lm)", unit: "lm", minutesMin: 8, minutesAvg: 10, minutesMax: 14 },
  { task: "uPVC sewer pipe 150mm (per lm)", unit: "lm", minutesMin: 12, minutesAvg: 15, minutesMax: 20 },
  // Rough-in benchmarks
  { task: "Bathroom rough-in (complete)", unit: "ea", minutesMin: 480, minutesAvg: 600, minutesMax: 720, notes: "8-12 hrs per bathroom" },
  { task: "Kitchen rough-in (complete)", unit: "ea", minutesMin: 240, minutesAvg: 300, minutesMax: 360, notes: "4-6 hrs per kitchen" },
  { task: "Laundry rough-in (complete)", unit: "ea", minutesMin: 120, minutesAvg: 150, minutesMax: 180 },
];

// ─── PAINTING ──────────────────────────────────────────────────────────────────
// Source: Resene NZ/AU Painting Productivity Tables (industry standard)
// All times in minutes per m² unless noted
export const PAINTING_PRODUCTIVITY: ProductivityRate[] = [
  // Interior new work (brush/roll)
  { task: "1 coat sealer — walls (brush/roll)", unit: "m²", minutesMin: 4, minutesAvg: 5.4, minutesMax: 7 },
  { task: "1 coat sealer — walls (spray)", unit: "m²", minutesMin: 2.5, minutesAvg: 3, minutesMax: 4 },
  { task: "Ceiling: seal + 2 coats (brush/roll)", unit: "m²", minutesMin: 11, minutesAvg: 13.2, minutesMax: 16 },
  { task: "Ceiling: seal + 2 coats (spray)", unit: "m²", minutesMin: 8, minutesAvg: 10.2, minutesMax: 13 },
  { task: "Walls: seal + 2 coats low sheen (brush/roll)", unit: "m²", minutesMin: 12, minutesAvg: 14.4, minutesMax: 18 },
  { task: "Walls: seal + 2 coats low sheen (spray)", unit: "m²", minutesMin: 8, minutesAvg: 10, minutesMax: 13 },
  { task: "Timber: undercoat + 2 coats gloss", unit: "m²", minutesMin: 16, minutesAvg: 18.6, minutesMax: 22 },
  // Interior repaints
  { task: "Walls repaint: prep + fill + sand + 2 coats", unit: "m²", minutesMin: 11, minutesAvg: 13.2, minutesMax: 16 },
  { task: "Ceiling repaint: 2 coats (good condition)", unit: "m²", minutesMin: 9, minutesAvg: 10.8, minutesMax: 13 },
  { task: "Ceiling repaint: 1 coat", unit: "m²", minutesMin: 6, minutesAvg: 7.2, minutesMax: 9 },
  // Doors & frames (per door)
  { task: "Flush door both sides + frame (new)", unit: "ea", minutesMin: 180, minutesAvg: 216, minutesMax: 260 },
  { task: "Fire door both sides + frame", unit: "ea", minutesMin: 240, minutesAvg: 294, minutesMax: 340 },
  { task: "Panel door both sides + frame", unit: "ea", minutesMin: 210, minutesAvg: 252, minutesMax: 300 },
  // Joinery
  { task: "Kitchen joinery: sand + undercoat + topcoat", unit: "ea", minutesMin: 900, minutesAvg: 1080, minutesMax: 1200, notes: "Full kitchen set" },
  { task: "Small bathroom: sand + undercoat + topcoat", unit: "ea", minutesMin: 840, minutesAvg: 1005, minutesMax: 1200 },
  // Exterior
  { task: "Exterior walls: 2 coats (brush/roll)", unit: "m²", minutesMin: 14, minutesAvg: 17, minutesMax: 21 },
  { task: "Exterior walls: 2 coats (spray)", unit: "m²", minutesMin: 9, minutesAvg: 11, minutesMax: 14 },
  { task: "Fascia + gutter (per lm)", unit: "lm", minutesMin: 8, minutesAvg: 10, minutesMax: 13 },
];

// ─── TILING ────────────────────────────────────────────────────────────────────
// Source: Methvin Production Rates — Tiling (Apr 2026)
// Rates in m²/hr converted to minutes/m²
export const TILING_PRODUCTIVITY: ProductivityRate[] = [
  // Ceramic 150x150mm
  { task: "Ceramic tile 150x150mm — small room (<1.5m²)", unit: "m²", minutesMin: 29, minutesAvg: 38, minutesMax: 50 },
  { task: "Ceramic tile 150x150mm — medium room (1.5-2.5m²)", unit: "m²", minutesMin: 19, minutesAvg: 25, minutesMax: 32 },
  { task: "Ceramic tile 150x150mm — large room (>2.5m²)", unit: "m²", minutesMin: 17, minutesAvg: 22, minutesMax: 28 },
  // Ceramic 108x108mm
  { task: "Ceramic tile 108x108mm — small room (<1.5m²)", unit: "m²", minutesMin: 24, minutesAvg: 31, minutesMax: 40 },
  { task: "Ceramic tile 108x108mm — medium room (1.5-2.5m²)", unit: "m²", minutesMin: 17, minutesAvg: 22, minutesMax: 28 },
  { task: "Ceramic tile 108x108mm — large room (>2.5m²)", unit: "m²", minutesMin: 16, minutesAvg: 20, minutesMax: 26 },
  // Large format
  { task: "Large format tile 600x600mm — floor", unit: "m²", minutesMin: 12, minutesAvg: 15, minutesMax: 20 },
  { task: "Large format tile 600x600mm — wall", unit: "m²", minutesMin: 15, minutesAvg: 20, minutesMax: 25 },
  { task: "Large format tile 900x900mm+ — floor", unit: "m²", minutesMin: 15, minutesAvg: 19, minutesMax: 25 },
  // Grouting
  { task: "Grouting (per m²)", unit: "m²", minutesMin: 14, minutesAvg: 17, minutesMax: 22 },
  // Waterproofing (wet areas)
  { task: "Waterproofing membrane (wet area)", unit: "m²", minutesMin: 12, minutesAvg: 15, minutesMax: 20 },
];

// ─── PLASTERING / RENDERING ────────────────────────────────────────────────────
// Source: Methvin Production Rates — Plastering (Apr 2026)
export const PLASTERING_PRODUCTIVITY: ProductivityRate[] = [
  // Cement render (1 coat 13mm)
  { task: "Cement render walls (1 coat 13mm)", unit: "m²", minutesMin: 13, minutesAvg: 15, minutesMax: 18 },
  { task: "Cement render soffits (1 coat 13mm)", unit: "m²", minutesMin: 15, minutesAvg: 17, minutesMax: 20 },
  { task: "Cement render columns", unit: "m²", minutesMin: 22, minutesAvg: 25, minutesMax: 30 },
  // Hardwall plaster (2 coats 16mm)
  { task: "Hardwall plaster walls (2 coats 16mm)", unit: "m²", minutesMin: 22, minutesAvg: 25, minutesMax: 30 },
  { task: "Hardwall plaster soffits (2 coats 16mm)", unit: "m²", minutesMin: 26, minutesAvg: 30, minutesMax: 35 },
  // Browning undercoat
  { task: "Browning undercoat walls (<2.5m)", unit: "m²", minutesMin: 12, minutesAvg: 16, minutesMax: 22 },
  { task: "Browning undercoat walls (>2.5m)", unit: "m²", minutesMin: 13, minutesAvg: 17, minutesMax: 24 },
  // Skimming topcoat
  { task: "Skim coat walls (<2.5m)", unit: "m²", minutesMin: 5, minutesAvg: 7, minutesMax: 10 },
  { task: "Skim coat walls (>2.5m)", unit: "m²", minutesMin: 6, minutesAvg: 8, minutesMax: 11 },
  // Plasterboard
  { task: "Fix plasterboard (per m²)", unit: "m²", minutesMin: 11, minutesAvg: 13, minutesMax: 19 },
  { task: "Bond + skim plasterboard ceiling", unit: "m²", minutesMin: 25, minutesAvg: 35, minutesMax: 55 },
  { task: "Skim plasterboard ceiling only", unit: "m²", minutesMin: 11, minutesAvg: 19, minutesMax: 22 },
  // Set + sand
  { task: "Set and sand plasterboard joints", unit: "m²", minutesMin: 8, minutesAvg: 10, minutesMax: 14 },
];

// ─── CARPENTRY / FRAMING ───────────────────────────────────────────────────────
// Source: Industry benchmarks, HIA cost guides
export const CARPENTRY_PRODUCTIVITY: ProductivityRate[] = [
  { task: "Wall framing (per lm of wall)", unit: "lm", minutesMin: 8, minutesAvg: 10, minutesMax: 14 },
  { task: "Roof truss installation (per truss)", unit: "ea", minutesMin: 30, minutesAvg: 40, minutesMax: 55 },
  { task: "Plasterboard fixing (per m²)", unit: "m²", minutesMin: 8, minutesAvg: 10, minutesMax: 14 },
  { task: "Door installation (hang + hardware)", unit: "ea", minutesMin: 90, minutesAvg: 120, minutesMax: 150 },
  { task: "Window installation (standard)", unit: "ea", minutesMin: 90, minutesAvg: 120, minutesMax: 150 },
  { task: "Skirting board (per lm)", unit: "lm", minutesMin: 4, minutesAvg: 5, minutesMax: 7 },
  { task: "Architrave set (per door)", unit: "ea", minutesMin: 30, minutesAvg: 40, minutesMax: 55 },
  { task: "Decking (per m²)", unit: "m²", minutesMin: 20, minutesAvg: 25, minutesMax: 35 },
  { task: "Staircase installation (per flight)", unit: "ea", minutesMin: 480, minutesAvg: 600, minutesMax: 720 },
];

// ─── CONCRETING ────────────────────────────────────────────────────────────────
// Source: Industry benchmarks, Blacktown QS report
export const CONCRETING_PRODUCTIVITY: ProductivityRate[] = [
  { task: "Formwork — walls (per m²)", unit: "m²", minutesMin: 25, minutesAvg: 32, minutesMax: 45 },
  { task: "Formwork — slabs (per m²)", unit: "m²", minutesMin: 18, minutesAvg: 24, minutesMax: 35 },
  { task: "Reinforcement bar placing (per tonne)", unit: "t", minutesMin: 480, minutesAvg: 600, minutesMax: 720 },
  { task: "Concrete placement — slab (per m³)", unit: "m³", minutesMin: 15, minutesAvg: 20, minutesMax: 30 },
  { task: "Concrete finishing — broom (per m²)", unit: "m²", minutesMin: 3, minutesAvg: 4, minutesMax: 6 },
  { task: "Concrete finishing — power float (per m²)", unit: "m²", minutesMin: 4, minutesAvg: 5, minutesMax: 7 },
  { task: "Driveway concrete (complete, per m²)", unit: "m²", minutesMin: 20, minutesAvg: 28, minutesMax: 40, notes: "Includes form, pour, finish, strip" },
  { task: "Footpath concrete (per m²)", unit: "m²", minutesMin: 15, minutesAvg: 20, minutesMax: 30 },
  { task: "Strip footings (per lm)", unit: "lm", minutesMin: 25, minutesAvg: 35, minutesMax: 50 },
];

// ─── HVAC ──────────────────────────────────────────────────────────────────────
// Source: Industry benchmarks, AIRAH guidelines
export const HVAC_PRODUCTIVITY: ProductivityRate[] = [
  { task: "Split system installation (wall-mount)", unit: "ea", minutesMin: 180, minutesAvg: 240, minutesMax: 300, notes: "Includes indoor + outdoor unit, commissioning" },
  { task: "Ducted system installation (per kW)", unit: "kW", minutesMin: 30, minutesAvg: 40, minutesMax: 55 },
  { task: "Ductwork — flexible (per lm)", unit: "lm", minutesMin: 8, minutesAvg: 10, minutesMax: 14 },
  { task: "Ductwork — rigid sheet metal (per lm)", unit: "lm", minutesMin: 15, minutesAvg: 20, minutesMax: 28 },
  { task: "Supply air grille / diffuser", unit: "ea", minutesMin: 20, minutesAvg: 25, minutesMax: 35 },
  { task: "Return air grille", unit: "ea", minutesMin: 15, minutesAvg: 20, minutesMax: 28 },
  { task: "Refrigerant pipe (per lm)", unit: "lm", minutesMin: 10, minutesAvg: 13, minutesMax: 18 },
  { task: "Condensate drain (per lm)", unit: "lm", minutesMin: 5, minutesAvg: 7, minutesMax: 10 },
  { task: "Commissioning and testing", unit: "ea", minutesMin: 60, minutesAvg: 90, minutesMax: 120 },
];

// ─── FLOORING ──────────────────────────────────────────────────────────────────
// Source: Industry benchmarks, Carpet Court, Beaumont Tiles
export const FLOORING_PRODUCTIVITY: ProductivityRate[] = [
  { task: "Hybrid / vinyl plank flooring (per m²)", unit: "m²", minutesMin: 8, minutesAvg: 10, minutesMax: 14 },
  { task: "Engineered timber flooring (per m²)", unit: "m²", minutesMin: 12, minutesAvg: 15, minutesMax: 20 },
  { task: "Solid hardwood flooring (per m²)", unit: "m²", minutesMin: 15, minutesAvg: 20, minutesMax: 28 },
  { task: "Laminate flooring (per m²)", unit: "m²", minutesMin: 7, minutesAvg: 9, minutesMax: 12 },
  { task: "Carpet installation (per m²)", unit: "m²", minutesMin: 6, minutesAvg: 8, minutesMax: 11 },
  { task: "Subfloor levelling compound (per m²)", unit: "m²", minutesMin: 5, minutesAvg: 7, minutesMax: 10 },
  { task: "Skirting board (per lm)", unit: "lm", minutesMin: 4, minutesAvg: 5, minutesMax: 7 },
  { task: "Threshold / transition strip (per ea)", unit: "ea", minutesMin: 10, minutesAvg: 14, minutesMax: 20 },
];

// ─── LANDSCAPING ───────────────────────────────────────────────────────────────
// Source: Industry benchmarks, Holman, Turf Farm
export const LANDSCAPING_PRODUCTIVITY: ProductivityRate[] = [
  { task: "Turf laying (per m²)", unit: "m²", minutesMin: 3, minutesAvg: 4, minutesMax: 6 },
  { task: "Garden bed preparation (per m²)", unit: "m²", minutesMin: 8, minutesAvg: 10, minutesMax: 15 },
  { task: "Mulch spreading (per m²)", unit: "m²", minutesMin: 3, minutesAvg: 4, minutesMax: 6 },
  { task: "Concrete paving (per m²)", unit: "m²", minutesMin: 18, minutesAvg: 24, minutesMax: 35 },
  { task: "Natural stone paving (per m²)", unit: "m²", minutesMin: 25, minutesAvg: 32, minutesMax: 45 },
  { task: "Retaining wall block (per m²)", unit: "m²", minutesMin: 35, minutesAvg: 45, minutesMax: 60 },
  { task: "Timber sleeper retaining wall (per lm)", unit: "lm", minutesMin: 45, minutesAvg: 55, minutesMax: 70 },
  { task: "Irrigation drip line (per lm)", unit: "lm", minutesMin: 3, minutesAvg: 4, minutesMax: 6 },
  { task: "Colorbond fence panel (per panel)", unit: "ea", minutesMin: 45, minutesAvg: 55, minutesMax: 70 },
  { task: "Plant installation (per plant)", unit: "ea", minutesMin: 8, minutesAvg: 12, minutesMax: 18 },
];

// ─── CABINETRY / CABINET MAKING ────────────────────────────────────────────────
// Source: Industry benchmarks, ATFA, Blum installation guides
export const CABINETRY_PRODUCTIVITY: ProductivityRate[] = [
  { task: "Cabinet box installation (per box)", unit: "ea", minutesMin: 25, minutesAvg: 35, minutesMax: 50 },
  { task: "Door hanging + hardware (per door)", unit: "ea", minutesMin: 15, minutesAvg: 20, minutesMax: 30 },
  { task: "Drawer installation (per drawer)", unit: "ea", minutesMin: 20, minutesAvg: 25, minutesMax: 35 },
  { task: "Benchtop installation (per lm)", unit: "lm", minutesMin: 30, minutesAvg: 40, minutesMax: 55 },
  { task: "Splashback installation (per m²)", unit: "m²", minutesMin: 25, minutesAvg: 35, minutesMax: 50 },
  { task: "Full kitchen installation (complete)", unit: "ea", minutesMin: 960, minutesAvg: 1200, minutesMax: 1440, notes: "16-24 hrs for standard kitchen" },
  { task: "Wardrobe installation (per lm)", unit: "lm", minutesMin: 45, minutesAvg: 55, minutesMax: 70 },
  { task: "Bathroom vanity installation", unit: "ea", minutesMin: 60, minutesAvg: 75, minutesMax: 100 },
];


// ─── EV CHARGING ──────────────────────────────────────────────────────────────
// Source: EVSE Australia, Terawatt, KM Electric, industry benchmarks (2024-25)
export const EV_CHARGING_PRODUCTIVITY: ProductivityRate[] = [
  // Site Assessment & Preliminaries
  { task: "Pre-installation site assessment (residential)", unit: "ea", minutesMin: 45, minutesAvg: 60, minutesMax: 90, notes: "Assess switchboard, cable route, load capacity" },
  { task: "Pre-installation site assessment (commercial)", unit: "ea", minutesMin: 90, minutesAvg: 120, minutesMax: 180, notes: "Multi-bay, load management, DNSP requirements" },
  // Switchboard Work
  { task: "Add dedicated RCBO/circuit to existing switchboard", unit: "ea", minutesMin: 45, minutesAvg: 60, minutesMax: 90 },
  { task: "Switchboard upgrade for EV (load balancing, new circuits)", unit: "ea", minutesMin: 180, minutesAvg: 240, minutesMax: 360, notes: "3-6 hrs depending on complexity" },
  { task: "Install Type B RCD", unit: "ea", minutesMin: 30, minutesAvg: 45, minutesMax: 60 },
  { task: "Install 4-pole RCBO (three-phase EVSE)", unit: "ea", minutesMin: 30, minutesAvg: 45, minutesMax: 60 },
  // Cable Runs
  { task: "Cable run — surface mount (per lm)", unit: "lm", minutesMin: 3, minutesAvg: 5, minutesMax: 8 },
  { task: "Cable run — concealed in wall/ceiling (per lm)", unit: "lm", minutesMin: 8, minutesAvg: 12, minutesMax: 18 },
  { task: "Cable run — in conduit (per lm)", unit: "lm", minutesMin: 7, minutesAvg: 10, minutesMax: 14 },
  { task: "Underground cable in conduit — trenching (per lm)", unit: "lm", minutesMin: 20, minutesAvg: 30, minutesMax: 45, notes: "Includes conduit, sand bedding, backfill" },
  // Charger Installation
  { task: "Residential wallbox installation (Mode 3, single-phase, simple)", unit: "ea", minutesMin: 90, minutesAvg: 120, minutesMax: 180, notes: "2-3 hrs; switchboard within 10m, no trenching" },
  { task: "Residential wallbox installation (Mode 3, single-phase, complex)", unit: "ea", minutesMin: 180, minutesAvg: 240, minutesMax: 360, notes: "3-6 hrs; switchboard upgrade or long cable run" },
  { task: "Residential wallbox installation (Mode 3, three-phase)", unit: "ea", minutesMin: 240, minutesAvg: 300, minutesMax: 420, notes: "4-7 hrs; includes 4-pole RCBO, three-phase cable" },
  { task: "Commercial wallbox installation (per bay, AC 7.4-22kW)", unit: "ea", minutesMin: 120, minutesAvg: 180, minutesMax: 240, notes: "2-4 hrs per bay; assumes distribution board nearby" },
  { task: "DC fast charger installation (50kW+)", unit: "ea", minutesMin: 480, minutesAvg: 600, minutesMax: 960, notes: "8-16 hrs; includes switchboard, metering, civil coordination" },
  // Earthing
  { task: "Earth stake installation", unit: "ea", minutesMin: 30, minutesAvg: 45, minutesMax: 60 },
  { task: "Equipotential bonding (EV charger to earth)", unit: "ea", minutesMin: 20, minutesAvg: 30, minutesMax: 45 },
  // Testing & Commissioning
  { task: "Testing and commissioning per AS/NZS 3017 (residential)", unit: "ea", minutesMin: 30, minutesAvg: 45, minutesMax: 60, notes: "RCD test, insulation resistance, earth loop impedance" },
  { task: "Testing and commissioning (commercial, per charger)", unit: "ea", minutesMin: 45, minutesAvg: 60, minutesMax: 90 },
  { task: "OCPP network configuration and testing", unit: "ea", minutesMin: 30, minutesAvg: 45, minutesMax: 90, notes: "Smart charging network setup" },
  { task: "Customer handover and demonstration", unit: "ea", minutesMin: 20, minutesAvg: 30, minutesMax: 45 },

  // DC Fast Charger Infrastructure (Mode 4 — high-power commercial)
  { task: "DC fast charger site assessment and DNSP pre-application", unit: "ea", minutesMin: 120, minutesAvg: 180, minutesMax: 300, notes: "Includes load assessment, DNSP requirements, site survey" },
  { task: "High-voltage switchboard design and installation (DC fast charger site)", unit: "ea", minutesMin: 480, minutesAvg: 720, minutesMax: 1200, notes: "8-20 hrs; includes design, supply, install, and commissioning" },
  { task: "3-phase HV supply cable run to DC charger cabinet (per lm)", unit: "lm", minutesMin: 15, minutesAvg: 22, minutesMax: 35, notes: "Large cable, heavy conduit — significantly more than standard cable runs" },
  { task: "Concrete equipment pad for DC fast charger (inc. civil)", unit: "ea", minutesMin: 240, minutesAvg: 360, minutesMax: 480, notes: "4-8 hrs; includes formwork, pour, cure — often subcontracted" },
  { task: "Protection relay installation and commissioning", unit: "ea", minutesMin: 120, minutesAvg: 180, minutesMax: 300 },
  { task: "NMI-compliant metering installation (AS 62053-22)", unit: "ea", minutesMin: 90, minutesAvg: 120, minutesMax: 180 },
  { task: "Earthing system for DC fast charger site (stakes, bonding, testing)", unit: "ea", minutesMin: 120, minutesAvg: 180, minutesMax: 300 },
  { task: "OCPP load management system installation and configuration", unit: "ea", minutesMin: 120, minutesAvg: 180, minutesMax: 300, notes: "Network setup, charger registration, load balancing config" },
  { task: "DC fast charger site commissioning and testing (full site)", unit: "ea", minutesMin: 240, minutesAvg: 360, minutesMax: 480, notes: "4-8 hrs; includes all chargers, metering, protection, OCPP" },
  // Network Operator Maintenance
  { task: "Routine site inspection (visual, cable check, cleaning — per charger)", unit: "ea", minutesMin: 20, minutesAvg: 30, minutesMax: 45, notes: "Per charger; add travel/call-out separately" },
  { task: "Quarterly preventive maintenance visit (per DC fast charger)", unit: "ea", minutesMin: 45, minutesAvg: 60, minutesMax: 90 },
  { task: "Emergency call-out and fault diagnosis (DC fast charger)", unit: "ea", minutesMin: 60, minutesAvg: 90, minutesMax: 180, notes: "Diagnosis only; internal repairs may require OEM certification" },

  // Maintenance & Repair
  { task: "Fault diagnosis and reset (GFCI trip, comms error)", unit: "ea", minutesMin: 30, minutesAvg: 45, minutesMax: 90 },
  { task: "Cable and connector inspection (visual + electrical)", unit: "ea", minutesMin: 20, minutesAvg: 30, minutesMax: 45 },
  { task: "Type 2 connector/cable replacement", unit: "ea", minutesMin: 45, minutesAvg: 60, minutesMax: 90 },
  { task: "RCD/GFCI replacement (EV circuit)", unit: "ea", minutesMin: 30, minutesAvg: 45, minutesMax: 60 },
  { task: "Firmware update and network reconfiguration", unit: "ea", minutesMin: 20, minutesAvg: 30, minutesMax: 60 },
  { task: "Annual preventive maintenance service (residential)", unit: "ea", minutesMin: 45, minutesAvg: 60, minutesMax: 90 },
  { task: "Annual preventive maintenance service (commercial, per charger)", unit: "ea", minutesMin: 60, minutesAvg: 90, minutesMax: 120 },
];

// ─── HELPER: Get productivity data for a trade ─────────────────────────────────
export function getProductivityForTrade(trade: string): ProductivityRate[] {
  const tradeMap: Record<string, ProductivityRate[]> = {
    electrical: ELECTRICAL_PRODUCTIVITY,
    plumbing: PLUMBING_PRODUCTIVITY,
    painting: PAINTING_PRODUCTIVITY,
    tiling: TILING_PRODUCTIVITY,
    plastering: PLASTERING_PRODUCTIVITY,
    rendering: PLASTERING_PRODUCTIVITY,
    carpentry: CARPENTRY_PRODUCTIVITY,
    concreting: CONCRETING_PRODUCTIVITY,
    hvac: HVAC_PRODUCTIVITY,
    flooring: FLOORING_PRODUCTIVITY,
    landscaping: LANDSCAPING_PRODUCTIVITY,
    cabinetry: CABINETRY_PRODUCTIVITY,
    "cabinet making": CABINETRY_PRODUCTIVITY,
    "ev-charging": EV_CHARGING_PRODUCTIVITY,
    "ev charging": EV_CHARGING_PRODUCTIVITY,
    evcharging: EV_CHARGING_PRODUCTIVITY,
  };
  const key = trade.toLowerCase().replace(/[^a-z ]/g, "");
  return tradeMap[key] ?? [];
}

// ─── HELPER: Format productivity data as prompt section ────────────────────────
export function buildProductivityPromptSection(trade: string): string {
  const rates = getProductivityForTrade(trade);
  if (rates.length === 0) return "";

  const lines = rates
    .map(r => `- ${r.task} (${r.unit}): ${r.minutesAvg} min avg (range ${r.minutesMin}-${r.minutesMax} min)${r.notes ? ` — ${r.notes}` : ""}`)
    .join("\n");

  return `
LABOUR PRODUCTIVITY BENCHMARKS (Australian industry standard — use these for labourMinutes field):
These are real-world task-level productivity rates from Methvin, Resene, WireWise, and QS cost reports.
Use the average (minutesAvg) as your baseline. Apply complexity multipliers:
  • New construction: 1.0x (baseline)
  • Renovation / existing building: 1.4x
  • High-end / custom work: 1.6x
  • Difficult access (crawl spaces, heights): 1.75x

${lines}

IMPORTANT: Use these benchmarks for the labourMinutes field on each line item. Do NOT guess — use the closest matching benchmark and note any adjustment applied.`;
}
