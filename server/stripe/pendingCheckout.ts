import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { checkoutAttempts, users } from '../../drizzle/schema';
import { getDb } from '../db';
import { createCheckoutSession, getStripe } from './stripe';

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
type Options = Parameters<typeof createCheckoutSession>[0];
const terminal = (status: string) => ['canceled', 'incomplete_expired'].includes(status);

export async function assertNoLiveSubscription(stripe: ReturnType<typeof getStripe>, customerId: string, subscriptionId?: string | null) {
  if (subscriptionId && !terminal((await stripe.subscriptions.retrieve(subscriptionId)).status)) {
    throw new TRPCError({ code: 'CONFLICT', message: 'Manage your existing subscription in Billing; no second subscription was created.' });
  }
  // A completed checkout can exist before its webhook maps the subscription.
  let starting_after: string | undefined;
  do {
    const page = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 100, starting_after });
    if (page.data.some(sub => !terminal(sub.status))) throw new TRPCError({ code: 'CONFLICT', message: 'An existing subscription is awaiting billing reconciliation; no second subscription was created.' });
    starting_after = page.has_more ? page.data.at(-1)?.id : undefined;
  } while (starting_after);
}

function optionsOf(attempt: typeof checkoutAttempts.$inferSelect): Options {
  return typeof attempt.options === 'string' ? JSON.parse(attempt.options) : attempt.options as Options;
}
function matches(a: Options, b: Options) {
  return a.customerId === b.customerId && a.priceId === b.priceId && a.origin === b.origin && a.automaticTax === b.automaticTax;
}

export async function pendingCheckout(db: Db, options: Options) {
  const stripe = getStripe();
  // Commit the attempt/key/parameters BEFORE creating a session. If Stripe accepts
  // it but the response or DB write fails, another process retries the same key.
  const attemptId = await db.transaction(async tx => {
    const [user] = await tx.select().from(users).where(eq(users.id, options.userId)).limit(1).for('update');
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    if (user.stripeCustomerId !== options.customerId) throw new TRPCError({ code: 'CONFLICT', message: 'Billing customer changed; reload Billing.' });
    await assertNoLiveSubscription(stripe, options.customerId, user.stripeSubscriptionId);
    const [pending] = await tx.select().from(checkoutAttempts).where(eq(checkoutAttempts.userId, options.userId)).limit(1);
    if (pending) {
      const savedOptions = optionsOf(pending);
      const session = pending.sessionId
        ? await stripe.checkout.sessions.retrieve(pending.sessionId)
        : await createCheckoutSession({ ...savedOptions, idempotencyKey: `pro-checkout:${pending.id}` });
      const completedSubscription = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (session.status === 'complete' && (!completedSubscription || completedSubscription !== user.stripeSubscriptionId)) throw new TRPCError({ code: 'CONFLICT', message: 'Checkout completed; await billing reconciliation before retrying.' });
      if (session.status === 'open' && matches(savedOptions, options)) {
        if (!pending.sessionId) await tx.update(checkoutAttempts).set({ sessionId: session.id }).where(eq(checkoutAttempts.userId, options.userId));
        return pending.id;
      }
      if (session.status === 'open') await stripe.checkout.sessions.expire(session.id);
      else if (!['expired', 'complete'].includes(session.status ?? '')) throw new Error('Unrecognised checkout session state');
    }
    // Drain sessions made by the old checkout implementation or a response lost
    // before this migration. Only this account's subscription sessions are touched.
    let starting_after: string | undefined;
    do {
      const page = await stripe.checkout.sessions.list({ customer: options.customerId, status: 'open', limit: 100, starting_after });
      for (const session of page.data) {
        if (session.mode === 'subscription' && session.client_reference_id === String(options.userId)) await stripe.checkout.sessions.expire(session.id);
      }
      starting_after = page.has_more ? page.data.at(-1)?.id : undefined;
    } while (starting_after);
    const id = randomUUID();
    await tx.insert(checkoutAttempts).values({ userId: options.userId, id, options, sessionId: null })
      .onDuplicateKeyUpdate({ set: { id, options, sessionId: null } });
    return id;
  });
  return db.transaction(async tx => {
    const [user] = await tx.select().from(users).where(eq(users.id, options.userId)).limit(1).for('update');
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    const [attempt] = await tx.select().from(checkoutAttempts).where(eq(checkoutAttempts.userId, options.userId)).limit(1);
    if (!attempt || attempt.id !== attemptId || !matches(optionsOf(attempt), options)) throw new TRPCError({ code: 'CONFLICT', message: 'Checkout options changed in another session. Retry your selected plan.' });
    await assertNoLiveSubscription(stripe, options.customerId, user.stripeSubscriptionId);
    const session = attempt.sessionId
      ? await stripe.checkout.sessions.retrieve(attempt.sessionId)
      : await createCheckoutSession({ ...optionsOf(attempt), idempotencyKey: `pro-checkout:${attempt.id}` });
    if (session.status !== 'open' || !session.url) throw new TRPCError({ code: 'CONFLICT', message: 'Checkout is no longer open. Retry from Billing.' });
    await tx.update(checkoutAttempts).set({ sessionId: session.id }).where(eq(checkoutAttempts.userId, options.userId));
    return { url: session.url };
  });
}
