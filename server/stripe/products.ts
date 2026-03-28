/**
 * Kindai Estimating Suite — Value-Based Pricing Model
 *
 * Pricing philosophy: charge based on VALUE delivered, not cost.
 * - Solo tradie saves 5-10 hrs/wk = ~$32K/yr value → charge $49/mo
 * - Trade business replaces part-time estimator = ~$50K/yr value → charge $199/mo
 * - Commercial company replaces full-time estimator ($130K+) → charge $799/mo
 * - Enterprise replaces 2-3 estimators ($300K+) → charge $1,499+/mo
 *
 * Competitor benchmarks:
 * - PlanSwift: $1,749/yr per license
 * - Bluebeam: $3,240/yr per license
 * - Buildxact: $3,588-$7,188/yr
 * - Procore: $20,000-$150,000+/yr
 * - CostX/CostOS: $10,000-$30,000+/yr
 *
 * Australian estimator salary: $95K-$150K+ loaded cost
 */

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  tagline: string;
  description: string;
  priceMonthly: number; // AUD cents
  priceYearly: number;  // AUD cents (annual total)
  features: PlanFeature[];
  limits: {
    estimatesPerMonth: number;   // -1 = unlimited
    aiTakeoffsPerMonth: number;  // -1 = unlimited
    projectsTotal: number;       // -1 = unlimited
    teamMembers: number;         // -1 = unlimited
  };
  popular?: boolean;
  contactSales?: boolean;
  targetAudience: string;
  annualSavings: string; // What this tier saves the customer annually
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export const PLANS: SubscriptionPlan[] = [
  // ─── TIER 1: FREE ────────────────────────────────────────────────────────────
  {
    id: "free",
    name: "Starter",
    tagline: "Try before you buy",
    description: "See what AI estimating can do — no credit card needed",
    targetAudience: "Anyone curious about AI estimating",
    annualSavings: "N/A",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      { text: "3 estimates per month", included: true },
      { text: "1 AI Vision Takeoff per month", included: true },
      { text: "5 active projects", included: true },
      { text: "Basic materials library", included: true },
      { text: "GST calculation", included: true },
      { text: "Retail pricing only", included: true },
      { text: "Trade pricing comparison", included: false },
      { text: "Supplier recommendations", included: false },
      { text: "PDF quote export", included: false },
      { text: "Labour rate engine", included: false },
      { text: "Compliance engine", included: false },
      { text: "Team members", included: false },
      { text: "Priority support", included: false },
      { text: "Accounting export (Xero/MYOB)", included: false },
    ],
    limits: {
      estimatesPerMonth: 3,
      aiTakeoffsPerMonth: 1,
      projectsTotal: 5,
      teamMembers: 1,
    },
  },

  // ─── TIER 2: SOLO TRADIE ─────────────────────────────────────────────────────
  {
    id: "solo",
    name: "Solo Tradie",
    tagline: "For the one-man band",
    description: "Everything a solo sparky, plumber, or chippie needs to quote faster and win more jobs",
    targetAudience: "Solo tradies and owner-operators (1-3 people)",
    annualSavings: "Saves ~$30,000/yr in quoting time",
    priceMonthly: 4900, // $49/mo
    priceYearly: 46800, // $39/mo billed yearly ($468/yr)
    popular: true,
    features: [
      { text: "Unlimited estimates", included: true },
      { text: "10 AI Vision Takeoffs per month", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full materials library", included: true },
      { text: "GST calculation", included: true },
      { text: "Trade vs retail pricing", included: true },
      { text: "Supplier recommendations", included: true },
      { text: "PDF quote export", included: true },
      { text: "Labour rate engine", included: true },
      { text: "Compliance engine (your state)", included: true },
      { text: "Team members", included: false },
      { text: "Priority support", included: false },
      { text: "Accounting export (Xero/MYOB)", included: false },
      { text: "Custom branding on quotes", included: false },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: 10,
      projectsTotal: -1,
      teamMembers: 1,
    },
  },

  // ─── TIER 3: TRADE BUSINESS ──────────────────────────────────────────────────
  {
    id: "trade_business",
    name: "Trade Business",
    tagline: "Replace your part-time estimator",
    description: "For trade businesses with a team — replaces the need for a dedicated part-time estimator",
    targetAudience: "Trade businesses with 4-20 staff",
    annualSavings: "Saves ~$50,000/yr vs part-time estimator",
    priceMonthly: 19900, // $199/mo
    priceYearly: 190800, // $159/mo billed yearly ($1,908/yr)
    features: [
      { text: "Unlimited estimates", included: true },
      { text: "50 AI Vision Takeoffs per month", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full materials library", included: true },
      { text: "GST calculation", included: true },
      { text: "Trade vs retail pricing", included: true },
      { text: "Supplier recommendations", included: true },
      { text: "PDF quote export", included: true },
      { text: "Labour rate engine", included: true },
      { text: "Compliance engine (all states)", included: true },
      { text: "Up to 5 team members", included: true },
      { text: "Standard support", included: true },
      { text: "Accounting export (Xero/MYOB)", included: true },
      { text: "Custom branding on quotes", included: true },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: 50,
      projectsTotal: -1,
      teamMembers: 5,
    },
  },

  // ─── TIER 4: COMMERCIAL ──────────────────────────────────────────────────────
  {
    id: "commercial",
    name: "Commercial",
    tagline: "Replace your full-time estimator",
    description: "For construction companies and large trade operations — does 80% of a $130K/yr estimator's work",
    targetAudience: "Construction companies and large trade businesses (20-100+ staff)",
    annualSavings: "Saves $120,000+/yr vs full-time estimator",
    priceMonthly: 79900, // $799/mo
    priceYearly: 766800, // $639/mo billed yearly ($7,668/yr)
    features: [
      { text: "Unlimited estimates", included: true },
      { text: "Unlimited AI Vision Takeoffs", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full materials library + custom databases", included: true },
      { text: "GST calculation", included: true },
      { text: "Trade vs retail pricing", included: true },
      { text: "Supplier recommendations + direct ordering", included: true },
      { text: "PDF quote export + branded templates", included: true },
      { text: "Labour rate engine + penalty rates", included: true },
      { text: "Compliance engine (all states + AS/NZS)", included: true },
      { text: "Up to 20 team members", included: true },
      { text: "Priority support", included: true },
      { text: "Accounting export (Xero/MYOB/QuickBooks)", included: true },
      { text: "Custom branding on quotes", included: true },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: -1,
      projectsTotal: -1,
      teamMembers: 20,
    },
  },

  // ─── TIER 5: ENTERPRISE ──────────────────────────────────────────────────────
  {
    id: "enterprise",
    name: "Enterprise",
    tagline: "Replace your estimating department",
    description: "For major construction firms — replaces 2-3 full-time estimators and integrates with your existing systems",
    targetAudience: "Major construction firms, tier 1-3 builders, multi-state operations",
    annualSavings: "Saves $300,000+/yr vs estimating team",
    priceMonthly: 149900, // $1,499/mo
    priceYearly: 1438800, // $1,199/mo billed yearly ($14,388/yr)
    contactSales: true,
    features: [
      { text: "Everything in Commercial, plus:", included: true },
      { text: "Unlimited AI Vision Takeoffs", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Multi-trade estimating (all 10 trades)", included: true },
      { text: "Custom material databases", included: true },
      { text: "API access for system integration", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom onboarding + training", included: true },
      { text: "SLA-backed priority support", included: true },
      { text: "SSO / SAML authentication", included: true },
      { text: "Audit trail + compliance reporting", included: true },
      { text: "White-label option available", included: true },
      { text: "Custom integrations (Procore, Aconex, etc.)", included: true },
      { text: "Quarterly business reviews", included: true },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: -1,
      projectsTotal: -1,
      teamMembers: -1,
    },
  },
];

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  const dollars = cents / 100;
  if (dollars >= 1000) return `$${(dollars / 1000).toFixed(1)}K`;
  return `$${dollars.toFixed(0)}`;
}

export function formatPriceMonthly(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}/mo`;
}

/**
 * ROI Calculator — shows customer how much they save vs hiring
 */
export function calculateROI(planId: string): {
  planCostAnnual: number;
  estimatorCostAnnual: number;
  annualSavings: number;
  roiMultiple: number;
} | null {
  const plan = getPlanById(planId);
  if (!plan || plan.priceMonthly === 0) return null;

  const planCostAnnual = plan.priceYearly > 0 ? plan.priceYearly / 100 : (plan.priceMonthly * 12) / 100;

  // Estimator cost benchmarks (AUD, loaded cost)
  const estimatorCosts: Record<string, number> = {
    solo: 32000,        // Value of time saved (8hrs/wk × $85/hr × 48wks)
    trade_business: 55000, // Part-time estimator loaded cost
    commercial: 135000,    // Full-time estimator loaded cost
    enterprise: 320000,    // 2-3 estimators loaded cost
  };

  const estimatorCostAnnual = estimatorCosts[planId] ?? 0;
  const annualSavings = estimatorCostAnnual - planCostAnnual;
  const roiMultiple = planCostAnnual > 0 ? Math.round(estimatorCostAnnual / planCostAnnual) : 0;

  return { planCostAnnual, estimatorCostAnnual, annualSavings, roiMultiple };
}
