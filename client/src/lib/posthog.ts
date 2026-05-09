/**
 * posthog.ts
 * PostHog analytics integration for Kindai Estimating Suite.
 *
 * Project: Kindai (kindaiestimator.com)
 * PostHog Project ID: 411354
 * Region: US Cloud (us.posthog.com)
 *
 * Tracks: pageviews, session replays, feature usage, funnel analysis,
 * bounce rate, time on page, and custom events.
 */

import posthog from "posthog-js";

const POSTHOG_KEY = "phc_vSpD5H6uatd4hpLSc5VdiMEUh4RrB5HrgDpSCL8LmAqG";
const POSTHOG_HOST = "https://us.i.posthog.com";

let initialized = false;

export function initPostHog() {
  if (initialized || typeof window === "undefined") return;
  if (!POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Session replay — records user sessions for debugging and UX analysis
    session_recording: {
      maskAllInputs: true,        // Privacy: mask all form inputs
      maskInputOptions: {
        password: true,
        email: false,             // Allow email visibility for support
      },
    },
    // Autocapture — automatically tracks clicks, form submissions, page views
    autocapture: true,
    // Capture pageviews on route changes (SPA-friendly)
    capture_pageview: false,      // We fire these manually via capturePageView()
    // Performance
    loaded: (ph) => {
      if (process.env.NODE_ENV === "development") {
        ph.debug();
      }
    },
    // Privacy
    respect_dnt: false,           // We have consent via privacy policy
    persistence: "localStorage+cookie",
  });

  initialized = true;
}

/** Fire a manual pageview (call on every route change) */
export function capturePageView(path?: string) {
  if (!initialized) return;
  posthog.capture("$pageview", {
    $current_url: path ?? window.location.href,
  });
}

/** Identify a logged-in user */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.identify(userId, properties);
}

/** Reset identity on logout */
export function resetUser() {
  if (!initialized) return;
  posthog.reset();
}

/** Track a custom event */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (!initialized) return;
  posthog.capture(event, properties);
}

// ─── Kindai-specific events ───────────────────────────────────────────────────

export const ph = {
  /** User started an AI takeoff */
  aiTakeoffStarted: (trade: string, mode: string) =>
    trackEvent("ai_takeoff_started", { trade, mode }),

  /** AI takeoff completed successfully */
  aiTakeoffCompleted: (trade: string, itemCount: number, totalValue: number, confidence: number) =>
    trackEvent("ai_takeoff_completed", { trade, item_count: itemCount, total_value: totalValue, confidence }),

  /** User edited a line item (correction to AI output) */
  lineItemEdited: (trade: string, field: string) =>
    trackEvent("line_item_edited", { trade, field }),

  /** User deleted a line item */
  lineItemDeleted: (trade: string) =>
    trackEvent("line_item_deleted", { trade }),

  /** PDF quote generated */
  quoteGenerated: (trade: string, totalValue: number) =>
    trackEvent("quote_generated", { trade, total_value: totalValue }),

  /** Quote sent to client */
  quoteSent: (trade: string) =>
    trackEvent("quote_sent", { trade }),

  /** User pushed to Xero */
  xeroSync: (success: boolean) =>
    trackEvent("xero_sync", { success }),

  /** Beta signup form submitted */
  betaSignup: (trade?: string, state?: string) =>
    trackEvent("beta_signup", { trade, state }),

  /** User clicked "Claim Pilot Spot" CTA */
  ctaClicked: (location: string) =>
    trackEvent("cta_clicked", { location }),

  /** User viewed the pricing page */
  pricingViewed: () =>
    trackEvent("pricing_viewed"),

  /** User viewed the AI Takeoff page */
  aiTakeoffPageViewed: () =>
    trackEvent("ai_takeoff_page_viewed"),

  /** New estimate created */
  estimateCreated: (trade: string) =>
    trackEvent("estimate_created", { trade }),

  /** New project created */
  projectCreated: () =>
    trackEvent("project_created"),

  /** User uploaded a plan/image for AI analysis */
  planUploaded: (trade: string) =>
    trackEvent("plan_uploaded", { trade }),

  /** User viewed the ebook guide */
  ebookViewed: () =>
    trackEvent("ebook_viewed"),

  /** User submitted ebook lead form */
  ebookLeadSubmitted: (trade?: string) =>
    trackEvent("ebook_lead_submitted", { trade }),

  /** A/B test: hero headline experiment exposure */
  heroExperimentExposed: (variant: "A" | "B", headline: string) =>
    trackEvent("hero_experiment_exposed", { variant, headline }),

  /** A/B test: hero CTA clicked with variant context */
  heroExperimentCTAClicked: (variant: "A" | "B", cta: string) =>
    trackEvent("hero_experiment_cta_clicked", { variant, cta }),

  /** Waitlist form submitted (beta full) */
  waitlistSubmitted: (trade: string) =>
    trackEvent("waitlist_submitted", { trade }),
};

export default posthog;
