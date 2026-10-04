import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { estimates, lineItems, estimateCorrections } from '../drizzle/schema';
import { getDb } from './db';
import { itemFields, priceEstimate, priceLine, sameDecimal } from './estimatePricing';
import type { z } from 'zod';

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
export async function lockEstimate(tx: Tx, userId: number, id: number, version?: number) {
  const [estimate] = await tx.select().from(estimates).where(and(eq(estimates.id, id), eq(estimates.userId, userId))).limit(1).for('update');
  if (!estimate) throw new TRPCError({ code: 'NOT_FOUND', message: 'Estimate not found' });
  if (version !== undefined && estimate.version !== version) throw new TRPCError({ code: 'CONFLICT', message: 'This estimate changed in another session. Your draft is preserved. Reload saved values and review before retrying.' });
  return estimate;
}
export async function saveTotals(tx: Tx, estimate: typeof estimates.$inferSelect) {
  const items = await tx.select().from(lineItems).where(eq(lineItems.estimateId, estimate.id));
  const totals = priceEstimate(items, estimate.margin);
  for (const item of items) {
    const subtotal = priceLine(item);
    if (subtotal !== item.subtotal) await tx.update(lineItems).set({ subtotal }).where(eq(lineItems.id, item.id));
    item.subtotal = subtotal;
  }
  const saved = { ...estimate, ...totals, version: estimate.version + 1, quotePdfUrl: null, quotePdfKey: null };
  await tx.update(estimates).set({ ...totals, version: saved.version, quotePdfUrl: null, quotePdfKey: null }).where(eq(estimates.id, estimate.id));
  return { estimate: saved, items, totals, version: saved.version };
}

type Edit = { kind: 'add'; values: z.input<typeof itemFields> } | { kind: 'update'; id: number; values: Partial<z.input<typeof itemFields>> } | { kind: 'delete'; id: number };
export async function editEstimate(db: Db, userId: number, estimateId: number, version: number, edit: Edit) {
  return db.transaction(async tx => {
    const estimate = await lockEstimate(tx, userId, estimateId, version);
    const [before] = edit.kind === 'add' ? [] : await tx.select().from(lineItems).where(and(eq(lineItems.id, edit.id), eq(lineItems.estimateId, estimateId))).limit(1);
    if (edit.kind !== 'add' && !before) throw new TRPCError({ code: 'NOT_FOUND', message: 'Line item not found in this estimate' });
    let id = edit.kind === 'add' ? 0 : edit.id;
    let after: unknown = null;
    if (edit.kind === 'delete') {
      await tx.delete(lineItems).where(and(eq(lineItems.id, id), eq(lineItems.estimateId, estimateId)));
    } else {
      const values = itemFields.parse({ ...(before ? { ...before, notes: before.notes ?? undefined, quantity: Number(before.quantity), unitRate: Number(before.unitRate), wasteFactor: Number(before.wasteFactor ?? 0) } : {}), ...edit.values });
      if (values.category.toLowerCase() !== 'materials' && values.wasteFactor !== 0) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Waste applies only to Materials. Set waste to zero for labour, plant and subcontract items.' });
      const row = { ...values, estimateId, quantity: String(values.quantity), unitRate: String(values.unitRate), wasteFactor: String(values.wasteFactor), subtotal: priceLine(values) };
      if (edit.kind === 'add') {
        const [result] = await tx.insert(lineItems).values({ ...row, isFromAi: false });
        id = result.insertId;
      } else await tx.update(lineItems).set(row).where(and(eq(lineItems.id, id), eq(lineItems.estimateId, estimateId)));
      after = row;
    }
    // Original AI extraction remains in aiTakeoffData. Audit snapshots are before/after,
    // never asserted to be training data or the original AI value on subsequent edits.
    await tx.insert(estimateCorrections).values({ estimateId, lineItemId: id, userId, trade: estimate.trade,
      correctionType: edit.kind === 'add' ? 'item_added' : edit.kind === 'delete' ? 'item_removed' : 'description_change',
      fieldName: 'item_snapshot', aiValue: before ? JSON.stringify(before) : null, humanValue: after ? JSON.stringify(after) : null,
      itemDescription: before?.description ?? (edit.kind === 'add' ? edit.values.description : ''),
    });
    if (before && edit.kind === 'update' && after) {
      const saved = after as Record<string, unknown>;
      const types = { quantity: 'quantity_change', unitRate: 'rate_change', wasteFactor: 'waste_change', description: 'description_change', unit: 'unit_change' } as const;
      for (const field of Object.keys(types) as (keyof typeof types)[]) {
        const previous = String(before[field] ?? '');
        const next = String(saved[field] ?? '');
        if ((field === 'description' || field === 'unit') ? previous !== next : !sameDecimal(previous, next)) await tx.insert(estimateCorrections).values({ estimateId, lineItemId: id, userId, trade: estimate.trade,
          correctionType: types[field], fieldName: field, aiValue: previous, humanValue: next,
          reason: 'Previous saved value; original extraction remains in aiTakeoffData.', itemDescription: before.description });
      }
    }
    return { id, ...await saveTotals(tx, estimate) };
  });
}
