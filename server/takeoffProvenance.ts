import { z } from 'zod';

export const sourceReferenceSchema = z.object({
  documentIndex: z.number().int().positive(),
  pageNumber: z.number().int().positive(),
  evidence: z.string().trim().min(1).max(800),
}).strict();
export type SourceReference = z.infer<typeof sourceReferenceSchema>;

// Bound model claims to real owned uploads; this validates location, not accuracy.
// A human still checks whether the cited drawing supports the measured quantity.
export function validateDrawingSources<T extends { sourceReferences?: SourceReference[] }>(
  items: T[], documents: { pageCount: number }[],
): T[] {
  return items.map(item => {
    const sources = z.array(sourceReferenceSchema).min(1).max(8).parse(item.sourceReferences);
    for (const source of sources) {
      const document = documents[source.documentIndex - 1];
      if (!document || source.pageNumber > document.pageCount) throw new Error('AI cited a drawing or sheet outside the uploaded document set. No takeoff was saved.');
    }
    return { ...item, sourceReferences: sources };
  });
}
export function drawingSourceNotes(sources?: SourceReference[]): string | null {
  if (!sources?.length) return null;
  return 'AI-cited sources (verify before quoting): ' + sources.map(s => `Document ${s.documentIndex}, page ${s.pageNumber}: ${s.evidence}`).join(' | ');
}

export function validateBatchSourceRange<T extends { sourceReferences?: SourceReference[] }>(items: T[], first: number, last: number): T[] {
  for (const item of items) {
    const sources = z.array(sourceReferenceSchema).min(1).max(8).parse(item.sourceReferences);
    if (sources.some(source => source.documentIndex < first || source.documentIndex > last)) throw new Error('AI cited a document not provided to this analysis batch.');
  }
  return items;
}
