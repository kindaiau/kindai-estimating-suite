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
});
