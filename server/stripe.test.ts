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

describe("Stripe Products & Plans (5-Tier Enterprise Value-Based)", () => {
  it("defines exactly 5 subscription tiers", () => {
    expect(PLANS).toHaveLength(5);
    expect(PLANS.map((p) => p.id)).toEqual([
      "free",
      "sole_trader",
      "small_builder",
      "mid_builder",
      "enterprise",
    ]);
  });

  it("free plan has $0 pricing", () => {
    const free = getPlanById("free");
    expect(free).toBeDefined();
    expect(free!.priceMonthly).toBe(0);
    expect(free!.priceYearly).toBe(0);
  });

  it("sole_trader plan is $149/mo monthly", () => {
    const solo = getPlanById("sole_trader");
    expect(solo).toBeDefined();
    expect(solo!.priceMonthly).toBe(14900);
    expect(solo!.priceYearly).toBe(143040);
  });

  it("small_builder plan is the $450/mo Pro tier", () => {
    const sb = getPlanById("small_builder");
    expect(sb).toBeDefined();
    expect(sb!.name).toBe("Pro");
    expect(sb!.priceMonthly).toBe(45000);
    expect(sb!.priceYearly).toBe(432000);
    expect(sb!.popular).toBe(true);
    expect(sb!.tagline).toContain("growing trade teams");
  });

  it("mid_builder plan is $1,499/mo — replaces full-time estimator", () => {
    const mb = getPlanById("mid_builder");
    expect(mb).toBeDefined();
    expect(mb!.priceMonthly).toBe(149900);
    expect(mb!.tagline).toContain("full-time estimator");
  });

  it("enterprise plan is custom pricing by contact", () => {
    const ent = getPlanById("enterprise");
    expect(ent).toBeDefined();
    expect(ent!.name).toBe("Enterprise & Custom Solutions");
    expect(ent!.priceMonthly).toBe(0);
    expect(ent!.priceYearly).toBe(0);
    expect(ent!.contactSales).toBe(true);
  });

  it("yearly pricing is cheaper than monthly (20% discount) for sole_trader", () => {
    const solo = getPlanById("sole_trader")!;
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
    expect(free.limits.aiTakeoffsPerMonth).toBe(3);
    expect(free.limits.projectsTotal).toBe(5);
  });

  it("mid_builder plan has unlimited estimates and takeoffs", () => {
    const mb = getPlanById("mid_builder")!;
    expect(mb.limits.estimatesPerMonth).toBe(-1);
    expect(mb.limits.aiTakeoffsPerMonth).toBe(-1);
    expect(mb.limits.projectsTotal).toBe(-1);
    expect(mb.limits.teamMembers).toBe(20);
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
    expect(formatPrice(14900)).toBe("$149");
    expect(formatPrice(45000)).toBe("$450");
    expect(formatPrice(149900)).toBe("$1.5K");
  });

  it("getPlanById returns undefined for invalid id", () => {
    expect(getPlanById("nonexistent")).toBeUndefined();
  });

  it("each paid tier targets a different audience", () => {
    const solo = getPlanById("sole_trader")!;
    const sb = getPlanById("small_builder")!;
    const mb = getPlanById("mid_builder")!;
    const ent = getPlanById("enterprise")!;
    expect(solo.targetAudience).toContain("Sole");
    expect(sb.targetAudience).toContain("3");
    expect(mb.targetAudience).toContain("15");
    expect(ent.targetAudience).toContain("Tier");
  });
});

// ─── ROI Calculator Tests ──────────────────────────────────────────────────────

