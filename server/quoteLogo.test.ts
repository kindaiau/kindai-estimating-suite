import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as any, put: vi.fn() }));
vi.mock('./db', () => ({ getDb: async () => mocks.db }));
vi.mock('./storage', () => ({ storagePut: mocks.put }));
import { inlineUploadedLogo, safeEmbeddedLogo } from './quoteLogo';
import { tradeProfilesRouter } from './routers/tradeProfiles';
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Zl1sAAAAASUVORK5CYII=';
describe('bounded offline PDF logo ingestion', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.put.mockResolvedValue({ url: 'https://storage.test/logo.png' }); });
  it('accepts strict small raster data and rejects SVG/MIME confusion or truncated content', () => {
    expect(inlineUploadedLogo(png, 'image/png')).toBe(`data:image/png;base64,${png}`);
    for (const [base64, type] of [[png, 'image/jpeg'], [png, 'image/svg+xml'], [png+'!', 'image/png'], ['iVBORw0KGgo=', 'image/png']]) expect(inlineUploadedLogo(base64, type)).toBeNull();
    expect(safeEmbeddedLogo('http://127.0.0.1/logo')).toBeNull();
  });
  it('keeps inline encoding below the existing TEXT limit', () => {
    const bytes = Buffer.alloc(48_001); Buffer.from(png, 'base64').copy(bytes);
    expect(inlineUploadedLogo(bytes.toString('base64'), 'image/png')).toBeNull();
    expect(Buffer.byteLength(`data:image/png;base64,${Buffer.alloc(48_000).toString('base64')}`)).toBeLessThan(65_535);
  });
  it('saves a small valid logo inline for the authenticated owner without storage access', async () => {
    const values = vi.fn(async () => {});
    mocks.db = { select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }), insert: () => ({ values }) };
    const caller = tradeProfilesRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any);
    const result = await caller.uploadLogo({ trade: 'plumbing', fileName: 'synthetic.png', fileBase64: png, contentType: 'image/png' });
    expect(result).toMatchObject({ url: `data:image/png;base64,${png}`, key: null, pdfLogoReady: true, warning: null });
    expect(values).toHaveBeenCalledWith({ userId: 7, trade: 'plumbing', logoUrl: result.url });
    expect(mocks.put).not.toHaveBeenCalled();
  });
  it('preserves larger legacy upload behavior but does not claim PDF readiness', async () => {
    mocks.db = { select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }), insert: () => ({ values: async () => {} }) };
    const caller = tradeProfilesRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any);
    const result = await caller.uploadLogo({ trade: 'plumbing', fileName: 'large.png', fileBase64: Buffer.concat([Buffer.from(png, 'base64').subarray(0, -12), Buffer.alloc(48_001), Buffer.from(png, 'base64').subarray(-12)]).toString('base64'), contentType: 'image/png' });
    expect(result).toMatchObject({ url: 'https://storage.test/logo.png', pdfLogoReady: false });
    expect(result.warning).toContain('48 KB'); expect(mocks.put).toHaveBeenCalledOnce();
  });
  it('marks an existing remote profile logo unready without fetching it', async () => {
    mocks.db = { select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ logoUrl: 'https://storage.test/old.png' }] }) }) }) };
    const caller = tradeProfilesRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any);
    await expect(caller.get({ trade: 'plumbing' })).resolves.toMatchObject({ pdfLogoReady: false });
    expect(mocks.put).not.toHaveBeenCalled();
  });
  it('rejects malformed raster content without a storage or database side effect', async () => {
    const caller = tradeProfilesRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any);
    await expect(caller.uploadLogo({ trade: 'plumbing', fileName: 'bad.png', fileBase64: 'not-a-valid-base64!', contentType: 'image/png' })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.put).not.toHaveBeenCalled();
  });

});
