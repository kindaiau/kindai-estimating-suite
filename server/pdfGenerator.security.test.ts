import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ launch: vi.fn(), page: null as any, close: vi.fn() }));
vi.mock('puppeteer-core', () => ({ default: { launch: mocks.launch } }));
import { buildHtml, generateQuotePdf, type PdfQuoteData } from './pdfGenerator';
const data: PdfQuoteData = {
  businessName: 'Synthetic Contractor', trade: 'plumbing', quoteNumber: 'TEST-1', quoteDate: '11/11/2026', projectTitle: 'Synthetic',
  lineItems: [{ description: 'Pipe', category: 'Materials', unit: 'm', quantity: 2, unitPrice: 5, total: 10 }], subtotal: 10, gstAmount: 1, total: 11,
};
describe('PDF rendering security (offline browser mock)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.page = { setJavaScriptEnabled: vi.fn(), setRequestInterception: vi.fn(), on: vi.fn(), setContent: vi.fn(), pdf: vi.fn().mockResolvedValue(new Uint8Array([1, 2])) };
    mocks.launch.mockResolvedValue({ newPage: async () => mocks.page, close: mocks.close });
  });
  it('escapes nested assurance content as well as ordinary fields', () => {
    const html = buildHtml({ ...data, businessName: '<b>Business</b>', assurance: { overallRisk: 'low', riskScore: 0, valueBand: 'routine', approvalLevel: 'owner', summary: '<img src="http://127.0.0.1/private">' } as any });
    expect(html).toContain('&lt;b&gt;Business&lt;/b&gt;');
    expect(html).toContain('&lt;img src=&quot;http://127.0.0.1/private&quot;&gt;');
    expect(html).not.toContain('<img src="http://127.0.0.1/private">');
  });
  it('renders canonical approved totals without recomputing a different price', () => {
    const html = buildHtml({ ...data, subtotal: 13.27, gstAmount: 1.33, total: 14.60 });
    expect(html).toContain('$13.27'); expect(html).toContain('$1.33'); expect(html).toContain('$14.60');
  });
  it('blocks external and local resource requests before setting content', async () => {
    await generateQuotePdf(data);
    expect(mocks.page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(mocks.page.setJavaScriptEnabled).toHaveBeenCalledWith(false);
    const handler = mocks.page.on.mock.calls.find((call: any[]) => call[0] === 'request')![1];
    for (const url of ['http://127.0.0.1/private', 'http://169.254.169.254/latest/meta-data/', 'file:///etc/passwd', 'https://example.test/image.png']) {
      const request = { url: () => url, abort: vi.fn(), continue: vi.fn() };
      await handler(request); expect(request.abort).toHaveBeenCalled(); expect(request.continue).not.toHaveBeenCalled();
    }
    expect(mocks.page.on.mock.invocationCallOrder[0]).toBeLessThan(mocks.page.setContent.mock.invocationCallOrder[0]);
  });
  it('always closes the browser on rendering failure', async () => {
    mocks.page.setContent.mockRejectedValue(new Error('Render failed'));
    await expect(generateQuotePdf(data)).rejects.toThrow('Render failed'); expect(mocks.close).toHaveBeenCalledOnce();
  });
  it('omits remote/SVG logos and retains approved inline PNG branding', () => {
    for (const companyLogoUrl of ['https://example.test/logo.png', 'file:///etc/passwd', 'data:image/svg+xml,<svg/>']) {
      const html = buildHtml({ ...data, companyLogoUrl });
      expect(html).not.toContain('<img src='); expect(html).toContain('Synthetic Contractor');
    }
    const companyLogoUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';
    expect(buildHtml({ ...data, companyLogoUrl })).toContain(`<img src="${companyLogoUrl}"`);
  });

});
it('does not invent payment terms or assert unverified GST registration', () => {
  const html = buildHtml(data);
  expect(html).not.toContain('50% deposit');
  expect(html).not.toContain('GST registered');
  expect(html).toContain('Confirm payment and commencement');
});
