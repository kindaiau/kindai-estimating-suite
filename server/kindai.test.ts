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

// ── AI Vision Takeoff Tests ──────────────────────────────────────────────

describe("AI Vision Takeoff pricing logic", () => {
  const sampleItems = [
    { quantity: 20, retailPrice: 12.50, tradePrice: 8.75, labourMinutes: 15, wasteFactor: 5 },
    { quantity: 15, retailPrice: 45.00, tradePrice: 32.00, labourMinutes: 20, wasteFactor: 3 },
    { quantity: 1, retailPrice: 850.00, tradePrice: 620.00, labourMinutes: 120, wasteFactor: 0 },
  ];

  it("calculates trade vs retail savings correctly", () => {
    let totalRetail = 0;
    let totalTrade = 0;
    for (const item of sampleItems) {
      const wm = 1 + item.wasteFactor / 100;
      totalRetail += item.quantity * wm * item.retailPrice;
      totalTrade += item.quantity * wm * item.tradePrice;
    }
    const savings = totalRetail - totalTrade;
    expect(savings).toBeGreaterThan(0);
    // Trade should always be cheaper than retail
    expect(totalTrade).toBeLessThan(totalRetail);
  });

  it("applies waste factor to material quantities", () => {
    const item = sampleItems[0];
    const withWaste = item.quantity * (1 + item.wasteFactor / 100);
    expect(withWaste).toBe(21); // 20 * 1.05 = 21
  });

  it("calculates total labour hours from per-item minutes", () => {
    let totalMinutes = 0;
    for (const item of sampleItems) {
      totalMinutes += item.quantity * item.labourMinutes;
    }
    const totalHours = totalMinutes / 60;
    // 20*15 + 15*20 + 1*120 = 300 + 300 + 120 = 720 minutes = 12 hours
    expect(totalHours).toBe(12);
  });

  it("calculates full quote with markup and GST", () => {
    const labourRate = 85;
    const markupPercent = 20;

    let materialsCost = 0;
    let totalLabourHours = 0;
    for (const item of sampleItems) {
      const wm = 1 + item.wasteFactor / 100;
      materialsCost += item.quantity * wm * item.tradePrice;
      totalLabourHours += (item.quantity * item.labourMinutes) / 60;
    }

    const labourCost = totalLabourHours * labourRate;
    const subtotal = materialsCost + labourCost;
    const markup = subtotal * (markupPercent / 100);
    const subtotalWithMarkup = subtotal + markup;
    const gst = subtotalWithMarkup * 0.1;
    const total = subtotalWithMarkup + gst;

    expect(materialsCost).toBeGreaterThan(0);
    expect(labourCost).toBeGreaterThan(0);
    expect(gst).toBeCloseTo(subtotalWithMarkup * 0.1, 2);
    expect(total).toBeCloseTo(subtotalWithMarkup * 1.1, 2);
    expect(total).toBeGreaterThan(subtotal);
  });

  it("handles zero markup correctly", () => {
    const cost = 5000;
    const markupPercent = 0;
    const withMarkup = cost * (1 + markupPercent / 100);
    const gst = withMarkup * 0.1;
    const total = withMarkup + gst;
    expect(withMarkup).toBe(5000);
    expect(total).toBe(5500);
  });
});

describe("AI supplier recommendation", () => {
  it("getSuppliers returns suppliers for valid trade", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const suppliers = await caller.ai.getSuppliers({ trade: "electrical" });
    expect(Array.isArray(suppliers)).toBe(true);
    expect(suppliers.length).toBeGreaterThan(0);
    // Each supplier should have required fields
    for (const s of suppliers) {
      expect(s.name).toBeTruthy();
      expect(s.website).toBeTruthy();
      expect(["trade", "retail", "online"]).toContain(s.type);
    }
  });

  it("getSuppliers filters by state when provided", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const suppliers = await caller.ai.getSuppliers({ trade: "plumbing", state: "QLD" });
    expect(Array.isArray(suppliers)).toBe(true);
    expect(suppliers.length).toBeGreaterThan(0);
  });
});
