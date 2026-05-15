import { describe, expect, it } from "vitest";
import { normalizeTakeoffItem } from "./takeoffPricing";

describe("normalizeTakeoffItem", () => {
  it("swaps retail/trade when returned in reverse order", () => {
    const item = normalizeTakeoffItem({
      description: "Switch",
      unit: "ea",
      quantity: 1,
      tradePrice: 22,
      retailPrice: 16,
    });

    expect(item.tradePrice).toBe(16);
    expect(item.retailPrice).toBe(22);
  });

  it("fills missing trade price from retail price", () => {
    const item = normalizeTakeoffItem({
      description: "Conduit",
      unit: "m",
      quantity: 10,
      retailPrice: 12.5,
      tradePrice: 0,
    });

    expect(item.tradePrice).toBe(10);
    expect(item.retailPrice).toBe(12.5);
  });

  it("clamps invalid numeric values", () => {
    const item = normalizeTakeoffItem({
      quantity: -3,
      labourMinutes: -10,
      wasteFactor: 220,
      tradePrice: -4,
      retailPrice: -2,
    });

    expect(item.quantity).toBe(0);
    expect(item.labourMinutes).toBe(0);
    expect(item.wasteFactor).toBe(100);
    expect(item.tradePrice).toBe(0);
    expect(item.retailPrice).toBe(0);
  });
});
