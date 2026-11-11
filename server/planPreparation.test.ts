import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { preparePlan } from './planPreparation';

describe('drawing PDF preparation', () => {
  it('preserves every paid sheet without re-encoding its source', async () => {
    const doc = await PDFDocument.create();
    for (let i = 0; i < 12; i++) doc.addPage([100 + i, 200]);
    const bytes = Buffer.from(await doc.save());
    const result = await preparePlan(bytes, 'application/pdf');
    expect(result.buffer).toBe(bytes);
    expect(result.pageCount).toBe(12);
  });
  it('rejects a page-less PDF before storage or paid analysis', async () => {
    const doc = await PDFDocument.create();
    const bytes = Buffer.from(await doc.save({ addDefaultPage: false }));
    await expect(preparePlan(bytes, 'application/pdf')).rejects.toThrow('at least one');
  });
  it.each([Buffer.alloc(0), Buffer.from('%PDF-1.7 broken')])('rejects empty or corrupt PDFs', async bytes => {
    await expect(preparePlan(bytes, 'application/pdf')).rejects.toThrow();
  });
});
