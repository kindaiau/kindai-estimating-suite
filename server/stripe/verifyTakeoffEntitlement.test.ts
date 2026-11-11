import { beforeEach, describe, expect, it, vi } from 'vitest';
const retrieve = vi.hoisted(() => vi.fn());
vi.mock('./stripe', () => ({ getStripe: () => ({ subscriptions: { retrieve } }) }));
import { verifyTakeoffEntitlement } from './verifyTakeoffEntitlement';
const account = { stripeCustomerId: 'cus_test', stripeSubscriptionId: 'sub_test', subscriptionTier: 'pro' as const };
const active = { id: 'sub_test', customer: 'cus_test', status: 'active', items: { data: [{ price: { lookup_key: 'kindai_pro_2026_monthly_inclusive' } }] } };
describe('fresh linked takeoff entitlement (offline)', () => {
  beforeEach(() => { vi.resetAllMocks(); retrieve.mockResolvedValue(active); });
  it.each(['active', 'trialing'])('permits provider-verified %s access', async status => {
    retrieve.mockResolvedValue({ ...active, status });
    await expect(verifyTakeoffEntitlement(account)).resolves.toBe(true);
    expect(retrieve).toHaveBeenCalledWith('sub_test', {}, { timeout: 5_000, maxNetworkRetries: 0 });
  });
  it.each(['canceled', 'incomplete_expired', 'past_due', 'unpaid', 'incomplete', 'paused'])('blocks stale database access when provider status is %s', async status => {
    retrieve.mockResolvedValue({ ...active, status });
    await expect(verifyTakeoffEntitlement(account)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('keeps paid access until scheduled cancellation actually takes effect', async () => {
    retrieve.mockResolvedValue({ ...active, cancel_at_period_end: true });
    await expect(verifyTakeoffEntitlement(account)).resolves.toBe(true);
  });
  it('fails closed on provider outage without changing saved entitlements', async () => {
    retrieve.mockRejectedValue(new Error('Outage'));
    await expect(verifyTakeoffEntitlement(account)).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    expect(account.subscriptionTier).toBe('pro');
  });
  it.each([{ customer: 'cus_other' }, { id: 'sub_other' }])('rejects mismatched provider mapping %j', async mismatch => {
    retrieve.mockResolvedValue({ ...active, ...mismatch });
    await expect(verifyTakeoffEntitlement(account)).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
  it('rejects a linked account missing its customer mapping', async () => {
    await expect(verifyTakeoffEntitlement({ ...account, stripeCustomerId: null })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(retrieve).not.toHaveBeenCalled();
  });
  it('does not silently verify or revoke unlinked historical/manual access', async () => {
    await expect(verifyTakeoffEntitlement({ ...account, stripeSubscriptionId: null })).resolves.toBe(false);
    expect(retrieve).not.toHaveBeenCalled();
  });
  it('rejects an unknown Pro price but preserves an already mapped legacy price', async () => {
    retrieve.mockResolvedValue({ ...active, items: { data: [{ price: { lookup_key: null } }] } });
    await expect(verifyTakeoffEntitlement(account)).rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(verifyTakeoffEntitlement({ ...account, subscriptionTier: 'sole_trader' })).resolves.toBe(true);
  });
});
