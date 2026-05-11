export type AdEntityLevel = "campaign" | "adset" | "ad";

export type RawMetaInsight = {
  account_id?: string;
  campaign_id: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  date_start: string;
  date_stop?: string;
  spend?: string | number;
  impressions?: string | number;
  clicks?: string | number;
  conversions?: string | number;
  purchase_roas?: Array<{ value?: string | number }>;
  actions?: Array<{ action_type?: string; value?: string | number }>;
  cpm?: string | number;
  ctr?: string | number;
};

export type UnifiedAdMetrics = {
  accountId: string;
  campaignId: string;
  campaignName: string;
  adSetId: string;
  adSetName: string;
  adId?: string;
  adName?: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roas: number;
  cpa: number;
  cpm: number;
  ctr: number;
  raw: RawMetaInsight;
};

export type AdSetFeatureRow = UnifiedAdMetrics & {
  audienceSize?: number;
  placementCount?: number;
  creativeScore?: number;
  currentBudget?: number;
};

export type PerformancePrediction = {
  adSetId: string;
  predictedRoas: number;
  predictedCpa: number;
  confidence: number;
};

export type BudgetAllocationInput = {
  adSetId: string;
  currentBudget: number;
  predictedRoas: number;
  cpa: number;
  conversions: number;
};

export type BudgetRecommendation = {
  adSetId: string;
  currentBudget: number;
  recommendedBudget: number;
  reason: string;
};

export type DecisionAction = {
  adSetId: string;
  action: "pause" | "scale" | "rotate_creative" | "monitor";
  currentBudget: number;
  recommendedBudget: number;
  reason: string;
  monitorMode: boolean;
};

export type GeneratedCopy = {
  headline: string;
  primaryText: string;
  cta: string;
  scores: {
    clarity: number;
    emotionalPull: number;
    ctaStrength: number;
    overall: number;
  };
};

export type MarketingBrain = {
  primaryGoal: "qualified_lead" | "booked_call";
  budgetRangeAud: {
    minDaily: number;
    maxDaily: number;
  };
  approvalMode: boolean;
  primaryProduct: {
    name: string;
    url: string;
    audience: string[];
    promise: string;
    benefits: string[];
    painPoints: string[];
    conversionEvents: string[];
  };
  secondaryProduct: {
    name: string;
    url: string;
    audience: string[];
    promise: string;
  };
  guardrails: {
    maxBudgetIncreasePercentPerDay: number;
    minSpendBeforePauseAud: number;
    minClicksBeforeJudging: number;
    draftCampaignsOnly: boolean;
    forbiddenClaims: string[];
  };
};

export type CampaignDraft = {
  name: string;
  objective: "OUTCOME_LEADS";
  status: "PAUSED";
  dailyBudgetAud: number;
  destinationUrl: string;
  audiences: Array<{
    name: string;
    location: string;
    ageMin: number;
    ageMax: number;
    interests: string[];
    painPoint: string;
  }>;
  creatives: GeneratedCopy[];
  prediction: {
    expectedLearningGoal: string;
    successThreshold: string;
    killRule: string;
    scaleRule: string;
  };
  metaPayloads: {
    campaign: Record<string, unknown>;
    adSets: Array<Record<string, unknown>>;
    ads: Array<Record<string, unknown>>;
  };
  monitorMode: true;
};

export type MetaDraftPublishResult = {
  createdInMeta: boolean;
  campaign?: {
    id: string;
    name: string;
    status: "PAUSED";
  };
  adSets: Array<{
    id: string;
    name: string;
    status: "PAUSED";
  }>;
  ads: Array<{
    id: string;
    name: string;
    status: "PAUSED";
  }>;
  skipped: Array<{
    asset: "campaign" | "ad_set" | "creative" | "ad";
    reason: string;
  }>;
  approvalMode: true;
};
