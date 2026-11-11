import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as any, pdf: vi.fn(), upload: vi.fn() }));
vi.mock('./db', () => ({ getDb: async () => mocks.db }));
vi.mock('./entitlements', () => ({ requireProFeature: async () => {} }));
vi.mock('./pdfGenerator', () => ({ generateQuotePdf: mocks.pdf }));
vi.mock('./storage', () => ({ storagePut: mocks.upload }));
import { estimatesRouter } from './routers/estimates';
import { quoteTokensRouter } from './routers/quoteTokens';

beforeEach(() => { vi.clearAllMocks(); });
describe('quote approval and export boundaries', () => {
  it('refuses to silently recalculate an approved stale total during PDF export', async () => {
    const estimate = { id: 1, userId: 1, version: 2, margin: '0', subtotal: '100.00', gstAmount: '10.00', total: '110.00' };
    const items = [{ quantity: '1.000', unitRate: '200.00', wasteFactor: '0', subtotal: '200.00' }];
    let count = 0;
    const update = vi.fn(() => ({ set: () => ({ where: async () => {} }) }));
    const tx = { select: () => ({ from: () => ({ where: () => { if (count++ === 0) return { limit: () => ({ for: async () => [estimate] }) }; return Promise.resolve(items); } }) }), update };
    mocks.db = { transaction: (fn: any) => fn(tx) };
    const caller = estimatesRouter.createCaller({ user: { id: 1 }, req: {}, res: {} } as any);
    await expect(caller.generatePdf({ id: 1, expectedVersion: 2 })).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    expect(update).not.toHaveBeenCalled(); expect(mocks.pdf).not.toHaveBeenCalled(); expect(mocks.upload).not.toHaveBeenCalled();
  });
  it.each([undefined, '', '   '])('requires a real acceptance signature at server boundary (%s)', async clientSignature => {
    mocks.db = null;
    const caller = quoteTokensRouter.createCaller({ user: null, req: {}, res: {} } as any);
    await expect(caller.respond({ token: 'synthetic-token', action: 'accepted', clientSignature })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('owner and version predicates before quote edits', () => {
  it.each(['read', 'edit', 'delete'] as const)('guards another account before %s', async action => {
    const { MySqlDialect } = await import('drizzle-orm/mysql-core');
    const mutation = vi.fn();
    const where = vi.fn((condition: any) => {
      const query = new MySqlDialect().sqlToQuery(condition);
      expect(query.sql).toContain('`estimates`.`userId`');
      expect(query.params).toEqual([7, 9]);
      return { limit: () => ({ for: async () => [] }) };
    });
    const tx = { select: () => ({ from: () => ({ where }) }), update: mutation, delete: mutation, insert: mutation };
    mocks.db = { transaction: (fn: any) => fn(tx) };
    const caller = estimatesRouter.createCaller({ user: { id: 9 }, req: {}, res: {} } as any);
    const request = action === 'read' ? caller.getWithLineItems({ id: 7 }) : action === 'edit'
      ? caller.updateLineItem({ id: 3, estimateId: 7, expectedVersion: 1, unitRate: 10 })
      : caller.deleteLineItem({ id: 3, estimateId: 7, expectedVersion: 1 });
    await expect(request).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(mutation).not.toHaveBeenCalled();
  });
  it('rejects stale revision before touching line items or totals', async () => {
    const mutation = vi.fn();
    const tx = { select: () => ({ from: () => ({ where: () => ({ limit: () => ({ for: async () => [{ id: 7, userId: 9, version: 2 }] }) }) }) }), update: mutation, delete: mutation, insert: mutation };
    mocks.db = { transaction: (fn: any) => fn(tx) };
    const caller = estimatesRouter.createCaller({ user: { id: 9 }, req: {}, res: {} } as any);
    await expect(caller.updateLineItem({ id: 3, estimateId: 7, expectedVersion: 1, unitRate: 10 })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(mutation).not.toHaveBeenCalled();
  });
  it.each([0, -1, 1.5, 91])('rejects invalid quote validity %s before persistence', async quoteValidDays => {
    mocks.db = null;
    const caller = estimatesRouter.createCaller({ user: { id: 1 }, req: {}, res: {} } as any);
    await expect(caller.update({ id: 1, expectedVersion: 1, quoteValidDays })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});
it('freezes issued terms, line prices and totals independently of later edits', async () => {
  const { buildIssuedQuoteSnapshot } = await import('./routers/quoteTokens');
  const estimate = { id: 1, version: 2, title: 'Bathroom', margin: '20', quoteNumber: 'KAI-TEST', quoteTerms: 'Payment due in 14 days' } as any;
  const items = [{ quantity: '1.005', unitRate: '10.00', wasteFactor: '10.00', subtotal: '11.06' }] as any;
  const snapshot = buildIssuedQuoteSnapshot(estimate, items, { companyName: 'Synthetic trade business' } as any);
  estimate.quoteTerms = 'Changed terms'; items[0].unitRate = '100.00';
  expect(snapshot.estimate).toMatchObject({ quoteTerms: 'Payment due in 14 days', quoteNumber: 'KAI-TEST', subtotal: '13.27', gstAmount: '1.33', total: '14.60' });
  expect(snapshot.items[0].unitRate).toBe('10.00');
});
