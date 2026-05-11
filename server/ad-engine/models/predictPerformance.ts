import type { AdSetFeatureRow, PerformancePrediction } from "../types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const safe = (value: number | undefined, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

export function predictPerformance(rows: AdSetFeatureRow[]): PerformancePrediction[] {
  if (rows.length === 0) return [];

  const avgRoas = rows.reduce((sum, row) => sum + row.roas, 0) / rows.length || 1;
  const avgCpa = rows.reduce((sum, row) => sum + row.cpa, 0) / rows.length || 50;

  return rows.map((row) => {
    const clickQuality = clamp(row.ctr / 3, 0.45, 1.35);
    const conversionQuality = clamp((row.conversions + 1) / Math.max(row.clicks * 0.04, 1), 0.5, 1.5);
    const creativeLift = clamp(safe(row.creativeScore, 70) / 70, 0.75, 1.25);
    const placementLift = clamp(safe(row.placementCount, 2) / 2, 0.8, 1.15);
    const spendPenalty = clamp(1 - row.spend / 10000, 0.75, 1);
    const score = clickQuality * conversionQuality * creativeLift * placementLift * spendPenalty;

    return {
      adSetId: row.adSetId,
      predictedRoas: Number(clamp((row.roas || avgRoas) * score, 0, 12).toFixed(2)),
      predictedCpa: Number(clamp((row.cpa || avgCpa) / Math.max(score, 0.2), 1, 1000).toFixed(2)),
      confidence: Number(clamp((row.clicks / 200 + row.conversions / 10) / 2, 0.2, 0.92).toFixed(2)),
    };
  });
}

export function trainPerformanceModel(rows: AdSetFeatureRow[]) {
  const predictions = predictPerformance(rows);
  return {
    modelType: "heuristic-gradient-boosting-baseline",
    trainedAt: new Date().toISOString(),
    featureCount: rows.length,
    predictions,
  };
}
