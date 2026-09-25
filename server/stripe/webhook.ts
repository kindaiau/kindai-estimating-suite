import { Router, raw } from "express";
import { getStripe } from "./stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { betaSignups, users } from "../../drizzle/schema";
import { and, eq, isNull } from "drizzle-orm";
import { sendPilotPaymentEmails } from "../resendEmail";
import { PILOT_SETUP_OFFER } from "./products";
import { buildPurchaseOrTrialEvent, sendMetaConversionEventSafely } from "../metaCapi";

function isPaidPilotSetupSession(session: any) {
  return (
    session.mode === "payment" &&
    session.payment_status === "paid" &&
    session.metadata?.kindai_flow === "founding_pilot_setup"
  );
}

function shouldSendCheckoutConversion(session: any) {
  return session.payment_status === "paid" && Boolean(session.id);
}

function getCheckoutCustomerDetails(session: any) {
  const customerDetails = session.customer_details ?? {};
  return {
    name: session.metadata?.customer_name || customerDetails.name || undefined,
    email: session.metadata?.customer_email || customerDetails.email || session.customer_email || undefined,
    phone: session.metadata?.customer_phone || customerDetails.phone || undefined,
  };
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function addUtcMonths(start: Date, months: number): Date {
  const result = new Date(start);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function getCheckoutEventSourceUrl(session: any) {
  if (session.metadata?.event_source_url) return session.metadata.event_source_url;
  if (session.metadata?.kindai_flow === "founding_pilot_setup") return "https://kindaiestimator.com/evaluation";
  return "https://kindaiestimator.com/pricing";
}

async function sendCheckoutConversionToMeta(session: any) {
  if (!shouldSendCheckoutConversion(session)) return;

  const customer = getCheckoutCustomerDetails(session);
  const eventName = session.mode === "subscription" ? "StartTrial" : "Purchase";

  await sendMetaConversionEventSafely(
    buildPurchaseOrTrialEvent({
      eventName,
      eventId: `stripe_checkout_${session.id}`,
      eventSourceUrl: getCheckoutEventSourceUrl(session),
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      amountTotal: session.amount_total,
      currency: session.currency,
      stripeSessionId: session.id,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
      planId: session.metadata?.plan_id || session.metadata?.planId,
      flow: session.metadata?.kindai_flow || session.mode,
    }),
    `Stripe checkout ${session.id}`
  );
}

export function registerStripeWebhook(app: Router) {
  // IMPORTANT: raw body parser MUST be applied before express.json()
  // This route is registered before the global json parser in index.ts
  app.post(
    "/api/stripe/webhook",
    raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe();
      const sig = req.headers["stripe-signature"];
      const webhookSecret = ENV.stripeWebhookSecret;

      if (!sig || !webhookSecret) {
        console.error("[Stripe Webhook] Missing signature or webhook secret");
        return res.status(400).json({ error: "Missing signature or secret" });
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).json({ error: `Webhook signature verification failed` });
      }

      console.log(`[Stripe Webhook] Received event: ${event.type} (${event.id})`);

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as any;

            if (isPaidPilotSetupSession(session)) {
              const customer = getCheckoutCustomerDetails(session);
              const email = normalizeEmail(customer.email);
              const amountPaid = session.amount_total ?? 0;
              const currency = String(session.currency ?? "").toLowerCase();
              const applicationId = Number(session.metadata?.application_id ?? 0);

              if (
                !email ||
                amountPaid !== PILOT_SETUP_OFFER.amount ||
                currency !== PILOT_SETUP_OFFER.currency ||
                session.metadata?.offer_id !== PILOT_SETUP_OFFER.id ||
                session.metadata?.offer_version !== PILOT_SETUP_OFFER.version ||
                !Number.isInteger(applicationId) ||
                applicationId <= 0
              ) {
                throw new Error("Paid setup checkout did not match the approved offer amount, currency or customer email");
              }

              const db = await getDb();
              if (!db) throw new Error("Database unavailable while activating paid setup");

              const [application] = await db
                .select({
                  id: betaSignups.id,
                  name: betaSignups.name,
                  email: betaSignups.email,
                  phone: betaSignups.phone,
                  trade: betaSignups.trade,
                  intent: betaSignups.intent,
                  status: betaSignups.status,
                  paymentStatus: betaSignups.paymentStatus,
                  stripeCheckoutSessionId: betaSignups.stripeCheckoutSessionId,
                  accessExpiresAt: betaSignups.accessExpiresAt,
                  confirmationClaimedAt: betaSignups.confirmationClaimedAt,
                  confirmationSentAt: betaSignups.confirmationSentAt,
                })
                .from(betaSignups)
                .where(and(eq(betaSignups.id, applicationId), eq(betaSignups.email, email)))
                .limit(1);

              if (!application || application.intent !== "Paid Pilot Setup" || !["approved", "active"].includes(application.status)) {
                throw new Error("No approved Founding Workflow Setup application matched the paid checkout");
              }

              if (application.stripeCheckoutSessionId !== session.id) {
                throw new Error("Paid checkout session did not match the approved application invitation");
              }

              const paidAt = new Date((session.created ?? Math.floor(Date.now() / 1000)) * 1000);
              const accessExpiresAt = application.accessExpiresAt ?? addUtcMonths(paidAt, 6);

              if (application.paymentStatus !== "paid") {
                const paymentUpdate = await db
                  .update(betaSignups)
                  .set({
                    status: "active",
                    offerVersion: PILOT_SETUP_OFFER.version,
                    paymentStatus: "paid",
                    amountPaid,
                    paymentCurrency: currency,
                    paidAt,
                    accessExpiresAt,
                  })
                  .where(and(
                    eq(betaSignups.id, application.id),
                    eq(betaSignups.paymentStatus, "unpaid"),
                    eq(betaSignups.stripeCheckoutSessionId, session.id)
                  ));
                const affected = Number((paymentUpdate as any)[0]?.affectedRows ?? (paymentUpdate as any).affectedRows ?? 0);
                if (affected !== 1) {
                  throw new Error("Paid setup activation lost its atomic payment-state claim");
                }
              }

              const [account] = await db
                .select({ id: users.id, tier: users.subscriptionTier, status: users.subscriptionStatus })
                .from(users)
                .where(eq(users.email, email))
                .limit(1);

              if (account && (account.tier === "free" || account.status === "pilot_active")) {
                await db
                  .update(users)
                  .set({
                    subscriptionTier: "sole_trader",
                    subscriptionStatus: "pilot_active",
                    isBetaUser: true,
                    betaExpiresAt: accessExpiresAt,
                    stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
                  })
                  .where(eq(users.id, account.id));
              }

              if (!application.confirmationSentAt) {
                if (
                  application.confirmationClaimedAt &&
                  Date.now() - new Date(application.confirmationClaimedAt).getTime() > 10 * 60 * 1000
                ) {
                  await db
                    .update(betaSignups)
                    .set({ confirmationClaimedAt: null })
                    .where(and(
                      eq(betaSignups.id, application.id),
                      eq(betaSignups.confirmationClaimedAt, application.confirmationClaimedAt)
                    ));
                }
                const claimedAt = new Date();
                const claim = await db
                  .update(betaSignups)
                  .set({ confirmationClaimedAt: claimedAt })
                  .where(and(
                    eq(betaSignups.id, application.id),
                    isNull(betaSignups.confirmationClaimedAt),
                    isNull(betaSignups.confirmationSentAt)
                  ));
                const claimed = Number((claim as any)[0]?.affectedRows ?? (claim as any).affectedRows ?? 0) === 1;
                if (claimed) {
                  try {
                    await sendPilotPaymentEmails({
                      name: application.name || customer.name || "KindAI customer",
                      email,
                      phone: application.phone || customer.phone || undefined,
                      tradeType: application.trade || session.metadata?.trade_type || undefined,
                      amountPaid,
                      currency,
                      stripeSessionId: session.id,
                    });
                    await db
                      .update(betaSignups)
                      .set({ confirmationSentAt: new Date() })
                      .where(and(eq(betaSignups.id, application.id), eq(betaSignups.confirmationClaimedAt, claimedAt)));
                  } catch (error) {
                    await db
                      .update(betaSignups)
                      .set({ confirmationClaimedAt: null })
                      .where(and(eq(betaSignups.id, application.id), eq(betaSignups.confirmationClaimedAt, claimedAt)));
                    throw error;
                  }
                }
              }

              console.log(`[Stripe Webhook] Paid setup activated for ${email} until ${accessExpiresAt.toISOString()}`);
              break;
            }

            await sendCheckoutConversionToMeta(session);

            const userId = session.client_reference_id
              ? parseInt(session.client_reference_id)
              : session.metadata?.user_id
              ? parseInt(session.metadata.user_id)
              : null;

            if (userId && session.subscription) {
              const db = await getDb();
              if (db) {
                // Fetch the subscription to determine the plan
                const sub = await stripe.subscriptions.retrieve(session.subscription as string) as any;
                const priceId = sub.items?.data?.[0]?.price?.id;
                const lookupKey = sub.items?.data?.[0]?.price?.lookup_key ?? "";

                let tier: "free" | "sole_trader" | "small_builder" | "mid_builder" | "enterprise" = "sole_trader";
                if (lookupKey.includes("enterprise") || priceId?.includes("enterprise")) {
                  tier = "enterprise";
                } else if (lookupKey.includes("mid_builder") || priceId?.includes("mid_builder")) {
                  tier = "mid_builder";
                } else if (lookupKey.includes("small_builder") || priceId?.includes("small_builder")) {
                  tier = "small_builder";
                } else if (lookupKey.includes("sole_trader") || priceId?.includes("sole_trader")) {
                  tier = "sole_trader";
                }

                await db
                  .update(users)
                  .set({
                    stripeCustomerId: session.customer as string,
                    stripeSubscriptionId: session.subscription as string,
                    subscriptionTier: tier,
                    subscriptionStatus: "active",
                  })
                  .where(eq(users.id, userId));

                console.log(`[Stripe Webhook] User ${userId} subscribed to ${tier}`);
              }
            }
            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            const db = await getDb();
            if (db) {
              const status = subscription.status;
              const cancelAtPeriodEnd = subscription.cancel_at_period_end;

              await db
                .update(users)
                .set({
                  subscriptionStatus: cancelAtPeriodEnd ? "cancelling" : status,
                })
                .where(eq(users.stripeCustomerId, customerId));

              console.log(`[Stripe Webhook] Subscription updated for customer ${customerId}: ${status}`);
            }
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as any;
            const customerId = subscription.customer as string;

            const db = await getDb();
            if (db) {
              await db
                .update(users)
                .set({
                  subscriptionTier: "free",
                  subscriptionStatus: "cancelled",
                  stripeSubscriptionId: null,
                })
                .where(eq(users.stripeCustomerId, customerId));

              console.log(`[Stripe Webhook] Subscription cancelled for customer ${customerId}`);
            }
            break;
          }

          case "invoice.paid": {
            const invoice = event.data.object as any;
            console.log(`[Stripe Webhook] Invoice paid: ${invoice.id} for customer ${invoice.customer}`);
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as any;
            const customerId = invoice.customer as string;

            const db = await getDb();
            if (db) {
              await db
                .update(users)
                .set({ subscriptionStatus: "past_due" })
                .where(eq(users.stripeCustomerId, customerId));

              console.log(`[Stripe Webhook] Payment failed for customer ${customerId}`);
            }
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        return res.json({ received: true });
      } catch (err: any) {
        console.error(`[Stripe Webhook] Error processing ${event.type}:`, err.message);
        return res.status(500).json({ error: "Webhook handler failed" });
      }
    }
  );
}
