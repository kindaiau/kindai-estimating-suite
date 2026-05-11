import { normalizeMetaInsight, summarizeMetrics } from "./metrics";
import { MetaMarketingApiClient } from "./metaMarketingApi";
import { storeAdMetrics } from "./storage";

export async function ingestDailyMetaMetrics(date = new Date().toISOString().slice(0, 10)) {
  const client = new MetaMarketingApiClient();
  const rawInsights = await client.getDailyInsights(date);
  const metrics = rawInsights.map(normalizeMetaInsight);
  const storage = await storeAdMetrics(metrics);

  return {
    date,
    source: client.isConfigured() ? "meta" : "mock",
    rows: metrics,
    summary: summarizeMetrics(metrics),
    storage,
  };
}
