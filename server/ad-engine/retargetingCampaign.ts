import "../_core/loadEnv";

type MetaAsset = {
  id: string;
};

type RetargetingAudience = {
  key: "website30" | "beta30";
  name: string;
  description: string;
  urlContains: string;
  retentionDays: number;
};

const AUDIENCES: RetargetingAudience[] = [
  {
    key: "website30",
    name: "Kindai Retargeting - Website Visitors 30D",
    description: "Visitors to kindaiestimator.com in the last 30 days.",
    urlContains: "kindaiestimator.com",
    retentionDays: 30,
  },
  {
    key: "beta30",
    name: "Kindai Retargeting - Beta Page Visitors 30D",
    description: "Visitors to the Kindai beta/pilot page in the last 30 days.",
    urlContains: "/beta",
    retentionDays: 30,
  },
];

function getMetaConfig() {
  const accessToken = process.env.META_MARKETING_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const pixelId = process.env.META_PIXEL_ID ?? process.env.VITE_META_PIXEL_ID;
  const apiVersion = process.env.META_MARKETING_API_VERSION ?? "v21.0";

  if (!accessToken || !adAccountId || !pixelId) {
    throw new Error("Missing META_MARKETING_ACCESS_TOKEN, META_AD_ACCOUNT_ID, or META_PIXEL_ID");
  }

  return {
    accessToken,
    pixelId,
    apiVersion,
    accountPath: adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`,
  };
}

async function postGraph(path: string, payload: Record<string, unknown>): Promise<MetaAsset> {
  const { accessToken, apiVersion } = getMetaConfig();
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${path}`);
  url.searchParams.set("access_token", accessToken);

  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(payload)) {
    body.set(key, typeof value === "string" ? value : JSON.stringify(value));
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Meta request failed at ${path}: ${response.status} ${text}`);
  }

  return JSON.parse(text) as MetaAsset;
}

async function getGraph<T>(path: string, fields: string): Promise<T[]> {
  const { accessToken, apiVersion } = getMetaConfig();
  const url = new URL(`https://graph.facebook.com/${apiVersion}/${path}`);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("fields", fields);
  url.searchParams.set("limit", "100");

  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Meta request failed at ${path}: ${response.status} ${text}`);
  }

  return ((JSON.parse(text) as { data?: T[] }).data ?? []);
}

function websiteAudienceRule(audience: RetargetingAudience) {
  const { pixelId } = getMetaConfig();

  return {
    inclusions: {
      operator: "or",
      rules: [
        {
          event_sources: [{ id: pixelId, type: "pixel" }],
          retention_seconds: audience.retentionDays * 24 * 60 * 60,
          filter: {
            operator: "and",
            filters: [
              {
                field: "url",
                operator: "i_contains",
                value: audience.urlContains,
              },
            ],
          },
        },
      ],
    },
  };
}

export async function createKindaiRetargetingCampaign() {
  const { accountPath, pixelId } = getMetaConfig();
  const createdAudiences: Array<RetargetingAudience & { id: string }> = [];
  const existingAudiences = await getGraph<{ id: string; name: string }>(
    `${accountPath}/customaudiences`,
    "id,name"
  );

  for (const audience of AUDIENCES) {
    const existing = existingAudiences.find((item) => item.name === audience.name);
    if (existing) {
      createdAudiences.push({ ...audience, id: existing.id });
    } else {
      const created = await postGraph(`${accountPath}/customaudiences`, {
        name: audience.name,
        description: audience.description,
        retention_days: String(audience.retentionDays),
        rule: websiteAudienceRule(audience),
        prefill: "1",
      });
      createdAudiences.push({ ...audience, id: created.id });
    }
  }

  const campaignName = "Kindai Pilot Retargeting | Setup + 6 Months | Draft";
  const existingCampaigns = await getGraph<{ id: string; name: string; status: string }>(
    `${accountPath}/campaigns`,
    "id,name,status"
  );
  const campaign =
    existingCampaigns.find((item) => item.name === campaignName) ??
    (await postGraph(`${accountPath}/campaigns`, {
      name: campaignName,
      objective: "OUTCOME_LEADS",
      status: "PAUSED",
      special_ad_categories: [],
      is_adset_budget_sharing_enabled: false,
    }));

  const adSets = [];
  const existingAdSets = await getGraph<{ id: string; name: string; status: string }>(
    `${accountPath}/adsets`,
    "id,name,status"
  );
  for (const audience of createdAudiences) {
    const adSetName = `Kindai Pilot Retargeting | ${audience.name}`;
    const existingAdSet = existingAdSets.find((item) => item.name === adSetName);
    const adSet = existingAdSet ?? await postGraph(`${accountPath}/adsets`, {
      name: adSetName,
      campaign_id: campaign.id,
      optimization_goal: "OFFSITE_CONVERSIONS",
      billing_event: "IMPRESSIONS",
      daily_budget: 250,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      promoted_object: {
        pixel_id: pixelId,
        custom_event_type: "LEAD",
      },
      targeting: {
        geo_locations: { countries: ["AU"] },
        age_min: 25,
        age_max: 60,
        custom_audiences: [{ id: audience.id }],
        targeting_automation: {
          advantage_audience: 0,
        },
      },
      status: "PAUSED",
    });
    adSets.push({ ...adSet, audience: audience.name });
  }

  return {
    campaign: { id: campaign.id, status: "PAUSED" },
    audiences: createdAudiences.map((audience) => ({
      id: audience.id,
      name: audience.name,
    })),
    adSets: adSets.map((adSet) => ({
      id: adSet.id,
      audience: adSet.audience,
      status: "PAUSED",
    })),
  };
}

if (process.argv[1]?.endsWith("retargetingCampaign.ts")) {
  createKindaiRetargetingCampaign()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
