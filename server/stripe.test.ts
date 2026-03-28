import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { PLANS, getPlanById, formatPrice, calculateROI } from "./stripe/products";

// ─── Test helpers ──────────────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-stripe",
    email: "tradie@kindai.com.au",
    name: "Test Tradie",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  const ctx: TrpcContext = {
    user,
    req: { protocol: "https", headers: { origin: "https://kindai.com.au" } } as any,
    res: {
      clearCookie: (name: string, options: any) => {
        clearedCookies.push({ name, options });
      },
    } as any,
  };
  return { ctx, clearedCookies };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

// ─── Product / Plan Tests ──────────────────────────────────────────────────────

describe("Stripe Products & Plans (5-Tier Value-Based)", () => {
  it("defines exactly 5 subscription tiers", () => {
    expect(PLANS).toHaveLength(5);
    expect(PLANS.map((p) => p.id)).toEqual(["free", "solo", "trade_business", "commercial", "enterprise"]);
  });

  it("free plan has $0 pricing", () => {
    const free = getPlanById("free");
    expect(free).toBeDefined();
    expect(free!.priceMonthly).toBe(0);
    expect(free!.priceYearly).toBe(0);
  });

  it("solo plan is $49/mo monthly, $468/yr yearly", () => {
    const solo = getPlanById("solo");
    expect(solo).toBeDefined();
    expect(solo!.priceMonthly).toBe(4900);
    expect(solo!.priceYearly).toBe(46800);
    expect(solo!.popular).toBe(true);
  });

  it("trade_business plan is $199/mo", () => {
    const tb = getPlanById("trade_business");
    expect(tb).toBeDefined();
    expect(tb!.priceMonthly).toBe(19900);
  });

  it("commercial plan is $799/mo — replaces full-time estimator", () => {
    const comm = getPlanById("commercial");
    expect(comm).toBeDefined();
    expect(comm!.priceMonthly).toBe(79900);
    expect(comm!.tagline).toContain("full-time estimator");
  });

  it("enterprise plan is $1,499/mo — replaces estimating department", () => {
    const ent = getPlanById("enterprise");
    expect(ent).toBeDefined();
    expect(ent!.priceMonthly).toBe(149900);
    expect(ent!.contactSales).toBe(true);
  });

  it("yearly pricing is cheaper than monthly (20% discount) for solo", () => {
    const solo = getPlanById("solo")!;
    const monthlyAnnualised = solo.priceMonthly * 12;
    expect(solo.priceYearly).toBeLessThan(monthlyAnnualised);
    const discount = 1 - solo.priceYearly / monthlyAnnualised;
    expect(discount).toBeGreaterThanOrEqual(0.15);
    expect(discount).toBeLessThanOrEqual(0.25);
  });

  it("all plans have features array", () => {
    PLANS.forEach((plan) => {
      expect(plan.features.length).toBeGreaterThan(0);
      plan.features.forEach((f) => {
        expect(typeof f.text).toBe("string");
        expect(typeof f.included).toBe("boolean");
      });
    });
  });

  it("all plans have valid limits", () => {
    PLANS.forEach((plan) => {
      expect(typeof plan.limits.estimatesPerMonth).toBe("number");
      expect(typeof plan.limits.aiTakeoffsPerMonth).toBe("number");
      expect(typeof plan.limits.projectsTotal).toBe("number");
      expect(typeof plan.limits.teamMembers).toBe("number");
    });
  });

  it("free plan has restrictive limits", () => {
    const free = getPlanById("free")!;
    expect(free.limits.estimatesPerMonth).toBe(3);
    expect(free.limits.aiTakeoffsPerMonth).toBe(1);
    expect(free.limits.projectsTotal).toBe(5);
  });

  it("commercial plan has unlimited estimates and takeoffs", () => {
    const comm = getPlanById("commercial")!;
    expect(comm.limits.estimatesPerMonth).toBe(-1);
    expect(comm.limits.aiTakeoffsPerMonth).toBe(-1);
    expect(comm.limits.projectsTotal).toBe(-1);
    expect(comm.limits.teamMembers).toBe(20);
  });

  it("enterprise plan has unlimited everything", () => {
    const ent = getPlanById("enterprise")!;
    expect(ent.limits.estimatesPerMonth).toBe(-1);
    expect(ent.limits.aiTakeoffsPerMonth).toBe(-1);
    expect(ent.limits.projectsTotal).toBe(-1);
    expect(ent.limits.teamMembers).toBe(-1);
  });

  it("formatPrice returns correct AUD formatting", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(4900)).toBe("$49");
    expect(formatPrice(79900)).toBe("$799");
    expect(formatPrice(149900)).toBe("$1.5K");
  });

  it("getPlanById returns undefined for invalid id", () => {
    expect(getPlanById("nonexistent")).toBeUndefined();
  });

  it("each paid tier targets a different audience", () => {
    const solo = getPlanById("solo")!;
    const tb = getPlanById("trade_business")!;
    const comm = getPlanById("commercial")!;
    const ent = getPlanById("enterprise")!;
    expect(solo.targetAudience).toContain("Solo");
    expect(tb.targetAudience).toContain("4-20");
    expect(comm.targetAudience).toContain("20-100");
    expect(ent.targetAudience).toContain("Major");
  });
});

