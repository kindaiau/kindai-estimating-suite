import { Router, raw } from "express";
import { getStripe } from "./stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendPilotPaymentEmails } from "../resendEmail";

function isPaidPilotSetupSession(session: any) {
  return (
    session.mode === "payment" &&
    session.payment_status === "paid" &&
    session.metadata?.kindai_flow === "founding_pilot_setup"
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
