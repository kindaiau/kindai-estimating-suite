import type { RawMetaInsight, UnifiedAdMetrics } from "./types";

const toNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const actionValue = (raw: RawMetaInsight, actionTypes: string[]): number => {
  const match = raw.actions?.find((action) =>
    action.action_type ? actionTypes.includes(action.action_type) : false
  );
  return toNumber(match?.value);
};

const safeDivide = (numerator: number, denominator: number): number =>
  denominator > 0 ? numerator / denominator : 0;

export function normalizeMetaInsight(raw: RawMetaInsight): UnifiedAdMetrics {
  const spend = toNumber(raw.spend);
  const impressions = toNumber(raw.impressions);
  const clicks = toNumber(raw.clicks);
  const conversions =
    toNumber(raw.conversions) ||
    actionValue(raw, ["purchase", "lead", "complete_registration"]);
  const roasFromMeta = toNumber(raw.purchase_roas?.[0]?.value);
  const revenue = roasFromMeta > 0 ? roasFromMeta * spend : actionValue(raw, ["purchase_value"]);
  const roas = roasFromMeta || safeDivide(revenue, spend);
  const cpa = safeDivide(spend, conversions);
  const cpm = toNumber(raw.cpm) || safeDivide(spend * 1000, impressions);
  const ctr = toNumber(raw.ctr) || safeDivide(clicks, impressions) * 100;

  return {
    accountId: raw.account_id ?? "mock-account",
    campaignId: raw.campaign_id,
    campaignName: raw.campaign_name ?? "Unnamed campaign",
    adSetId: raw.adset_id ?? raw.campaign_id,
    adSetName: raw.adset_name ?? "Campaign level",
    adId: raw.ad_id,
    adName: raw.ad_name,
    date: raw.date_start,
    spend,
    impressions,
    clicks,
    conversions,
    revenue,
    roas,
    cpa,
    cpm,
    ctr,
    raw,
  };
}

export function summarizeMetrics(rows: UnifiedAdMetrics[]) {
  const totals = rows.reduce(
    (acc, row) => ({
      spend: acc.spend + row.spend,
      impressions: acc.impressions + row.impressions,
      clicks: acc.clicks + row.clicks,
      conversions: acc.conversions + row.conversions,
      revenue: acc.revenue + row.revenue,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0 }
  );

  return {
    ...totals,
    roas: safeDivide(totals.revenue, totals.spend),
    cpa: safeDivide(totals.spend, totals.conversions),
    cpm: safeDivide(totals.spend * 1000, totals.impressions),
    ctr: safeDivide(totals.clicks, totals.impressions) * 100,
  };
}
