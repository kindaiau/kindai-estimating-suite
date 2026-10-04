import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import { eq, sql } from 'drizzle-orm';
import { estimates, lineItems, users, projects, estimateCorrections, takeoffJobs, planUploads, oauthStates, stripeEvents, emailChallenges, quoteTokens } from '../drizzle/schema';
import { editEstimate } from './estimateEdits';
import { itemFields, priceLine, priceEstimate } from './estimatePricing';
import { beginTakeoff, completeTakeoff, failTakeoff } from './takeoffJobs';
import { preparePlan } from './planPreparation';
import { PDFDocument } from 'pdf-lib';
import { proPrice, assertProPrice, proTaxConfig } from './stripe/proCheckout';
import { illustrativeTimeValue } from '../shared/kindaiOffer';

const mocks = vi.hoisted(() => ({ db: null as any, pdf: vi.fn(async (_: any) => Buffer.from('mock-pdf')) }));
vi.mock('./db', () => ({ getDb: async () => mocks.db }));
vi.mock('./pdfGenerator', () => ({ generateQuotePdf: mocks.pdf }));
vi.mock('./storage', () => ({ storagePut: async () => ({ url: 'https://test.invalid/quote.pdf' }) }));
vi.mock('./metaCapi', () => ({ sendMetaConversionEvent: async () => {}, extractMetaClickIdentifiers: () => ({}), buildMetaUserData: () => ({}) }));

const mailMock = vi.hoisted(() => vi.fn(async (_: any) => true));
vi.mock('./resendEmail', () => ({ sendResendEmail: mailMock }));

const stripeMocks = vi.hoisted(() => ({ list: vi.fn(), createPrice: vi.fn(), checkout: vi.fn(), customer: vi.fn() }));
vi.mock('./stripe/stripe', () => ({
  getStripe: () => ({ prices: { list: stripeMocks.list, create: stripeMocks.createPrice }, products: { create: async () => ({ id: 'prod_mock' }) } }),
  findOrCreateCustomer: stripeMocks.customer, createCheckoutSession: stripeMocks.checkout,
  createPilotSetupCheckoutSession: vi.fn(), createPortalSession: vi.fn(),
}));

const modelMock = vi.hoisted(() => vi.fn());
vi.mock('./_core/llm', () => ({ invokeLLM: modelMock }));

