import { generateAdCopy } from "./creativeCopy";
import { getMarketingBrain } from "./marketingBrain";
import type { CampaignDraft } from "./types";

type CampaignDraftInput = {
  product?: "kindai_estimator" | "kindai_leads";
  dailyBudgetAud?: number;
  audienceFocus?: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export async function buildCampaignDraft(input: CampaignDraftInput = {}): Promise<CampaignDraft> {
  const brain = getMarketingBrain();
  const product =
    input.product === "kindai_leads" ? brain.secondaryProduct : brain.primaryProduct;
  const isEstimator = input.product !== "kindai_leads";
  const dailyBudgetAud = clamp(
    input.dailyBudgetAud ?? brain.budgetRangeAud.minDaily,
    brain.budgetRangeAud.minDaily,
    brain.budgetRangeAud.maxDaily
  );
  const audienceFocus =
    input.audienceFocus ??
    (isEstimator ? "Australian builders and trades who quote manually" : product.audience.join(", "));

  const creatives = await generateAdCopy({
    productBenefits: isEstimator
      ? brain.primaryProduct.benefits.join(", ")
      : product.promise,
    audiencePainPoints: isEstimator
      ? brain.primaryProduct.painPoints.join(", ")
      : "overwhelm, unclear acquisition, too much manual follow-up",
    offer: product.name,
    tone: "direct, practical and Australian",
  });

  const audiences = isEstimator
    ? [
        {
          name: "AU Builders and Renovators",
          location: "Australia",
          ageMin: 25,
          ageMax: 60,
          interests: ["Construction", "Home improvement", "Building materials", "Renovation"],
          painPoint: "quoting takes too long and costs jobs",
        },
        {
          name: "AU Trades Quoting Manually",
          location: "Australia",
          ageMin: 25,
          ageMax: 60,
          interests: ["Tradesman", "Electrical contractor", "Plumbing", "Carpentry"],
          painPoint: "manual takeoffs and spreadsheets slow the business down",
        },
      ]
    : [
        {
          name: "Solo Founders and Service Owners",
          location: "Australia",
          ageMin: 24,
          ageMax: 55,
          interests: ["Entrepreneurship", "Small business", "Business software", "Automation"],
          painPoint: "lead generation is inconsistent and manual",
        },
      ];

  const draftStamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const campaignName = `${product.name} | ${audienceFocus} | Draft ${draftStamp}`;
  const adSets = audiences.map((audience) => ({
    name: `${campaignName} | ${audience.name}`,
    optimization_goal: "LEAD_GENERATION",
    billing_event: "IMPRESSIONS",
    daily_budget: Math.round((dailyBudgetAud / audiences.length) * 100),
    bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    targeting: {
      geo_locations: { countries: ["AU"] },
      age_min: audience.ageMin,
      age_max: audience.ageMax,
      targeting_automation: {
        advantage_audience: 0,
      },
    },
    status: "PAUSED",
  }));

  return {
    name: campaignName,
    objective: "OUTCOME_LEADS",
    status: "PAUSED",
    dailyBudgetAud,
    destinationUrl: product.url,
    audiences,
    creatives,
    prediction: {
      expectedLearningGoal: "Find which audience produces qualified leads or booked calls at the lowest CPA.",
      successThreshold: "At least one qualified lead or booked call signal inside the first 3-5 days.",
      killRule: `Do not pause until at least $${brain.guardrails.minSpendBeforePauseAud} spend and ${brain.guardrails.minClicksBeforeJudging} clicks, unless CTR is extremely weak.`,
      scaleRule: `If CPA is inside target for 2 straight days, increase budget by no more than ${brain.guardrails.maxBudgetIncreasePercentPerDay}% per day.`,
    },
    metaPayloads: {
      campaign: {
        name: campaignName,
        objective: "OUTCOME_LEADS",
        status: "PAUSED",
        special_ad_categories: [],
        is_adset_budget_sharing_enabled: false,
      },
      adSets,
      ads: creatives.map((creative, index) => ({
        name: `${product.name} Creative ${index + 1}`,
        status: "PAUSED",
        creative: {
          title: creative.headline,
          body: creative.primaryText,
          call_to_action_type: "LEARN_MORE",
          object_url: product.url,
        },
      })),
    },
    monitorMode: true,
  };
}
