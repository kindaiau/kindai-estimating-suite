import Decimal from "decimal.js";
import { priceLine } from "../estimatePricing";
/**
 * insertAiLineItems.ts
 * Reusable helper to insert AI-generated takeoff items into the lineItems table.
 * Used by both the orchestrated takeoff (SSE route) and the simple tRPC takeoff mutations.
 */
import { getDb } from "../db";
import { lineItems } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

interface AiItem {
  section?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  retailPrice?: number;
  tradePrice?: number;
  category?: string;
  labourMinutes?: number;
  wasteFactor?: number;
}

type BuildAiLineItemRowsOptions = {
  labourRate?: number;
  useTradePrice?: boolean;
};

export function buildAiLineItemRows(
  estimateId: number,
  items: AiItem[],
  options: BuildAiLineItemRowsOptions = {}
) {
  const labourRate = options.labourRate ?? 110;
  const useTradePrice = options.useTradePrice ?? true;

  const materialRows = items.map((item, idx) => {
    const qty = Number(item.quantity) || 0;
    const unitRate = Number(useTradePrice ? item.tradePrice : item.retailPrice) || 0;
    const waste = Number(item.wasteFactor) || 0;
    const effectiveQty = qty * (1 + waste / 100);
    const subtotal = effectiveQty * unitRate;

    return {
      estimateId,
      section: item.section || "General",
      category: item.category || "Materials",
      description: item.description || "AI-generated item",
      unit: item.unit || "ea",
      quantity: new Decimal(qty).toFixed(3),
      unitRate: new Decimal(unitRate).toFixed(2),
      wasteFactor: new Decimal(waste).toFixed(2),
      subtotal: priceLine({ quantity: new Decimal(qty).toFixed(3), unitRate: new Decimal(unitRate).toFixed(2), wasteFactor: new Decimal(waste).toFixed(2) }),
      isFromAi: true,
      notes: null,
      sortOrder: idx,
    };
  });

  const labourRows = items
    .filter((item) => item.category !== "Labour" && (Number(item.labourMinutes) || 0) > 0)
    .map((item, idx) => {
      const qty = Number(item.quantity) || 0;
      const hours = (qty * (Number(item.labourMinutes) || 0)) / 60;
      const subtotal = hours * labourRate;
      return {
        estimateId,
        section: item.section || "General",
        category: "Labour",
        description: `Labour: ${item.description || "AI-generated"}`,
        unit: "hr",
        quantity: new Decimal(hours).toFixed(3),
        unitRate: String(labourRate),
        wasteFactor: "0",
        subtotal: priceLine({ quantity: new Decimal(hours).toFixed(3), unitRate: new Decimal(labourRate).toFixed(2) }),
        isFromAi: true,
        notes: null,
        sortOrder: materialRows.length + idx,
      };
    });

  return [...materialRows, ...labourRows];
}
