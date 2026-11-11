import { expect, it } from 'vitest';
import { mergeTakeoffResults } from './routers/ai';
it('does not silently combine like descriptions from different drawings/rates', () => {
  const batch = (documentIndex: number, tradePrice: number) => ({ items: [{ section: 'Plumbing', description: 'Copper pipe', unit: 'm', category: 'Materials', quantity: 2, retailPrice: tradePrice, tradePrice, labourMinutes: 0, wasteFactor: 0, sourceReferences: [{ documentIndex, pageNumber: 1, evidence: 'Dimension marked 2m' }] }], confidence: 80, assumptions: [], roomBreakdown: [], planNotes: '' });
  const result = mergeTakeoffResults([batch(1, 10), batch(6, 20)], 6);
  expect(result.items).toHaveLength(2);
  expect(result.items.map(item => item.tradePrice)).toEqual([10, 20]);
  expect(result.items.map(item => item.sourceReferences?.[0].documentIndex)).toEqual([1, 6]);
});
it('rejects duplicate drawing inputs before database or model access', async () => {
  const { aiRouter } = await import('./routers/ai');
  const caller = aiRouter.createCaller({ user: { id: 1 }, req: {}, res: {} } as any);
  await expect(caller.visionTakeoffMultiPage({ estimateId: 1, requestId: 'duplicate-input-123', trade: 'plumbing', imageUrls: ['https://example.test/a.pdf', 'https://example.test/a.pdf'] })).rejects.toThrow('only once');
});
