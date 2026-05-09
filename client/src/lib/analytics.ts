type AnalyticsPrimitive = string | number | boolean | null | undefined;
type AnalyticsProperties = Record<string, AnalyticsPrimitive>;

type UmamiWindow = Window & {
  umami?: {
    track?: (eventName: string, properties?: AnalyticsProperties) => void;
  };
  plausible?: PlausibleTracker;
};

type PlausibleTracker = {
  (eventName: string, options?: { props?: AnalyticsProperties }): void;
  q?: unknown[];
};

export type AnalyticsEventName =
  | "page_viewed"
  | "cta_clicked"
  | "pricing_viewed"
  | "pricing_plan_clicked"
  | "checkout_started"
  | "checkout_succeeded"
  | "checkout_cancelled"
  | "enterprise_contact_clicked"
  | "beta_viewed"
  | "beta_form_started"
  | "beta_signup_submitted"
  | "beta_signup_succeeded"
  | "beta_signup_failed"
  | "demo_viewed"
  | "demo_trade_selected"
  | "demo_plan_uploaded"
  | "demo_takeoff_started"
  | "demo_takeoff_succeeded"
  | "demo_takeoff_failed"
  | "ai_takeoff_viewed"
  | "ai_takeoff_trade_selected"
  | "ai_takeoff_file_uploaded"
  | "ai_takeoff_started"
  | "ai_takeoff_succeeded"
  | "ai_takeoff_failed"
  | "quote_send_clicked"
  | "quote_send_succeeded"
  | "quote_send_failed"
  | "quote_pdf_clicked"
  | "quote_pdf_succeeded"
  | "quote_pdf_failed"
  | "quote_assurance_blocked"
  | "quote_link_viewed"
  | "quote_response_submitted"
  | "support_viewed"
  | "contact_clicked";

const MANAGED_ANALYTICS_CONFIGURED = Boolean(
  import.meta.env.VITE_ANALYTICS_WEBSITE_ID &&
    (import.meta.env.VITE_ANALYTICS_ENDPOINT || import.meta.env.VITE_ANALYTICS_SCRIPT_URL)
);
const PLAUSIBLE_CONFIGURED = Boolean(import.meta.env.VITE_PLAUSIBLE_DOMAIN);
const ALLOW_EXISTING_TRACKERS = import.meta.env.VITE_ANALYTICS_ALLOW_EXISTING_TRACKERS !== "false";
const ANALYTICS_DISABLED =
  import.meta.env.VITE_ANALYTICS_DISABLED === "true" ||
  (!MANAGED_ANALYTICS_CONFIGURED && !PLAUSIBLE_CONFIGURED && !ALLOW_EXISTING_TRACKERS);
const MAX_STRING_LENGTH = 160;
const MAX_QUEUE_LENGTH = 100;
const SENSITIVE_KEY_PATTERN = /(email|phone|mobile|name|client|customer|address|token|password|secret|url|file|filename)/i;
const queue: Array<{ eventName: AnalyticsEventName; properties?: AnalyticsProperties }> = [];

function getWindow(): UmamiWindow | null {
  return typeof window === "undefined" ? null : (window as UmamiWindow);
}

function cleanString(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_STRING_LENGTH);
}

function cleanProperties(properties: AnalyticsProperties = {}): AnalyticsProperties {
  const cleaned: AnalyticsProperties = {};

  for (const [key, value] of Object.entries(properties)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) continue;
    if (value === undefined || value === null) continue;

    if (typeof value === "string") {
      const trimmed = cleanString(value);
      if (trimmed) cleaned[key] = trimmed;
      continue;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      cleaned[key] = Math.round(value * 100) / 100;
      continue;
    }

    if (typeof value === "boolean") {
      cleaned[key] = value;
    }
  }

  return cleaned;
}

function sendToUmami(eventName: AnalyticsEventName, properties?: AnalyticsProperties): boolean {
  const win = getWindow();
  const track = win?.umami?.track;
  if (typeof track !== "function") return false;

  track(eventName, properties);
  return true;
}

function sendToPlausible(eventName: AnalyticsEventName, properties?: AnalyticsProperties): boolean {
  const win = getWindow();
  const track = win?.plausible;
  if (typeof track !== "function") return false;

  track(eventName, { props: properties });
  return true;
}

function sendToTrackers(eventName: AnalyticsEventName, properties?: AnalyticsProperties): boolean {
  const cleaned = cleanProperties(properties);
  const sentToUmami = sendToUmami(eventName, cleaned);
  const sentToPlausible = sendToPlausible(eventName, cleaned);

  return sentToUmami || sentToPlausible;
}

export function flushAnalyticsQueue() {
  if (ANALYTICS_DISABLED) {
    queue.length = 0;
    return;
  }

  for (let index = 0; index < queue.length; ) {
    const event = queue[index];
    if (sendToTrackers(event.eventName, event.properties)) {
      queue.splice(index, 1);
    } else {
      index++;
      break;
    }
  }
}

export function trackEvent(eventName: AnalyticsEventName, properties?: AnalyticsProperties) {
  if (ANALYTICS_DISABLED) return;

  const cleaned = cleanProperties(properties);
  if (sendToTrackers(eventName, cleaned)) return;

  if (queue.length >= MAX_QUEUE_LENGTH) queue.shift();
  queue.push({
    eventName,
    properties: cleaned,
  });
}

export function trackCtaClick(label: string, location: string, properties?: AnalyticsProperties) {
  trackEvent("cta_clicked", {
    label,
    location,
    ...properties,
  });
}

export function getAnalyticsContext() {
  if (typeof window === "undefined") {
    return {
      path: "",
      referrer: "",
      utmSource: "",
      utmMedium: "",
      utmCampaign: "",
      utmContent: "",
      utmTerm: "",
    };
  }

  const params = new URLSearchParams(window.location.search);
  return {
    path: window.location.pathname,
    referrer: document.referrer ? new URL(document.referrer, window.location.origin).hostname : "",
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    utmContent: params.get("utm_content") ?? "",
    utmTerm: params.get("utm_term") ?? "",
  };
}
