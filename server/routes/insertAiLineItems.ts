/**
 * insertAiLineItems.ts
 * Reusable helper to insert AI-generated takeoff items into the lineItems table.
 * Used by both the orchestrated takeoff (SSE route) and the simple tRPC takeoff mutations.
 */
import { getDb } from "../db";
import { lineItems } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { normalizeTakeoffItem } from "../_core/takeoffPricing";

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
  const normalizedItems = items.map((item) => normalizeTakeoffItem(item));

  const materialRows = normalizedItems.map((normalized, idx) => {
    const qty = Number(normalized.quantity) || 0;
    const unitRate = Number(useTradePrice ? normalized.tradePrice : normalized.retailPrice) || 0;
    const waste = Number(normalized.wasteFactor) || 0;
    const effectiveQty = qty * (1 + waste / 100);
    const subtotal = effectiveQty * unitRate;

    return {
      estimateId,
      section: normalized.section,
      category: normalized.category,
      description: normalized.description,
      unit: normalized.unit,
      quantity: String(qty),
      unitRate: String(unitRate),
      wasteFactor: String(waste),
      subtotal: String(Math.round(subtotal * 100) / 100),
      isFromAi: true,
      notes: null,
      sortOrder: idx,
    };
  });

  const labourRows = normalizedItems
    .filter((item) => (Number(item.labourMinutes) || 0) > 0)
    .map((normalized, idx) => {
      const qty = Number(normalized.quantity) || 0;
      const hours = (qty * (Number(normalized.labourMinutes) || 0)) / 60;
      const subtotal = hours * labourRate;
      return {
        estimateId,
        section: normalized.section,
        category: "Labour",
        description: `Labour: ${normalized.description}`,
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
