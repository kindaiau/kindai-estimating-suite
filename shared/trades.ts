// ─── Trade Definitions ────────────────────────────────────────────────────────
export const TRADES = [
  {
    id: "electrical",
    name: "Electrical",
    icon: "Zap",
    color: "#F59E0B",
    description: "Residential & commercial electrical estimating",
    unit: "points",
  },
  {
    id: "plumbing",
    name: "Plumbing",
    icon: "Droplets",
    color: "#3B82F6",
    description: "Plumbing, drainage & hot water systems",
    unit: "fixtures",
  },
  {
    id: "carpentry",
    name: "Carpentry",
    icon: "Hammer",
    color: "#92400E",
    description: "Framing, fit-out & timber work",
    unit: "lm",
  },
  {
    id: "concreting",
    name: "Concreting",
    icon: "Building2",
    color: "#6B7280",
    description: "Slabs, footings, driveways & paths",
    unit: "m³",
  },
  {
    id: "hvac",
    name: "HVAC",
    icon: "Wind",
    color: "#06B6D4",
    description: "Heating, ventilation & air conditioning",
    unit: "kW",
  },
  {
    id: "flooring",
    name: "Flooring",
    icon: "Grid3x3",
    color: "#8B5CF6",
    description: "Tiles, timber, carpet & vinyl flooring",
    unit: "m²",
  },
  {
    id: "landscaping",
    name: "Landscaping",
    icon: "Leaf",
    color: "#10B981",
    description: "Gardens, retaining walls & outdoor spaces",
    unit: "m²",
  },
  {
    id: "cabinetry",
    name: "Cabinetry",
    icon: "Package",
    color: "#D97706",
    description: "Kitchen, bathroom & custom cabinetry",
    unit: "lm",
  },
  {
    id: "rendering",
    name: "Rendering & Plastering",
    icon: "Layers",
    color: "#EC4899",
    description: "Internal & external render and plaster",
    unit: "m²",
  },
  {
    id: "cabinet-making",
    name: "Cabinet Making",
    icon: "Boxes",
    color: "#F97316",
    description: "Custom joinery, wardrobes & built-ins",
    unit: "ea",
  },
] as const;

export type TradeId = (typeof TRADES)[number]["id"];

// ─── Australian States ────────────────────────────────────────────────────────
export const AU_STATES = [
  { code: "NSW", name: "New South Wales" },
  { code: "VIC", name: "Victoria" },
  { code: "QLD", name: "Queensland" },
  { code: "SA", name: "South Australia" },
  { code: "WA", name: "Western Australia" },
  { code: "TAS", name: "Tasmania" },
  { code: "NT", name: "Northern Territory" },
  { code: "ACT", name: "Australian Capital Territory" },
] as const;

export type AuState = (typeof AU_STATES)[number]["code"];

// ─── GST ──────────────────────────────────────────────────────────────────────
export const GST_RATE = 0.1; // 10%

// ─── Compliance Profiles ──────────────────────────────────────────────────────
export const COMPLIANCE_DATA: Record<
  string,
  {
    licensingBodies: Record<string, { body: string; type: string; url: string }>;
    standards: { code: string; title: string }[];
    whsNotice: string;
    quoteDisclaimer: string;
  }
