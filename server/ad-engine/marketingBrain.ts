import type { MarketingBrain } from "./types";

export const kindaiMarketingBrain: MarketingBrain = {
  primaryGoal: "qualified_lead",
  budgetRangeAud: {
    minDaily: 20,
    maxDaily: 50,
  },
  approvalMode: true,
  primaryProduct: {
    name: "Kindai Estimator",
    url: "https://kindaiestimator.com",
    audience: [
      "Australian builders",
      "Australian trades",
      "cabinet makers",
      "electricians",
      "plumbers",
      "renovation businesses",
      "small construction teams",
    ],
    promise:
      "AI estimating and quoting software that helps Australian builders and trades turn plans into clearer quotes faster.",
    benefits: [
      "faster quote turnaround",
      "less manual measuring and spreadsheet work",
      "clearer materials and labour breakdowns",
      "professional quote output",
      "more consistent estimating process",
    ],
    painPoints: [
      "quoting after hours",
      "slow manual takeoffs",
      "missed items in estimates",
      "messy spreadsheets",
      "losing jobs because quotes take too long",
    ],
    conversionEvents: [
      "view_demo",
      "start_ai_takeoff",
      "submit_lead",
      "book_call",
      "qualified_lead",
    ],
  },
  secondaryProduct: {
    name: "KindAI Leads",
    url: "https://kindaileads.manus.space",
    audience: ["solo founders", "overwhelmed service business owners"],
    promise: "AI lead systems for founders who need clearer acquisition without more manual follow-up.",
  },
  guardrails: {
    maxBudgetIncreasePercentPerDay: 20,
    minSpendBeforePauseAud: 30,
    minClicksBeforeJudging: 40,
    draftCampaignsOnly: true,
    forbiddenClaims: [
      "guaranteed results",
      "guaranteed leads",
      "guaranteed revenue",
      "replace your estimator completely",
      "100% accurate",
    ],
  },
};

export function getMarketingBrain() {
  return kindaiMarketingBrain;
}
