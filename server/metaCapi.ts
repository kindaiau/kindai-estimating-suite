import crypto from "node:crypto";
import type { Request } from "express";

const META_GRAPH_VERSION = "v19.0";
const DEFAULT_EVENT_SOURCE_URL = "https://kindaiestimator.com/";

type MetaActionSource = "website" | "system_generated";

type MetaUserDataInput = {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
};

type MetaEventInput = {
  eventName: "Lead" | "Purchase" | "StartTrial" | "CompleteRegistration" | string;
  eventId?: string;
  eventTime?: number;
  actionSource?: MetaActionSource;
  eventSourceUrl?: string;
  customData?: Record<string, unknown>;
  userData?: MetaUserDataInput;
};

export type MetaConversionResult =
  | {
      sent: true;
      skipped: false;
      eventId: string;
      body: string;
    }
  | {
      sent: false;
      skipped: true;
      eventId: string;
      reason: "missing_meta_capi_config";
    };

function readMetaConfig() {
  const pixelId =
    process.env.FB_PIXEL_ID?.trim() ||
    process.env.META_PIXEL_ID?.trim() ||
    process.env.VITE_META_PIXEL_ID?.trim();
  const accessToken =
    process.env.FB_ACCESS_TOKEN?.trim() ||
    process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();
  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();

  return {
    pixelId: pixelId || undefined,
    accessToken: accessToken || undefined,
    testEventCode: testEventCode || undefined,
  };
}

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeEmail(value?: string): string | undefined {
  const normalized = value?.trim().toLowerCase();
  return normalized || undefined;
}

function normalizePhone(value?: string): string | undefined {
  const normalized = value?.replace(/\D+/g, "");
  return normalized || undefined;
}

function normalizeName(value?: string): string | undefined {
  const normalized = value
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

  return normalized || undefined;
}

function normalizeUrl(value?: string): string | undefined {
  const normalized = value?.trim();
  if (!normalized) return undefined;

  try {
    const url = new URL(normalized);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    return undefined;
  }

  return undefined;
}

function hashIfPresent(value?: string): string[] | undefined {
  return value ? [sha256(value)] : undefined;
}

function splitName(name?: string) {
  const cleaned = name?.trim();
  if (!cleaned) return { firstName: undefined, lastName: undefined };

  const [firstName, ...rest] = cleaned.split(/\s+/);
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : undefined,
  };
}

function buildUserData(input: MetaUserDataInput = {}) {
  const nameParts = splitName(input.name);
  const userData: Record<string, unknown> = {};

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const firstName = normalizeName(input.firstName ?? nameParts.firstName);
  const lastName = normalizeName(input.lastName ?? nameParts.lastName);
  const externalId = normalizeEmail(input.externalId ?? input.email);

  const hashedEmail = hashIfPresent(email);
  const hashedPhone = hashIfPresent(phone);
  const hashedFirstName = hashIfPresent(firstName);
  const hashedLastName = hashIfPresent(lastName);
  const hashedExternalId = hashIfPresent(externalId);

  if (hashedEmail) userData.em = hashedEmail;
  if (hashedPhone) userData.ph = hashedPhone;
  if (hashedFirstName) userData.fn = hashedFirstName;
  if (hashedLastName) userData.ln = hashedLastName;
  if (hashedExternalId) userData.external_id = hashedExternalId;
  if (input.clientIpAddress) userData.client_ip_address = input.clientIpAddress;
  if (input.clientUserAgent) userData.client_user_agent = input.clientUserAgent;
  if (input.fbp) userData.fbp = input.fbp;
  if (input.fbc) userData.fbc = input.fbc;

  return userData;
}

function sanitizeForEventId(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "");
}

export function createMetaEventId(prefix: string, stableId?: string | number | null) {
  const safePrefix = sanitizeForEventId(prefix) || "kindai_capi";
  const safeStableId = stableId === undefined || stableId === null ? undefined : sanitizeForEventId(String(stableId));
  const suffix = crypto.randomBytes(6).toString("hex");
  return [safePrefix, safeStableId, Math.floor(Date.now() / 1000), suffix].filter(Boolean).join("_");
}

export function extractMetaClickIdentifiers(cookieHeader?: string) {
  const pairs = (cookieHeader ?? "")
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const index = entry.indexOf("=");
      if (index === -1) return [entry, ""] as const;
      return [entry.slice(0, index), decodeURIComponent(entry.slice(index + 1))] as const;
    });

  const cookies = Object.fromEntries(pairs);

  return {
    fbp: typeof cookies._fbp === "string" && cookies._fbp ? cookies._fbp : undefined,
    fbc: typeof cookies._fbc === "string" && cookies._fbc ? cookies._fbc : undefined,
  };
}

