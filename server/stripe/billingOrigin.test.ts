import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ pilot: vi.fn(), portal: vi.fn(), db: vi.fn() }));
vi.mock('../db', () => ({ getDb: mocks.db }));
vi.mock('./stripe', () => ({ findOrCreateCustomer: vi.fn(), getStripe: vi.fn(), createPilotSetupCheckoutSession: mocks.pilot, createPortalSession: mocks.portal }));
import { billingRouter, requireBillingOrigin } from '../routers/billing';
const caller = billingRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any);
const pilot = { name: 'Synthetic', email: 'synthetic@example.test' };
describe('billing return origin allowlist (offline)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('PUBLIC_APP_ORIGIN', 'https://kindai.au');
    mocks.pilot.mockResolvedValue('https://checkout.test');
    mocks.portal.mockResolvedValue('https://portal.test');
    mocks.db.mockResolvedValue({ select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ stripeCustomerId: 'cus_test' }] }) }) }) });
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(['https://evil.example', 'https://kindai.au.evil.example', 'https://kindai.au@evil.example', 'https://kindai.au/path', 'http://kindai.au'])('rejects %s before database or provider access on every billing route', async origin => {
    await expect(caller.createPilotSetupCheckout({ ...pilot, origin })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller.createPortal({ origin })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    await expect(caller.createCheckout({ planId: 'pro', interval: 'monthly', origin })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.pilot).not.toHaveBeenCalled();
    expect(mocks.portal).not.toHaveBeenCalled();
  });
  it.each(['', 'not-a-url', 'javascript:alert(1)', 'https://dummy-user:dummy-password@kindai.au'])('fails closed for invalid configuration %s', configured => {
    vi.stubEnv('PUBLIC_APP_ORIGIN', configured);
    expect(() => requireBillingOrigin('https://kindai.au')).toThrow('configured application origin');
  });
  it('allows the exact configured origin through both pilot and portal routes', async () => {
    expect(requireBillingOrigin('https://kindai.au')).toBe('https://kindai.au');
    await expect(caller.createPilotSetupCheckout({ ...pilot, origin: 'https://kindai.au' })).resolves.toEqual({ url: 'https://checkout.test' });
    await expect(caller.createPortal({ origin: 'https://kindai.au' })).resolves.toEqual({ url: 'https://portal.test' });
    expect(mocks.pilot).toHaveBeenCalledOnce(); expect(mocks.portal).toHaveBeenCalledOnce();
  });
});
