import crypto from "node:crypto";

const META_GRAPH_VERSION = "v22.0";

type MetaActionSource = "website" | "system_generated";

type MetaEventInput = {
  eventName: string;
  eventId?: string;
  eventTime?: number;
  actionSource?: MetaActionSource;
  eventSourceUrl?: string;
  customData?: Record<string, unknown>;
  userData?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    externalId?: string;
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
};

function readMetaConfig() {
  const pixelId = process.env.META_PIXEL_ID?.trim() || process.env.VITE_META_PIXEL_ID?.trim();
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();
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

function hashIfPresent(value?: string): string[] | undefined {
  return value ? [sha256(value)] : undefined;
}

function buildUserData(input: MetaEventInput["userData"] = {}) {
  const userData: Record<string, unknown> = {};

  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const firstName = normalizeName(input.firstName);
  const lastName = normalizeName(input.lastName);
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

function splitName(name?: string) {
  const cleaned = name?.trim();
  if (!cleaned) return { firstName: undefined, lastName: undefined };

  const [firstName, ...rest] = cleaned.split(/\s+/);
  return {
    firstName,
    lastName: rest.length > 0 ? rest.join(" ") : undefined,
  };
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

export async function sendMetaConversionEvent(input: MetaEventInput) {
  const { pixelId, accessToken, testEventCode } = readMetaConfig();
  if (!pixelId || !accessToken) {
    return {
      sent: false,
      skipped: true,
      reason: "missing_meta_capi_config",
    } as const;
  }

  const url = new URL(`https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events`);
  url.searchParams.set("access_token", accessToken);

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: input.eventName,
        event_time: input.eventTime ?? Math.floor(Date.now() / 1000),
        event_id: input.eventId,
        action_source: input.actionSource ?? "website",
        event_source_url: input.eventSourceUrl,
        user_data: buildUserData(input.userData),
        custom_data: input.customData ?? {},
      },
    ],
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
    body,
  } as const;
}

export function buildMetaUserData(input: {
  email?: string;
  name?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbp?: string;
  fbc?: string;
}) {
  const { firstName, lastName } = splitName(input.name);

  return {
    email: input.email,
    firstName,
    lastName,
    externalId: input.email,
    clientIpAddress: input.clientIpAddress,
    clientUserAgent: input.clientUserAgent,
    fbp: input.fbp,
    fbc: input.fbc,
  };
}
