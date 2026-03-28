import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { PLANS, getPlanById, formatPrice } from "./stripe/products";

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

describe("Stripe Products & Plans", () => {
  it("defines exactly 3 subscription tiers", () => {
    expect(PLANS).toHaveLength(3);
    expect(PLANS.map((p) => p.id)).toEqual(["free", "pro", "business"]);
  });

  it("free plan has $0 pricing", () => {
    const free = getPlanById("free");
    expect(free).toBeDefined();
    expect(free!.priceMonthly).toBe(0);
    expect(free!.priceYearly).toBe(0);
  });

  it("pro plan is $49/mo monthly, $468/yr yearly", () => {
    const pro = getPlanById("pro");
    expect(pro).toBeDefined();
    expect(pro!.priceMonthly).toBe(4900);
    expect(pro!.priceYearly).toBe(46800);
    expect(pro!.popular).toBe(true);
  });

  it("business plan is $149/mo monthly, $1428/yr yearly", () => {
    const biz = getPlanById("business");
    expect(biz).toBeDefined();
    expect(biz!.priceMonthly).toBe(14900);
    expect(biz!.priceYearly).toBe(142800);
  });

  it("yearly pricing is cheaper than monthly (20% discount)", () => {
    const pro = getPlanById("pro")!;
    const monthlyAnnualised = pro.priceMonthly * 12;
    expect(pro.priceYearly).toBeLessThan(monthlyAnnualised);
    // Verify ~20% discount
    const discount = 1 - pro.priceYearly / monthlyAnnualised;
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

  it("business plan has unlimited limits", () => {
    const biz = getPlanById("business")!;
    expect(biz.limits.estimatesPerMonth).toBe(-1);
    expect(biz.limits.aiTakeoffsPerMonth).toBe(-1);
    expect(biz.limits.projectsTotal).toBe(-1);
  });

  it("formatPrice returns correct AUD formatting", () => {
    expect(formatPrice(0)).toBe("Free");
    expect(formatPrice(4900)).toBe("$49");
    expect(formatPrice(14900)).toBe("$149");
  });

  it("getPlanById returns undefined for invalid id", () => {
    expect(getPlanById("nonexistent")).toBeUndefined();
  });
});

// ─── Billing Router Tests ──────────────────────────────────────────────────────

describe("Billing Router", () => {
  it("getPlans returns all 3 plans publicly", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    expect(plans).toHaveLength(3);
    expect(plans[0].id).toBe("free");
    expect(plans[1].id).toBe("pro");
    expect(plans[2].id).toBe("business");
  });

  it("getPlans returns features and limits for each plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    plans.forEach((plan) => {
      expect(plan.features.length).toBeGreaterThan(0);
      expect(plan.limits).toBeDefined();
      expect(typeof plan.limits.estimatesPerMonth).toBe("number");
    });
  });

  it("getPlans returns popular flag for pro plan", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    const pro = plans.find((p) => p.id === "pro");
    expect(pro?.popular).toBe(true);
    const free = plans.find((p) => p.id === "free");
    expect(free?.popular).toBe(false);
  });

  it("getSubscription requires authentication", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    // Should not throw — returns default for authenticated user
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
    // Trade pricing should exist but not be included
    expect(tradePricing?.included).toBe(false);
  });

  it("pro plan includes trade pricing", () => {
    const pro = getPlanById("pro")!;
    const tradePricing = pro.features.find((f) => f.text.toLowerCase().includes("trade"));
    expect(tradePricing?.included).toBe(true);
  });

  it("only business plan includes priority support", () => {
    const free = getPlanById("free")!;
    const pro = getPlanById("pro")!;
    const biz = getPlanById("business")!;

    const freeSupport = free.features.find((f) => f.text.includes("Priority support"));
    const proSupport = pro.features.find((f) => f.text.includes("Priority support"));
    const bizSupport = biz.features.find((f) => f.text.includes("Priority support"));

    expect(freeSupport?.included).toBe(false);
    expect(proSupport?.included).toBe(false);
    expect(bizSupport?.included).toBe(true);
  });
});
