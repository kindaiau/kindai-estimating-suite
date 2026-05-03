type FeatureKey =
  | "auth"
  | "database"
  | "billing"
  | "storage"
  | "email"
  | "ai"
  | "frontend"
  | "analytics";

type FeatureRequirement = {
  label: string;
  required: string[];
  optional?: string[];
  requiredOnStartup?: boolean;
};

const FEATURE_REQUIREMENTS: Record<FeatureKey, FeatureRequirement> = {
  auth: {
    label: "Authentication",
    required: ["VITE_APP_ID", "JWT_SECRET", "OAUTH_SERVER_URL"],
    optional: ["OWNER_OPEN_ID", "VITE_OAUTH_PORTAL_URL"],
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
    required: ["BREVO_API_KEY"],
    optional: ["HUBSPOT_API_KEY"],
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
  hubspotApiKey: readEnv("HUBSPOT_API_KEY"),
  openAiApiKey: readEnv("OPENAI_API_KEY"),
  openAiModel: readEnv("OPENAI_MODEL"),
  oauthPortalUrl: readEnv("VITE_OAUTH_PORTAL_URL"),
  appLogo: readEnv("VITE_APP_LOGO"),
  frontendForgeApiUrl: readEnv("VITE_FRONTEND_FORGE_API_URL"),
  frontendForgeApiKey: readEnv("VITE_FRONTEND_FORGE_API_KEY"),
  analyticsEndpoint: readEnv("VITE_ANALYTICS_ENDPOINT"),
  analyticsWebsiteId: readEnv("VITE_ANALYTICS_WEBSITE_ID"),
  analyticsScriptUrl: readEnv("VITE_ANALYTICS_SCRIPT_URL"),
  plausibleDomain: readEnv("VITE_PLAUSIBLE_DOMAIN"),
  plausibleScriptUrl: readEnv("VITE_PLAUSIBLE_SCRIPT_URL"),
  xeroClientId: readEnv("XERO_CLIENT_ID"),
  xeroClientSecret: readEnv("XERO_CLIENT_SECRET"),
  gmailUser: readEnv("GMAIL_USER"),
  gmailAppPassword: readEnv("GMAIL_APP_PASSWORD"),
  isProduction: process.env.NODE_ENV === "production",
};

export function getEnvironmentStatus() {
  return Object.fromEntries(
    Object.entries(FEATURE_REQUIREMENTS).map(([key, requirement]) => [
      key,
      getFeatureStatus(requirement),
    ])
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
