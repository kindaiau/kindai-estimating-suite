import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { generateQuotePdf, buildHtml } from '../server/pdfGenerator';
import { priceEstimate, priceLine } from '../server/estimatePricing';
process.env.CHROMIUM_PATH = '/usr/bin/chromium';
const item = { quantity: '1.005', unitRate: '10.00', wasteFactor: '10.00' };
const totals = priceEstimate([item], '20');
const data = {
  businessName: 'Local test contractor', trade: 'plumbing', quoteNumber: 'TEST-V2', quoteDate: '02/10/2026',
  projectTitle: 'Disposable validation fixture', companyLogoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  lineItems: [{ description: 'Copper pipe <script>bad()</script>', category: 'Materials', unit: 'm', quantity: 1.005, unitPrice: 10, total: Number(priceLine(item)) }],
  subtotal: Number(totals.subtotal), gstAmount: Number(totals.gstAmount), total: Number(totals.total), margin: 20, marginAmount: 2.21,
};
const html = buildHtml(data);
if (html.includes('<script>bad')) throw new Error('HTML was not escaped');
writeFileSync('docs/validation/quote-v2.pdf', await generateQuotePdf(data));
const text = execFileSync('pdftotext', ['docs/validation/quote-v2.pdf', '-'], { encoding: 'utf8' });
for (const expected of ['$13.27', '$1.33', '$14.60', 'GST (10%)', 'included in subtotal']) if (!text.includes(expected)) throw new Error(`PDF missing ${expected}`);
writeFileSync('docs/validation/pdf-results.json', JSON.stringify({ totals, renderedPdfTotalsMatch: true, escapedItemText: true }, null, 2));
console.log('Actual Chromium PDF text matches canonical subtotal 13.27, GST 1.33, total 14.60.');
