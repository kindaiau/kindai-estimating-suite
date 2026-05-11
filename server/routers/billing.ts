import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { requireDatabase } from "../_core/errors";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { PILOT_SETUP_OFFER, PLANS, getPlanById, getPlanCheckoutAmount } from "../stripe/products";
import {
  findOrCreateCustomer,
  createCheckoutSession,
  createPilotSetupCheckoutSession,
  createPortalSession,
  getStripe,
} from "../stripe/stripe";

export const billingRouter = router({
  /** Get all available plans */
  getPlans: publicProcedure.query(() => {
    return PLANS.map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      priceMonthly: p.priceMonthly,
      priceYearly: p.priceYearly,
      features: p.features,
      limits: p.limits,
      popular: p.popular ?? false,
      contactSales: p.contactSales ?? false,
      targetAudience: p.targetAudience,
      annualSavings: p.annualSavings,
    }));
  }),

  /** Get current user's subscription status */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const rawDb = await getDb();
    if (!rawDb) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }
    const db = rawDb;

    const [user] = await db
      .select({
        tier: users.subscriptionTier,
        status: users.subscriptionStatus,
        stripeCustomerId: users.stripeCustomerId,
        stripeSubscriptionId: users.stripeSubscriptionId,
      })
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // If there's an active subscription, fetch latest status from Stripe
    let currentPeriodEnd: number | null = null;
    let cancelAtPeriodEnd = false;

    if (user.stripeSubscriptionId) {
      try {
        const stripe = getStripe();
        const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId) as any;
        currentPeriodEnd = sub.current_period_end ?? null;
        cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
      } catch {
        // Subscription may have been deleted
      }
    }

    const plan = getPlanById(user.tier ?? "free");

    return {
      tier: user.tier ?? "free",
      status: user.status ?? "none",
      planName: plan?.name ?? "Starter",
      limits: plan?.limits,
      currentPeriodEnd,
      cancelAtPeriodEnd,
    };
  }),

  /** Create a Stripe Checkout Session for a subscription */
  createCheckout: protectedProcedure
    .input(
      z.object({
        planId: z.enum(["sole_trader", "small_builder", "mid_builder", "enterprise"]),
        interval: z.enum(["monthly", "yearly"]).default("monthly"),
        origin: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      // Get user's current Stripe customer ID
      const [user] = await db
        .select({
          stripeCustomerId: users.stripeCustomerId,
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      // Find or create Stripe customer
      const customerId = await findOrCreateCustomer({
        email: user.email ?? ctx.user.email ?? "",
        name: user.name ?? ctx.user.name ?? undefined,
        userId: ctx.user.id,
        existingCustomerId: user.stripeCustomerId,
      });

      // Save customer ID if new
      if (!user.stripeCustomerId) {
        await db
          .update(users)
          .set({ stripeCustomerId: customerId })
          .where(eq(users.id, ctx.user.id));
      }

      // Create the price in Stripe on-the-fly (or use existing)
      const stripe = getStripe();
      const plan = getPlanById(input.planId);
      if (!plan) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid plan" });
      if (plan.contactSales || plan.priceMonthly <= 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This plan is handled by the Kindai team. Please contact us to scope the right solution.",
        });
      }

      const priceAmount = getPlanCheckoutAmount(plan, input.interval);

      // Search for existing price or create one
      const prices = await stripe.prices.list({
        lookup_keys: [`kindai_${input.planId}_${input.interval}`],
        active: true,
        limit: 1,
      });

      let priceId: string;

      if (prices.data.length > 0) {
        priceId = prices.data[0].id;
      } else {
        // Create product and price
        const product = await stripe.products.create({
          name: `Kindai ${plan.name} (${input.interval})`,
          description: plan.description,
          metadata: { planId: input.planId },
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: priceAmount,
          currency: "aud",
          recurring: {
            interval: input.interval === "yearly" ? "year" : "month",
          },
          lookup_key: `kindai_${input.planId}_${input.interval}`,
        });

        priceId = price.id;
      }

      // Create checkout session
      const checkoutUrl = await createCheckoutSession({
        customerId,
        priceId,
        userId: ctx.user.id,
        userEmail: user.email ?? ctx.user.email ?? "",
        userName: user.name ?? ctx.user.name ?? undefined,
        origin: input.origin,
      });

      return { url: checkoutUrl };
    }),

  /** Create a one-time Stripe Checkout Session for the founding pilot setup sprint */
  createPilotSetupCheckout: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        tradeType: z.string().optional(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      const checkoutUrl = await createPilotSetupCheckoutSession({
        name: input.name,
        email: input.email,
        phone: input.phone,
        tradeType: input.tradeType,
        origin: input.origin,
        amount: PILOT_SETUP_OFFER.amount,
        currency: PILOT_SETUP_OFFER.currency,
        productName: PILOT_SETUP_OFFER.name,
        productDescription: PILOT_SETUP_OFFER.description,
      });

      return { url: checkoutUrl };
    }),

  /** Create a Stripe Customer Portal session */
  createPortal: protectedProcedure
    .input(z.object({ origin: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = requireDatabase(await getDb());

      const [user] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user?.stripeCustomerId) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No billing account found. Please subscribe to a plan first.",
        });
      }

      const url = await createPortalSession({
        customerId: user.stripeCustomerId,
        origin: input.origin,
      });

      return { url };
    }),
});