> = {
  electrical: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Electrical Contractor Licence", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/electrical-contractor-licence" },
      VIC: { body: "Energy Safe Victoria (ESV)", type: "Electrical Contractor Licence", url: "https://www.esv.vic.gov.au/licences-and-registrations/electrical-contractors/" },
      QLD: { body: "Queensland Building and Construction Commission (QBCC)", type: "Electrical Contractor Licence", url: "https://www.qbcc.qld.gov.au/licences/types/electrical" },
      SA: { body: "Consumer and Business Services SA", type: "Electrical Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/electrical" },
      WA: { body: "Electrical Licensing Board WA", type: "Electrical Contractor Licence", url: "https://www.commerce.wa.gov.au/worksafe/electrical-licensing" },
      TAS: { body: "WorkSafe Tasmania", type: "Electrical Contractor Licence", url: "https://worksafe.tas.gov.au/topics/licensing/electrical-workers-and-contractors" },
      NT: { body: "NT WorkSafe", type: "Electrical Contractor Licence", url: "https://worksafe.nt.gov.au/licences-and-registrations/electrical" },
      ACT: { body: "Access Canberra", type: "Electrical Contractor Licence", url: "https://www.accesscanberra.act.gov.au/s/article/electrical-contractor-licence" },
    },
    standards: [
      { code: "AS/NZS 3000:2018", title: "Wiring Rules (Electrical Installations)" },
      { code: "AS/NZS 3008.1.1", title: "Electrical Installations - Selection of Cables" },
      { code: "AS/NZS 3017", title: "Electrical Installations - Verification Guidelines" },
      { code: "AS/NZS 4777", title: "Grid Connection of Energy Systems via Inverters" },
    ],
    whsNotice: "All electrical work must be performed by a licensed electrician. A Certificate of Compliance for Electrical Work (CCEW) must be issued upon completion. Ensure all WHS obligations under the Work Health and Safety Act 2011 are met.",
    quoteDisclaimer: "This estimate is prepared by a licensed electrical contractor. All work will comply with AS/NZS 3000:2018 Wiring Rules. GST of 10% is included where marked. A Certificate of Compliance for Electrical Work (CCEW) will be provided upon completion. Prices are valid for 30 days from the date of issue.",
  },
  plumbing: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Plumbing Contractor Licence", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/plumbing-and-drainage-contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Plumbing Licence", url: "https://www.vba.vic.gov.au/plumbers/licences" },
      QLD: { body: "QBCC", type: "Plumbing & Drainage Licence", url: "https://www.qbcc.qld.gov.au/licences/types/plumbing-drainage" },
      SA: { body: "Consumer and Business Services SA", type: "Plumbing Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/plumbing" },
      WA: { body: "Building and Energy WA", type: "Plumbing Contractor Licence", url: "https://www.commerce.wa.gov.au/building-and-energy/plumbing-licensing" },
      TAS: { body: "CBOS Tasmania", type: "Plumbing Contractor Licence", url: "https://www.cbos.tas.gov.au/topics/licensing/plumbing" },
      NT: { body: "NT WorkSafe", type: "Plumbing Contractor Licence", url: "https://worksafe.nt.gov.au/licences-and-registrations/plumbing" },
      ACT: { body: "Access Canberra", type: "Plumbing Contractor Licence", url: "https://www.accesscanberra.act.gov.au/s/article/plumbing-contractor-licence" },
    },
    standards: [
      { code: "AS/NZS 3500.1", title: "Plumbing and Drainage - Water Services" },
      { code: "AS/NZS 3500.2", title: "Plumbing and Drainage - Sanitary Plumbing and Drainage" },
      { code: "AS/NZS 3500.4", title: "Plumbing and Drainage - Heated Water Services" },
      { code: "AS 1432", title: "Copper Tubes for Plumbing, Gasfitting and Drainage" },
    ],
    whsNotice: "All plumbing work must be performed by a licensed plumber. A Certificate of Compliance must be issued for all plumbing work. Ensure compliance with the National Construction Code (NCC) and relevant state plumbing regulations.",
    quoteDisclaimer: "This estimate is prepared by a licensed plumbing contractor. All work will comply with AS/NZS 3500 series standards and the National Construction Code. GST of 10% is included where marked. A Certificate of Compliance will be provided upon completion. Prices are valid for 30 days from the date of issue.",
  },
  carpentry: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Builder's Licence (Carpentry)", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Domestic Builder (Carpentry)", url: "https://www.vba.vic.gov.au/builders/registration" },
      QLD: { body: "QBCC", type: "Carpentry Licence", url: "https://www.qbcc.qld.gov.au/licences/types/carpentry" },
      SA: { body: "Consumer and Business Services SA", type: "Building Work Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/building" },
      WA: { body: "Building and Energy WA", type: "Builder's Registration", url: "https://www.commerce.wa.gov.au/building-and-energy/builders-registration" },
      TAS: { body: "CBOS Tasmania", type: "Building Practitioner Registration", url: "https://www.cbos.tas.gov.au/topics/licensing/building" },
      NT: { body: "NT Building Practitioners Board", type: "Builder's Licence", url: "https://nt.gov.au/industry/construction/licences-and-registrations/building-practitioners" },
      ACT: { body: "Access Canberra", type: "Builder's Licence", url: "https://www.accesscanberra.act.gov.au/s/article/builders-licence" },
    },
    standards: [
      { code: "AS 1684", title: "Residential Timber-Framed Construction" },
      { code: "AS 4440", title: "Installation of Nailplated Timber Roof Trusses" },
      { code: "AS/NZS 1170", title: "Structural Design Actions" },
      { code: "NCC Volume 1 & 2", title: "National Construction Code" },
    ],
    whsNotice: "All carpentry work must comply with the Work Health and Safety Act 2011. Ensure proper PPE is worn at all times. Working at heights requires compliance with the Code of Practice for Managing the Risk of Falls at Workplaces.",
    quoteDisclaimer: "This estimate is prepared by a licensed building contractor. All work will comply with AS 1684 and the National Construction Code. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
  concreting: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Contractor Licence (Concreting)", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Domestic Builder (Concreting)", url: "https://www.vba.vic.gov.au/builders/registration" },
      QLD: { body: "QBCC", type: "Concreting Licence", url: "https://www.qbcc.qld.gov.au/licences/types/concreting" },
      SA: { body: "Consumer and Business Services SA", type: "Building Work Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/building" },
      WA: { body: "Building and Energy WA", type: "Builder's Registration", url: "https://www.commerce.wa.gov.au/building-and-energy/builders-registration" },
      TAS: { body: "CBOS Tasmania", type: "Building Practitioner Registration", url: "https://www.cbos.tas.gov.au/topics/licensing/building" },
      NT: { body: "NT Building Practitioners Board", type: "Builder's Licence", url: "https://nt.gov.au/industry/construction/licences-and-registrations/building-practitioners" },
      ACT: { body: "Access Canberra", type: "Builder's Licence", url: "https://www.accesscanberra.act.gov.au/s/article/builders-licence" },
    },
    standards: [
      { code: "AS 3600:2018", title: "Concrete Structures" },
      { code: "AS 3610", title: "Formwork for Concrete" },
      { code: "AS 1379", title: "Specification and Supply of Concrete" },
      { code: "AS/NZS 4671", title: "Steel Reinforcing Materials" },
    ],
    whsNotice: "Concreting work must comply with WHS regulations. Manual handling of concrete bags requires proper technique. Wet concrete is a skin and eye irritant — appropriate PPE must be worn. Excavation work requires a safe work method statement (SWMS).",
    quoteDisclaimer: "This estimate is prepared by a licensed concreting contractor. All work will comply with AS 3600:2018 and relevant Australian Standards. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
  hvac: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Refrigeration & Air Conditioning Licence", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Plumbing Licence (Mechanical Services)", url: "https://www.vba.vic.gov.au/plumbers/licences" },
      QLD: { body: "QBCC", type: "Air Conditioning & Refrigeration Licence", url: "https://www.qbcc.qld.gov.au/licences/types/air-conditioning-refrigeration" },
      SA: { body: "Consumer and Business Services SA", type: "Refrigeration & Air Conditioning Licence", url: "https://www.cbs.sa.gov.au/licences" },
      WA: { body: "Building and Energy WA", type: "Refrigeration & Air Conditioning Licence", url: "https://www.commerce.wa.gov.au/building-and-energy" },
      TAS: { body: "CBOS Tasmania", type: "Refrigeration & Air Conditioning Licence", url: "https://www.cbos.tas.gov.au/topics/licensing" },
      NT: { body: "NT WorkSafe", type: "Refrigeration & Air Conditioning Licence", url: "https://worksafe.nt.gov.au/licences-and-registrations" },
      ACT: { body: "Access Canberra", type: "Refrigeration & Air Conditioning Licence", url: "https://www.accesscanberra.act.gov.au" },
    },
    standards: [
      { code: "AS/NZS 1668.1", title: "The Use of Ventilation and Air Conditioning in Buildings" },
      { code: "AS/NZS 3000:2018", title: "Wiring Rules (for electrical components)" },
      { code: "AS 1677", title: "Refrigerating Systems" },
      { code: "NCC Section J", title: "Energy Efficiency Requirements" },
    ],
    whsNotice: "HVAC work involving refrigerants requires an ARC (Australian Refrigeration Council) licence for handling refrigerants. All electrical connections must be performed by a licensed electrician. Ensure compliance with NCC Section J energy efficiency requirements.",
    quoteDisclaimer: "This estimate is prepared by a licensed HVAC contractor. All refrigerant handling complies with ARC licensing requirements. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
  flooring: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Contractor Licence (Flooring)", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Domestic Builder (Flooring)", url: "https://www.vba.vic.gov.au/builders/registration" },
      QLD: { body: "QBCC", type: "Flooring Licence", url: "https://www.qbcc.qld.gov.au/licences/types/flooring" },
      SA: { body: "Consumer and Business Services SA", type: "Building Work Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/building" },
      WA: { body: "Building and Energy WA", type: "Builder's Registration", url: "https://www.commerce.wa.gov.au/building-and-energy/builders-registration" },
      TAS: { body: "CBOS Tasmania", type: "Building Practitioner Registration", url: "https://www.cbos.tas.gov.au/topics/licensing/building" },
      NT: { body: "NT Building Practitioners Board", type: "Builder's Licence", url: "https://nt.gov.au/industry/construction/licences-and-registrations/building-practitioners" },
      ACT: { body: "Access Canberra", type: "Builder's Licence", url: "https://www.accesscanberra.act.gov.au/s/article/builders-licence" },
    },
    standards: [
      { code: "AS 1884", title: "Floor Coverings - Resilient Sheet and Tiles" },
      { code: "AS 4586", title: "Slip Resistance Classification of New Pedestrian Surface Materials" },
      { code: "AS 1860.2", title: "Particleboard Flooring - Installation" },
      { code: "AS 2455", title: "Textile Floor Coverings - Installation Practice" },
    ],
    whsNotice: "Flooring installation must comply with WHS regulations. Adhesives and solvents require adequate ventilation. Knee pads and appropriate PPE must be worn. Heavy material handling requires manual handling risk assessment.",
    quoteDisclaimer: "This estimate is prepared by a licensed flooring contractor. All work will comply with relevant Australian Standards for floor coverings. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
  landscaping: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Contractor Licence (Landscaping)", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Domestic Builder (Landscaping)", url: "https://www.vba.vic.gov.au/builders/registration" },
      QLD: { body: "QBCC", type: "Landscaping Licence", url: "https://www.qbcc.qld.gov.au/licences/types/landscaping" },
      SA: { body: "Consumer and Business Services SA", type: "Building Work Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/building" },
      WA: { body: "Building and Energy WA", type: "Builder's Registration", url: "https://www.commerce.wa.gov.au/building-and-energy/builders-registration" },
      TAS: { body: "CBOS Tasmania", type: "Building Practitioner Registration", url: "https://www.cbos.tas.gov.au/topics/licensing/building" },
      NT: { body: "NT Building Practitioners Board", type: "Builder's Licence", url: "https://nt.gov.au/industry/construction/licences-and-registrations/building-practitioners" },
      ACT: { body: "Access Canberra", type: "Builder's Licence", url: "https://www.accesscanberra.act.gov.au/s/article/builders-licence" },
    },
    standards: [
      { code: "AS 4419", title: "Soils for Landscaping and Garden Use" },
      { code: "AS 4970", title: "Protection of Trees on Development Sites" },
      { code: "AS 3959", title: "Construction of Buildings in Bushfire-Prone Areas" },
      { code: "AS 1926.1", title: "Swimming Pool Safety - Safety Barriers for Swimming Pools" },
    ],
    whsNotice: "Landscaping work must comply with WHS regulations. Use of powered equipment requires appropriate training. Excavation near services requires a Dial Before You Dig enquiry. Retaining walls over 1m may require engineering certification.",
    quoteDisclaimer: "This estimate is prepared by a licensed landscaping contractor. All work will comply with relevant Australian Standards. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
  cabinetry: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Contractor Licence (Cabinetmaking)", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Domestic Builder (Cabinetmaking)", url: "https://www.vba.vic.gov.au/builders/registration" },
      QLD: { body: "QBCC", type: "Cabinetmaking Licence", url: "https://www.qbcc.qld.gov.au/licences/types/cabinetmaking" },
      SA: { body: "Consumer and Business Services SA", type: "Building Work Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/building" },
      WA: { body: "Building and Energy WA", type: "Builder's Registration", url: "https://www.commerce.wa.gov.au/building-and-energy/builders-registration" },
      TAS: { body: "CBOS Tasmania", type: "Building Practitioner Registration", url: "https://www.cbos.tas.gov.au/topics/licensing/building" },
      NT: { body: "NT Building Practitioners Board", type: "Builder's Licence", url: "https://nt.gov.au/industry/construction/licences-and-registrations/building-practitioners" },
      ACT: { body: "Access Canberra", type: "Builder's Licence", url: "https://www.accesscanberra.act.gov.au/s/article/builders-licence" },
    },
    standards: [
      { code: "AS/NZS 4386.1", title: "Domestic Kitchen Assemblies - Materials and Construction" },
      { code: "AS/NZS 4386.2", title: "Domestic Kitchen Assemblies - Performance Requirements" },
      { code: "AS 1860.1", title: "Particleboard Flooring - Specifications" },
      { code: "AWISA Standards", title: "Australian Woodworking Industry Suppliers Association Standards" },
    ],
    whsNotice: "Cabinetry installation must comply with WHS regulations. Use of power tools requires appropriate PPE. Dust extraction is required when cutting MDF and particleboard. Ensure adequate ventilation when using adhesives and finishes.",
    quoteDisclaimer: "This estimate is prepared by a licensed cabinetmaking contractor. All work will comply with AS/NZS 4386 kitchen assembly standards. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
  rendering: {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Contractor Licence (Plastering)", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Domestic Builder (Plastering)", url: "https://www.vba.vic.gov.au/builders/registration" },
      QLD: { body: "QBCC", type: "Plastering Licence", url: "https://www.qbcc.qld.gov.au/licences/types/plastering" },
      SA: { body: "Consumer and Business Services SA", type: "Building Work Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/building" },
      WA: { body: "Building and Energy WA", type: "Builder's Registration", url: "https://www.commerce.wa.gov.au/building-and-energy/builders-registration" },
      TAS: { body: "CBOS Tasmania", type: "Building Practitioner Registration", url: "https://www.cbos.tas.gov.au/topics/licensing/building" },
      NT: { body: "NT Building Practitioners Board", type: "Builder's Licence", url: "https://nt.gov.au/industry/construction/licences-and-registrations/building-practitioners" },
      ACT: { body: "Access Canberra", type: "Builder's Licence", url: "https://www.accesscanberra.act.gov.au/s/article/builders-licence" },
    },
    standards: [
      { code: "AS 3740", title: "Waterproofing of Domestic Wet Areas" },
      { code: "AS 2589", title: "Gypsum Linings - Application and Finishing" },
      { code: "AS 3958.1", title: "Ceramic Tiles - Guide to the Installation of Ceramic Tiles" },
      { code: "NCC Section F", title: "Health and Amenity Requirements" },
    ],
    whsNotice: "Rendering and plastering work must comply with WHS regulations. Cement and lime products are skin and eye irritants — appropriate PPE must be worn. Scaffolding for external rendering must comply with the Code of Practice for Scaffolding.",
    quoteDisclaimer: "This estimate is prepared by a licensed plastering/rendering contractor. All work will comply with relevant Australian Standards. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
  "cabinet-making": {
    licensingBodies: {
      NSW: { body: "NSW Fair Trading", type: "Contractor Licence (Cabinetmaking)", url: "https://www.fairtrading.nsw.gov.au/trades-and-businesses/licensing/contractor-licence" },
      VIC: { body: "Victorian Building Authority (VBA)", type: "Domestic Builder (Cabinetmaking)", url: "https://www.vba.vic.gov.au/builders/registration" },
      QLD: { body: "QBCC", type: "Cabinetmaking Licence", url: "https://www.qbcc.qld.gov.au/licences/types/cabinetmaking" },
      SA: { body: "Consumer and Business Services SA", type: "Building Work Contractor Licence", url: "https://www.cbs.sa.gov.au/licences/building" },
      WA: { body: "Building and Energy WA", type: "Builder's Registration", url: "https://www.commerce.wa.gov.au/building-and-energy/builders-registration" },
      TAS: { body: "CBOS Tasmania", type: "Building Practitioner Registration", url: "https://www.cbos.tas.gov.au/topics/licensing/building" },
      NT: { body: "NT Building Practitioners Board", type: "Builder's Licence", url: "https://nt.gov.au/industry/construction/licences-and-registrations/building-practitioners" },
      ACT: { body: "Access Canberra", type: "Builder's Licence", url: "https://www.accesscanberra.act.gov.au/s/article/builders-licence" },
    },
    standards: [
      { code: "AS/NZS 4386.1", title: "Domestic Kitchen Assemblies - Materials and Construction" },
      { code: "AS/NZS 4386.2", title: "Domestic Kitchen Assemblies - Performance Requirements" },
      { code: "AS 4084", title: "Steel Storage Racking" },
      { code: "AWISA Standards", title: "Australian Woodworking Industry Suppliers Association Standards" },
    ],
    whsNotice: "Cabinet making must comply with WHS regulations. Use of CNC and power tools requires appropriate training and PPE. Dust extraction is mandatory when machining MDF. Ensure adequate ventilation when applying finishes.",
    quoteDisclaimer: "This estimate is prepared by a licensed cabinet making contractor. All work will comply with AS/NZS 4386 standards. GST of 10% is included where marked. Prices are valid for 30 days from the date of issue.",
  },
};

