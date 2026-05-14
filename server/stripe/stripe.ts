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
 * Create a one-time Checkout Session for the founding pilot setup sprint.
 */
export async function createPilotSetupCheckoutSession(opts: {
  name: string;
  email: string;
  phone?: string;
  tradeType?: string;
  origin: string;
  amount: number;
  currency: string;
  productName: string;
  productDescription: string;
}): Promise<string> {
  const stripe = getStripe();
  const successUrl = new URL("/beta", opts.origin);
  successUrl.searchParams.set("paid_setup", "success");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL("/beta", opts.origin);
  cancelUrl.searchParams.set("intent", "paid-setup");
  cancelUrl.searchParams.set("checkout", "cancelled");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: opts.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: opts.currency,
          unit_amount: opts.amount,
          product_data: {
            name: opts.productName,
            description: opts.productDescription,
          },
        },
      },
    ],
    phone_number_collection: { enabled: true },
    client_reference_id: opts.email,
    metadata: {
      intent: "Paid Pilot Setup",
      kindai_flow: "founding_pilot_setup",
      customer_name: opts.name,
      customer_email: opts.email,
      customer_phone: opts.phone ?? "",
      trade_type: opts.tradeType ?? "",
    },
    payment_intent_data: {
      metadata: {
        kindai_flow: "founding_pilot_setup",
        customer_name: opts.name,
        customer_email: opts.email,
        customer_phone: opts.phone ?? "",
        trade_type: opts.tradeType ?? "",
      },
    },
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
  });

  if (!session.url) throw new Error("Failed to create pilot setup checkout session URL");
  return session.url;
}

/**
 * Create a one-time Checkout Session for the $9 / 21-day Pro Trial.
 * Fully public — no Stripe customer or auth required before payment.
 */
export async function createProTrialCheckoutSession(opts: {
  name: string;
  email: string;
  phone?: string;
  tradeType?: string;
  origin: string;
}): Promise<string> {
  const stripe = getStripe();

  const successUrl = new URL("/pricing", opts.origin);
  successUrl.searchParams.set("trial", "success");
  successUrl.searchParams.set("session_id", "{CHECKOUT_SESSION_ID}");

  const cancelUrl = new URL("/pricing", opts.origin);
  cancelUrl.searchParams.set("trial", "cancelled");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: opts.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "aud",
          unit_amount: 900, // A$9
          product_data: {
            name: "Kindai Pro \u2014 21-Day Trial",
            description:
              "Full Pro access for 21 days. Unlimited Quick Quotes, Plan Reading (Vision AI), Company Memory, and Correction Learning. No lock-in.",
          },
        },
      },
    ],
    phone_number_collection: { enabled: false },
    client_reference_id: opts.email,
    metadata: {
      intent: "Pro Trial",
      kindai_flow: "pro_trial_21_day",
      customer_name: opts.name,
      customer_email: opts.email,
      customer_phone: opts.phone ?? "",
      trade_type: opts.tradeType ?? "",
    },
    payment_intent_data: {
      metadata: {
        kindai_flow: "pro_trial_21_day",
        customer_name: opts.name,
        customer_email: opts.email,
        trade_type: opts.tradeType ?? "",
      },
    },
    success_url: successUrl.toString(),
    cancel_url: cancelUrl.toString(),
  });

  if (!session.url) throw new Error("Failed to create Pro Trial checkout session URL");
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
