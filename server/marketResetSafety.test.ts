import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function read(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("controlled market reset safety gates", () => {
  const journal = read("../drizzle/meta/_journal.json");
  const migration = read("../drizzle/0020_fuzzy_whistler.sql");
  const schema = read("../drizzle/schema.ts");
  const publicPricing = read("../client/public/pricing.md");
  const structuredData = read("../client/src/components/StructuredData.tsx");
  const pricingPage = read("../client/src/pages/Pricing.tsx");
  const app = read("../client/src/App.tsx");
  const estimates = read("./routers/estimates.ts");
  const billing = read("./routers/billing.ts");
  const stripe = read("./stripe/stripe.ts");
  const webhook = read("./stripe/webhook.ts");
  const entitlements = read("./aiEntitlements.ts");
  const waitlist = read("./routers/waitlist.ts");

  it("registers the paid setup migration with all required controls", () => {
    expect(journal).toContain('"tag": "0020_fuzzy_whistler"');
    for (const field of [
      "pilotPaymentStatus",
      "stripeCheckoutSessionId",
      "accessExpiresAt",
      "confirmationClaimedAt",
      "confirmationSentAt",
      "quotaSlot",
    ]) {
      expect(migration).toContain(field);
      expect(schema).toContain(field);
    }
    expect(migration).toContain("ai_usage_user_period_slot_unique");
    expect(migration).toContain("beta_signups_stripeCheckoutSessionId_unique");
  });

  it("publishes one internally consistent founding setup price", () => {
    expect(publicPricing).toContain("Price excluding GST: A$2,500");
    expect(publicPricing).toContain("GST: A$250");
    expect(publicPricing).toContain("Total payment: A$2,750");
    expect(publicPricing).not.toContain("A$1,100");
    expect(structuredData).toContain('"price": "2750"');
    expect(structuredData).not.toContain('"name": "Pro"');
    expect(pricingPage).not.toContain('name: "Pro"');
  });

  it("keeps private workspace and model routes behind paid access", () => {
    const paidRouters = [
      "./routers/ai.ts",
      "./routers/projects.ts",
      "./routers/estimates.ts",
      "./routers/estimateAgent.ts",
      "./routers/emailFollowup.ts",
      "./routers/companyMemory.ts",
      "./routers/corrections.ts",
      "./routers/labour.ts",
      "./routers/materials.ts",
      "./routers/quoteTokens.ts",
      "./routers/saas.ts",
      "./routers/suppliers.ts",
      "./routers/swms.ts",
      "./routers/team.ts",
      "./routers/tradeProfiles.ts",
      "./routers/variations.ts",
      "./routers/voice.ts",
      "./routers/xero.ts",
    ];
    for (const routerPath of paidRouters) {
      const source = read(routerPath);
      expect(source, routerPath).toContain("paidProcedure");
      expect(source, routerPath).not.toContain("protectedProcedure");
    }
  });

  it("allocates finite plan-reading quotas through unique monthly slots", () => {
    expect(schema).toContain("ai_usage_user_period_slot_unique");
    expect(entitlements).toContain("for (let slot = 1; slot <= limit; slot += 1)");
    expect(entitlements).toContain("Another request owns this monthly slot");
    expect(entitlements).not.toContain("count()");
  });

  it("reuses one approved Stripe session and atomically claims payment state", () => {
    expect(stripe).toContain("existingSessionId");
    expect(stripe).toContain("idempotencyKey:");
    expect(stripe).toContain("application_id");
    expect(billing).toContain("stripeCheckoutSessionId: checkout.id");
    expect(billing).toContain('subscriptionStatus !== "pilot_active"');
    expect(webhook).toContain('eq(betaSignups.paymentStatus, "unpaid")');
    expect(webhook).toContain("confirmationClaimedAt");
    expect(webhook).toContain("confirmationSentAt");
  });

  it("does not send private estimating data to Meta or load the Meta pixel", () => {
    expect(app).not.toContain("MetaPixel");
    expect(estimates).not.toContain("sendMetaConversionEvent");
    expect(estimates).not.toContain('eventName: "Purchase"');
    expect(estimates).not.toContain("New Estimate:");
  });

  it("keeps legacy lead capture closed", () => {
    expect(waitlist).toContain("The legacy waitlist is closed");
    expect(waitlist).not.toContain("sendMetaConversionEvent");
    expect(waitlist).not.toContain("Download the Free Guide");
  });
});
