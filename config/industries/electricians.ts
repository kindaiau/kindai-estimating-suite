import type { IndustryConfig } from "./types";

export const electriciansIndustry: IndustryConfig = {
  key: "electricians",
  tradeId: "electrical",
  name: "Electricians",
  shortName: "Electrical",
  audience: "electricians, sparkies, electrical contractors, and service teams",
  landingPath: "/electricians",
  crmLabels: {
    lead: "Electrical enquiry",
    customer: "Customer",
    project: "Electrical job",
    quote: "Electrical quote",
    primaryAsset: "Photos, plans, or scope notes",
    followUp: "Quote chase-up",
  },
  onboarding: {
    headline: "Set up your sparkie quoting system",
    subcopy:
      "Kindai will tune the dashboard, estimator, CRM, and automation around electrical jobs, labour, cable runs, switchboards, fittings, compliance, and variations.",
    setupSteps: [
      "Add your normal labour rate and call-out rules.",
      "Choose your common job types: residential, commercial, maintenance, switchboards, EV chargers, or fit-outs.",
      "Set your default markup, travel allowance, and compliance wording.",
      "Review the electrical quote template before sending anything to customers.",
    ],
  },
  prompts: {
    acquisition:
      "Qualify electrical leads by job type, property type, urgency, photos or plans supplied, switchboard condition, cable run complexity, access, compliance risk, and decision maker readiness.",
    conversion:
      "Convert electrical enquiries with clear quote steps: confirm scope, ask for photos, identify compliance risks, explain assumptions, send a review-ready quote, and follow up with practical next actions.",
    delivery:
      "Manage electrical delivery through booking, site access, materials, switchboard and circuit checks, compliance documents, variations, testing, and handover.",
    estimatorSystem:
      "You are a senior Australian electrical estimator. Price electrical work using labour, cable runs, fittings, switchboard work, protection, compliance testing, access constraints, travel, GST, and margin. Call out assumptions and compliance items clearly.",
  },
  workflows: [
    { id: "scope-captured", label: "Scope captured", description: "Collect photos, plans, site notes, urgency, and customer details.", agent: "acquisition" },
    { id: "risk-checked", label: "Compliance checked", description: "Flag switchboard, RCD, access, asbestos, and certificate requirements.", agent: "conversion" },
    { id: "quote-sent", label: "Quote sent", description: "Send reviewed quote and trigger practical follow-up reminders.", agent: "conversion" },
    { id: "job-booked", label: "Job booked", description: "Confirm booking, materials, travel, access, and technician notes.", agent: "delivery" },
    { id: "handover-complete", label: "Handover complete", description: "Track testing, compliance certificate, variations, and invoice handover.", agent: "delivery" },
  ],
  estimateTemplates: [
    { category: "labour", label: "Licensed electrician labour", unit: "hr", defaultRate: 115, notes: "Standard electrical labour allowance." },
    { category: "labour", label: "Apprentice or trade assistant", unit: "hr", defaultRate: 65, notes: "Support labour where appropriate." },
    { category: "materials", label: "Cable run allowance", unit: "m", defaultRate: 8.5, notes: "TPS cable, conduit, clips, saddles, and fixings." },
    { category: "materials", label: "GPO or fitting allowance", unit: "ea", defaultRate: 42, notes: "Power points, switches, light fittings, and accessories." },
    { category: "materials", label: "Switchboard protection", unit: "ea", defaultRate: 165, notes: "RCBOs, breakers, RCDs, labels, and switchboard materials." },
    { category: "compliance", label: "Testing and certificate", unit: "job", defaultRate: 180, notes: "Testing, documentation, and state compliance handover." },
    { category: "delivery", label: "Travel and mobilisation", unit: "job", defaultRate: 120, notes: "Vehicle, travel, pickup, and setup allowance." },
  ],
  dashboardWidgets: [
    { id: "quote-speed", title: "Quote speed", metric: "Drafts this week", helpText: "How many electrical quote drafts were created." },
    { id: "compliance-flags", title: "Compliance flags", metric: "Quotes needing review", helpText: "Switchboard, RCD, certificate, or safety assumptions requiring review." },
    { id: "follow-ups", title: "Follow-ups", metric: "Due today", helpText: "Quotes that need a practical chase-up today." },
  ],
  landing: {
    seoTitle: "AI Estimating Software for Electricians | Kindai Estimator",
    seoDescription:
      "Kindai helps electricians quote faster with AI-assisted labour estimates, cable runs, switchboard allowances, fittings, compliance notes, CRM follow-ups, and project tracking.",
    heroTitle: "Quote electrical jobs faster and stop losing leads to paperwork.",
    heroCopy:
      "Kindai turns customer notes, photos, plans, and site details into structured electrical quote drafts, follow-up tasks, reminders, and project workflow for sparkies.",
    painPoints: [
      "Small jobs and quote requests eat up too much admin time.",
      "Cable runs, fittings, labour, switchboard work, and compliance items are easy to underprice.",
      "Customers forget to reply unless someone follows up.",
      "Variations and scope changes get buried in texts and notes.",
    ],
    benefits: [
      "Create structured electrical quote drafts from customer inputs.",
      "Estimate labour, cable, fittings, switchboards, travel, compliance, GST, and margin.",
      "Track every lead through New Lead, Qualified, Quote Sent, Follow-Up, Won, and Lost.",
      "Keep variations, tasks, project notes, and follow-ups in one place.",
    ],
    workflowExamples: [
      "Turn a switchboard upgrade enquiry into a scoped estimate with compliance checks.",
      "Estimate cable runs and fittings for a renovation quote.",
      "Create a follow-up task after a quote is sent so the lead does not go cold.",
    ],
    testimonials: [
      {
        quote: "It gives us a cleaner way to price jobs, chase quotes, and keep compliance assumptions visible.",
        name: "Pilot electrical contractor",
        role: "Residential and light commercial",
      },
      {
        quote: "The pipeline matters as much as the estimator. Leads stop slipping through the cracks.",
        name: "Admin manager",
        role: "Electrical service team",
      },
    ],
    faqs: [
      {
        question: "Does Kindai replace a licensed electrician's judgement?",
        answer: "No. Kindai drafts estimates and flags assumptions. A qualified person still reviews scope, compliance, and safety before any quote is sent.",
      },
      {
        question: "Can it handle switchboards and EV chargers?",
        answer: "Yes. The electrical configuration includes labour, cable runs, switchboard protection, fittings, compliance, EV charger allowances, and travel.",
      },
      {
        question: "Can follow-ups be automatic?",
        answer: "Kindai can draft and schedule follow-up tasks. Sending should remain approval-first unless you explicitly configure a safe automation path.",
      },
    ],
  },
};
