import { TRPCError } from '@trpc/server';
import type { users } from '../../drizzle/schema';
import { getStripe } from './stripe';

type Account = Pick<typeof users.$inferSelect, 'stripeCustomerId' | 'stripeSubscriptionId' | 'subscriptionTier'>;
const legacy = ['enterprise', 'mid_builder', 'small_builder', 'sole_trader'] as const;

/** Recheck linked paid access before starting chargeable provider work.
 * Unlinked/manual entitlements remain unchanged and explicitly unverified.
 * This does not mutate billing records or manufacture webhook events.
 */
export async function verifyTakeoffEntitlement(user: Account): Promise<boolean> {
  if (!user.stripeSubscriptionId) return false;
  if (!user.stripeCustomerId) throw new TRPCError({ code: 'FORBIDDEN', message: 'Billing account requires reconciliation before another scan.' });
  let current;
  try {
    current = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId, {}, { timeout: 5_000, maxNetworkRetries: 0 });
  } catch {
    throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Unable to verify your paid plan right now. Retry shortly; your saved work is preserved.' });
  }
  const customerId = typeof current.customer === 'string' ? current.customer : current.customer?.id;
  if (current.id !== user.stripeSubscriptionId || customerId !== user.stripeCustomerId) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Billing account requires reconciliation before another scan.' });
  }
  if (!['active', 'trialing'].includes(current.status)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'An active paid plan is required to start another scan. Your saved work is preserved.' });
  }
  const key = current.items?.data?.[0]?.price?.lookup_key ?? '';
  const recognised = ['kindai_pro_2026_monthly_inclusive', 'kindai_pro_2026_yearly_inclusive'].includes(key)
    || legacy.some(tier => [`kindai_${tier}_monthly`, `kindai_${tier}_yearly`].includes(key));
  // Match reconcileSubscription's existing grandfathered-price rule, only for
  // this exact already-mapped subscription. Never grant unknown Pro prices.
  const mappedLegacy = legacy.includes(user.subscriptionTier as typeof legacy[number]);
  if (!recognised && !mappedLegacy) throw new TRPCError({ code: 'FORBIDDEN', message: 'Your subscription price requires billing reconciliation before another scan.' });
  return true;
}
