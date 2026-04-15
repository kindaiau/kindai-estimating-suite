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

type PixelEventOptions = {
  eventId?: string;
};

function fbq(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

function trackStandardEvent(
  eventName: string,
  params?: Record<string, unknown>,
  options?: PixelEventOptions
) {
  if (options?.eventId) {
    fbq("track", eventName, params ?? {}, { eventID: options.eventId });
    return;
  }

  fbq("track", eventName, params ?? {});
}

export function generateMetaEventId(prefix: string): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  return `${prefix}_${randomPart}`;
}

export function getMetaBrowserContext() {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return {
      sourceUrl: undefined,
      fbp: undefined,
      fbc: undefined,
    };
  }

  const cookies = Object.fromEntries(
    document.cookie
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const index = entry.indexOf("=");
        if (index === -1) return [entry, ""] as const;
        return [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))] as const;
      })
  );

  return {
    sourceUrl: window.location.href,
    fbp: typeof cookies._fbp === "string" && cookies._fbp ? cookies._fbp : undefined,
    fbc: typeof cookies._fbc === "string" && cookies._fbc ? cookies._fbc : undefined,
  };
}

// ─── Standard Events ────────────────────────────────────────────────────────

/** Fires when someone views a key content page (e.g. Pricing, Demo, Beta) */
export function pixelViewContent(
  params: {
    content_name: string;
    content_category?: string;
    content_ids?: string[];
    value?: number;
    currency?: string;
  },
  options?: PixelEventOptions
) {
  trackStandardEvent(
    "ViewContent",
    {
      currency: "AUD",
      ...params,
    },
    options
  );
}

/** Fires when someone submits the beta sign-up form successfully */
export function pixelLead(
  params?: {
    content_name?: string;
    content_category?: string;
    value?: number;
  },
  options?: PixelEventOptions
) {
  trackStandardEvent(
    "Lead",
    {
      content_name: "Beta Sign-up",
      content_category: "Kindai Estimating Suite",
      value: 0,
      currency: "AUD",
      ...params,
    },
    options
  );
}

/** Fires when someone completes registration (account created / beta confirmed) */
export function pixelCompleteRegistration(
  params?: {
    content_name?: string;
    status?: string;
    value?: number;
  },
  options?: PixelEventOptions
) {
  trackStandardEvent(
    "CompleteRegistration",
    {
      content_name: "Beta Founding Member",
      status: "confirmed",
      value: 0,
      currency: "AUD",
      ...params,
    },
    options
  );
}

/** Fires when someone clicks a pricing plan or starts checkout */
export function pixelInitiateCheckout(params: {
  content_name: string;
  value: number;
  num_items?: number;
}) {
  trackStandardEvent("InitiateCheckout", {
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
  trackStandardEvent("Purchase", {
    currency: "AUD",
    ...params,
  });
}

/** Fires when someone starts a free trial or demo session */
export function pixelStartTrial(params?: {
  predicted_ltv?: number;
  value?: number;
}) {
  trackStandardEvent("StartTrial", {
    currency: "AUD",
    value: 0,
    ...params,
  });
}

/** Fires when someone submits a contact/enquiry form */
export function pixelContact() {
  trackStandardEvent("Contact");
}

/** Fires when someone searches within the app */
export function pixelSearch(params: { search_string: string }) {
  trackStandardEvent("Search", params);
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
  pixelViewContent({
    content_name: "Beta Landing Page",
    content_category: "Lead Generation",
  });

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
