import "./_core/loadEnv";
import { sendMetaConversionEvent } from "./metaCapi";

type AdPixel = {
  id: string;
  name?: string;
  last_fired_time?: string;
};

function requireMetaConfig() {
  const accessToken = process.env.META_MARKETING_ACCESS_TOKEN;
  const pixelId = process.env.META_PIXEL_ID ?? process.env.VITE_META_PIXEL_ID;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const apiVersion = process.env.META_MARKETING_API_VERSION ?? "v21.0";

  if (!accessToken || !pixelId || !adAccountId) {
    throw new Error("Missing META_MARKETING_ACCESS_TOKEN, META_PIXEL_ID, or META_AD_ACCOUNT_ID");
  }

  return {
    accessToken,
    pixelId,
    apiVersion,
    accountPath: adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`,
  };
}

async function getAdPixels(): Promise<AdPixel[]> {
  const { accessToken, accountPath, apiVersion } = requireMetaConfig();
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${accountPath}/adspixels`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", "id,name,last_fired_time");
  url.searchParams.set("limit", "50");

  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Meta pixel lookup failed (${response.status}): ${text}`);
  }

  return ((JSON.parse(text) as { data?: AdPixel[] }).data ?? []);
}

export async function runMetaDiagnostics() {
  const { pixelId } = requireMetaConfig();
  const pixels = await getAdPixels();
  const selectedPixel = pixels.find((pixel) => pixel.id === pixelId);
  const diagnosticEventId = `kindai_diagnostic_${Date.now()}`;

  const capiResult = await sendMetaConversionEvent({
    eventName: "PageView",
    eventId: diagnosticEventId,
    actionSource: "website",
    eventSourceUrl: "https://kindaiestimator.com/beta?kindai_meta_diagnostic=1",
    customData: {
      content_name: "Kindai Meta Diagnostic",
      diagnostic: true,
    },
    userData: {
      externalId: `kindai-diagnostic-${Date.now()}@kindai.local`,
      clientUserAgent: "Kindai Meta Diagnostics",
    },
  });

  return {
    configuredPixelId: pixelId,
    pixelFoundInAdAccount: Boolean(selectedPixel),
    selectedPixel,
    availablePixels: pixels.map((pixel) => ({
      id: pixel.id,
      name: pixel.name,
      lastFiredTime: pixel.last_fired_time,
    })),
    capiDiagnostic: {
      eventId: diagnosticEventId,
      sent: capiResult.sent,
      skipped: capiResult.skipped,
      body: capiResult.sent ? JSON.parse(capiResult.body) : undefined,
    },
    domainVerificationConfigured: Boolean(process.env.VITE_META_DOMAIN_VERIFICATION),
  };
}

if (process.argv[1]?.endsWith("metaDiagnostics.ts")) {
  runMetaDiagnostics()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