export function getRequestMetaContext(req: Request, explicit?: { fbp?: string; fbc?: string }) {
  const cookieIds = extractMetaClickIdentifiers(req.headers.cookie);
  const clientIpAddress =
    (req.headers["x-forwarded-for"] as string | undefined)
      ?.split(",")
      .map((value) => value.trim())
      .find(Boolean) ?? req.socket.remoteAddress ?? undefined;

  return {
    clientIpAddress,
    clientUserAgent: req.headers["user-agent"] ?? undefined,
    fbp: explicit?.fbp ?? cookieIds.fbp,
    fbc: explicit?.fbc ?? cookieIds.fbc,
  };
}

export function buildMetaUserData(input: MetaUserDataInput) {
  const { firstName, lastName } = splitName(input.name);

  return {
    email: input.email,
    phone: input.phone,
    firstName: input.firstName ?? firstName,
    lastName: input.lastName ?? lastName,
    externalId: input.externalId ?? input.email,
    clientIpAddress: input.clientIpAddress,
    clientUserAgent: input.clientUserAgent,
    fbp: input.fbp,
    fbc: input.fbc,
  };
}

export function buildMetaEventPayload(input: MetaEventInput, eventId: string) {
  return {
    event_name: input.eventName,
    event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: input.actionSource ?? "website",
    event_source_url: normalizeUrl(input.eventSourceUrl) ?? DEFAULT_EVENT_SOURCE_URL,
    user_data: buildUserData(input.userData),
    custom_data: input.customData ?? {},
  };
}

export async function sendMetaConversionEvent(input: MetaEventInput): Promise<MetaConversionResult> {
  const { pixelId, accessToken, testEventCode } = readMetaConfig();
  const eventId = input.eventId || createMetaEventId(`kindai_${input.eventName}`);

  if (!pixelId || !accessToken) {
    return {
      sent: false,
      skipped: true,
      eventId,
      reason: "missing_meta_capi_config",
    } as const;
  }

  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`);
  url.searchParams.set("access_token", accessToken);

  const payload: Record<string, unknown> = {
    data: [buildMetaEventPayload(input, eventId)],
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.text();

  if (!response.ok) {
    throw new Error(`Meta CAPI request failed (${response.status}): ${body}`);
  }

  return {
    sent: true,
    skipped: false,
    eventId,
    body,
  } as const;
}

export async function sendMetaConversionEventSafely(input: MetaEventInput, logLabel: string) {
  try {
    const result = await sendMetaConversionEvent(input);
    if (result.skipped) {
      console.warn(`[Meta CAPI] Skipped ${input.eventName} event (${result.eventId}): ${result.reason}`);
    } else {
      console.log(`[Meta CAPI] Sent ${input.eventName} event (${result.eventId}) for ${logLabel}`);
    }
    return result;
  } catch (err: unknown) {
    console.error(
      `[Meta CAPI] Failed to send ${input.eventName} event for ${logLabel}:`,
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}

export function buildLeadEvent(input: {
  email: string;
  name?: string;
  phone?: string;
  eventId?: string;
  eventSourceUrl?: string;
  source?: string;
  trade?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
  customData?: Record<string, unknown>;
}): MetaEventInput {
  return {
    eventName: "Lead",
    eventId: input.eventId,
    actionSource: "website",
    eventSourceUrl: input.eventSourceUrl,
    customData: {
      currency: "AUD",
      value: 0,
      content_name: "Kindai Lead Magnet",
      content_category: "Lead Generation",
      source: input.source,
      trade: input.trade,
      ...input.customData,
    },
    userData: buildMetaUserData({
      email: input.email,
      name: input.name,
      phone: input.phone,
      clientIpAddress: input.clientIpAddress,
      clientUserAgent: input.clientUserAgent,
      fbp: input.fbp,
      fbc: input.fbc,
    }),
  };
}

export function buildPurchaseOrTrialEvent(input: {
  email?: string;
  name?: string;
  phone?: string;
  eventName?: "Purchase" | "StartTrial";
  eventId: string;
  eventSourceUrl?: string;
  amountTotal?: number | null;
  currency?: string | null;
  stripeSessionId?: string;
  stripeCustomerId?: string;
  planId?: string;
  flow?: string;
}): MetaEventInput {
  const amountInMajorUnits = typeof input.amountTotal === "number" ? input.amountTotal / 100 : undefined;
  const currency = (input.currency ?? "aud").toUpperCase();

  return {
    eventName: input.eventName ?? "Purchase",
    eventId: input.eventId,
    actionSource: "website",
    eventSourceUrl: input.eventSourceUrl ?? DEFAULT_EVENT_SOURCE_URL,
    customData: {
      currency,
      value: amountInMajorUnits,
      content_name: input.eventName === "StartTrial" ? "Kindai Trial Started" : "Kindai Trial Payment",
      content_category: "Kindai Estimating Suite",
      stripe_session_id: input.stripeSessionId,
      stripe_customer_id: input.stripeCustomerId,
      plan_id: input.planId,
      flow: input.flow,
    },
    userData: buildMetaUserData({
      email: input.email,
      name: input.name,
      phone: input.phone,
    }),
  };
}
