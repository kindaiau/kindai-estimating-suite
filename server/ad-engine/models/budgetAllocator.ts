import type { BudgetAllocationInput, BudgetRecommendation } from "../types";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function allocateBudgets(
  inputs: BudgetAllocationInput[],
  options: { epsilon?: number; maxDailyChangePercent?: number; totalBudget?: number } = {}
): BudgetRecommendation[] {
  if (inputs.length === 0) return [];

  const epsilon = options.epsilon ?? 0.1;
  const maxChange = options.maxDailyChangePercent ?? 0.25;
  const totalBudget = options.totalBudget ?? inputs.reduce((sum, row) => sum + row.currentBudget, 0);
  const exploreBoost = 1 + epsilon / inputs.length;
  const scores = inputs.map((row) => ({
    ...row,
    score: Math.max(row.predictedRoas, 0.1) * Math.max(row.conversions + 1, 1) / Math.max(row.cpa, 1),
  }));
  const scoreTotal = scores.reduce((sum, row) => sum + row.score, 0) || 1;

  return scores.map((row) => {
    const target = (row.score / scoreTotal) * totalBudget * exploreBoost;
    const minBudget = row.currentBudget * (1 - maxChange);
    const maxBudget = row.currentBudget * (1 + maxChange);
    const recommendedBudget = Number(clamp(target, minBudget, maxBudget).toFixed(2));
    const direction = recommendedBudget > row.currentBudget ? "Scale" : recommendedBudget < row.currentBudget ? "Reduce" : "Hold";

    return {
      adSetId: row.adSetId,
      currentBudget: row.currentBudget,
      recommendedBudget,
      reason: `${direction}: score ${row.score.toFixed(2)} from predicted ROAS ${row.predictedRoas.toFixed(2)} and CPA ${row.cpa.toFixed(2)}.`,
    };
  });
}
