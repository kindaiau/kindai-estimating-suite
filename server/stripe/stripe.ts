import Stripe from "stripe";
import { ENV } from "../_core/env";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = ENV.stripeSecretKey;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
    _stripe = new Stripe(key, { apiVersion: "2025-03-31.basil" as any });
  }
  return _stripe;
}

/**
 * Find or create a Stripe Customer for a given user
 */
export async function findOrCreateCustomer(opts: {
  email: string;
  name?: string;
  userId: number;
  existingCustomerId?: string | null;
}): Promise<string> {
  const stripe = getStripe();

  // If we already have a customer ID, verify it exists
  if (opts.existingCustomerId) {
    try {
      await stripe.customers.retrieve(opts.existingCustomerId);
      return opts.existingCustomerId;
    } catch {
      // Customer was deleted, create a new one
    }
  }

  const customer = await stripe.customers.create({
    email: opts.email,
    name: opts.name ?? undefined,
    metadata: { userId: opts.userId.toString() },
  });

  return customer.id;
}

/**
 * Create a Checkout Session for a subscription
 */
export async function createCheckoutSession(opts: {
  customerId: string;
  priceId: string;
  userId: number;
  userEmail: string;
  userName?: string;
  origin: string;
  successPath?: string;
  cancelPath?: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    customer: opts.customerId,
    mode: "subscription",
    line_items: [{ price: opts.priceId, quantity: 1 }],
    allow_promotion_codes: true,
    client_reference_id: opts.userId.toString(),
    metadata: {
      user_id: opts.userId.toString(),
      customer_email: opts.userEmail,
      customer_name: opts.userName ?? "",
    },
    success_url: `${opts.origin}${opts.successPath ?? "/billing?success=true"}`,
    cancel_url: `${opts.origin}${opts.cancelPath ?? "/pricing?cancelled=true"}`,
  });

  if (!session.url) throw new Error("Failed to create checkout session URL");
  return session.url;
}

/**
 * Create a Customer Portal session for managing billing
 */
export async function createPortalSession(opts: {
  customerId: string;
  origin: string;
  returnPath?: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.billingPortal.sessions.create({
    customer: opts.customerId,
    return_url: `${opts.origin}${opts.returnPath ?? "/billing"}`,
  });

  return session.url;
}
