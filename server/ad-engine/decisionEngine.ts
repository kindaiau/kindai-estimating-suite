import { MetaMarketingApiClient } from "./metaMarketingApi";
import { getMarketingBrain } from "./marketingBrain";
import { allocateBudgets } from "./models/budgetAllocator";
import { predictPerformance } from "./models/predictPerformance";
import type { AdSetFeatureRow, DecisionAction } from "./types";

export async function buildDecisionPlan(rows: AdSetFeatureRow[], monitorMode = true): Promise<DecisionAction[]> {
  const brain = getMarketingBrain();
  const predictions = predictPerformance(rows);
  const predictionByAdSet = new Map(predictions.map((prediction) => [prediction.adSetId, prediction]));
  const budgets = allocateBudgets(
    rows.map((row) => {
      const prediction = predictionByAdSet.get(row.adSetId);
      return {
        adSetId: row.adSetId,
        currentBudget: row.currentBudget ?? Math.max(row.spend, 20),
        predictedRoas: prediction?.predictedRoas ?? row.roas,
        cpa: row.cpa,
        conversions: row.conversions,
      };
    })
  );
  const budgetByAdSet = new Map(budgets.map((budget) => [budget.adSetId, budget]));

  return rows.map((row) => {
    const prediction = predictionByAdSet.get(row.adSetId);
    const budget = budgetByAdSet.get(row.adSetId);
    const predictedRoas = prediction?.predictedRoas ?? row.roas;
    const recommendedBudget = budget?.recommendedBudget ?? row.currentBudget ?? row.spend;
    const currentBudget = budget?.currentBudget ?? row.currentBudget ?? row.spend;

    const hasEnoughData =
      row.spend >= brain.guardrails.minSpendBeforePauseAud &&
      row.clicks >= brain.guardrails.minClicksBeforeJudging;

    if (hasEnoughData && row.conversions === 0 && row.ctr < 1) {
      return {
        adSetId: row.adSetId,
        action: "pause",
        currentBudget,
        recommendedBudget: 0,
        reason: "Enough data is in and clicks/conversions are weak. Pause before more budget leaks.",
        monitorMode,
      };
    }

    if (predictedRoas >= 2.5 && row.cpa > 0 && recommendedBudget > currentBudget) {
      const maxBudget =
        currentBudget * (1 + brain.guardrails.maxBudgetIncreasePercentPerDay / 100);
      return {
        adSetId: row.adSetId,
        action: "scale",
        currentBudget,
        recommendedBudget: Math.min(recommendedBudget, maxBudget),
        reason: `Model predicts ROAS ${predictedRoas.toFixed(2)}. Scale gradually while monitoring CPA.`,
        monitorMode,
      };
    }

    if (hasEnoughData && (row.ctr < 1.2 || predictedRoas < 1.2)) {
      return {
        adSetId: row.adSetId,
        action: "rotate_creative",
        currentBudget,
        recommendedBudget,
        reason: "Performance is below target. Refresh the creative angle before scaling.",
        monitorMode,
      };
    }

    return {
      adSetId: row.adSetId,
      action: "monitor",
      currentBudget,
      recommendedBudget,
      reason: "Performance is stable. Keep collecting data.",
      monitorMode,
    };
  });
}

export async function applyDecisionPlan(actions: DecisionAction[], monitorMode = true) {
  const client = new MetaMarketingApiClient();
  return Promise.all(
    actions
      .filter((action) => action.action === "scale" && action.recommendedBudget > 0)
      .map((action) =>
        client.updateAdSetBudget(action.adSetId, Math.round(action.recommendedBudget * 100), monitorMode)
      )
  );
}
