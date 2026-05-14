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
      quantity: String(qty),
      unitRate: String(unitRate),
      wasteFactor: String(waste),
      subtotal: String(Math.round(subtotal * 100) / 100),
      isFromAi: true,
      notes: null,
      sortOrder: idx,
    };
  });

  const labourRows = items
    .filter((item) => (Number(item.labourMinutes) || 0) > 0)
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
        quantity: String(Math.round(hours * 100) / 100),
        unitRate: String(labourRate),
        wasteFactor: "0",
        subtotal: String(Math.round(subtotal * 100) / 100),
        isFromAi: true,
        notes: null,
        sortOrder: materialRows.length + idx,
      };
    });

  return [...materialRows, ...labourRows];
}

/**
 * Clears existing AI-generated line items for an estimate, then inserts new ones.
 * Splits materials and labour into separate rows.
 * Returns the count of inserted rows.
 */
export async function insertAiLineItems(
  estimateId: number,
  items: AiItem[],
  labourRate: number = 110,
  useTradePrice: boolean = true
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Clear existing AI-generated items for this estimate
  await db.delete(lineItems).where(
    and(
      eq(lineItems.estimateId, estimateId),
      eq(lineItems.isFromAi, true)
    )
  );

  if (!items || items.length === 0) return 0;
  const allRows = buildAiLineItemRows(estimateId, items, { labourRate, useTradePrice });

  // Insert in batches of 50 to avoid MySQL packet limits
  for (let i = 0; i < allRows.length; i += 50) {
    const batch = allRows.slice(i, i + 50);
    await db.insert(lineItems).values(batch as any);
  }

  const materialCount = allRows.filter((row) => row.category !== "Labour").length;
  const labourCount = allRows.length - materialCount;
  console.log(`[AI LineItems] Inserted ${allRows.length} items (${materialCount} materials + ${labourCount} labour) for estimate ${estimateId}`);
  return allRows.length;
}
