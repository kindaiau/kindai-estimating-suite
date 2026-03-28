/**
 * Kindai Estimating Suite — Subscription Tiers
 * Prices are in AUD cents
 */

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: "free" | "pro" | "business";
  name: string;
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
  stripePriceIdMonthly?: string; // Set after creating in Stripe
  stripePriceIdYearly?: string;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Starter",
    description: "Get started with basic estimating",
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
      { text: "Priority support", included: false },
    ],
    limits: {
      estimatesPerMonth: 3,
      aiTakeoffsPerMonth: 1,
      projectsTotal: 5,
      teamMembers: 1,
    },
  },
  {
    id: "pro",
    name: "Pro Tradie",
    description: "Everything a solo tradie needs",
    priceMonthly: 4900, // $49/mo
    priceYearly: 46800, // $39/mo billed yearly ($468)
    popular: true,
    features: [
      { text: "Unlimited estimates", included: true },
      { text: "20 AI Vision Takeoffs per month", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full materials library", included: true },
      { text: "GST calculation", included: true },
      { text: "Trade vs retail pricing", included: true },
      { text: "Supplier recommendations", included: true },
      { text: "PDF quote export", included: true },
      { text: "Team members (up to 3)", included: false },
      { text: "Priority support", included: false },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: 20,
      projectsTotal: -1,
      teamMembers: 1,
    },
  },
  {
    id: "business",
    name: "Business",
    description: "For growing trade businesses",
    priceMonthly: 14900, // $149/mo
    priceYearly: 142800, // $119/mo billed yearly ($1,428)
    features: [
      { text: "Unlimited estimates", included: true },
      { text: "Unlimited AI Vision Takeoffs", included: true },
      { text: "Unlimited projects", included: true },
      { text: "Full materials library", included: true },
      { text: "GST calculation", included: true },
      { text: "Trade vs retail pricing", included: true },
      { text: "Supplier recommendations", included: true },
      { text: "PDF quote export", included: true },
      { text: "Team members (up to 10)", included: true },
      { text: "Priority support", included: true },
    ],
    limits: {
      estimatesPerMonth: -1,
      aiTakeoffsPerMonth: -1,
      projectsTotal: -1,
      teamMembers: 10,
    },
  },
];

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatPrice(cents: number): string {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(0)}`;
}
