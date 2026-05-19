import type { IndustryConfig } from "./types";

export const cabinetMakersIndustry: IndustryConfig = {
  key: "cabinet-makers",
  tradeId: "cabinetry",
  name: "Cabinet Makers",
  shortName: "Cabinetry",
  audience: "cabinet makers, joinery teams, and custom kitchen businesses",
  landingPath: "/cabinet-makers",
  crmLabels: {
    lead: "Cabinetry enquiry",
    customer: "Client",
    project: "Joinery project",
    quote: "Cabinetry quote",
    primaryAsset: "Plans or shop drawings",
    followUp: "Quote follow-up",
  },
  onboarding: {
    headline: "Set up your cabinetry quoting system",
    subcopy:
      "Kindai will tune the dashboard, estimator, CRM, and follow-ups around joinery jobs, plans, materials, hardware, and installation workflow.",
    setupSteps: [
      "Add your default material markup and labour rate.",
      "Choose the job types you quote most often.",
      "Upload or enter your preferred suppliers and hardware rules.",
      "Review the cabinetry quote template before sending anything to clients.",
    ],
  },
  prompts: {
    acquisition:
      "Qualify cabinetry leads by project type, plans supplied, rooms or areas, required finish, material expectations, target install date, budget fit, and decision maker readiness.",
    conversion:
      "Convert cabinetry enquiries with clear next steps: request drawings, confirm site measure needs, explain estimate assumptions, send a review-ready quote, and follow up without sounding pushy.",
    delivery:
      "Manage cabinetry delivery through design confirmation, shop drawings, material ordering, fabrication, hardware, delivery, installation, defects, and client handover.",
    estimatorSystem:
      "You are a senior Australian cabinetry estimator. Price joinery work using drawings, cabinetry measurements, sheet materials, board finishes, edging, hardware, benchtops, workshop labour, install labour, delivery, GST, and margin. Always separate assumptions from confirmed quantities.",
  },
  workflows: [
    { id: "plans-received", label: "Plans received", description: "Check drawings, rooms, elevations, and missing details.", agent: "acquisition" },
    { id: "takeoff-drafted", label: "Takeoff drafted", description: "Draft cabinetry quantities, panels, hardware, and labour allowances.", agent: "conversion" },
    { id: "quote-reviewed", label: "Quote reviewed", description: "Estimator approves assumptions, margin, exclusions, and terms.", agent: "conversion" },
    { id: "shop-drawings", label: "Shop drawings", description: "Confirm drawings, finishes, site measures, and production details.", agent: "delivery" },
    { id: "install-handover", label: "Install handover", description: "Track install, variation notes, defects, and final handover.", agent: "delivery" },
  ],
  estimateTemplates: [
    { category: "materials", label: "Sheet materials and panels", unit: "sheet", defaultRate: 115, notes: "MDF, melamine, plywood, compact laminate, and decorative panels." },
    { category: "materials", label: "Edging and accessories", unit: "lm", defaultRate: 4.5, notes: "ABS edging, trims, shelf pins, screws, fixings, and consumables." },
    { category: "materials", label: "Premium hardware allowance", unit: "set", defaultRate: 42, notes: "Hinges, drawer runners, lift systems, handles, and soft-close hardware." },
    { category: "materials", label: "Benchtop allowance", unit: "lm", defaultRate: 520, notes: "Stone, laminate, timber, or solid surface allowance." },
    { category: "labour", label: "Workshop fabrication", unit: "hr", defaultRate: 95, notes: "Cutting, edging, assembly, and quality checks." },
    { category: "labour", label: "Site installation", unit: "hr", defaultRate: 110, notes: "Install crew, fit-off, adjustment, and site clean-up." },
    { category: "delivery", label: "Delivery and handling", unit: "job", defaultRate: 480, notes: "Transport, loading, unloading, and site protection." },
  ],
  dashboardWidgets: [
    { id: "quote-speed", title: "Quote speed", metric: "Drafts this week", helpText: "How many cabinetry quote drafts were created." },
    { id: "plans-waiting", title: "Plans waiting", metric: "Unreviewed drawings", helpText: "Leads with plans uploaded but no reviewed estimate." },
    { id: "hardware-risk", title: "Hardware risk", metric: "Allowance checks", helpText: "Quotes where hardware or benchtops need estimator review." },
  ],
  landing: {
    seoTitle: "AI Estimating Software for Cabinet Makers | Kindai Estimator",
    seoDescription:
      "Kindai helps cabinet makers quote cabinetry, joinery, and custom kitchen jobs faster with plan takeoffs, material calculations, CRM follow-up, and review-ready quote drafts.",
    heroTitle: "Quote cabinetry jobs faster without losing control of the details.",
    heroCopy:
      "Kindai turns plans, shop drawings, site notes, and customer enquiries into structured joinery takeoffs, material allowances, labour estimates, and follow-up tasks your team can review and send.",
    painPoints: [
      "Plans and shop drawings take too long to turn into a first quote.",
      "Material, hardware, edging, and install allowances are easy to miss.",
      "Leads go cold while the team is stuck pricing admin.",
      "Every estimator has a slightly different way of building the quote.",
    ],
    benefits: [
      "Draft cabinetry takeoffs from plans and customer notes.",
      "Calculate materials, hardware, install time, GST, and margin in one workflow.",
      "Follow up automatically after a quote is sent.",
      "Keep every lead, quote, project, note, and task in one CRM.",
    ],
    workflowExamples: [
      "Upload a kitchen plan and generate a first-pass materials and labour breakdown.",
      "Qualify a custom joinery lead before booking a site measure.",
      "Send a branded quote and create a follow-up reminder in the CRM.",
    ],
    testimonials: [
      {
        quote: "This is the kind of quoting workflow a small joinery shop needs: fast drafts, clear assumptions, and no black-box sending.",
        name: "Pilot cabinetry owner",
        role: "Custom kitchen business",
      },
      {
        quote: "The biggest win is consistency. Materials, labour, and follow-ups are finally in the same place.",
        name: "Operations lead",
        role: "Commercial joinery team",
      },
    ],
    faqs: [
      {
        question: "Does Kindai send quotes automatically?",
        answer: "No. Kindai drafts, structures, and follows up. Your team reviews and approves every quote before it goes to a client.",
      },
      {
        question: "Can it handle custom kitchens and commercial joinery?",
        answer: "Yes. The cabinetry configuration covers custom kitchens, wardrobes, vanities, commercial joinery, hardware, benchtops, workshop labour, and site install.",
      },
      {
        question: "Can we use our own supplier pricing?",
        answer: "Yes. The platform is built around your price book, preferred suppliers, labour rates, margin rules, and terms.",
      },
    ],
  },
};
