import { reconcileSubscription } from "./reconcile";
import { Router, raw } from "express";
import { getStripe } from "./stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendPilotPaymentEmails } from "../resendEmail";
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

function getCheckoutEventSourceUrl(session: any) {
  if (session.metadata?.event_source_url) return session.metadata.event_source_url;
  if (session.metadata?.kindai_flow === "founding_pilot_setup") return "https://kindaibook-55hbndtb.manus.space";
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
            await sendCheckoutConversionToMeta(session);

            if (isPaidPilotSetupSession(session)) {
              const customerDetails = session.customer_details ?? {};
              await sendPilotPaymentEmails({
                name:
                  session.metadata?.customer_name ||
                  customerDetails.name ||
                  "Kindai pilot customer",
                email:
                  session.metadata?.customer_email ||
                  customerDetails.email ||
                  session.customer_email,
                phone:
                  session.metadata?.customer_phone ||
                  customerDetails.phone ||
                  undefined,
                tradeType: session.metadata?.trade_type || undefined,
                amountPaid: session.amount_total ?? 0,
                currency: session.currency ?? "aud",
                stripeSessionId: session.id,
              });
              console.log(`[Stripe Webhook] Paid pilot setup completed for ${session.customer_email ?? session.metadata?.customer_email}`);
              break;
            }

            const db = await getDb();
            if (!db) throw new Error('Database unavailable');
            await reconcileSubscription(db, stripe, event);
            break;
          }
          case "customer.subscription.updated":
          case "customer.subscription.deleted":
          case "invoice.paid":
          case "invoice.payment_failed": {
            const db = await getDb();
            if (!db) throw new Error('Database unavailable');
            await reconcileSubscription(db, stripe, event);
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
