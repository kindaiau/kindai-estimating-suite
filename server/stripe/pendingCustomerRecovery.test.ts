import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ stripe: null as any, create: vi.fn() }));
vi.mock('./stripe', () => ({ getStripe: () => mocks.stripe, createCheckoutSession: mocks.create }));
import { pendingCheckout } from './pendingCheckout';
import { users } from '../../drizzle/schema';
const current = { customerId: 'cus_new', userId: 7, priceId: 'price_test', userEmail: 'synthetic@example.test', origin: 'https://kindai.au' };
function database() {
  let attempt: any = { userId: 7, id: 'old-attempt', options: { ...current, customerId: 'cus_deleted' }, sessionId: null };
  const inserted = vi.fn();
  const tx = {
    select: () => ({ from: (table: unknown) => ({ where: () => ({ limit: () => {
      const rows = Promise.resolve(table === users ? [{ id: 7, stripeCustomerId: 'cus_new', stripeSubscriptionId: null }] : [attempt]);
      return Object.assign(rows, { for: () => rows });
    } }) }) }),
    insert: () => ({ values: (value: any) => ({ onDuplicateKeyUpdate: async () => { inserted(value); attempt = value; } }) }),
    update: () => ({ set: (value: any) => ({ where: async () => { attempt = { ...attempt, ...value }; } }) }),
  };
  return { db: { transaction: (fn: any) => fn(tx) } as any, inserted };
}
describe('replaced customer pending checkout route (offline transaction)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.stripe = {
      customers: { retrieve: vi.fn().mockResolvedValue({ id: 'cus_deleted', deleted: true }) },
      subscriptions: { list: vi.fn().mockResolvedValue({ data: [], has_more: false }) },
      checkout: { sessions: { list: vi.fn().mockResolvedValue({ data: [], has_more: false }) } },
    };
    mocks.create.mockImplementation(async (options: any) => {
      if (options.customerId === 'cus_deleted') throw new Error('No such customer');
      return { id: 'cs_new', status: 'open', url: 'https://checkout.test' };
    });
  });
  it('recovers a lost old-customer creation response without recreating it', async () => {
    const f = database();
    await expect(pendingCheckout(f.db, current)).resolves.toEqual({ url: 'https://checkout.test' });
    expect(f.inserted).toHaveBeenCalledOnce();
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[0][0]).toMatchObject({ customerId: 'cus_new' });
  });
  it('does not overwrite the attempt or create a new session when old history is unavailable', async () => {
    const f = database(); mocks.stripe.customers.retrieve.mockRejectedValue(new Error('Provider unavailable'));
    await expect(pendingCheckout(f.db, current)).rejects.toThrow('Provider unavailable');
    expect(f.inserted).not.toHaveBeenCalled(); expect(mocks.create).not.toHaveBeenCalled();
  });
});