const item = { category: 'Materials', description: 'Copper pipe', unit: 'm', quantity: 1.005, unitRate: 10, wasteFactor: 10 };
describe('exact decimal pricing and checkout contracts (offline)', () => {
  it('rounds half cents, applies material waste, markup and GST once', () => {
    expect(priceLine(item)).toBe('11.06');
    expect(priceEstimate([item], '20')).toEqual({ subtotal: '13.27', gstAmount: '1.33', total: '14.60' });
    expect(priceLine({ quantity: '1.005', unitRate: '1' })).toBe('1.01');
    expect(priceEstimate([{ quantity: '1', unitRate: '0.05' }], '0')).toEqual({ subtotal: '0.05', gstAmount: '0.01', total: '0.06' });
  });
  it('rejects invalid and excess-precision input, accepts zero rate', () => {
    for (const quantity of [0, -1, Infinity, NaN, 0.0001]) expect(itemFields.safeParse({ ...item, quantity }).success).toBe(false);
    for (const unitRate of [-1, Infinity, NaN, 0.001]) expect(itemFields.safeParse({ ...item, unitRate }).success).toBe(false);
    expect(itemFields.parse({ ...item, unitRate: 0 }).unitRate).toBe(0);
    expect(itemFields.safeParse({ ...item, unit: '' }).success).toBe(false);
  });
  it('monthly/yearly amounts and ROI match the offer', () => {
    expect(proPrice('monthly')).toBe(14900); expect(proPrice('yearly')).toBe(149000);
    expect(proPrice('monthly') * 12 - proPrice('yearly')).toBe(29800);
    expect(illustrativeTimeValue(6, 50)).toBe(1235);
    expect(() => assertProPrice({ unit_amount: 143040, currency: 'aud', recurring: { interval: 'year', interval_count: 1 }, tax_behavior: 'inclusive' }, 'yearly', 'inclusive')).toThrow();
    expect(() => assertProPrice({ unit_amount: 149000, currency: 'aud', recurring: { interval: 'year', interval_count: 1 }, tax_behavior: 'inclusive' }, 'yearly', 'inclusive')).not.toThrow();
    vi.stubEnv('PRO_GST_BEHAVIOR', ''); vi.stubEnv('PRO_STRIPE_AUTOMATIC_TAX', '');
    expect(proTaxConfig).toThrow('awaiting confirmed'); vi.unstubAllEnvs();
  });
  it('enforces approved inclusive GST and rejects a conflicting deployment or Stripe price', () => {
    vi.stubEnv('PRO_GST_BEHAVIOR', ''); vi.stubEnv('PRO_STRIPE_AUTOMATIC_TAX', 'true');
    expect(proTaxConfig()).toEqual({ behavior: 'inclusive', automatic: true });
    vi.stubEnv('PRO_GST_BEHAVIOR', 'exclusive');
    expect(proTaxConfig).toThrow('must include GST');
    for (const interval of ['monthly', 'yearly'] as const) {
      expect(() => assertProPrice({ unit_amount: proPrice(interval), currency: 'aud', recurring: { interval: interval === 'monthly' ? 'month' : 'year', interval_count: 1 }, tax_behavior: 'exclusive' }, interval, 'exclusive')).toThrow();
    }
    vi.unstubAllEnvs();
  });
  it('extracts only the selected sheet from a multipage PDF', async () => {
    const doc = await PDFDocument.create(); doc.addPage([100, 200]); doc.addPage([300, 400]);
    const bytes = Buffer.from(await doc.save());
    const prepared = await preparePlan(bytes, 'application/pdf', 2);
    const extracted = await PDFDocument.load(prepared.buffer);
    expect(extracted.getPageCount()).toBe(1); expect(extracted.getPage(0).getWidth()).toBe(300);
    await expect(preparePlan(bytes, 'application/pdf', 3)).rejects.toThrow();
    await expect(preparePlan(bytes, 'image/png')).rejects.toThrow();
  });
});

