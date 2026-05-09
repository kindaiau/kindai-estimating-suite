import type { CampaignDraft, MetaDraftPublishResult, RawMetaInsight } from "./types";

type MetaClientConfig = {
  accessToken?: string;
  adAccountId?: string;
  apiVersion?: string;
  pixelId?: string;
  pageId?: string;
};

const defaultMockInsights: RawMetaInsight[] = [
  {
    account_id: "act_mock",
    campaign_id: "cmp_kindai_founders",
    campaign_name: "Kindai Founder Systems",
    adset_id: "as_trade_founders",
    adset_name: "Trade founders AU",
    date_start: new Date().toISOString().slice(0, 10),
    spend: 84,
    impressions: 12600,
    clicks: 412,
    actions: [{ action_type: "lead", value: 18 }],
    purchase_roas: [{ value: 3.4 }],
  },
  {
    account_id: "act_mock",
    campaign_id: "cmp_kindai_founders",
    campaign_name: "Kindai Founder Systems",
    adset_id: "as_solo_builders",
    adset_name: "Solo builders AU",
    date_start: new Date().toISOString().slice(0, 10),
    spend: 62,
    impressions: 9800,
    clicks: 226,
    actions: [{ action_type: "lead", value: 7 }],
    purchase_roas: [{ value: 1.6 }],
  },
];

export class MetaMarketingApiClient {
  private readonly accessToken?: string;
  private readonly adAccountId?: string;
  private readonly apiVersion: string;
  private readonly pixelId?: string;
  private readonly pageId?: string;

  constructor(config: MetaClientConfig = {}) {
    this.accessToken = config.accessToken ?? process.env.META_MARKETING_ACCESS_TOKEN;
    this.adAccountId = config.adAccountId ?? process.env.META_AD_ACCOUNT_ID;
    this.apiVersion = config.apiVersion ?? process.env.META_MARKETING_API_VERSION ?? "v21.0";
    this.pixelId = config.pixelId ?? process.env.META_PIXEL_ID ?? process.env.VITE_META_PIXEL_ID;
    this.pageId = config.pageId ?? process.env.META_PAGE_ID;
  }

  isConfigured() {
    return Boolean(this.accessToken && this.adAccountId);
  }

