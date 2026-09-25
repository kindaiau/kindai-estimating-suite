/**
 * Kindai Estimating Suite — Enterprise Value-Based Pricing Model
 *
 * Pricing philosophy: We are NOT selling software. We are selling the elimination
 * of a $100K–$250K annual risk (salary + super + leave + wrong quotes + missed jobs).
 *
 * The real cost of a full-time estimator in Australia:
 *   - Base salary:         $95,000 – $182,000
 *   - Super (11.5%):       $10,925 – $20,930
 *   - Leave loading (17.5%): $4,156 – $7,963
 *   - Workers comp (~2%):  $1,900 – $3,640
 *   - Desk / IT / tools:   $5,000 – $15,000
 *   ─────────────────────────────────────────
 *   TOTAL LOADED COST:    $117,000 – $229,500/yr
 *
 * PLUS the risk cost of underquoting:
 *   - Average underquote on a $500K job = 8–15% = $40K–$75K loss
 *   - One bad quote can wipe out 3–6 months of profit
 *
 * Competitor benchmarks:
 *   - PlanSwift:     $170/mo ($2,040/yr) — basic takeoff only, no AI
 *   - Buildxact:     $149–$399/mo ($1,788–$4,788/yr) — no AI Vision
 *   - Cubit:         $99–$299/mo per seat — no AI, desktop-only
 *   - Bluebeam:      $270/mo per seat ($3,240/yr) — markup tool only
 *   - CostX/CostOS:  $10,000–$30,000/yr — enterprise, no AI
 *   - Procore:       $20,000–$150,000+/yr — full PM suite
 *
 * Kindai advantage: AI Vision Takeoff + Australian compliance + trade pricing
 * in a single platform. No other tool does this.
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
  priceYearly: number;  // AUD cents (annual total, billed annually)
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
  annualSavings: string;
  roiStatement: string;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export const PILOT_SETUP_OFFER = {
  id: "founding_pilot_setup_sprint",
  version: "1.0",
  name: "KindAI Cabinet & Joinery Founding Workflow Setup + 6 Months",
  description:
    "One founder-led cabinet or joinery workflow setup, up to 150 price-book rows, up to 20 written rules, two reviewed real jobs, 30 days of email support, and the first 6 months of Sole Tradie for one user.",
  priceExGst: 250000,
  gstAmount: 25000,
  amount: 275000,
  currency: "aud",
};

export function getPlanCheckoutAmount(
  plan: SubscriptionPlan,
  interval: "monthly" | "yearly"
): number {
  return interval === "yearly" ? plan.priceYearly : plan.priceMonthly;
}

export const PLANS: SubscriptionPlan[] = [
  // ─── TIER 1: EVALUATION ──────────────────────────────────────────────────────
  {
    id: "free",
    name: "Evaluation",
    tagline: "Explore the workflow before you commit",
    description: "Explore a representative sample, then apply for the paid cabinet and joinery Founding Workflow Setup.",
    targetAudience: "Any construction business evaluating AI estimating",
    annualSavings: "N/A",
    roiStatement: "No open-ended free AI access",
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      { text: "Interactive estimating sample", included: true },
      { text: "A$2,500 + GST Founding Workflow Setup by application", included: true },
      { text: "Private projects", included: false },
      { text: "Basic materials library", included: true },
      { text: "GST calculation", included: true },
      { text: "Retail pricing only", included: true },
      { text: "Trade vs retail pricing", included: false },
      { text: "PDF quote export", included: false },
      { text: "Labour rate engine", included: false },
      { text: "Compliance engine", included: false },
      { text: "Supplier recommendations", included: false },
      { text: "Team members", included: false },
    ],
    limits: {
      estimatesPerMonth: 0,
      aiTakeoffsPerMonth: 0,
      projectsTotal: 0,
      teamMembers: 1,
    },
  },

  // ─── TIER 2: SOLE TRADER ─────────────────────────────────────────────────────
  {
    id: "sole_trader",
    name: "Sole Tradie",
    tagline: "Quote faster. Win more jobs.",
    description: "For an owner-operator who wants a repeatable estimating workflow using their own rates and business rules.",
    targetAudience: "Sole traders and owner-operators (1–2 people)",
    annualSavings: "Depends on estimating volume and review time",
    roiStatement: "Validate the value on your own jobs before committing",
    priceMonthly: 14900, // $149/mo
    priceYearly: 143040, // $119/mo billed annually ($1,428/yr — saves $360)
    features: [
      { text: "Unlimited estimates", included: true },
      { text: "20 AI Vision Takeoffs per month", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full materials library (151+ items)", included: true },
      { text: "GST calculation + compliance", included: true },
      { text: "Trade vs retail pricing comparison", included: true },
      { text: "Supplier recommendations", included: true },
      { text: "Branded PDF quote export", included: true },
      { text: "Labour rate engine (Fair Work rates)", included: true },
      { text: "Compliance engine (your state)", included: true },
      { text: "Team members", included: false },
      { text: "Client-owned accounting export", included: false },
      { text: "Multi-state compliance", included: false },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: 20,
      projectsTotal: -1,
      teamMembers: 1,
    },
  },

  // ─── TIER 3: PRO ─────────────────────────────────────────────────────────────
  {
    id: "small_builder",
    name: "Pro",
    tagline: "For growing trade teams.",
    description: "For trade businesses with a small team. Adds unlimited AI volume, client-owned accounting integrations, accuracy reporting, and team workflows.",
    targetAudience: "Trade businesses with 3–15 staff",
    annualSavings: "Depends on team usage, estimating volume and existing workflow",
    roiStatement: "Designed to standardise estimating across a small team",
    priceMonthly: 45000, // $450/mo
    priceYearly: 432000, // $360/mo billed annually ($4,320/yr — saves $1,080)
    popular: true,
    features: [
      { text: "Unlimited estimates", included: true },
      { text: "Unlimited AI Vision Takeoffs", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full materials library + custom items", included: true },
      { text: "GST calculation + compliance", included: true },
      { text: "Trade vs retail pricing comparison", included: true },
      { text: "Supplier recommendations + direct ordering", included: true },
      { text: "Branded PDF quote export", included: true },
      { text: "Labour rate engine + penalty rates", included: true },
      { text: "Compliance engine (all 8 states)", included: true },
      { text: "Up to 5 team members", included: true },
      { text: "Client-owned accounting export (Xero/MYOB)", included: true },
      { text: "Custom branding on quotes", included: true },
      { text: "Priority email support", included: true },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: -1,
      projectsTotal: -1,
      teamMembers: 5,
    },
  },

  // ─── TIER 4: MID-TIER BUILDER ────────────────────────────────────────────────
  {
    id: "mid_builder",
    name: "Mid-Tier Builder",
    tagline: "Support a high-volume estimating team.",
    description: "For construction companies that need higher-volume, multi-trade estimating with onboarding, controls and dedicated support.",
    targetAudience: "Construction companies with 15–100 staff, $2M–$20M turnover",
    annualSavings: "Depends on estimating volume, staffing and review workflow",
    roiStatement: "Commercial value is validated during onboarding and review",
    priceMonthly: 149900, // $1,499/mo
    priceYearly: 1438800, // $1,199/mo billed annually ($14,388/yr — saves $3,600)
    features: [
      { text: "Everything in Pro, plus:", included: true },
      { text: "Unlimited AI Vision Takeoffs", included: true },
      { text: "Up to 20 team members", included: true },
      { text: "Multi-trade estimating (all 10 trades)", included: true },
      { text: "Custom material price databases", included: true },
      { text: "Advanced compliance (AS/NZS standards)", included: true },
      { text: "Client-owned accounting export (Xero/MYOB/QuickBooks)", included: true },
      { text: "Quote acceptance portal (client-facing)", included: true },
      { text: "Win rate analytics dashboard", included: true },
      { text: "Dedicated phone + email support", included: true },
      { text: "Onboarding session included", included: true },
      { text: "API access", included: true },
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
    name: "Enterprise & Custom Solutions",
    tagline: "Built around your workflow.",
    description: "For builders and major trade teams that need custom onboarding, integrations, supplier price books, and commercial support around their existing or recommended systems.",
    targetAudience: "Tier 1–3 builders, $20M+ turnover, multi-state operations",
    annualSavings: "Defined against the customer's current workflow and delivery cost",
    roiStatement: "Custom scope and commercial case required",
    priceMonthly: 0, // Custom pricing by contact
    priceYearly: 0, // Custom pricing by contact
    contactSales: true,
    features: [
      { text: "Everything in Pro, plus:", included: true },
      { text: "Unlimited team members", included: true },
      { text: "Dedicated account manager", included: true },
      { text: "Custom onboarding + staff training", included: true },
      { text: "SLA-backed 4-hour support response", included: true },
      { text: "SSO / SAML authentication", included: true },
      { text: "Audit trail + compliance reporting", included: true },
      { text: "White-label option available", included: true },
      { text: "Custom accounting and job-management integrations", included: true },
      { text: "Quarterly business reviews", included: true },
      { text: "Custom AI model training on your data", included: true },
      { text: "Volume pricing for multi-site deployments", included: true },
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
 * ROI Calculator — shows the customer exactly how much they save vs hiring
 * Based on real 2024-25 Australian salary + on-costs data
 */
