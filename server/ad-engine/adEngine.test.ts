import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeMetaInsight, summarizeMetrics } from "./metrics";
import { allocateBudgets } from "./models/budgetAllocator";
import { predictPerformance } from "./models/predictPerformance";
import { buildDecisionPlan } from "./decisionEngine";
import { getMarketingBrain } from "./marketingBrain";
import { buildCampaignDraft } from "./campaignDraft";
import { MetaMarketingApiClient } from "./metaMarketingApi";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Kindai Ad Engine metrics", () => {
  it("normalizes Meta insights into ROAS, CPA, CPM and CTR", () => {
    const metric = normalizeMetaInsight({
      account_id: "act_1",
      campaign_id: "cmp_1",
      campaign_name: "Campaign",
      adset_id: "as_1",
      adset_name: "Ad set",
      date_start: "2026-05-03",
      spend: "100",
      impressions: "10000",
      clicks: "300",
      actions: [{ action_type: "lead", value: "10" }],
      purchase_roas: [{ value: "3.5" }],
    });

    expect(metric.roas).toBe(3.5);
    expect(metric.cpa).toBe(10);
    expect(metric.cpm).toBe(10);
    expect(metric.ctr).toBe(3);
  });

  it("summarizes rows for the dashboard", () => {
    const rows = [
      normalizeMetaInsight({
        campaign_id: "cmp_1",
        adset_id: "as_1",
        date_start: "2026-05-03",
        spend: 50,
        impressions: 5000,
        clicks: 100,
        actions: [{ action_type: "lead", value: 5 }],
        purchase_roas: [{ value: 2 }],
      }),
    ];

    expect(summarizeMetrics(rows)).toMatchObject({ spend: 50, conversions: 5, cpa: 10, ctr: 2 });
  });
});

describe("Kindai Ad Engine models", () => {
  const rows = [
    {
      ...normalizeMetaInsight({
        campaign_id: "cmp_1",
        adset_id: "winner",
        date_start: "2026-05-03",
        spend: 100,
        impressions: 10000,
        clicks: 400,
        actions: [{ action_type: "lead", value: 20 }],
        purchase_roas: [{ value: 4 }],
      }),
      currentBudget: 100,
      creativeScore: 90,
      placementCount: 3,
    },
    {
      ...normalizeMetaInsight({
        campaign_id: "cmp_1",
        adset_id: "needs_creative",
        date_start: "2026-05-03",
        spend: 100,
        impressions: 10000,
        clicks: 80,
        actions: [{ action_type: "lead", value: 2 }],
        purchase_roas: [{ value: 0.8 }],
      }),
      currentBudget: 100,
      creativeScore: 45,
      placementCount: 1,
    },
  ];

  it("predicts performance for each ad set", () => {
    const predictions = predictPerformance(rows);
    expect(predictions).toHaveLength(2);
    expect(predictions[0].predictedRoas).toBeGreaterThan(predictions[1].predictedRoas);
  });

  it("allocates more budget toward stronger arms", () => {
    const recommendations = allocateBudgets([
      { adSetId: "winner", currentBudget: 100, predictedRoas: 4, cpa: 5, conversions: 20 },
      { adSetId: "needs_creative", currentBudget: 100, predictedRoas: 0.8, cpa: 50, conversions: 2 },
    ]);

    expect(recommendations.find((item) => item.adSetId === "winner")?.recommendedBudget).toBeGreaterThan(100);
    expect(recommendations.find((item) => item.adSetId === "needs_creative")?.recommendedBudget).toBeLessThan(100);
  });

  it("returns monitor-mode decisions", async () => {
    const actions = await buildDecisionPlan(rows, true);
    expect(actions.every((action) => action.monitorMode)).toBe(true);
    expect(actions.map((action) => action.action)).toContain("scale");
    expect(actions.map((action) => action.action)).toContain("rotate_creative");
  });
});

describe("Kindai Ad Engine marketing brain", () => {
  it("prioritizes Kindai Estimator for Australian builders and trades", () => {
    const brain = getMarketingBrain();

    expect(brain.primaryProduct.name).toBe("Kindai Estimator");
    expect(brain.primaryProduct.url).toBe("https://kindaiestimator.com");
    expect(brain.primaryProduct.audience).toContain("Australian builders");
    expect(brain.primaryProduct.audience).toContain("Australian trades");
    expect(brain.guardrails.draftCampaignsOnly).toBe(true);
  });

  it("builds paused campaign drafts inside the testing budget", async () => {
    const draft = await buildCampaignDraft({
      product: "kindai_estimator",
      dailyBudgetAud: 30,
    });

    expect(draft.status).toBe("PAUSED");
    expect(draft.monitorMode).toBe(true);
    expect(draft.dailyBudgetAud).toBe(30);
    expect(draft.destinationUrl).toBe("https://kindaiestimator.com");
    expect(draft.metaPayloads.campaign.status).toBe("PAUSED");
    expect(draft.metaPayloads.adSets.every((adSet) => adSet.status === "PAUSED")).toBe(true);
  });

  it("publishes only paused campaign and ad-set drafts to Meta", async () => {
    const draft = await buildCampaignDraft({
      product: "kindai_estimator",
      dailyBudgetAud: 30,
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "campaign_1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "adset_1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "adset_2" }), { status: 200 }));

    const client = new MetaMarketingApiClient({
      accessToken: "test-token",
      adAccountId: "act_123",
      pixelId: "pixel_123",
    });
    const result = await client.publishPausedCampaignDraft(draft);

    expect(result.createdInMeta).toBe(true);
    expect(result.campaign).toMatchObject({ id: "campaign_1", status: "PAUSED" });
    expect(result.adSets).toHaveLength(2);
    expect(result.ads).toHaveLength(0);
    expect(result.skipped).toContainEqual({
      asset: "ad",
      reason: "META_PAGE_ID is not configured, so creatives and ads were not created",
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const call of fetchMock.mock.calls) {
      const body = call[1]?.body as URLSearchParams;
      expect(body.get("status")).toBe("PAUSED");
    }
  });

  it("creates paused creatives and ads when a Meta page id is configured", async () => {
    const draft = await buildCampaignDraft({
      product: "kindai_estimator",
      dailyBudgetAud: 30,
    });
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "campaign_1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "adset_1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "adset_2" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "creative_1" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "ad_1" }), { status: 200 }));

    const client = new MetaMarketingApiClient({
      accessToken: "test-token",
      adAccountId: "act_123",
      pixelId: "pixel_123",
      pageId: "page_123",
    });
    const result = await client.publishPausedCampaignDraft(draft);

    expect(result.createdInMeta).toBe(true);
    expect(result.adSets).toHaveLength(2);
    expect(result.ads).toHaveLength(1);
    expect(result.skipped).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    const creativeBody = fetchMock.mock.calls[3][1]?.body as URLSearchParams;
    expect(creativeBody.get("object_story_spec")).toContain("page_123");
    const adBody = fetchMock.mock.calls[4][1]?.body as URLSearchParams;
    expect(adBody.get("status")).toBe("PAUSED");
  });
});
