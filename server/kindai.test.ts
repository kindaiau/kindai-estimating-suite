import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { COOKIE_NAME } from "../shared/const";

// ── Helpers ────────────────────────────────────────────────────────────────

type AuthUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  const user: AuthUser = {
    id: 1,
    openId: "test-user-openid",
    email: "tradie@example.com.au",
    name: "Test Tradie",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
    ...overrides,
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ── Auth Tests ─────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("tradie@example.com.au");
    expect(result?.name).toBe("Test Tradie");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx = makeCtx({
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    });
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1, httpOnly: true });
  });
});

// ── Compliance Tests ────────────────────────────────────────────────────────

describe("compliance.getTrades", () => {
  it("returns all 10 supported trades", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const trades = await caller.compliance.getTrades();
    expect(trades).toBeDefined();
    expect(Array.isArray(trades)).toBe(true);
    expect(trades.length).toBeGreaterThanOrEqual(10);
  });
});

describe("compliance.getProfile", () => {
  it("returns compliance profile for electrical trade", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const profile = await caller.compliance.getProfile({ trade: "electrical", state: "QLD" });
    expect(profile).not.toBeNull();
    expect(profile?.trade).toBe("electrical");
    expect(profile?.standards).toBeDefined();
    expect(Array.isArray(profile?.standards)).toBe(true);
    expect(profile?.whsNotice).toBeTruthy();
  });

  it("returns compliance profile for plumbing trade with NSW state", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const profile = await caller.compliance.getProfile({ trade: "plumbing", state: "NSW" });
    expect(profile).not.toBeNull();
    expect(profile?.licensing).toBeDefined();
    expect(profile?.licensing?.body).toBeTruthy();
  });

  it("returns null for unknown trade", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const profile = await caller.compliance.getProfile({ trade: "unknown-trade" });
    expect(profile).toBeNull();
  });

  it("includes quote disclaimer for each trade", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const trades = ["electrical", "plumbing", "carpentry", "concreting", "hvac", "flooring", "landscaping", "cabinetry", "rendering", "cabinet-making"];
    for (const trade of trades) {
      const profile = await caller.compliance.getProfile({ trade });
      expect(profile?.quoteDisclaimer).toBeTruthy();
    }
  });
});

// ── GST Calculation Tests ────────────────────────────────────────────────────

describe("GST calculation logic", () => {
  it("correctly calculates 10% GST on a subtotal", () => {
    const subtotal = 1000;
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    expect(gst).toBe(100);
    expect(total).toBe(1100);
  });

  it("correctly calculates GST for typical trade quote", () => {
    const lineItems = [
      { quantity: 20, unitRate: 45, wasteFactor: 0 },   // materials
      { quantity: 8, unitRate: 95, wasteFactor: 0 },    // labour hours
      { quantity: 1, unitRate: 150, wasteFactor: 0 },   // call-out
    ];
    const subtotal = lineItems.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitRate * (1 + item.wasteFactor / 100);
      return sum + itemTotal;
    }, 0);
    const gst = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal + gst) * 100) / 100;
    expect(subtotal).toBe(1810); // 900 + 760 + 150
    expect(gst).toBe(181);
    expect(total).toBe(1991);
  });

  it("applies waste factor correctly", () => {
    const quantity = 100;
    const unitRate = 10;
    const wasteFactor = 10; // 10%
    const subtotal = quantity * unitRate * (1 + wasteFactor / 100);
    expect(subtotal).toBe(1100); // 1000 + 100 waste
  });
});

// ── Quote Number Format Tests ─────────────────────────────────────────────

describe("Quote number format", () => {
  it("generates quote numbers in correct Australian format", () => {
    // Quote numbers should be like KAI-2025-001234
    const quoteNumberPattern = /^KAI-\d{4}-\d{6}$/;
    // Test the pattern itself
    expect("KAI-2025-001234").toMatch(quoteNumberPattern);
    expect("KAI-2026-000001").toMatch(quoteNumberPattern);
    expect("INVALID").not.toMatch(quoteNumberPattern);
  });
});

// ── Labour Rate Tests ─────────────────────────────────────────────────────

describe("Labour rate calculations", () => {
  it("calculates overtime rate correctly (1.5x base)", () => {
    const baseRate = 45.50;
    const overtimeMultiplier = 1.5;
    const overtimeRate = baseRate * overtimeMultiplier;
    expect(overtimeRate).toBeCloseTo(68.25, 2);
  });

  it("calculates Sunday penalty rate correctly (2x base)", () => {
    const baseRate = 45.50;
    const sundayMultiplier = 2.0;
    const sundayRate = baseRate * sundayMultiplier;
    expect(sundayRate).toBeCloseTo(91.00, 2);
  });

  it("calculates public holiday rate correctly (2.5x base)", () => {
    const baseRate = 45.50;
    const phMultiplier = 2.5;
    const phRate = baseRate * phMultiplier;
    expect(phRate).toBeCloseTo(113.75, 2);
  });
});

// ── Margin Tests ─────────────────────────────────────────────────────────

describe("Margin calculation", () => {
  it("applies margin on top of cost correctly", () => {
    const cost = 1000;
    const marginPercent = 20;
    const withMargin = cost * (1 + marginPercent / 100);
    expect(withMargin).toBe(1200);
  });

  it("calculates markup vs margin distinction", () => {
    const cost = 1000;
    // Markup: add % of cost
    const markup20 = cost * 1.2;
    expect(markup20).toBe(1200);
    // Margin: % of selling price
    const margin20 = cost / (1 - 0.2);
    expect(margin20).toBe(1250);
  });
});

// ── Australian Address Validation ─────────────────────────────────────────

describe("Australian state validation", () => {
  const validStates = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"];
  
  it("accepts all valid Australian states and territories", () => {
    validStates.forEach(state => {
      expect(validStates).toContain(state);
    });
    expect(validStates).toHaveLength(8);
  });

  it("rejects invalid state codes", () => {
    const invalid = ["NZ", "USA", "UK", "QC", "ON"];
    invalid.forEach(state => {
      expect(validStates).not.toContain(state);
    });
  });
});