// ─── Default Labour Rates (Fair Work Act 2024-25) ─────────────────────────────
export const DEFAULT_LABOUR_RATES: Record<
  string,
  Array<{
    classification: string;
    baseRate: number;
    overtimeRate: number;
    saturdayRate: number;
    sundayRate: number;
    publicHolidayRate: number;
    travelAllowance: number;
    toolAllowance: number;
  }>
> = {
  electrical: [
    { classification: "Electrician - Grade 1 (Apprentice 1st Year)", baseRate: 16.50, overtimeRate: 24.75, saturdayRate: 24.75, sundayRate: 33.00, publicHolidayRate: 41.25, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Electrician - Grade 2 (Apprentice 2nd Year)", baseRate: 19.80, overtimeRate: 29.70, saturdayRate: 29.70, sundayRate: 39.60, publicHolidayRate: 49.50, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Electrician - Grade 3 (Apprentice 3rd Year)", baseRate: 23.10, overtimeRate: 34.65, saturdayRate: 34.65, sundayRate: 46.20, publicHolidayRate: 57.75, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Electrician - Grade 4 (Apprentice 4th Year)", baseRate: 27.50, overtimeRate: 41.25, saturdayRate: 41.25, sundayRate: 55.00, publicHolidayRate: 68.75, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Electrician - Qualified (Grade 5)", baseRate: 42.50, overtimeRate: 63.75, saturdayRate: 63.75, sundayRate: 85.00, publicHolidayRate: 106.25, travelAllowance: 18.50, toolAllowance: 1.80 },
    { classification: "Electrician - Advanced (Grade 6)", baseRate: 46.20, overtimeRate: 69.30, saturdayRate: 69.30, sundayRate: 92.40, publicHolidayRate: 115.50, travelAllowance: 18.50, toolAllowance: 1.80 },
    { classification: "Electrical Supervisor", baseRate: 52.00, overtimeRate: 78.00, saturdayRate: 78.00, sundayRate: 104.00, publicHolidayRate: 130.00, travelAllowance: 18.50, toolAllowance: 1.80 },
  ],
  plumbing: [
    { classification: "Plumber - Apprentice 1st Year", baseRate: 16.50, overtimeRate: 24.75, saturdayRate: 24.75, sundayRate: 33.00, publicHolidayRate: 41.25, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Plumber - Apprentice 2nd Year", baseRate: 19.80, overtimeRate: 29.70, saturdayRate: 29.70, sundayRate: 39.60, publicHolidayRate: 49.50, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Plumber - Apprentice 3rd Year", baseRate: 23.10, overtimeRate: 34.65, saturdayRate: 34.65, sundayRate: 46.20, publicHolidayRate: 57.75, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Plumber - Apprentice 4th Year", baseRate: 27.50, overtimeRate: 41.25, saturdayRate: 41.25, sundayRate: 55.00, publicHolidayRate: 68.75, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Plumber - Qualified", baseRate: 43.80, overtimeRate: 65.70, saturdayRate: 65.70, sundayRate: 87.60, publicHolidayRate: 109.50, travelAllowance: 18.50, toolAllowance: 1.80 },
    { classification: "Plumber - Advanced", baseRate: 47.50, overtimeRate: 71.25, saturdayRate: 71.25, sundayRate: 95.00, publicHolidayRate: 118.75, travelAllowance: 18.50, toolAllowance: 1.80 },
    { classification: "Plumbing Supervisor", baseRate: 54.00, overtimeRate: 81.00, saturdayRate: 81.00, sundayRate: 108.00, publicHolidayRate: 135.00, travelAllowance: 18.50, toolAllowance: 1.80 },
  ],
  carpentry: [
    { classification: "Carpenter - Apprentice 1st Year", baseRate: 15.50, overtimeRate: 23.25, saturdayRate: 23.25, sundayRate: 31.00, publicHolidayRate: 38.75, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Carpenter - Apprentice 2nd Year", baseRate: 18.60, overtimeRate: 27.90, saturdayRate: 27.90, sundayRate: 37.20, publicHolidayRate: 46.50, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Carpenter - Apprentice 3rd Year", baseRate: 21.70, overtimeRate: 32.55, saturdayRate: 32.55, sundayRate: 43.40, publicHolidayRate: 54.25, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Carpenter - Apprentice 4th Year", baseRate: 25.80, overtimeRate: 38.70, saturdayRate: 38.70, sundayRate: 51.60, publicHolidayRate: 64.50, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Carpenter - Qualified (CW3)", baseRate: 38.50, overtimeRate: 57.75, saturdayRate: 57.75, sundayRate: 77.00, publicHolidayRate: 96.25, travelAllowance: 17.50, toolAllowance: 1.60 },
    { classification: "Carpenter - Advanced (CW4)", baseRate: 42.00, overtimeRate: 63.00, saturdayRate: 63.00, sundayRate: 84.00, publicHolidayRate: 105.00, travelAllowance: 17.50, toolAllowance: 1.60 },
    { classification: "Carpentry Supervisor", baseRate: 48.00, overtimeRate: 72.00, saturdayRate: 72.00, sundayRate: 96.00, publicHolidayRate: 120.00, travelAllowance: 17.50, toolAllowance: 1.60 },
  ],
  concreting: [
    { classification: "Concrete Worker - Grade 1", baseRate: 30.00, overtimeRate: 45.00, saturdayRate: 45.00, sundayRate: 60.00, publicHolidayRate: 75.00, travelAllowance: 16.00, toolAllowance: 0 },
    { classification: "Concrete Worker - Grade 2", baseRate: 33.50, overtimeRate: 50.25, saturdayRate: 50.25, sundayRate: 67.00, publicHolidayRate: 83.75, travelAllowance: 16.00, toolAllowance: 0 },
    { classification: "Concrete Finisher", baseRate: 38.00, overtimeRate: 57.00, saturdayRate: 57.00, sundayRate: 76.00, publicHolidayRate: 95.00, travelAllowance: 16.00, toolAllowance: 0 },
    { classification: "Concreting Supervisor", baseRate: 46.00, overtimeRate: 69.00, saturdayRate: 69.00, sundayRate: 92.00, publicHolidayRate: 115.00, travelAllowance: 16.00, toolAllowance: 0 },
  ],
  hvac: [
    { classification: "HVAC Technician - Apprentice 1st Year", baseRate: 16.00, overtimeRate: 24.00, saturdayRate: 24.00, sundayRate: 32.00, publicHolidayRate: 40.00, travelAllowance: 0, toolAllowance: 0 },
    { classification: "HVAC Technician - Apprentice 2nd Year", baseRate: 19.20, overtimeRate: 28.80, saturdayRate: 28.80, sundayRate: 38.40, publicHolidayRate: 48.00, travelAllowance: 0, toolAllowance: 0 },
    { classification: "HVAC Technician - Qualified", baseRate: 44.00, overtimeRate: 66.00, saturdayRate: 66.00, sundayRate: 88.00, publicHolidayRate: 110.00, travelAllowance: 18.50, toolAllowance: 1.80 },
    { classification: "HVAC Technician - Advanced", baseRate: 48.50, overtimeRate: 72.75, saturdayRate: 72.75, sundayRate: 97.00, publicHolidayRate: 121.25, travelAllowance: 18.50, toolAllowance: 1.80 },
    { classification: "HVAC Supervisor", baseRate: 55.00, overtimeRate: 82.50, saturdayRate: 82.50, sundayRate: 110.00, publicHolidayRate: 137.50, travelAllowance: 18.50, toolAllowance: 1.80 },
  ],
  flooring: [
    { classification: "Floor Layer - Grade 1", baseRate: 30.00, overtimeRate: 45.00, saturdayRate: 45.00, sundayRate: 60.00, publicHolidayRate: 75.00, travelAllowance: 16.00, toolAllowance: 1.20 },
    { classification: "Floor Layer - Grade 2", baseRate: 34.00, overtimeRate: 51.00, saturdayRate: 51.00, sundayRate: 68.00, publicHolidayRate: 85.00, travelAllowance: 16.00, toolAllowance: 1.20 },
    { classification: "Floor Layer - Qualified", baseRate: 38.50, overtimeRate: 57.75, saturdayRate: 57.75, sundayRate: 77.00, publicHolidayRate: 96.25, travelAllowance: 16.00, toolAllowance: 1.20 },
    { classification: "Flooring Supervisor", baseRate: 46.00, overtimeRate: 69.00, saturdayRate: 69.00, sundayRate: 92.00, publicHolidayRate: 115.00, travelAllowance: 16.00, toolAllowance: 1.20 },
  ],
  landscaping: [
    { classification: "Landscape Labourer", baseRate: 28.00, overtimeRate: 42.00, saturdayRate: 42.00, sundayRate: 56.00, publicHolidayRate: 70.00, travelAllowance: 14.00, toolAllowance: 0 },
    { classification: "Landscape Gardener - Grade 1", baseRate: 32.00, overtimeRate: 48.00, saturdayRate: 48.00, sundayRate: 64.00, publicHolidayRate: 80.00, travelAllowance: 14.00, toolAllowance: 0 },
    { classification: "Landscape Gardener - Qualified", baseRate: 37.50, overtimeRate: 56.25, saturdayRate: 56.25, sundayRate: 75.00, publicHolidayRate: 93.75, travelAllowance: 14.00, toolAllowance: 0 },
    { classification: "Landscape Supervisor", baseRate: 45.00, overtimeRate: 67.50, saturdayRate: 67.50, sundayRate: 90.00, publicHolidayRate: 112.50, travelAllowance: 14.00, toolAllowance: 0 },
  ],
  cabinetry: [
    { classification: "Cabinet Maker - Apprentice 1st Year", baseRate: 15.00, overtimeRate: 22.50, saturdayRate: 22.50, sundayRate: 30.00, publicHolidayRate: 37.50, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Cabinet Maker - Apprentice 2nd Year", baseRate: 18.00, overtimeRate: 27.00, saturdayRate: 27.00, sundayRate: 36.00, publicHolidayRate: 45.00, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Cabinet Maker - Qualified", baseRate: 38.00, overtimeRate: 57.00, saturdayRate: 57.00, sundayRate: 76.00, publicHolidayRate: 95.00, travelAllowance: 16.00, toolAllowance: 1.50 },
    { classification: "Cabinet Maker - Advanced", baseRate: 42.50, overtimeRate: 63.75, saturdayRate: 63.75, sundayRate: 85.00, publicHolidayRate: 106.25, travelAllowance: 16.00, toolAllowance: 1.50 },
    { classification: "Cabinetry Supervisor", baseRate: 50.00, overtimeRate: 75.00, saturdayRate: 75.00, sundayRate: 100.00, publicHolidayRate: 125.00, travelAllowance: 16.00, toolAllowance: 1.50 },
  ],
  rendering: [
    { classification: "Plasterer - Apprentice 1st Year", baseRate: 15.50, overtimeRate: 23.25, saturdayRate: 23.25, sundayRate: 31.00, publicHolidayRate: 38.75, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Plasterer - Apprentice 2nd Year", baseRate: 18.60, overtimeRate: 27.90, saturdayRate: 27.90, sundayRate: 37.20, publicHolidayRate: 46.50, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Plasterer - Qualified", baseRate: 39.00, overtimeRate: 58.50, saturdayRate: 58.50, sundayRate: 78.00, publicHolidayRate: 97.50, travelAllowance: 17.00, toolAllowance: 1.40 },
    { classification: "Plasterer - Advanced", baseRate: 43.00, overtimeRate: 64.50, saturdayRate: 64.50, sundayRate: 86.00, publicHolidayRate: 107.50, travelAllowance: 17.00, toolAllowance: 1.40 },
    { classification: "Plastering Supervisor", baseRate: 50.00, overtimeRate: 75.00, saturdayRate: 75.00, sundayRate: 100.00, publicHolidayRate: 125.00, travelAllowance: 17.00, toolAllowance: 1.40 },
  ],
  "cabinet-making": [
    { classification: "Cabinet Maker - Apprentice 1st Year", baseRate: 15.00, overtimeRate: 22.50, saturdayRate: 22.50, sundayRate: 30.00, publicHolidayRate: 37.50, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Cabinet Maker - Apprentice 2nd Year", baseRate: 18.00, overtimeRate: 27.00, saturdayRate: 27.00, sundayRate: 36.00, publicHolidayRate: 45.00, travelAllowance: 0, toolAllowance: 0 },
    { classification: "Cabinet Maker - Qualified", baseRate: 38.00, overtimeRate: 57.00, saturdayRate: 57.00, sundayRate: 76.00, publicHolidayRate: 95.00, travelAllowance: 16.00, toolAllowance: 1.50 },
    { classification: "Cabinet Maker - Advanced", baseRate: 42.50, overtimeRate: 63.75, saturdayRate: 63.75, sundayRate: 85.00, publicHolidayRate: 106.25, travelAllowance: 16.00, toolAllowance: 1.50 },
    { classification: "Joinery Supervisor", baseRate: 50.00, overtimeRate: 75.00, saturdayRate: 75.00, sundayRate: 100.00, publicHolidayRate: 125.00, travelAllowance: 16.00, toolAllowance: 1.50 },
  ],
};