// Explicit opt-in, fixed loopback disposable database; never uses DATABASE_URL.
const integration = process.env.KINDAI_LOCAL_DB_TESTS === '1' ? describe : describe.skip;
integration('transaction and quota integration against disposable MariaDB', () => {
  let pool: mysql.Pool;
  let db: ReturnType<typeof drizzle>;
  beforeAll(async () => {
    pool = mysql.createPool({ host: '127.0.0.1', port: 3307, user: 'root', password: 'local-test-only', database: 'kindai_test' });
    db = drizzle(pool); mocks.db = db;
  });
  afterAll(async () => { await pool.end(); });
  beforeEach(async () => {
    for (const table of [oauthStates, stripeEvents, emailChallenges, quoteTokens, takeoffJobs, planUploads, estimateCorrections, lineItems, estimates, projects, users]) await db.delete(table);
    await db.insert(users).values([{ id: 1, openId: 'test:one', emailVerified: true, subscriptionTier: 'pro', subscriptionStatus: 'active' }, { id: 2, openId: 'test:two', emailVerified: true }]);
    await db.insert(projects).values([{ id: 1, userId: 1, name: 'Commercial plumbing', trade: 'plumbing' }, { id: 2, userId: 2, name: 'Other tenant', trade: 'plumbing' }]);
    await db.insert(estimates).values([{ id: 1, projectId: 1, userId: 1, trade: 'plumbing', title: 'Quote', margin: '20', aiTakeoffData: [{ quantity: 99 }] }, { id: 2, projectId: 2, userId: 2, trade: 'plumbing', title: 'Other' }]);
    mocks.pdf.mockClear();
  });
  it('add → edit → delete persists items, totals, audit and versions; preserves AI evidence', async () => {
    const added = await editEstimate(db, 1, 1, 1, { kind: 'add', values: item });
    expect(added.totals.total).toBe('14.60'); expect(added.version).toBe(2);
    const updated = await editEstimate(db, 1, 1, 2, { kind: 'update', id: added.id, values: { quantity: 2.5, unitRate: 12.35 } });
    expect(updated.totals).toEqual({ subtotal: '40.75', gstAmount: '4.08', total: '44.83' });
    const deleted = await editEstimate(db, 1, 1, 3, { kind: 'delete', id: added.id });
    expect(deleted.items).toHaveLength(0); expect(deleted.totals.total).toBe('0.00'); expect(deleted.version).toBe(4);
    expect((await db.select().from(estimateCorrections)).filter(c => c.fieldName === "item_snapshot")).toHaveLength(3);
    const [saved] = await db.select().from(estimates).where(eq(estimates.id, 1)); expect(typeof saved.aiTakeoffData === 'string' ? JSON.parse(saved.aiTakeoffData) : saved.aiTakeoffData).toEqual([{ quantity: 99 }]);
  });
  it('rejects tenant and item/estimate mismatch without moving foreign items', async () => {
    const foreign = await editEstimate(db, 2, 2, 1, { kind: 'add', values: item });
    await expect(editEstimate(db, 1, 2, 2, { kind: 'delete', id: foreign.id })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(editEstimate(db, 1, 1, 1, { kind: 'update', id: foreign.id, values: { quantity: 7 } })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect((await db.select().from(lineItems))[0].estimateId).toBe(2);
  });
  it('concurrent duplicate submissions allow one commit and reject stale writes', async () => {
    const outcomes = await Promise.allSettled([1,2].map(() => editEstimate(db, 1, 1, 1, { kind: 'add', values: item })));
    expect(outcomes.filter(o => o.status === 'fulfilled')).toHaveLength(1);
    expect((outcomes.find(o => o.status === 'rejected') as PromiseRejectedResult).reason.code).toBe('CONFLICT');
    expect(await db.select().from(lineItems)).toHaveLength(1);
  });
  it('rolls back item and version when audit insert fails', async () => {
    await db.execute(sql.raw("CREATE TRIGGER reject_test_audit BEFORE INSERT ON estimate_corrections FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'test failure'"));
    try {
      await expect(editEstimate(db, 1, 1, 1, { kind: 'add', values: item })).rejects.toThrow();
      expect(await db.select().from(lineItems)).toHaveLength(0);
      expect((await db.select().from(estimates).where(eq(estimates.id, 1)))[0].version).toBe(1);
    } finally { await db.execute(sql.raw('DROP TRIGGER reject_test_audit')); }
  });
  it('rejects non-material waste and saves zero-rate items', async () => {
    await expect(editEstimate(db, 1, 1, 1, { kind: 'add', values: { ...item, category: 'Labour' } })).rejects.toThrow('Waste');
    const result = await editEstimate(db, 1, 1, 1, { kind: 'add', values: { ...item, unitRate: 0 } }); expect(result.totals.total).toBe('0.00');
  });
  it('a partial tRPC rate edit preserves existing waste rather than injecting a default', async () => {
    const saved = await editEstimate(db, 1, 1, 1, { kind: 'add', values: item });
    const { estimatesRouter } = await import('./routers/estimates');
    const caller = estimatesRouter.createCaller({ user: { id: 1 }, req: {}, res: {} } as any);
    const result = await caller.updateLineItem({ id: saved.id, estimateId: 1, expectedVersion: 2, unitRate: 20 });
    expect(Number(result.items[0].wasteFactor)).toBe(10);
    expect(result.items[0].subtotal).toBe('22.11');
  });
  it('exports canonical saved items and totals; rejects stale export', async () => {
    const saved = await editEstimate(db, 1, 1, 1, { kind: 'add', values: item });
    const { estimatesRouter } = await import('./routers/estimates');
    const caller = estimatesRouter.createCaller({ user: (await db.select().from(users).where(eq(users.id, 1)))[0], req: { headers: {}, socket: {} }, res: {} } as any);
    const exported = await caller.generatePdf({ id: 1, expectedVersion: saved.version });
    expect(exported.totals).toEqual(saved.totals);
    expect(mocks.pdf.mock.calls[0][0]).toMatchObject({ subtotal: 13.27, gstAmount: 1.33, total: 14.60, lineItems: [expect.objectContaining({ quantity: 1.005, unitPrice: 10, total: 11.06 })] });
    await expect(caller.generatePdf({ id: 1, expectedVersion: 1 })).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('checkout creates exact monthly/yearly prices, blocks stale Stripe prices and existing subscribers', async () => {
    vi.stubEnv('PRO_GST_BEHAVIOR', 'inclusive'); vi.stubEnv('PRO_STRIPE_AUTOMATIC_TAX', 'true'); vi.stubEnv('PUBLIC_APP_ORIGIN', 'https://kindai.au');
    stripeMocks.list.mockResolvedValue({ data: [] }); stripeMocks.customer.mockResolvedValue('cus_mock'); stripeMocks.checkout.mockResolvedValue('https://checkout.stripe.test/mock');
    stripeMocks.createPrice.mockImplementation(async args => ({ id: `price_${args.unit_amount}` }));
    const { billingRouter } = await import('./routers/billing');
    const caller = billingRouter.createCaller({ user: { id: 2 }, req: {}, res: {} } as any);
    try {
      for (const interval of ['monthly', 'yearly'] as const) await caller.createCheckout({ planId: 'pro', interval, origin: 'https://kindai.au' });
      expect(stripeMocks.createPrice.mock.calls.map(c => [c[0].unit_amount, c[0].currency, c[0].recurring.interval])).toEqual([[14900, 'aud', 'month'], [149000, 'aud', 'year']]);
      expect(stripeMocks.checkout.mock.calls[1][0]).toMatchObject({ priceId: 'price_149000', automaticTax: true, planId: 'pro' });
      stripeMocks.list.mockResolvedValue({ data: [{ id: 'price_wrong', unit_amount: 143040, currency: 'aud', recurring: { interval: 'year', interval_count: 1 }, tax_behavior: 'inclusive' }] });
      await expect(caller.createCheckout({ planId: 'pro', interval: 'yearly', origin: 'https://kindai.au' })).rejects.toThrow('does not match');
      await db.update(users).set({ stripeSubscriptionId: 'sub_existing' }).where(eq(users.id, 2));
      await expect(caller.createCheckout({ planId: 'pro', interval: 'monthly', origin: 'https://kindai.au' })).rejects.toThrow('existing subscription');
    } finally { vi.unstubAllEnvs(); }
  });
  it('Pro rate-book CRUD is owned and variations track owned projects', async () => {
    const { companyMemoryRouter } = await import('./routers/companyMemory');
    const { variationsRouter } = await import('./routers/variations');
    const context = { user: { id: 1, name: 'Test' }, req: {}, res: {} } as any;
    const books = companyMemoryRouter.createCaller(context);
    const rate = await books.addPriceBookItem({ trade: 'plumbing', category: 'Materials', name: 'Copper', unit: 'm', unitPrice: 12.35 });
    expect((await books.listPriceBook({ trade: 'plumbing' })).find(r => r.id === rate.id)?.unitPrice).toBe('12.35');
    const variations = variationsRouter.createCaller(context);
    await expect(variations.create({ projectId: 2, title: 'Foreign', costImpact: 10 })).rejects.toMatchObject({ code: 'NOT_FOUND' });
    const result = await variations.create({ projectId: 1, estimateId: 1, title: 'Additional pipe', costImpact: 44.83 });
    expect(result.variationNumber).toMatch(/^VO-/);
    const free = companyMemoryRouter.createCaller({ user: { id: 2 }, req: {}, res: {} } as any);
    await expect(free.addPriceBookItem({ category: 'Materials', name: 'Pipe', unit: 'm', unitPrice: 1 })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('rejects a malformed later takeoff batch without saving a partial estimate', async () => {
    await db.update(estimates).set({ aiTakeoffData: null }).where(eq(estimates.id, 1));
    const urls = Array.from({ length: 6 }, (_, n) => `https://test.invalid/plan-${n}.png`);
    await db.insert(planUploads).values(urls.map((url, n) => ({ fileKey: `plans/1/${n}.png`, userId: 1, url, pageCount: 1 })));
    modelMock.mockReset(); modelMock.mockResolvedValueOnce({ choices: [{ message: { content: JSON.stringify({ items: [{ quantity: 1, tradePrice: 10 }], confidence: 75, assumptions: [] }) } }] }).mockResolvedValueOnce({ choices: [{ message: { content: 'invalid-json' } }] });
    const { aiRouter } = await import('./routers/ai');
    const caller = aiRouter.createCaller({ user: { id: 1 }, req: {}, res: {} } as any);
    await expect(caller.visionTakeoffMultiPage({ estimateId: 1, requestId: 'batch-submission-123', trade: 'plumbing', imageUrls: urls })).rejects.toThrow('No partial takeoff');
    expect(await db.select().from(lineItems)).toHaveLength(0);
    expect((await db.select().from(takeoffJobs))[0].status).toBe('failed');
  });
  async function upload() { await db.insert(planUploads).values({ fileKey: 'plans/2/a.pdf', userId: 2, url: 'https://test.invalid/a.pdf', pageCount: 1 }); }
  const url = 'https://test.invalid/a.pdf';
  it('atomically reserves one lifetime free scan under races', async () => {
    await upload();
    const outcomes = await Promise.allSettled(['submission-one-123', 'submission-two-123'].map(id => beginTakeoff(db, 2, 2, id, { url }, [url])));
    expect(outcomes.filter(o => o.status === 'fulfilled')).toHaveLength(1); expect(await db.select().from(takeoffJobs)).toHaveLength(1);
  });
  it('same completed submission replays; failed request has two bounded retries', async () => {
    await upload();
    const job = await beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url]);
    await failTakeoff(db, job);
    const retry = await beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url]); expect(retry.attempts).toBe(2);
    const result = { items: [{ description: 'Pipe', quantity: 2, unit: 'm', tradePrice: 4, category: 'Materials', wasteFactor: 0 }], confidence: 70, assumptions: ['Review'] };
    await completeTakeoff(db, retry, result);
    const replay = await beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url]); expect(replay.status).toBe('completed'); expect(replay.result).toEqual(result);
    expect(await db.select().from(lineItems)).toHaveLength(1);
  });
  it('blocks running duplicates, altered payloads and a fourth failed attempt', async () => {
    await upload();
    let job = await beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url]);
    await expect(beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url])).rejects.toThrow('still running');
    await expect(beginTakeoff(db, 2, 2, 'submission-one-123', { changed: true }, [url])).rejects.toThrow('another request');
    for (let n = 0; n < 2; n++) { await failTakeoff(db, job); job = await beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url]); }
    await failTakeoff(db, job);
    await expect(beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url])).rejects.toThrow('retry limit');
  });
  it('does not overwrite human edits made while takeoff was running', async () => {
    await upload(); const job = await beginTakeoff(db, 2, 2, 'submission-one-123', { url }, [url]);
    await editEstimate(db, 2, 2, 1, { kind: 'add', values: item });
    await expect(completeTakeoff(db, job, { items: [{ quantity: 8, tradePrice: 20 }], confidence: 80, assumptions: [] })).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await db.select().from(lineItems)).toHaveLength(1);
  });
  it('paid legacy and Pro users retain scan access without free quota', async () => {
    await db.update(estimates).set({ aiTakeoffData: null }).where(eq(estimates.id, 1));
    await db.update(users).set({ subscriptionTier: 'sole_trader' }).where(eq(users.id, 1));
    const job = await beginTakeoff(db, 1, 1, 'paid-submission-123', {}, [], true);
    expect(job.freeUserId).toBeNull();
  });
  it('rejects unverified, multi-sheet and foreign uploads before reserving quota', async () => {
    await upload(); await db.update(users).set({ emailVerified: false }).where(eq(users.id, 2));
    await expect(beginTakeoff(db, 2, 2, 'submission-one-123', {}, [url])).rejects.toThrow('Verify');
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, 2));
    await db.update(planUploads).set({ pageCount: 2 });
    await expect(beginTakeoff(db, 2, 2, 'submission-one-123', {}, [url])).rejects.toThrow('exactly one');
    await expect(beginTakeoff(db, 2, 2, 'submission-one-123', {}, ['https://test.invalid/foreign'])).rejects.toThrow('own account');
    expect(await db.select().from(takeoffJobs)).toHaveLength(0);
  });
  it('recovers an expired attempt once and fences both late completion and late failure', async () => {
    await upload();
    const old = await beginTakeoff(db, 2, 2, 'recovery-test-12345', { url }, [url]);
    await db.update(takeoffJobs).set({ leaseExpiresAt: new Date(Date.now() - 1000) });
    const outcomes = await Promise.allSettled([1,2].map(() => beginTakeoff(db, 2, 2, 'recovery-test-12345', { url }, [url])));
    expect(outcomes.filter(o => o.status === 'fulfilled')).toHaveLength(1);
    const retry = (outcomes.find(o => o.status === 'fulfilled') as PromiseFulfilledResult<any>).value;
    expect(retry.attempts).toBe(2);
    await failTakeoff(db, old);
    expect((await db.select().from(takeoffJobs))[0].status).toBe('running');
    const result = { items: [{ description: 'Pipe', quantity: 2, unit: 'm', tradePrice: 4, category: 'Materials' }], confidence: 70, assumptions: [] };
    await expect(completeTakeoff(db, old, result)).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(await db.select().from(lineItems)).toHaveLength(0);
    await completeTakeoff(db, retry, result);
    expect(await db.select().from(lineItems)).toHaveLength(1);
  });
  it('Xero state rejects forgery, browser mismatch, expiry and concurrent replay', async () => {
    const { issueXeroState, consumeXeroState } = await import('./xeroState');
    vi.stubEnv('PUBLIC_APP_ORIGIN', 'https://kindai.au');
    await expect(issueXeroState(db, 1, 'https://evil.invalid')).rejects.toThrow();
    const issued = await issueXeroState(db, 1, 'https://kindai.au');
    await expect(consumeXeroState(db, issued.state, '0'.repeat(64))).rejects.toThrow();
    const results = await Promise.allSettled([1,2].map(() => consumeXeroState(db, issued.state, issued.browser)));
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    const expired = await issueXeroState(db, 1, 'https://kindai.au');
    await db.update(oauthStates).set({ expiresAt: new Date(Date.now() - 1000) });
    await expect(consumeXeroState(db, expired.state, expired.browser)).rejects.toThrow();
    vi.unstubAllEnvs();
  });
  it('legacy email verification requires a delivered code, binds account email and rejects replay', async () => {
    const { emailVerificationRouter } = await import('./routers/emailVerification');
    await db.update(users).set({ emailVerified: false, email: 'legacy@example.test' }).where(eq(users.id, 2));
    const caller = emailVerificationRouter.createCaller({ user: { id: 2 }, req: {}, res: {} } as any);
    mailMock.mockClear(); mailMock.mockResolvedValue(true);
    await caller.request();
    const code = mailMock.mock.calls[0][0].text.match(/code is (\d{8})/)[1];
    await expect(caller.request()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    await expect(caller.confirm({ code: '00000000' })).rejects.toThrow('Invalid');
    expect((await db.select().from(emailChallenges))[0].attempts).toBe(1);
    await caller.confirm({ code });
    expect((await db.select().from(users).where(eq(users.id, 2)))[0].emailVerified).toBe(true);
    await expect(caller.confirm({ code })).rejects.toThrow('Invalid');
  });
  it('failed verification delivery rolls back the challenge', async () => {
    const { emailVerificationRouter } = await import('./routers/emailVerification');
    await db.update(users).set({ emailVerified: false, email: 'legacy@example.test' }).where(eq(users.id, 2));
    mailMock.mockResolvedValueOnce(false);
    await expect(emailVerificationRouter.createCaller({ user: { id: 2 }, req: {}, res: {} } as any).request()).rejects.toThrow('could not be sent');
    expect(await db.select().from(emailChallenges)).toHaveLength(0);
  });
  it('issued quote stays immutable after edits and responses serialize', async () => {
    const { quoteTokensRouter } = await import('./routers/quoteTokens');
    vi.stubEnv('PUBLIC_APP_ORIGIN', 'https://kindai.au');
    const saved = await editEstimate(db, 1, 1, 1, { kind: 'add', values: item });
    const [user] = await db.select().from(users).where(eq(users.id, 1));
    const caller = quoteTokensRouter.createCaller({ user, req: {}, res: {} } as any);
    const issued = await caller.sendQuote({ estimateId: 1, expectedVersion: saved.version, clientName: 'Client', origin: 'https://kindai.au' });
    await editEstimate(db, 1, 1, saved.version, { kind: 'update', id: saved.id, values: { quantity: 5 } });
    const visible = await caller.getByToken({ token: issued.token });
    expect(visible.estimate.total).toBe('14.60');
    expect(visible.items[0].quantity).toBe('1.005');
    const responses = await Promise.allSettled(['accepted', 'declined'].map(action => caller.respond({ token: issued.token, action: action as 'accepted' | 'declined' })));
    expect(responses.filter(r => r.status === 'fulfilled')).toHaveLength(1);
    await expect(caller.sendQuote({ estimateId: 1, expectedVersion: saved.version, clientName: 'Client', origin: 'https://kindai.au' })).rejects.toMatchObject({ code: 'CONFLICT' });
    vi.unstubAllEnvs();
  });
  it('Stripe duplicates and delayed failures use latest provider state and preserve unrelated subscriptions', async () => {
    const { reconcileSubscription } = await import('./stripe/reconcile');
    await db.update(users).set({ stripeCustomerId: 'cus_mock', stripeSubscriptionId: 'sub_current' }).where(eq(users.id, 1));
    const retrieve = vi.fn(async () => ({ customer: 'cus_mock', status: 'active', items: { data: [{ price: { lookup_key: 'kindai_pro_2026_monthly_inclusive' } }] } }));
    const stripe = { subscriptions: { retrieve } };
    const event = { id: 'evt_mock_1', type: 'invoice.payment_failed', data: { object: { customer: 'cus_mock', subscription: 'sub_current' } } };
    await Promise.all([1,2].map(() => reconcileSubscription(db, stripe, event)));
    expect(retrieve).toHaveBeenCalledTimes(1);
    expect((await db.select().from(users).where(eq(users.id, 1)))[0].subscriptionStatus).toBe('active');
    await reconcileSubscription(db, stripe, { ...event, id: 'evt_mock_2', data: { object: { customer: 'cus_mock', subscription: 'sub_old' } } });
    expect(retrieve).toHaveBeenCalledTimes(1);
    retrieve.mockRejectedValueOnce(new Error('Provider unavailable'));
    await expect(reconcileSubscription(db, stripe, { ...event, id: 'evt_mock_3' })).rejects.toThrow();
    expect((await db.select().from(stripeEvents)).map(e => e.id)).not.toContain('evt_mock_3');
  });

});
