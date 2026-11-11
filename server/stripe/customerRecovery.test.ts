import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ db: null as any, customer: vi.fn(), pending: vi.fn(), prices: vi.fn() }));
vi.mock('../db', () => ({ getDb: async () => mocks.db }));
vi.mock('./stripe', () => ({
  findOrCreateCustomer: mocks.customer,
  getStripe: () => ({ prices: { list: mocks.prices } }),
  createPilotSetupCheckoutSession: vi.fn(), createPortalSession: vi.fn(),
}));
vi.mock('./pendingCheckout', () => ({ pendingCheckout: mocks.pending }));
import { billingRouter } from '../routers/billing';
import { MySqlDialect } from 'drizzle-orm/mysql-core';

describe('checkout customer mapping recovery (offline route)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('PUBLIC_APP_ORIGIN', 'https://kindai.au');
    vi.stubEnv('PRO_STRIPE_AUTOMATIC_TAX', 'true');
    vi.stubEnv('PRO_GST_BEHAVIOR', 'inclusive');
    mocks.customer.mockResolvedValue('cus_replacement');
    mocks.prices.mockResolvedValue({ data: [{ id: 'price_test', unit_amount: 14900, currency: 'aud', tax_behavior: 'inclusive', recurring: { interval: 'month', interval_count: 1 } }] });
  });
  afterEach(() => vi.unstubAllEnvs());
  it.each(['cus_deleted', null])('persists replacement before checkout when prior mapping is %s', async previous => {
    let storedCustomerId: string | null = previous;
    const whereUpdate = vi.fn(async (condition: any) => {
      const query = new MySqlDialect().sqlToQuery(condition);
      expect(query.params).toContain(7);
      if (previous) expect(query.params).toContain(previous);
      else expect(query.sql).toContain('is null');
      storedCustomerId = 'cus_replacement';
    });
    mocks.db = {
      select: () => ({ from: () => ({ where: () => ({ limit: async () => [{ stripeCustomerId: previous, email: 'test@example.test' }] }) }) }),
      update: () => ({ set: (values: any) => {
        expect(values).toEqual({ stripeCustomerId: 'cus_replacement' });
        return { where: whereUpdate };
      } }),
    };
    mocks.pending.mockImplementation(async (_db: any, options: any) => {
      if (storedCustomerId !== options.customerId) throw new Error('Checkout customer changed. Refresh billing and try again.');
      return { url: 'https://checkout.test' };
    });
    const caller = billingRouter.createCaller({ user: { id: 7 }, req: {}, res: {} } as any);
    await expect(caller.createCheckout({ planId: 'pro', interval: 'monthly', origin: 'https://kindai.au' })).resolves.toEqual({ url: 'https://checkout.test' });
    expect(whereUpdate).toHaveBeenCalledOnce();
  });
});
