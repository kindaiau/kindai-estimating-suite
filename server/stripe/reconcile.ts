import { eq } from 'drizzle-orm';
import { stripeEvents, users } from '../../drizzle/schema';
import { getDb } from '../db';
type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
// Fetch inside the user lock: delivery order cannot replace newer provider state
// with an older event payload. The ledger and entitlement write commit together.
export async function reconcileSubscription(db: Db, stripe: { subscriptions: { retrieve(id: string): Promise<any> } }, event: { id: string; type: string; data: { object: any } }) {
  const object = event.data.object;
  const checkout = event.type === 'checkout.session.completed';
  const subscriptionId = checkout ? object.subscription : event.type.startsWith('customer.subscription.') ? object.id : object.subscription ?? object.parent?.subscription_details?.subscription;
  const customerId = typeof object.customer === 'string' ? object.customer : object.customer?.id;
  if (!subscriptionId || typeof subscriptionId !== 'string' || !customerId) return;
  await db.transaction(async tx => {
    const userId = checkout ? Number(object.client_reference_id ?? object.metadata?.user_id) : undefined;
    const [user] = await tx.select().from(users).where(userId ? eq(users.id, userId) : eq(users.stripeCustomerId, customerId)).limit(1).for('update');
    if (!user) throw new Error('Subscription customer is not mapped; retry after checkout reconciliation');
    if (user.stripeCustomerId && user.stripeCustomerId !== customerId) throw new Error('Subscription customer mismatch');
    const [seen] = await tx.select().from(stripeEvents).where(eq(stripeEvents.id, event.id)).limit(1);
    if (seen) return;
    const current = await stripe.subscriptions.retrieve(subscriptionId);
    const currentCustomer = typeof current.customer === 'string' ? current.customer : current.customer?.id;
    if (currentCustomer !== customerId) throw new Error('Provider customer mismatch');
    const terminal = (status: string) => ['canceled', 'incomplete_expired'].includes(status);
    if (user.stripeSubscriptionId && user.stripeSubscriptionId !== subscriptionId) {
      const previous = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      if (!terminal(previous.status) && !terminal(current.status)) {
        // Do not silently discard a second paid subscription. Fail delivery so
        // billing operations must resolve it; never auto-refund/cancel a charge.
        throw new Error(`Duplicate live subscriptions require billing reconciliation: ${user.stripeSubscriptionId}, ${subscriptionId}`);
      }
      if (!checkout || !terminal(previous.status) || current.created <= previous.created) {
        await tx.insert(stripeEvents).values({ id: event.id }); return;
      }
    }
    if (!checkout && !user.stripeSubscriptionId) throw new Error('Awaiting subscription checkout mapping');
    const key = current.items?.data?.[0]?.price?.lookup_key ?? '';
    const legacy = ['enterprise', 'mid_builder', 'small_builder', 'sole_trader'] as const;
    const mappedLegacy = legacy.includes(user.subscriptionTier as typeof legacy[number]) && user.stripeSubscriptionId === subscriptionId;
    const recognised = ['kindai_pro_2026_monthly_inclusive', 'kindai_pro_2026_yearly_inclusive'].includes(key) ? 'pro' :
      legacy.find(t => [`kindai_${t}_monthly`, `kindai_${t}_yearly`].includes(key));
    // Unknown replacements fail closed. A grandfathered price can retain access
    // only on its already-mapped legacy subscription. Terminal IDs remain mapped
    // to prevent stale events from restoring another subscription.
    const tier = terminal(current.status) ? 'free' : recognised ?? (mappedLegacy ? user.subscriptionTier : 'free');
    await tx.update(users).set({ stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, subscriptionTier: tier, subscriptionStatus: current.status }).where(eq(users.id, user.id));
    await tx.insert(stripeEvents).values({ id: event.id });
  });
}
