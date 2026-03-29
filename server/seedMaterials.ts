/**
 * Seed default materials library with 2024-25 Australian trade pricing.
 * userId = null means system/global material visible to all users.
 * Run via: npx tsx server/seedMaterials.ts
 */

import { getDb } from "./db";
import { materials } from "../drizzle/schema";
import { isNull, eq, and } from "drizzle-orm";

type SeedMaterial = {
  trade: string;
  category: string;
  name: string;
  description?: string;
  unit: string;
  unitPrice: string;
  supplier?: string;
  wasteFactor?: string;
};

const SEED_MATERIALS: SeedMaterial[] = [
  // ─── ELECTRICAL ──────────────────────────────────────────────────────────────
  { trade: "electrical", category: "Wiring", name: "2.5mm Twin & Earth Cable", description: "Standard T&E 2.5mm² for power circuits", unit: "m", unitPrice: "2.85", supplier: "Clipsal/HPM", wasteFactor: "10" },
  { trade: "electrical", category: "Wiring", name: "1.5mm Twin & Earth Cable", description: "Standard T&E 1.5mm² for lighting circuits", unit: "m", unitPrice: "1.95", supplier: "Clipsal/HPM", wasteFactor: "10" },
  { trade: "electrical", category: "Wiring", name: "4mm Twin & Earth Cable", description: "4mm² T&E for larger circuits", unit: "m", unitPrice: "4.20", supplier: "Clipsal/HPM", wasteFactor: "10" },
  { trade: "electrical", category: "Wiring", name: "6mm Twin & Earth Cable", description: "6mm² T&E for stove/oven circuits", unit: "m", unitPrice: "6.80", supplier: "Clipsal/HPM", wasteFactor: "10" },
  { trade: "electrical", category: "Wiring", name: "16mm 3-Phase Cable", description: "16mm² 3-phase for large loads", unit: "m", unitPrice: "18.50", supplier: "Prysmian", wasteFactor: "8" },
  { trade: "electrical", category: "Wiring", name: "Conduit 20mm PVC", description: "20mm PVC conduit for surface/concealed runs", unit: "m", unitPrice: "1.45", supplier: "Clipsal", wasteFactor: "10" },
  { trade: "electrical", category: "Wiring", name: "Conduit 25mm PVC", description: "25mm PVC conduit", unit: "m", unitPrice: "1.95", supplier: "Clipsal", wasteFactor: "10" },
  { trade: "electrical", category: "Outlets & Switches", name: "GPO Double Power Point 10A", description: "Double GPO 10A flush plate", unit: "ea", unitPrice: "18.50", supplier: "Clipsal/HPM", wasteFactor: "0" },
  { trade: "electrical", category: "Outlets & Switches", name: "GPO Single Power Point 10A", description: "Single GPO 10A flush plate", unit: "ea", unitPrice: "12.80", supplier: "Clipsal/HPM", wasteFactor: "0" },
  { trade: "electrical", category: "Outlets & Switches", name: "USB Double Power Point", description: "Double GPO with USB-A/C charging", unit: "ea", unitPrice: "42.00", supplier: "Clipsal", wasteFactor: "0" },
  { trade: "electrical", category: "Outlets & Switches", name: "Single Switch 10A", description: "Single pole switch 10A", unit: "ea", unitPrice: "9.50", supplier: "Clipsal/HPM", wasteFactor: "0" },
  { trade: "electrical", category: "Outlets & Switches", name: "Double Switch 10A", description: "Double pole switch 10A", unit: "ea", unitPrice: "14.20", supplier: "Clipsal/HPM", wasteFactor: "0" },
  { trade: "electrical", category: "Outlets & Switches", name: "Dimmer Switch LED", description: "LED compatible dimmer switch", unit: "ea", unitPrice: "38.50", supplier: "Clipsal/HPM", wasteFactor: "0" },
  { trade: "electrical", category: "Lighting", name: "LED Downlight 10W", description: "10W LED downlight, warm white, dimmable", unit: "ea", unitPrice: "28.50", supplier: "Brilliant/Mercator", wasteFactor: "0" },
  { trade: "electrical", category: "Lighting", name: "LED Downlight 13W", description: "13W LED downlight, IP44 rated", unit: "ea", unitPrice: "35.00", supplier: "Brilliant/Mercator", wasteFactor: "0" },
  { trade: "electrical", category: "Lighting", name: "LED Batten Light 36W 1200mm", description: "36W LED batten for garage/workshop", unit: "ea", unitPrice: "48.00", supplier: "Philips/Osram", wasteFactor: "0" },
  { trade: "electrical", category: "Safety", name: "Smoke Alarm 240V Interconnectable", description: "240V hardwired smoke alarm", unit: "ea", unitPrice: "45.00", supplier: "Brooks/Clipsal", wasteFactor: "0" },
  { trade: "electrical", category: "Safety", name: "Safety Switch RCD 30mA", description: "30mA RCD safety switch for switchboard", unit: "ea", unitPrice: "85.00", supplier: "Clipsal/Schneider", wasteFactor: "0" },
  { trade: "electrical", category: "Switchboard", name: "MCB 10A Single Pole", description: "10A single pole circuit breaker", unit: "ea", unitPrice: "22.00", supplier: "Schneider/ABB", wasteFactor: "0" },
  { trade: "electrical", category: "Switchboard", name: "MCB 20A Single Pole", description: "20A single pole circuit breaker", unit: "ea", unitPrice: "24.00", supplier: "Schneider/ABB", wasteFactor: "0" },
  { trade: "electrical", category: "Switchboard", name: "MCB 32A Single Pole", description: "32A single pole circuit breaker", unit: "ea", unitPrice: "28.00", supplier: "Schneider/ABB", wasteFactor: "0" },
  { trade: "electrical", category: "Switchboard", name: "Switchboard 12-Way Surface", description: "12-way surface mount switchboard", unit: "ea", unitPrice: "185.00", supplier: "Schneider/Clipsal", wasteFactor: "0" },
  { trade: "electrical", category: "Switchboard", name: "Switchboard 24-Way Flush", description: "24-way flush mount switchboard", unit: "ea", unitPrice: "320.00", supplier: "Schneider/Clipsal", wasteFactor: "0" },
  { trade: "electrical", category: "Data & Comms", name: "Data Point Cat6 Single", description: "Cat6 data outlet single port", unit: "ea", unitPrice: "32.00", supplier: "Clipsal/Legrand", wasteFactor: "0" },
  { trade: "electrical", category: "Data & Comms", name: "Cat6 Cable", description: "Cat6 UTP cable for data runs", unit: "m", unitPrice: "1.85", supplier: "Clipsal/Legrand", wasteFactor: "10" },

  // ─── PLUMBING ─────────────────────────────────────────────────────────────────
  { trade: "plumbing", category: "Copper Pipe", name: "Copper Pipe 15mm", description: "15mm copper tube Type B", unit: "m", unitPrice: "8.50", supplier: "Tradelink/Reece", wasteFactor: "10" },
  { trade: "plumbing", category: "Copper Pipe", name: "Copper Pipe 20mm", description: "20mm copper tube Type B", unit: "m", unitPrice: "12.80", supplier: "Tradelink/Reece", wasteFactor: "10" },
  { trade: "plumbing", category: "Copper Pipe", name: "Copper Pipe 25mm", description: "25mm copper tube Type B", unit: "m", unitPrice: "18.50", supplier: "Tradelink/Reece", wasteFactor: "10" },
  { trade: "plumbing", category: "PEX Pipe", name: "PEX-A Pipe 16mm", description: "16mm PEX-A flexible pipe", unit: "m", unitPrice: "3.20", supplier: "Reece/Tradelink", wasteFactor: "10" },
  { trade: "plumbing", category: "PEX Pipe", name: "PEX-A Pipe 20mm", description: "20mm PEX-A flexible pipe", unit: "m", unitPrice: "4.80", supplier: "Reece/Tradelink", wasteFactor: "10" },
  { trade: "plumbing", category: "PVC Drainage", name: "PVC Drain Pipe 50mm", description: "50mm PVC drainage pipe", unit: "m", unitPrice: "6.50", supplier: "Iplex/Vinidex", wasteFactor: "10" },
  { trade: "plumbing", category: "PVC Drainage", name: "PVC Drain Pipe 100mm", description: "100mm PVC drainage pipe", unit: "m", unitPrice: "12.50", supplier: "Iplex/Vinidex", wasteFactor: "10" },
  { trade: "plumbing", category: "PVC Drainage", name: "PVC Drain Pipe 150mm", description: "150mm PVC drainage pipe", unit: "m", unitPrice: "22.00", supplier: "Iplex/Vinidex", wasteFactor: "10" },
  { trade: "plumbing", category: "Fixtures", name: "Toilet Suite Close Coupled", description: "Close coupled toilet suite, dual flush", unit: "ea", unitPrice: "285.00", supplier: "Caroma/Fowler", wasteFactor: "0" },
  { trade: "plumbing", category: "Fixtures", name: "Basin 500mm Wall Hung", description: "500mm wall hung vanity basin", unit: "ea", unitPrice: "145.00", supplier: "Caroma/Fowler", wasteFactor: "0" },
  { trade: "plumbing", category: "Fixtures", name: "Shower Rose 200mm", description: "200mm overhead shower rose", unit: "ea", unitPrice: "85.00", supplier: "Methven/Caroma", wasteFactor: "0" },
  { trade: "plumbing", category: "Fixtures", name: "Bath Mixer Tap Set", description: "Bath/shower mixer set with diverter", unit: "ea", unitPrice: "185.00", supplier: "Methven/Caroma", wasteFactor: "0" },
  { trade: "plumbing", category: "Fixtures", name: "Kitchen Mixer Tap", description: "Kitchen sink mixer tap", unit: "ea", unitPrice: "145.00", supplier: "Methven/Caroma", wasteFactor: "0" },
  { trade: "plumbing", category: "Hot Water", name: "Hot Water Unit 250L Electric", description: "250L electric storage hot water unit", unit: "ea", unitPrice: "680.00", supplier: "Rheem/Dux", wasteFactor: "0" },
  { trade: "plumbing", category: "Hot Water", name: "Hot Water Unit 170L Gas", description: "170L gas storage hot water unit", unit: "ea", unitPrice: "850.00", supplier: "Rheem/Rinnai", wasteFactor: "0" },
  { trade: "plumbing", category: "Hot Water", name: "Continuous Flow Gas 26L", description: "26L/min continuous flow gas hot water", unit: "ea", unitPrice: "1250.00", supplier: "Rinnai/Bosch", wasteFactor: "0" },
  { trade: "plumbing", category: "Valves & Fittings", name: "Ball Valve 15mm", description: "15mm brass ball valve", unit: "ea", unitPrice: "18.50", supplier: "Reece/Tradelink", wasteFactor: "0" },
  { trade: "plumbing", category: "Valves & Fittings", name: "Ball Valve 20mm", description: "20mm brass ball valve", unit: "ea", unitPrice: "24.00", supplier: "Reece/Tradelink", wasteFactor: "0" },
  { trade: "plumbing", category: "Valves & Fittings", name: "Pressure Limiting Valve", description: "Pressure limiting valve 500kPa", unit: "ea", unitPrice: "85.00", supplier: "Reece/Tradelink", wasteFactor: "0" },

  // ─── CARPENTRY ────────────────────────────────────────────────────────────────
  { trade: "carpentry", category: "Framing Timber", name: "90x45 MGP10 Pine", description: "90x45mm MGP10 structural pine", unit: "lm", unitPrice: "5.80", supplier: "Bowens/Bunnings Trade", wasteFactor: "15" },
  { trade: "carpentry", category: "Framing Timber", name: "70x45 MGP10 Pine", description: "70x45mm MGP10 structural pine", unit: "lm", unitPrice: "4.20", supplier: "Bowens/Bunnings Trade", wasteFactor: "15" },
  { trade: "carpentry", category: "Framing Timber", name: "140x45 MGP10 Pine", description: "140x45mm MGP10 structural pine", unit: "lm", unitPrice: "9.50", supplier: "Bowens/Bunnings Trade", wasteFactor: "15" },
  { trade: "carpentry", category: "Framing Timber", name: "190x45 LVL Beam", description: "190x45mm LVL structural beam", unit: "lm", unitPrice: "18.50", supplier: "Carter Holt Harvey", wasteFactor: "5" },
  { trade: "carpentry", category: "Framing Timber", name: "240x45 LVL Beam", description: "240x45mm LVL structural beam", unit: "lm", unitPrice: "24.00", supplier: "Carter Holt Harvey", wasteFactor: "5" },
  { trade: "carpentry", category: "Sheet Material", name: "Plywood Structural 17mm", description: "17mm structural plywood F17", unit: "sheet", unitPrice: "68.00", supplier: "Bowens/Bunnings Trade", wasteFactor: "10" },
  { trade: "carpentry", category: "Sheet Material", name: "Plywood Structural 12mm", description: "12mm structural plywood F17", unit: "sheet", unitPrice: "52.00", supplier: "Bowens/Bunnings Trade", wasteFactor: "10" },
  { trade: "carpentry", category: "Sheet Material", name: "Particleboard Flooring 19mm", description: "19mm tongue & groove particleboard flooring", unit: "sheet", unitPrice: "58.00", supplier: "Bowens/Bunnings Trade", wasteFactor: "10" },
  { trade: "carpentry", category: "Sheet Material", name: "Plasterboard 10mm", description: "10mm plasterboard standard", unit: "sheet", unitPrice: "18.50", supplier: "Gyprock/USG", wasteFactor: "15" },
  { trade: "carpentry", category: "Sheet Material", name: "Plasterboard 13mm", description: "13mm plasterboard standard", unit: "sheet", unitPrice: "22.00", supplier: "Gyprock/USG", wasteFactor: "15" },
  { trade: "carpentry", category: "Doors", name: "Internal Door 820x2040 Hollow Core", description: "820x2040mm hollow core internal door", unit: "ea", unitPrice: "95.00", supplier: "Corinthian/Hume", wasteFactor: "0" },
  { trade: "carpentry", category: "Doors", name: "Internal Door 820x2040 Solid Core", description: "820x2040mm solid core internal door", unit: "ea", unitPrice: "185.00", supplier: "Corinthian/Hume", wasteFactor: "0" },
  { trade: "carpentry", category: "Doors", name: "External Door 870x2040 Solid Timber", description: "870x2040mm solid timber external door", unit: "ea", unitPrice: "380.00", supplier: "Corinthian/Hume", wasteFactor: "0" },
  { trade: "carpentry", category: "Fixings", name: "Framing Nails 90mm Ring Shank", description: "90mm ring shank framing nails 3kg box", unit: "box", unitPrice: "28.50", supplier: "ITW/Paslode", wasteFactor: "5" },
  { trade: "carpentry", category: "Fixings", name: "Joist Hanger LUS210", description: "LUS210 joist hanger galvanised", unit: "ea", unitPrice: "4.80", supplier: "Simpson Strong-Tie", wasteFactor: "0" },
  { trade: "carpentry", category: "Fixings", name: "Hurricane Tie H2.5", description: "H2.5 hurricane tie for rafter connections", unit: "ea", unitPrice: "3.20", supplier: "Simpson Strong-Tie", wasteFactor: "0" },

  // ─── CONCRETING ───────────────────────────────────────────────────────────────
  { trade: "concreting", category: "Concrete", name: "Concrete 20MPa Pump Mix", description: "20MPa concrete pump mix delivered", unit: "m³", unitPrice: "195.00", supplier: "Boral/Hanson", wasteFactor: "5" },
  { trade: "concreting", category: "Concrete", name: "Concrete 25MPa Pump Mix", description: "25MPa concrete pump mix delivered", unit: "m³", unitPrice: "210.00", supplier: "Boral/Hanson", wasteFactor: "5" },
  { trade: "concreting", category: "Concrete", name: "Concrete 32MPa Pump Mix", description: "32MPa concrete pump mix delivered", unit: "m³", unitPrice: "235.00", supplier: "Boral/Hanson", wasteFactor: "5" },
  { trade: "concreting", category: "Concrete", name: "Concrete 40MPa Pump Mix", description: "40MPa concrete pump mix delivered", unit: "m³", unitPrice: "265.00", supplier: "Boral/Hanson", wasteFactor: "5" },
  { trade: "concreting", category: "Reinforcement", name: "SL82 Mesh Sheet 6x2.4m", description: "SL82 reinforcing mesh sheet", unit: "sheet", unitPrice: "68.00", supplier: "InfraBuild/OneSteel", wasteFactor: "10" },
  { trade: "concreting", category: "Reinforcement", name: "SL92 Mesh Sheet 6x2.4m", description: "SL92 reinforcing mesh sheet", unit: "sheet", unitPrice: "85.00", supplier: "InfraBuild/OneSteel", wasteFactor: "10" },
  { trade: "concreting", category: "Reinforcement", name: "N12 Rebar 6m", description: "N12 deformed bar 6m length", unit: "ea", unitPrice: "18.50", supplier: "InfraBuild/OneSteel", wasteFactor: "10" },
  { trade: "concreting", category: "Reinforcement", name: "N16 Rebar 6m", description: "N16 deformed bar 6m length", unit: "ea", unitPrice: "28.00", supplier: "InfraBuild/OneSteel", wasteFactor: "10" },
  { trade: "concreting", category: "Formwork", name: "Formply 17mm", description: "17mm form ply for concrete formwork", unit: "sheet", unitPrice: "95.00", supplier: "Bowens/Nubco", wasteFactor: "20" },
  { trade: "concreting", category: "Formwork", name: "Formwork Timber 90x45", description: "90x45mm formwork timber", unit: "lm", unitPrice: "5.50", supplier: "Bowens/Nubco", wasteFactor: "20" },
  { trade: "concreting", category: "Accessories", name: "Bar Chair 65mm", description: "65mm plastic bar chair for mesh support", unit: "ea", unitPrice: "0.45", supplier: "Various", wasteFactor: "5" },
  { trade: "concreting", category: "Accessories", name: "Concrete Curing Compound", description: "Concrete curing compound 20L", unit: "ea", unitPrice: "65.00", supplier: "Parchem/Sika", wasteFactor: "5" },
  { trade: "concreting", category: "Accessories", name: "DPC Membrane 200um", description: "200um polyethylene DPC membrane", unit: "m²", unitPrice: "1.85", supplier: "Various", wasteFactor: "10" },
  { trade: "concreting", category: "Accessories", name: "Expansion Joint 10mm", description: "10mm foam expansion joint strip", unit: "lm", unitPrice: "2.80", supplier: "Various", wasteFactor: "5" },

  // ─── HVAC ─────────────────────────────────────────────────────────────────────
  { trade: "hvac", category: "Split Systems", name: "Split System 2.5kW Reverse Cycle", description: "2.5kW wall split system, reverse cycle", unit: "ea", unitPrice: "850.00", supplier: "Daikin/Mitsubishi", wasteFactor: "0" },
  { trade: "hvac", category: "Split Systems", name: "Split System 3.5kW Reverse Cycle", description: "3.5kW wall split system, reverse cycle", unit: "ea", unitPrice: "1050.00", supplier: "Daikin/Mitsubishi", wasteFactor: "0" },
  { trade: "hvac", category: "Split Systems", name: "Split System 5.0kW Reverse Cycle", description: "5.0kW wall split system, reverse cycle", unit: "ea", unitPrice: "1350.00", supplier: "Daikin/Mitsubishi", wasteFactor: "0" },
  { trade: "hvac", category: "Split Systems", name: "Split System 7.1kW Reverse Cycle", description: "7.1kW wall split system, reverse cycle", unit: "ea", unitPrice: "1750.00", supplier: "Daikin/Mitsubishi", wasteFactor: "0" },
  { trade: "hvac", category: "Ducted Systems", name: "Ducted System 10kW 3-Zone", description: "10kW ducted reverse cycle, 3-zone", unit: "ea", unitPrice: "3800.00", supplier: "Daikin/Actron", wasteFactor: "0" },
  { trade: "hvac", category: "Ducted Systems", name: "Ducted System 14kW 5-Zone", description: "14kW ducted reverse cycle, 5-zone", unit: "ea", unitPrice: "5200.00", supplier: "Daikin/Actron", wasteFactor: "0" },
  { trade: "hvac", category: "Ductwork", name: "Flexible Duct 200mm", description: "200mm flexible insulated duct", unit: "m", unitPrice: "18.50", supplier: "Trox/Fantech", wasteFactor: "10" },
  { trade: "hvac", category: "Ductwork", name: "Flexible Duct 250mm", description: "250mm flexible insulated duct", unit: "m", unitPrice: "24.00", supplier: "Trox/Fantech", wasteFactor: "10" },
  { trade: "hvac", category: "Ductwork", name: "Supply Air Grille 300x150", description: "300x150mm supply air grille", unit: "ea", unitPrice: "38.00", supplier: "Trox/Fantech", wasteFactor: "0" },
  { trade: "hvac", category: "Ductwork", name: "Return Air Grille 600x300", description: "600x300mm return air grille", unit: "ea", unitPrice: "65.00", supplier: "Trox/Fantech", wasteFactor: "0" },
  { trade: "hvac", category: "Refrigerant Pipe", name: "Refrigerant Pipe 1/4\" + 3/8\" Pair", description: "1/4\" + 3/8\" copper refrigerant pipe pair", unit: "m", unitPrice: "28.50", supplier: "Tradelink/Reece", wasteFactor: "10" },
  { trade: "hvac", category: "Refrigerant Pipe", name: "Refrigerant Pipe 1/4\" + 1/2\" Pair", description: "1/4\" + 1/2\" copper refrigerant pipe pair", unit: "m", unitPrice: "35.00", supplier: "Tradelink/Reece", wasteFactor: "10" },

  // ─── FLOORING ─────────────────────────────────────────────────────────────────
  { trade: "flooring", category: "Hybrid Flooring", name: "Hybrid Flooring 6mm SPC", description: "6mm SPC hybrid flooring, waterproof", unit: "m²", unitPrice: "38.00", supplier: "Carpet Court/Flooring Xtra", wasteFactor: "10" },
  { trade: "flooring", category: "Hybrid Flooring", name: "Hybrid Flooring 8mm SPC", description: "8mm SPC hybrid flooring, waterproof", unit: "m²", unitPrice: "48.00", supplier: "Carpet Court/Flooring Xtra", wasteFactor: "10" },
  { trade: "flooring", category: "Laminate", name: "Laminate Flooring 8mm AC4", description: "8mm AC4 laminate flooring", unit: "m²", unitPrice: "28.00", supplier: "Carpet Court/Flooring Xtra", wasteFactor: "10" },
  { trade: "flooring", category: "Laminate", name: "Laminate Flooring 12mm AC5", description: "12mm AC5 laminate flooring", unit: "m²", unitPrice: "42.00", supplier: "Carpet Court/Flooring Xtra", wasteFactor: "10" },
  { trade: "flooring", category: "Timber", name: "Engineered Timber 14mm", description: "14mm engineered timber flooring", unit: "m²", unitPrice: "85.00", supplier: "Hurford/Boral", wasteFactor: "10" },
  { trade: "flooring", category: "Timber", name: "Solid Timber 19mm Blackbutt", description: "19mm solid blackbutt timber flooring", unit: "m²", unitPrice: "125.00", supplier: "Hurford/Boral", wasteFactor: "10" },
  { trade: "flooring", category: "Carpet", name: "Carpet Residential Nylon 30oz", description: "30oz nylon carpet residential grade", unit: "m²", unitPrice: "32.00", supplier: "Carpet Court/Godfrey Hirst", wasteFactor: "15" },
  { trade: "flooring", category: "Carpet", name: "Carpet Commercial Loop Pile", description: "Commercial loop pile carpet", unit: "m²", unitPrice: "45.00", supplier: "Carpet Court/Godfrey Hirst", wasteFactor: "10" },
  { trade: "flooring", category: "Underlay", name: "Foam Underlay 8mm", description: "8mm foam underlay for floating floors", unit: "m²", unitPrice: "4.50", supplier: "Various", wasteFactor: "10" },
  { trade: "flooring", category: "Underlay", name: "Carpet Underlay 10mm", description: "10mm carpet underlay", unit: "m²", unitPrice: "6.50", supplier: "Various", wasteFactor: "10" },
  { trade: "flooring", category: "Accessories", name: "Threshold Strip Aluminium", description: "Aluminium threshold/transition strip", unit: "ea", unitPrice: "18.50", supplier: "Various", wasteFactor: "0" },
  { trade: "flooring", category: "Accessories", name: "Skirting Board 67x18mm", description: "67x18mm MDF skirting board", unit: "lm", unitPrice: "4.80", supplier: "Bowens/Bunnings Trade", wasteFactor: "10" },
  { trade: "flooring", category: "Tiles", name: "Porcelain Floor Tile 600x600", description: "600x600mm porcelain floor tile", unit: "m²", unitPrice: "38.00", supplier: "Beaumont Tiles/Tile Depot", wasteFactor: "10" },
  { trade: "flooring", category: "Tiles", name: "Tile Adhesive 20kg", description: "Flexible tile adhesive 20kg bag", unit: "bag", unitPrice: "28.50", supplier: "Mapei/Ardex", wasteFactor: "5" },
  { trade: "flooring", category: "Tiles", name: "Tile Grout 5kg", description: "Sanded tile grout 5kg bag", unit: "bag", unitPrice: "18.50", supplier: "Mapei/Ardex", wasteFactor: "5" },

  // ─── LANDSCAPING ──────────────────────────────────────────────────────────────
  { trade: "landscaping", category: "Turf & Lawn", name: "Turf Sir Walter Buffalo", description: "Sir Walter Buffalo turf", unit: "m²", unitPrice: "12.50", supplier: "Turf Farm Direct", wasteFactor: "5" },
  { trade: "landscaping", category: "Turf & Lawn", name: "Turf Kikuyu", description: "Kikuyu turf", unit: "m²", unitPrice: "9.50", supplier: "Turf Farm Direct", wasteFactor: "5" },
  { trade: "landscaping", category: "Turf & Lawn", name: "Lawn Undersoil 100mm", description: "Lawn undersoil/topsoil 100mm depth", unit: "m²", unitPrice: "8.50", supplier: "Various", wasteFactor: "5" },
  { trade: "landscaping", category: "Paving", name: "Concrete Paver 400x400", description: "400x400mm concrete paver 40mm thick", unit: "m²", unitPrice: "45.00", supplier: "Boral/Adbri", wasteFactor: "10" },
  { trade: "landscaping", category: "Paving", name: "Sandstone Paver 600x300", description: "600x300mm sandstone paver", unit: "m²", unitPrice: "85.00", supplier: "Various", wasteFactor: "10" },
  { trade: "landscaping", category: "Paving", name: "Paving Sand 20kg", description: "Paving sand 20kg bag", unit: "bag", unitPrice: "8.50", supplier: "Boral/Various", wasteFactor: "5" },
  { trade: "landscaping", category: "Retaining Walls", name: "Besser Block 390x190x190", description: "390x190x190mm concrete besser block", unit: "ea", unitPrice: "4.80", supplier: "Boral/Adbri", wasteFactor: "5" },
  { trade: "landscaping", category: "Retaining Walls", name: "Sleeper Hardwood 200x75", description: "200x75mm hardwood sleeper 2.4m", unit: "ea", unitPrice: "38.00", supplier: "Bowens/Various", wasteFactor: "5" },
  { trade: "landscaping", category: "Retaining Walls", name: "Galvanised Post 100x100", description: "100x100mm galvanised steel post", unit: "ea", unitPrice: "45.00", supplier: "Midalia/Various", wasteFactor: "0" },
  { trade: "landscaping", category: "Irrigation", name: "Poly Pipe 19mm", description: "19mm poly pipe for irrigation", unit: "m", unitPrice: "1.85", supplier: "Holman/Rainbird", wasteFactor: "10" },
  { trade: "landscaping", category: "Irrigation", name: "Drip Emitter 4L/hr", description: "4L/hr drip emitter", unit: "ea", unitPrice: "0.85", supplier: "Holman/Rainbird", wasteFactor: "5" },
  { trade: "landscaping", category: "Irrigation", name: "Irrigation Controller 6-Zone", description: "6-zone irrigation controller", unit: "ea", unitPrice: "185.00", supplier: "Holman/Rainbird", wasteFactor: "0" },
  { trade: "landscaping", category: "Mulch & Soil", name: "Garden Mulch Hardwood", description: "Hardwood garden mulch per cubic metre", unit: "m³", unitPrice: "75.00", supplier: "Various", wasteFactor: "5" },
  { trade: "landscaping", category: "Mulch & Soil", name: "Premium Garden Soil", description: "Premium garden soil per cubic metre", unit: "m³", unitPrice: "85.00", supplier: "Various", wasteFactor: "5" },

  // ─── CABINETRY ────────────────────────────────────────────────────────────────
  { trade: "cabinetry", category: "Cabinet Boxes", name: "Base Cabinet 600mm", description: "600mm base cabinet carcass", unit: "ea", unitPrice: "185.00", supplier: "Kaboodle/Polytec", wasteFactor: "0" },
  { trade: "cabinetry", category: "Cabinet Boxes", name: "Base Cabinet 900mm", description: "900mm base cabinet carcass", unit: "ea", unitPrice: "245.00", supplier: "Kaboodle/Polytec", wasteFactor: "0" },
  { trade: "cabinetry", category: "Cabinet Boxes", name: "Overhead Cabinet 600mm", description: "600mm overhead cabinet carcass", unit: "ea", unitPrice: "145.00", supplier: "Kaboodle/Polytec", wasteFactor: "0" },
  { trade: "cabinetry", category: "Cabinet Boxes", name: "Overhead Cabinet 900mm", description: "900mm overhead cabinet carcass", unit: "ea", unitPrice: "185.00", supplier: "Kaboodle/Polytec", wasteFactor: "0" },
  { trade: "cabinetry", category: "Cabinet Boxes", name: "Pantry Cabinet 600mm 2100H", description: "600mm pantry cabinet 2100mm high", unit: "ea", unitPrice: "485.00", supplier: "Kaboodle/Polytec", wasteFactor: "0" },
  { trade: "cabinetry", category: "Benchtops", name: "Laminate Benchtop 33mm", description: "33mm laminate benchtop per linear metre", unit: "lm", unitPrice: "185.00", supplier: "Laminex/Formica", wasteFactor: "5" },
  { trade: "cabinetry", category: "Benchtops", name: "Stone Benchtop 20mm Engineered", description: "20mm engineered stone benchtop per m²", unit: "m²", unitPrice: "450.00", supplier: "Caesarstone/Quantum Quartz", wasteFactor: "5" },
  { trade: "cabinetry", category: "Benchtops", name: "Timber Benchtop 40mm Blackbutt", description: "40mm solid blackbutt timber benchtop per lm", unit: "lm", unitPrice: "380.00", supplier: "Various", wasteFactor: "5" },
  { trade: "cabinetry", category: "Hardware", name: "Soft Close Hinge Pair", description: "Soft close cabinet hinge pair", unit: "pair", unitPrice: "8.50", supplier: "Blum/Hafele", wasteFactor: "0" },
  { trade: "cabinetry", category: "Hardware", name: "Drawer Runner 450mm Soft Close", description: "450mm soft close drawer runner pair", unit: "pair", unitPrice: "28.50", supplier: "Blum/Hafele", wasteFactor: "0" },
  { trade: "cabinetry", category: "Hardware", name: "Cabinet Handle 128mm", description: "128mm cabinet handle", unit: "ea", unitPrice: "12.50", supplier: "Various", wasteFactor: "0" },
  { trade: "cabinetry", category: "Sheet Material", name: "Melamine Board 16mm White", description: "16mm white melamine board 2400x1200", unit: "sheet", unitPrice: "68.00", supplier: "Laminex/Polytec", wasteFactor: "15" },
  { trade: "cabinetry", category: "Sheet Material", name: "MDF 16mm", description: "16mm MDF sheet 2400x1200", unit: "sheet", unitPrice: "52.00", supplier: "Laminex/Various", wasteFactor: "15" },

  // ─── RENDERING ────────────────────────────────────────────────────────────────
  { trade: "rendering", category: "Render Coats", name: "Sand & Cement Render 20kg", description: "Sand & cement render premix 20kg bag", unit: "bag", unitPrice: "12.50", supplier: "Boral/Hanson", wasteFactor: "10" },
  { trade: "rendering", category: "Render Coats", name: "Acrylic Render 20kg", description: "Acrylic texture render 20kg bucket", unit: "bucket", unitPrice: "48.00", supplier: "Rockcote/Dulux", wasteFactor: "10" },
  { trade: "rendering", category: "Render Coats", name: "Polymer Render 20kg", description: "Polymer modified render 20kg bag", unit: "bag", unitPrice: "22.00", supplier: "Rockcote/Dulux", wasteFactor: "10" },
  { trade: "rendering", category: "Render Coats", name: "Texture Coat 15L", description: "Acrylic texture coat 15L bucket", unit: "bucket", unitPrice: "85.00", supplier: "Rockcote/Dulux", wasteFactor: "10" },
  { trade: "rendering", category: "Mesh & Reinforcement", name: "Fibreglass Mesh 145g/m²", description: "145g/m² fibreglass reinforcing mesh", unit: "m²", unitPrice: "2.80", supplier: "Rockcote/Various", wasteFactor: "10" },
  { trade: "rendering", category: "Mesh & Reinforcement", name: "Corner Bead Galvanised", description: "Galvanised corner bead 2.4m", unit: "ea", unitPrice: "4.50", supplier: "Various", wasteFactor: "5" },
  { trade: "rendering", category: "Primers & Sealers", name: "Render Primer 15L", description: "Render primer/sealer 15L", unit: "ea", unitPrice: "65.00", supplier: "Rockcote/Dulux", wasteFactor: "5" },
  { trade: "rendering", category: "Primers & Sealers", name: "Bonding Agent 5L", description: "Concrete bonding agent 5L", unit: "ea", unitPrice: "38.00", supplier: "Sika/Mapei", wasteFactor: "5" },
  { trade: "rendering", category: "Insulation", name: "EPS Foam Board 50mm", description: "50mm EPS foam insulation board for EIFS", unit: "m²", unitPrice: "18.50", supplier: "Rockcote/Various", wasteFactor: "10" },
  { trade: "rendering", category: "Insulation", name: "EPS Foam Board 75mm", description: "75mm EPS foam insulation board for EIFS", unit: "m²", unitPrice: "26.00", supplier: "Rockcote/Various", wasteFactor: "10" },

  // ─── CABINET MAKING ───────────────────────────────────────────────────────────
  { trade: "cabinet-making", category: "Sheet Material", name: "Melamine Board 16mm White 2400x1200", description: "16mm white melamine board", unit: "sheet", unitPrice: "68.00", supplier: "Laminex/Polytec", wasteFactor: "15" },
  { trade: "cabinet-making", category: "Sheet Material", name: "Melamine Board 18mm White 2400x1200", description: "18mm white melamine board", unit: "sheet", unitPrice: "78.00", supplier: "Laminex/Polytec", wasteFactor: "15" },
  { trade: "cabinet-making", category: "Sheet Material", name: "MDF 16mm 2400x1200", description: "16mm MDF standard sheet", unit: "sheet", unitPrice: "52.00", supplier: "Laminex/Various", wasteFactor: "15" },
  { trade: "cabinet-making", category: "Sheet Material", name: "MDF 25mm 2400x1200", description: "25mm MDF for shelving", unit: "sheet", unitPrice: "72.00", supplier: "Laminex/Various", wasteFactor: "15" },
  { trade: "cabinet-making", category: "Sheet Material", name: "Plywood 12mm Birch 2400x1200", description: "12mm birch plywood for drawer boxes", unit: "sheet", unitPrice: "95.00", supplier: "Bowens/Various", wasteFactor: "15" },
  { trade: "cabinet-making", category: "Hardware", name: "Soft Close Hinge Blum Clip Top", description: "Blum Clip Top soft close hinge", unit: "ea", unitPrice: "12.50", supplier: "Blum", wasteFactor: "0" },
  { trade: "cabinet-making", category: "Hardware", name: "Drawer Runner Blum Tandem 500mm", description: "Blum Tandem soft close drawer runner 500mm", unit: "pair", unitPrice: "48.00", supplier: "Blum", wasteFactor: "0" },
  { trade: "cabinet-making", category: "Hardware", name: "Shelf Pin 5mm", description: "5mm shelf support pin", unit: "ea", unitPrice: "0.45", supplier: "Hafele/Various", wasteFactor: "5" },
  { trade: "cabinet-making", category: "Hardware", name: "Cam Lock 15mm", description: "15mm cam lock connector", unit: "ea", unitPrice: "0.85", supplier: "Hafele/Various", wasteFactor: "5" },
  { trade: "cabinet-making", category: "Edging", name: "ABS Edging 22mm White", description: "22mm white ABS edging tape 50m roll", unit: "roll", unitPrice: "28.50", supplier: "Laminex/Polytec", wasteFactor: "10" },
  { trade: "cabinet-making", category: "Edging", name: "Iron-On Edging 22mm", description: "22mm iron-on edging tape 50m roll", unit: "roll", unitPrice: "18.50", supplier: "Various", wasteFactor: "10" },
  { trade: "cabinet-making", category: "Wardrobe Systems", name: "Wardrobe Rail Oval 25x16mm", description: "Oval wardrobe rail 25x16mm per metre", unit: "m", unitPrice: "8.50", supplier: "Hafele/Various", wasteFactor: "5" },
  { trade: "cabinet-making", category: "Wardrobe Systems", name: "Wardrobe Rail Bracket", description: "Wardrobe rail end bracket pair", unit: "pair", unitPrice: "4.50", supplier: "Hafele/Various", wasteFactor: "0" },
];

export async function seedMaterials() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    return;
  }

  // Check if already seeded (look for system materials with null userId)
  const existing = await db.select().from(materials)
    .where(isNull(materials.userId))
    .limit(1);

  if (existing.length > 0) {
    console.log(`Materials already seeded (${existing.length}+ system materials found). Skipping.`);
    return;
  }

  console.log(`Seeding ${SEED_MATERIALS.length} default materials...`);

  // Insert in batches of 20
  const BATCH_SIZE = 20;
  for (let i = 0; i < SEED_MATERIALS.length; i += BATCH_SIZE) {
    const batch = SEED_MATERIALS.slice(i, i + BATCH_SIZE);
    await db.insert(materials).values(
      batch.map(m => ({
        userId: null,
        trade: m.trade,
        category: m.category,
        name: m.name,
        description: m.description,
        unit: m.unit,
        unitPrice: m.unitPrice as any,
        supplier: m.supplier,
        wasteFactor: (m.wasteFactor ?? "5") as any,
        isActive: true,
      }))
    );
    console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(SEED_MATERIALS.length / BATCH_SIZE)}`);
  }

  console.log(`✅ Seeded ${SEED_MATERIALS.length} materials across 10 trades.`);
}
