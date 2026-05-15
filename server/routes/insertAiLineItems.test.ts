import { describe, expect, it } from "vitest";
import { buildAiLineItemRows } from "./insertAiLineItems";

describe("buildAiLineItemRows", () => {
  it("uses the selected price source and scales labour by quantity", () => {
    const rows = buildAiLineItemRows(42, [
      {
        section: "Power",
        description: "Double GPO",
        unit: "ea",
        quantity: 3,
        tradePrice: 18,
        retailPrice: 24,
        category: "Materials",
        labourMinutes: 30,
        wasteFactor: 10,
      },
    ], {
      labourRate: 90,
      useTradePrice: false,
    });

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      estimateId: 42,
      description: "Double GPO",
      unitRate: "24",
      subtotal: "79.2",
    });
    expect(rows[1]).toMatchObject({
      category: "Labour",
      quantity: "1.5",
      unitRate: "90",
      subtotal: "135",
    });
  });

  it("normalizes swapped retail/trade prices before selecting unit rate", () => {
    const rows = buildAiLineItemRows(7, [
      {
        description: "LED batten",
        unit: "ea",
        quantity: 2,
        tradePrice: 42,
        retailPrice: 30,
        category: "Materials",
        labourMinutes: 0,
        wasteFactor: 0,
      },
    ], {
      useTradePrice: true,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      unitRate: "30",
      subtotal: "60",
    });
  });

  it("derives missing trade pricing from retail pricing", () => {
    const rows = buildAiLineItemRows(11, [
      {
        description: "MCB 20A",
        unit: "ea",
        quantity: 5,
        tradePrice: 0,
        retailPrice: 25,
        category: "Materials",
        labourMinutes: 0,
        wasteFactor: 0,
      },
    ], {
      useTradePrice: true,
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      unitRate: "20",
      subtotal: "100",
    });
  });
});
