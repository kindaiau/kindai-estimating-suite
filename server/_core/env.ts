type FeatureKey =
  | "auth"
  | "database"
  | "billing"
  | "storage"
  | "email"
  | "ai"
  | "frontend"
  | "analytics"
  | "adEngine"
  | "clientIntegrations";

type FeatureRequirement = {
  label: string;
  required: string[];
  optional?: string[];
  requiredOnStartup?: boolean;
};

const FEATURE_REQUIREMENTS: Record<FeatureKey, FeatureRequirement> = {
  auth: {
    label: "Authentication",
    required: ["AUTH_PROVIDER_CONFIG"],
    optional: [
      "VITE_APP_ID",
      "JWT_SECRET",
      "OAUTH_SERVER_URL",
      "OWNER_OPEN_ID",
      "VITE_OAUTH_PORTAL_URL",
      "SUPABASE_URL",
      "SUPABASE_ANON_KEY",
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_ANON_KEY",
    ],
    requiredOnStartup: true,
  },
  database: {
    label: "Database",
    required: ["DATABASE_URL"],
    requiredOnStartup: true,
  },
  billing: {
    label: "Billing",
    required: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
  },
  storage: {
    label: "Storage",
    required: ["BUILT_IN_FORGE_API_URL", "BUILT_IN_FORGE_API_KEY"],
    optional: ["VITE_FRONTEND_FORGE_API_URL", "VITE_FRONTEND_FORGE_API_KEY"],
  },
  email: {
    label: "Email & CRM",
    required: ["RESEND_API_KEY"],
    optional: [
      "BREVO_API_KEY",
      "HUBSPOT_API_KEY",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "OWNER_NOTIFICATION_EMAIL",
      "MATTHEW_NOTIFICATION_EMAIL",
    ],
  },
  ai: {
    label: "AI",
    required: ["OPENAI_API_KEY"],
  },
  frontend: {
    label: "Frontend branding",
    required: ["VITE_OAUTH_PORTAL_URL"],
    optional: ["VITE_APP_LOGO"],
  },
  analytics: {
    label: "Analytics",
    required: [],
    optional: [
      "VITE_ANALYTICS_ENDPOINT",
      "VITE_ANALYTICS_WEBSITE_ID",
      "VITE_ANALYTICS_SCRIPT_URL",
      "VITE_PLAUSIBLE_DOMAIN",
      "VITE_PLAUSIBLE_SCRIPT_URL",
      "VITE_ANALYTICS_ALLOW_EXISTING_TRACKERS",
    ],
  },
  adEngine: {
    label: "Ad Engine",
    required: [],
    optional: [
      "META_MARKETING_ACCESS_TOKEN",
      "META_AD_ACCOUNT_ID",
      "META_MARKETING_API_VERSION",
      "META_PIXEL_ID",
      "META_CONVERSIONS_API_ACCESS_TOKEN",
      "META_TEST_EVENT_CODE",
      "META_PAGE_ID",
      "WEBHOOK_SECRET",
      "FB_WEBHOOK_VERIFY_TOKEN",
    ],
  },
  clientIntegrations: {
    label: "Client-owned integrations",
    required: [],
    optional: [
      "XERO_CLIENT_ID",
      "XERO_CLIENT_SECRET",
      "SERVICEM8_API_KEY",
    ],
  },
};

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getFeatureStatus(requirement: FeatureRequirement) {
  const missingRequired = requirement.required.filter((name) => !readEnv(name));
  const configuredOptional = (requirement.optional ?? []).filter((name) =>
    Boolean(readEnv(name))
  );

  return {
    label: requirement.label,
    ready: missingRequired.length === 0,
    missingRequired,
    configuredOptional,
  };
}

function getAuthFeatureStatus() {
  const appId = readEnv("VITE_APP_ID");
  const jwtSecret = readEnv("JWT_SECRET");
  const oauthServerUrl = readEnv("OAUTH_SERVER_URL");
  const supabaseUrl = readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL");
  const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY") ?? readEnv("VITE_SUPABASE_ANON_KEY");

  const legacyAuthReady = Boolean(appId && jwtSecret && oauthServerUrl);
  const supabaseAuthReady = Boolean(supabaseUrl && supabaseAnonKey);
  const ready = legacyAuthReady || supabaseAuthReady;

  return {
    label: FEATURE_REQUIREMENTS.auth.label,
    ready,
    missingRequired: ready
      ? []
      : [
          "SUPABASE_URL|VITE_SUPABASE_URL + SUPABASE_ANON_KEY|VITE_SUPABASE_ANON_KEY",
          "or VITE_APP_ID + JWT_SECRET + OAUTH_SERVER_URL",
        ],
    configuredOptional: (FEATURE_REQUIREMENTS.auth.optional ?? []).filter((name) =>
      Boolean(readEnv(name))
    ),
  };
}

