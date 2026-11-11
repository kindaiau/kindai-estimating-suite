import { describe, expect, it, vi } from 'vitest';
import { recoverDeletedCustomerAttempt } from './pendingCheckout';
const saved = { customerId: 'cus_deleted', priceId: 'price_old', userId: 7, userEmail: 'synthetic@example.test', origin: 'https://kindai.au' };
function provider() {
  const session = { id: 'cs_old', mode: 'subscription', customer: 'cus_deleted', client_reference_id: '7', status: 'open', subscription: null };
  const stripe = {
    customers: { retrieve: vi.fn().mockResolvedValue({ id: 'cus_deleted', deleted: true }) },
    subscriptions: { retrieve: vi.fn().mockResolvedValue({ status: 'canceled' }), list: vi.fn().mockResolvedValue({ data: [], has_more: false }) },
    checkout: { sessions: { list: vi.fn().mockResolvedValue({ data: [session], has_more: false }), expire: vi.fn().mockResolvedValue({ status: 'expired' }), create: vi.fn() } },
  };
  return { stripe, session, run: (mapped?: string) => recoverDeletedCustomerAttempt(stripe as any, saved, mapped) };
}
describe('deleted customer attempt reconciliation (offline)', () => {
  it('expires an owned open session without recreating the old checkout', async () => {
    const f = provider(); await f.run();
    expect(f.stripe.checkout.sessions.expire).toHaveBeenCalledWith('cs_old');
    expect(f.stripe.checkout.sessions.create).not.toHaveBeenCalled();
    expect(f.stripe.subscriptions.list).toHaveBeenCalledTimes(2);
  });
  it('allows an empty verified history', async () => {
    const f = provider(); f.stripe.checkout.sessions.list.mockResolvedValue({ data: [], has_more: false });
    await expect(f.run()).resolves.toBeUndefined();
  });
  it.each([false, undefined])('does not discard a customer not confirmed deleted (%s)', async deleted => {
    const f = provider(); f.stripe.customers.retrieve.mockResolvedValue({ id: 'cus_deleted', deleted });
    await expect(f.run()).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(f.stripe.checkout.sessions.list).not.toHaveBeenCalled();
  });
  it.each([{ statusCode: 404 }, new Error('Provider unavailable')])('preserves uncertainty on provider failure', async error => {
    const f = provider(); f.stripe.customers.retrieve.mockRejectedValue(error);
    await expect(f.run()).rejects.toBe(error);
    expect(f.stripe.checkout.sessions.expire).not.toHaveBeenCalled();
  });
  it('blocks an unmapped completed subscription', async () => {
    const f = provider(); f.stripe.checkout.sessions.list.mockResolvedValue({ data: [{ ...f.session, status: 'complete', subscription: 'sub_unknown' }], has_more: false });
    await expect(f.run()).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(f.stripe.checkout.sessions.expire).not.toHaveBeenCalled();
  });
  it('retains a reconciled terminal subscription without duplicating its checkout', async () => {
    const f = provider(); f.stripe.checkout.sessions.list.mockResolvedValue({ data: [{ ...f.session, status: 'complete', subscription: 'sub_known' }], has_more: false });
    await expect(f.run('sub_known')).resolves.toBeUndefined();
  });
  it('blocks active subscriptions and completion races', async () => {
    const f = provider(); f.stripe.subscriptions.list.mockResolvedValueOnce({ data: [], has_more: false }).mockResolvedValueOnce({ data: [{ status: 'active' }], has_more: false });
    await expect(f.run()).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('blocks a failed expiration instead of rotating the attempt', async () => {
    const f = provider(); f.stripe.checkout.sessions.expire.mockResolvedValue({ status: 'complete' });
    await expect(f.run()).rejects.toMatchObject({ code: 'CONFLICT' });
  });
  it('rejects sessions belonging to a different account', async () => {
    const f = provider(); f.stripe.checkout.sessions.list.mockResolvedValue({ data: [{ ...f.session, client_reference_id: '8' }], has_more: false });
    await expect(f.run()).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(f.stripe.checkout.sessions.expire).not.toHaveBeenCalled();
  });
  it('reads every page before allowing replacement', async () => {
    const f = provider(); f.stripe.checkout.sessions.list.mockResolvedValueOnce({ data: [{ ...f.session, status: 'expired' }], has_more: true }).mockResolvedValueOnce({ data: [{ ...f.session, id: 'cs_complete', status: 'complete', subscription: 'sub_unknown' }], has_more: false });
    await expect(f.run()).rejects.toMatchObject({ code: 'CONFLICT' });
    expect(f.stripe.checkout.sessions.list.mock.calls[1][0].starting_after).toBe('cs_old');
  });
  it('fails closed on incomplete subscription pagination', async () => {
    const f = provider(); f.stripe.subscriptions.list.mockResolvedValue({ data: [], has_more: true });
    await expect(f.run()).rejects.toThrow('Incomplete provider subscription history');
    expect(f.stripe.checkout.sessions.expire).not.toHaveBeenCalled();
  });

});