describe("ROI Calculator", () => {
  it("returns null for free plan", () => {
    expect(calculateROI("free")).toBeNull();
  });

  it("sole_trader plan has positive ROI", () => {
    const roi = calculateROI("sole_trader");
    expect(roi).not.toBeNull();
    expect(roi!.annualSavings).toBeGreaterThan(0);
    expect(roi!.roiMultiple).toBeGreaterThan(5);
  });

  it("mid_builder plan saves over $100K/yr", () => {
    const roi = calculateROI("mid_builder");
    expect(roi).not.toBeNull();
    expect(roi!.annualSavings).toBeGreaterThan(100000);
  });

  it("enterprise custom plan does not calculate fixed ROI", () => {
    const roi = calculateROI("enterprise");
    expect(roi).toBeNull();
  });

  it("all paid plans include paybackDays", () => {
    ["sole_trader", "small_builder", "mid_builder"].forEach((id) => {
      const roi = calculateROI(id);
      expect(roi).not.toBeNull();
      expect(roi!.paybackDays).toBeGreaterThan(0);
      expect(roi!.paybackDays).toBeLessThan(365);
    });
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
    expect(plans[1].id).toBe("sole_trader");
    expect(plans[2].id).toBe("small_builder");
    expect(plans[3].id).toBe("mid_builder");
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

  it("getPlans returns popular flag for small_builder plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    const sb = plans.find((p) => p.id === "small_builder");
    expect(sb?.popular).toBe(true);
    const free = plans.find((p) => p.id === "free");
    expect(free?.popular).toBe(false);
  });

  it("getSubscription returns subscription data with required fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // With a live DB, getSubscription should return a valid subscription object
    // (may return free tier for a test user that doesn't exist in DB)
    // The key contract: it must not silently return fake data when DB is unavailable
    // This is enforced by the requireDatabase check in billing.ts
    const result = await caller.billing.getSubscription().catch((err) => {
      // If DB is unavailable, it should throw INTERNAL_SERVER_ERROR — not return fake free tier
      expect(err.code).toBe("INTERNAL_SERVER_ERROR");
      expect(err.message).toBe("Database unavailable");
      return null;
    });
    if (result !== null) {
      // If DB is available, result must have required fields
      expect(result).toHaveProperty("tier");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("planName");
      expect(result).toHaveProperty("limits");
    }
  });
});

// ─── Plan Feature Gating Logic ─────────────────────────────────────────────────

describe("Plan Feature Gating", () => {
  it("free plan does not include trade pricing", () => {
    const free = getPlanById("free")!;
    const tradePricing = free.features.find((f) => f.text.includes("Trade"));
    expect(tradePricing?.included).toBe(false);
  });

  it("sole_trader plan includes trade pricing", () => {
    const solo = getPlanById("sole_trader")!;
    const tradePricing = solo.features.find((f) => f.text.toLowerCase().includes("trade"));
    expect(tradePricing?.included).toBe(true);
  });

  it("mid_builder plan includes priority support", () => {
    const mb = getPlanById("mid_builder")!;
    const support = mb.features.find((f) => f.text.toLowerCase().includes("support"));
    expect(support?.included).toBe(true);
  });

  it("free and sole_trader plans do not include team members", () => {
    const free = getPlanById("free")!;
    const solo = getPlanById("sole_trader")!;
    expect(free.limits.teamMembers).toBe(1);
    expect(solo.limits.teamMembers).toBe(1);
  });

  it("small_builder plan includes up to 5 team members", () => {
    const sb = getPlanById("small_builder")!;
    expect(sb.limits.teamMembers).toBe(5);
    const teamFeature = sb.features.find((f) => f.text.includes("team member"));
    expect(teamFeature?.included).toBe(true);
  });

  it("pricing scales with value delivered", () => {
    const solo = getPlanById("sole_trader")!;
    const sb = getPlanById("small_builder")!;
    const mb = getPlanById("mid_builder")!;
    const ent = getPlanById("enterprise")!;
    // Self-serve tiers should scale with value delivered. Enterprise is scoped directly.
    expect(sb.priceMonthly).toBeGreaterThan(solo.priceMonthly);
    expect(mb.priceMonthly).toBeGreaterThan(sb.priceMonthly);
    expect(ent.priceMonthly).toBe(0);
    expect(ent.contactSales).toBe(true);
  });
});
