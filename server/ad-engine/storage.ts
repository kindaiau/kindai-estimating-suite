import { getDb } from "../db";
import { adEngineNormalizedMetrics, adEngineRawInsights } from "../../drizzle/schema";
import type { UnifiedAdMetrics } from "./types";

export async function storeAdMetrics(metrics: UnifiedAdMetrics[]) {
  const db = await getDb();
  if (!db || metrics.length === 0) {
    return { stored: 0, skipped: metrics.length, reason: db ? "empty" : "database-not-configured" };
  }

  const asDate = (value: string) => new Date(`${value}T00:00:00.000Z`);

  await db.insert(adEngineRawInsights).values(
    metrics.map((metric) => ({
      source: "meta_marketing_api",
      accountId: metric.accountId,
      campaignId: metric.campaignId,
      adSetId: metric.adSetId,
      adId: metric.adId,
      metricDate: asDate(metric.date),
      payload: metric.raw,
    }))
  );

  await db.insert(adEngineNormalizedMetrics).values(
    metrics.map((metric) => ({
      accountId: metric.accountId,
      campaignId: metric.campaignId,
      campaignName: metric.campaignName,
      adSetId: metric.adSetId,
      adSetName: metric.adSetName,
      adId: metric.adId,
      adName: metric.adName,
      metricDate: asDate(metric.date),
      spend: metric.spend.toFixed(2),
      impressions: metric.impressions,
      clicks: metric.clicks,
      conversions: metric.conversions.toFixed(2),
      revenue: metric.revenue.toFixed(2),
      roas: metric.roas.toFixed(4),
      cpa: metric.cpa.toFixed(2),
      cpm: metric.cpm.toFixed(2),
      ctr: metric.ctr.toFixed(4),
    }))
  );

  return { stored: metrics.length, skipped: 0 };
}