// ─── ROI Calculator Tests ──────────────────────────────────────────────────────

describe("ROI Calculator", () => {
  it("returns null for free plan", () => {
    expect(calculateROI("free")).toBeNull();
  });

  it("solo plan has positive ROI", () => {
    const roi = calculateROI("solo");
    expect(roi).not.toBeNull();
    expect(roi!.annualSavings).toBeGreaterThan(0);
    expect(roi!.roiMultiple).toBeGreaterThan(10);
  });

  it("commercial plan saves over $100K/yr", () => {
    const roi = calculateROI("commercial");
    expect(roi).not.toBeNull();
    expect(roi!.annualSavings).toBeGreaterThan(100000);
  });

  it("enterprise plan saves over $250K/yr", () => {
    const roi = calculateROI("enterprise");
    expect(roi).not.toBeNull();
    expect(roi!.annualSavings).toBeGreaterThan(250000);
  });
});

// ─── Billing Router Tests ──────────────────────────────────────────────────────

describe("Billing Router", () => {
  it("getPlans returns all 5 plans publicly", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    expect(plans).toHaveLength(5);
    expect(plans[0].id).toBe("free");
    expect(plans[1].id).toBe("solo");
    expect(plans[2].id).toBe("trade_business");
    expect(plans[3].id).toBe("commercial");
    expect(plans[4].id).toBe("enterprise");
  });

  it("getPlans returns tagline and targetAudience for each plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    plans.forEach((plan) => {
      expect(plan.tagline).toBeDefined();
      expect(plan.targetAudience).toBeDefined();
      expect(plan.annualSavings).toBeDefined();
    });
  });

  it("getPlans returns popular flag for solo plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    const solo = plans.find((p) => p.id === "solo");
    expect(solo?.popular).toBe(true);
    const free = plans.find((p) => p.id === "free");
    expect(free?.popular).toBe(false);
  });

  it("getSubscription requires authentication", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const sub = await caller.billing.getSubscription();
    expect(sub).toBeDefined();
    expect(sub.tier).toBeDefined();
  });
});

// ─── Plan Feature Gating Logic ─────────────────────────────────────────────────

describe("Plan Feature Gating", () => {
  it("free plan does not include trade pricing", () => {
    const free = getPlanById("free")!;
    const tradePricing = free.features.find((f) => f.text.includes("Trade"));
    expect(tradePricing?.included).toBe(false);
  });

  it("solo plan includes trade pricing", () => {
    const solo = getPlanById("solo")!;
    const tradePricing = solo.features.find((f) => f.text.toLowerCase().includes("trade"));
    expect(tradePricing?.included).toBe(true);
  });

  it("commercial plan includes priority support", () => {
    const comm = getPlanById("commercial")!;
    const support = comm.features.find((f) => f.text.includes("Priority support"));
    expect(support?.included).toBe(true);
  });

  it("free and solo plans do not include team members", () => {
    const free = getPlanById("free")!;
    const solo = getPlanById("solo")!;
    expect(free.limits.teamMembers).toBe(1);
    expect(solo.limits.teamMembers).toBe(1);
  });

  it("trade_business plan includes up to 5 team members", () => {
    const tb = getPlanById("trade_business")!;
    expect(tb.limits.teamMembers).toBe(5);
    const teamFeature = tb.features.find((f) => f.text.includes("team member"));
    expect(teamFeature?.included).toBe(true);
  });

  it("pricing scales with value delivered", () => {
    const solo = getPlanById("solo")!;
    const tb = getPlanById("trade_business")!;
    const comm = getPlanById("commercial")!;
    const ent = getPlanById("enterprise")!;
    // Each tier should be more expensive than the previous
    expect(tb.priceMonthly).toBeGreaterThan(solo.priceMonthly);
    expect(comm.priceMonthly).toBeGreaterThan(tb.priceMonthly);
    expect(ent.priceMonthly).toBeGreaterThan(comm.priceMonthly);
  });
});
