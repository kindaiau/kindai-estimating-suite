import { describe, expect, it } from 'vitest';
import { validateBatchSourceRange, validateDrawingSources, drawingSourceNotes } from './takeoffProvenance';
import { buildAiLineItemRows } from './routes/insertAiLineItems';
const source = { documentIndex: 2, pageNumber: 3, evidence: 'Dimension marked 2400 mm along north wall' };
describe('owned drawing provenance', () => {
  it('preserves source locations and evidence through persisted quote lines', () => {
    const [item] = validateDrawingSources([{ quantity: 2.4, tradePrice: 10, labourMinutes: 30, sourceReferences: [source] }], [{ pageCount: 1 }, { pageCount: 4 }]);
    for (const row of buildAiLineItemRows(1, [item])) expect(row.notes).toContain('Document 2, page 3');
    expect(drawingSourceNotes(item.sourceReferences)).toContain('verify before quoting');
  });
  it.each([undefined, [], [{ ...source, documentIndex: 3 }], [{ ...source, pageNumber: 5 }], [{ ...source, evidence: '' }], [{ ...source, pageNumber: 0 }]])('rejects absent or impossible sources %s', sourceReferences => {
    expect(() => validateDrawingSources([{ sourceReferences }], [{ pageCount: 1 }, { pageCount: 4 }])).toThrow();
  });
  it('keeps legacy/manual notes absent rather than inventing source evidence', () => {
    expect(drawingSourceNotes()).toBeNull();
  });
});

it('rejects a valid global document reference when that batch never saw it', () => {
  const item = { sourceReferences: [{ ...source, documentIndex: 6 }] };
  expect(() => validateBatchSourceRange([item], 1, 5)).toThrow('not provided');
  expect(validateBatchSourceRange([item], 6, 10)).toEqual([item]);
});