  async getDailyInsights(date = new Date().toISOString().slice(0, 10)): Promise<RawMetaInsight[]> {
    if (!this.isConfigured()) {
      return defaultMockInsights.map((insight) => ({ ...insight, date_start: date }));
    }

    const account = this.adAccountId?.startsWith("act_")
      ? this.adAccountId
      : `act_${this.adAccountId}`;
    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${account}/insights`);
    url.searchParams.set("access_token", this.accessToken as string);
    url.searchParams.set("level", "adset");
    url.searchParams.set("time_increment", "1");
    url.searchParams.set("time_range", JSON.stringify({ since: date, until: date }));
    url.searchParams.set(
      "fields",
      [
        "account_id",
        "campaign_id",
        "campaign_name",
        "adset_id",
        "adset_name",
        "ad_id",
        "ad_name",
        "date_start",
        "date_stop",
        "spend",
        "impressions",
        "clicks",
        "actions",
        "purchase_roas",
        "cpm",
        "ctr",
      ].join(",")
    );

    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta Marketing API failed: ${response.status} ${errorText}`);
    }

    const payload = (await response.json()) as { data?: RawMetaInsight[] };
    return payload.data ?? [];
  }

  async updateAdSetBudget(adSetId: string, dailyBudgetCents: number, monitorMode = true) {
    if (monitorMode || !this.isConfigured()) {
      return {
        adSetId,
        dailyBudgetCents,
        monitorMode: true,
        applied: false,
      };
    }

    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${adSetId}`);
    url.searchParams.set("access_token", this.accessToken as string);
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ daily_budget: dailyBudgetCents }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Meta budget update failed: ${response.status} ${errorText}`);
    }

    return {
      adSetId,
      dailyBudgetCents,
      monitorMode: false,
      applied: true,
      response: await response.json(),
    };
  }

  private accountPath() {
    if (!this.adAccountId) return undefined;
    return this.adAccountId.startsWith("act_") ? this.adAccountId : `act_${this.adAccountId}`;
  }

  private async postGraph(path: string, payload: Record<string, unknown>) {
    if (!this.accessToken) {
      throw new Error("META_MARKETING_ACCESS_TOKEN is not configured");
    }

    const url = new URL(`https://graph.facebook.com/${this.apiVersion}/${path}`);
    url.searchParams.set("access_token", this.accessToken);
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
      throw new Error(`Meta draft publish failed at ${path}: ${response.status} ${text}`);
    }

    return JSON.parse(text) as { id: string };
  }

  async publishPausedCampaignDraft(draft: CampaignDraft): Promise<MetaDraftPublishResult> {
    if (!this.isConfigured()) {
      return {
        createdInMeta: false,
        adSets: [],
        ads: [],
        skipped: [{ asset: "campaign", reason: "Meta Marketing API is not configured" }],
        approvalMode: true,
      };
    }

    const account = this.accountPath();
    if (!account) {
      throw new Error("META_AD_ACCOUNT_ID is not configured");
    }

    const campaign = await this.postGraph(`${account}/campaigns`, {
      ...draft.metaPayloads.campaign,
      status: "PAUSED",
    });

    const adSets: MetaDraftPublishResult["adSets"] = [];
    const skipped: MetaDraftPublishResult["skipped"] = [];

    if (!this.pixelId) {
      skipped.push({
        asset: "ad_set",
        reason: "META_PIXEL_ID is required to create lead-optimized website ad sets",
      });
    } else {
      for (const adSetPayload of draft.metaPayloads.adSets) {
        const adSet = await this.postGraph(`${account}/adsets`, {
          ...adSetPayload,
          campaign_id: campaign.id,
          optimization_goal: "OFFSITE_CONVERSIONS",
          promoted_object: {
            pixel_id: this.pixelId,
            custom_event_type: "LEAD",
          },
          status: "PAUSED",
        });
        adSets.push({
          id: adSet.id,
          name: String(adSetPayload.name),
          status: "PAUSED",
        });
      }
    }

    const ads: MetaDraftPublishResult["ads"] = [];

    if (!this.pageId) {
      skipped.push({
        asset: "ad",
        reason: "META_PAGE_ID is not configured, so creatives and ads were not created",
      });
    } else if (adSets.length === 0) {
      skipped.push({
        asset: "ad",
        reason: "No ad sets were created, so creatives and ads were skipped",
      });
    } else {
      for (let index = 0; index < draft.metaPayloads.ads.length; index += 1) {
        const adPayload = draft.metaPayloads.ads[index];
        const creativePayload = adPayload.creative as {
          title?: string;
          body?: string;
          call_to_action_type?: string;
          object_url?: string;
        };
        const creative = await this.postGraph(`${account}/adcreatives`, {
          name: `${adPayload.name} Creative`,
          object_story_spec: {
            page_id: this.pageId,
            link_data: {
              link: creativePayload.object_url,
              message: creativePayload.body,
              name: creativePayload.title,
              call_to_action: {
                type: creativePayload.call_to_action_type ?? "LEARN_MORE",
                value: {
                  link: creativePayload.object_url,
                },
              },
            },
          },
        });
        const adSet = adSets[index % adSets.length];
        const ad = await this.postGraph(`${account}/ads`, {
          name: adPayload.name,
          adset_id: adSet.id,
          creative: { creative_id: creative.id },
          status: "PAUSED",
        });
        ads.push({
          id: ad.id,
          name: String(adPayload.name),
          status: "PAUSED",
        });
      }
    }

    return {
      createdInMeta: true,
      campaign: {
        id: campaign.id,
        name: draft.name,
        status: "PAUSED",
      },
      adSets,
      ads,
      skipped,
      approvalMode: true,
    };
  }
}