export function calculateROI(planId: string): {
  planCostAnnual: number;
  estimatorCostAnnual: number;
  annualSavings: number;
  roiMultiple: number;
  paybackDays: number;
} | null {
  const plan = getPlanById(planId);
  if (!plan || plan.priceMonthly === 0) return null;

  const planCostAnnual = plan.priceYearly > 0 ? plan.priceYearly / 100 : (plan.priceMonthly * 12) / 100;

  // Fully loaded estimator cost benchmarks (AUD) — salary + super + leave + on-costs
  const estimatorCosts: Record<string, number> = {
    sole_trader: 35000,    // Value of time saved (10hrs/wk × $85/hr × 48wks)
    small_builder: 72000,  // Part-time estimator fully loaded cost
    mid_builder: 155000,   // Full-time estimator fully loaded cost (median)
    enterprise: 350000,    // 2–3 estimators fully loaded cost
  };

  const estimatorCostAnnual = estimatorCosts[planId] ?? 0;
  const annualSavings = estimatorCostAnnual - planCostAnnual;
  const roiMultiple = planCostAnnual > 0 ? Math.round(estimatorCostAnnual / planCostAnnual) : 0;
  const paybackDays = planCostAnnual > 0 ? Math.round((planCostAnnual / estimatorCostAnnual) * 365) : 0;

  return { planCostAnnual, estimatorCostAnnual, annualSavings, roiMultiple, paybackDays };
}
