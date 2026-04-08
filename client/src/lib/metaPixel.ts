/**
 * Meta Pixel Event Helper — Kindai Estimating Suite
 * Pixel ID: 1223641749636127
 *
 * Standard events reference: https://developers.facebook.com/docs/meta-pixel/reference
 * All events are no-ops if fbq is not loaded (e.g. during SSR or ad-blockers).
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
  }
}

function fbq(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

// ─── Standard Events ────────────────────────────────────────────────────────

/** Fires when someone views a key content page (e.g. Pricing, Demo, Beta) */
export function pixelViewContent(params: {
  content_name: string;
  content_category?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}) {
  fbq("track", "ViewContent", {
    currency: "AUD",
    ...params,
  });
}

/** Fires when someone submits the beta sign-up form successfully */
export function pixelLead(params?: {
  content_name?: string;
  content_category?: string;
  value?: number;
}) {
  fbq("track", "Lead", {
    content_name: "Beta Sign-up",
    content_category: "Kindai Estimating Suite",
    value: 0,
    currency: "AUD",
    ...params,
  });
}

/** Fires when someone completes registration (account created / beta confirmed) */
export function pixelCompleteRegistration(params?: {
  content_name?: string;
  status?: string;
  value?: number;
}) {
  fbq("track", "CompleteRegistration", {
    content_name: "Beta Founding Member",
    status: "confirmed",
    value: 0,
    currency: "AUD",
    ...params,
  });
}

/** Fires when someone clicks a pricing plan or starts checkout */
export function pixelInitiateCheckout(params: {
  content_name: string;
  value: number;
  num_items?: number;
}) {
  fbq("track", "InitiateCheckout", {
    currency: "AUD",
    num_items: 1,
    ...params,
  });
}

/** Fires when a Stripe payment is completed successfully */
export function pixelPurchase(params: {
  value: number;
  content_name: string;
  content_ids?: string[];
}) {
  fbq("track", "Purchase", {
    currency: "AUD",
    ...params,
  });
}

/** Fires when someone starts a free trial or demo session */
export function pixelStartTrial(params?: {
  predicted_ltv?: number;
  value?: number;
}) {
  fbq("track", "StartTrial", {
    currency: "AUD",
    value: 0,
    ...params,
  });
}

/** Fires when someone submits a contact/enquiry form */
export function pixelContact() {
  fbq("track", "Contact");
}

/** Fires when someone searches within the app */
export function pixelSearch(params: { search_string: string }) {
  fbq("track", "Search", params);
}

// ─── Custom Events ───────────────────────────────────────────────────────────

/** Fires when someone runs an AI takeoff (core product action) */
export function pixelRunTakeoff(params?: {
  trade?: string;
  job_type?: string;
}) {
  fbq("trackCustom", "RunTakeoff", {
    currency: "AUD",
    ...params,
  });
}

/** Fires when someone uploads a plan for scanning */
export function pixelUploadPlan(params?: { trade?: string }) {
  fbq("trackCustom", "UploadPlan", params ?? {});
}

/** Fires when someone generates and sends a quote to a client */
export function pixelSendQuote(params?: {
  quote_value?: number;
  trade?: string;
}) {
  fbq("trackCustom", "SendQuote", {
    currency: "AUD",
    ...params,
  });
}

/** Fires when someone views the /beta page */
export function pixelViewBetaPage() {
  fbq("trackCustom", "ViewBetaPage", {
    content_name: "Beta Landing Page",
    content_category: "Acquisition",
  });
}

/** Fires when someone views the /pricing page */
export function pixelViewPricingPage() {
  pixelViewContent({
    content_name: "Pricing Page",
    content_category: "Consideration",
  });
}

/** Fires when someone views the demo page */
export function pixelViewDemoPage() {
  pixelViewContent({
    content_name: "Demo Page",
    content_category: "Consideration",
  });
}
