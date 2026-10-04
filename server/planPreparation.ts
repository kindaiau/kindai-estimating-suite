import { PDFDocument } from 'pdf-lib';

export async function preparePlan(buffer: Buffer, contentType: string, selectedPage?: number) {
  if (contentType === 'application/pdf') {
    const document = await PDFDocument.load(buffer);
    const count = document.getPageCount();
    if (selectedPage !== undefined) {
      if (!Number.isInteger(selectedPage) || selectedPage < 1 || selectedPage > count) throw new Error(`Choose a drawing sheet from 1 to ${count}`);
      const single = await PDFDocument.create();
      const [page] = await single.copyPages(document, [selectedPage - 1]);
      single.addPage(page);
      return { buffer: Buffer.from(await single.save()), pageCount: 1, ext: 'pdf' };
    }
    return { buffer, pageCount: count, ext: 'pdf' };
  }
  const signatures: Record<string, boolean> = {
    'image/png': buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
    'image/jpeg': buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255,
    'image/webp': buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP',
  };
  if (!signatures[contentType]) throw new Error('File content does not match its image type');
  return { buffer, pageCount: 1, ext: contentType === 'image/jpeg' ? 'jpg' : contentType.split('/')[1] };
}