export const ENV = {
  appId: readEnv("VITE_APP_ID"),
  cookieSecret: readEnv("JWT_SECRET"),
  databaseUrl: readEnv("DATABASE_URL"),
  oAuthServerUrl: readEnv("OAUTH_SERVER_URL"),
  ownerOpenId: readEnv("OWNER_OPEN_ID"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  forgeApiUrl: readEnv("BUILT_IN_FORGE_API_URL"),
  forgeApiKey: readEnv("BUILT_IN_FORGE_API_KEY"),
  brevoApiKey: readEnv("BREVO_API_KEY"),
  resendApiKey: readEnv("RESEND_API_KEY"),
  resendFromEmail: readEnv("RESEND_FROM_EMAIL"),
  ownerNotificationEmail:
    readEnv("OWNER_NOTIFICATION_EMAIL") ?? readEnv("MATTHEW_NOTIFICATION_EMAIL"),
  matthewNotificationEmail: readEnv("MATTHEW_NOTIFICATION_EMAIL"),
  hubspotApiKey: readEnv("HUBSPOT_API_KEY"),
  openAiApiKey: readEnv("OPENAI_API_KEY"),
  openAiModel: readEnv("OPENAI_MODEL"),
  oauthPortalUrl: readEnv("VITE_OAUTH_PORTAL_URL"),
  supabaseUrl: readEnv("SUPABASE_URL") ?? readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnv("SUPABASE_ANON_KEY") ?? readEnv("VITE_SUPABASE_ANON_KEY"),
  appLogo: readEnv("VITE_APP_LOGO"),
  frontendForgeApiUrl: readEnv("VITE_FRONTEND_FORGE_API_URL"),
  frontendForgeApiKey: readEnv("VITE_FRONTEND_FORGE_API_KEY"),
  analyticsEndpoint: readEnv("VITE_ANALYTICS_ENDPOINT"),
  analyticsWebsiteId: readEnv("VITE_ANALYTICS_WEBSITE_ID"),
  analyticsScriptUrl: readEnv("VITE_ANALYTICS_SCRIPT_URL"),
  plausibleDomain: readEnv("VITE_PLAUSIBLE_DOMAIN"),
  plausibleScriptUrl: readEnv("VITE_PLAUSIBLE_SCRIPT_URL"),
  metaMarketingAccessToken: readEnv("META_MARKETING_ACCESS_TOKEN"),
  metaAdAccountId: readEnv("META_AD_ACCOUNT_ID"),
  metaMarketingApiVersion: readEnv("META_MARKETING_API_VERSION"),
  metaPixelId: readEnv("META_PIXEL_ID"),
  metaConversionsApiAccessToken: readEnv("META_CONVERSIONS_API_ACCESS_TOKEN"),
  metaTestEventCode: readEnv("META_TEST_EVENT_CODE"),
  metaPageId: readEnv("META_PAGE_ID"),
  xeroClientId: readEnv("XERO_CLIENT_ID"),
  xeroClientSecret: readEnv("XERO_CLIENT_SECRET"),
  isProduction: process.env.NODE_ENV === "production",
};

export function getEnvironmentStatus() {
  return Object.fromEntries(
    Object.entries(FEATURE_REQUIREMENTS).map(([key, requirement]) => {
      if (key === "auth") {
        return [key, getAuthFeatureStatus()];
      }
      return [key, getFeatureStatus(requirement)];
    })
  ) as Record<
    FeatureKey,
    ReturnType<typeof getFeatureStatus>
  >;
}

export function validateServerEnv() {
  const status = getEnvironmentStatus();
  const startupFailures = Object.entries(FEATURE_REQUIREMENTS)
    .filter(([, requirement]) => requirement.requiredOnStartup)
    .flatMap(([key]) =>
      status[key as FeatureKey].missingRequired.map((name) => `${key}.${name}`)
    );

  if (startupFailures.length > 0) {
    throw new Error(
      `Missing required startup environment variables: ${startupFailures.join(
        ", "
      )}`
    );
  }

  return status;
}

export function requireEnvValue(
  value: string | undefined,
  name: string
): string {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}
