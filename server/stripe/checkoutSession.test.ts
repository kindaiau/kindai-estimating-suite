import { describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ create: vi.fn(), retrieveCustomer: vi.fn(), createCustomer: vi.fn() }));
vi.mock('../_core/env', () => ({ ENV: { stripeSecretKey: 'mock-key' } }));
vi.mock('stripe', () => ({ default: class {
  checkout = { sessions: { create: mocks.create } };
  customers = { retrieve: mocks.retrieveCustomer, create: mocks.createCustomer };
} }));
import { createCheckoutSession, findOrCreateCustomer } from './stripe';
describe('subscription checkout request (offline)', () => {
  it('collects and saves a tax location for an existing customer when automatic tax is enabled', async () => {
    mocks.create.mockResolvedValue({ id: 'cs_mock', url: 'https://checkout.test', status: 'open' });
    const options = { customerId: 'cus_mock', priceId: 'price_mock', userId: 1, userEmail: 'test@example.test', origin: 'https://kindai.au', automaticTax: true, idempotencyKey: 'attempt-123' };
    expect(await createCheckoutSession(options)).toMatchObject({ id: 'cs_mock', status: 'open' });
    expect(mocks.create).toHaveBeenLastCalledWith(expect.objectContaining({ customer: 'cus_mock', automatic_tax: { enabled: true }, billing_address_collection: 'required', customer_update: { address: 'auto' } }), { idempotencyKey: 'attempt-123' });
    await createCheckoutSession({ ...options, automaticTax: false });
    const params = mocks.create.mock.calls.at(-1)![0];
    expect(params.automatic_tax.enabled).toBe(false); expect(params.customer_update).toBeUndefined();
  });
  it('does not create another customer during a provider outage', async () => {
    mocks.retrieveCustomer.mockRejectedValue(new Error('Provider unavailable'));
    await expect(findOrCreateCustomer({ email: '', userId: 1, existingCustomerId: 'cus_mock' })).rejects.toThrow('Provider unavailable');
    expect(mocks.createCustomer).not.toHaveBeenCalled();
  });
});
