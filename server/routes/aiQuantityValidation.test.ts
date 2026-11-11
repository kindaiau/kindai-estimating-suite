import { describe, expect, it } from 'vitest';
import { buildAiLineItemRows } from './insertAiLineItems';

describe('AI quantity validation before estimate persistence', () => {
  it.each([undefined, null, '', 'not-a-number', NaN, Infinity, -1, 0, 0.0009, 10000000, '2'])('rejects unavailable or invalid quantity %s instead of inventing a zero line', quantity => {
    expect(() => buildAiLineItemRows(1, [{ description: 'Pipe', quantity, tradePrice: 10 } as any])).toThrow();
  });
  it('retains a measurable quantity and explicit zero provisional rate', () => {
    expect(buildAiLineItemRows(1, [{ quantity: 2, tradePrice: 0 }])[0]).toMatchObject({ quantity: '2.000', unitRate: '0.00' });
  });
});
