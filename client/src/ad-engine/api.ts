export type AdEngineOverview = {
  source: "meta" | "mock";
  isLive: boolean;
  dataWarning?: string;
  storage?: {
    stored: number;
    skipped: number;
    reason?: string;
  };
  summary: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    revenue: number;
    roas: number;
    cpa: number;
    cpm: number;
    ctr: number;
  };
  actions: Array<{
    adSetId: string;
    action: "pause" | "scale" | "rotate_creative" | "monitor";
    currentBudget: number;
    recommendedBudget: number;
    reason: string;
    monitorMode: boolean;
  }>;
  topCreatives: Array<{
    id: string;
    name: string;
    roas: number;
    ctr: number;
    spend: number;
  }>;
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

export type CampaignDraft = {
  name: string;
  dailyBudgetAud: number;
  destinationUrl: string;
  audiences: Array<{
    name: string;
    location: string;
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
    asset: string;
    reason: string;
  }>;
  approvalMode: true;
};

export async function fetchAdEngineOverview(): Promise<AdEngineOverview> {
  const response = await fetch("/api/ad-engine/overview");
  if (!response.ok) throw new Error("Could not load Ad Engine overview");
  return response.json();
}

export async function generateCopy(input: {
  productBenefits: string;
  audiencePainPoints: string;
  offer?: string;
  tone?: string;
}): Promise<GeneratedCopy[]> {
  const response = await fetch("/api/ad-engine/generate-copy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Could not generate copy");
  const payload = (await response.json()) as { variants: GeneratedCopy[] };
  return payload.variants;
}

export async function createCampaignDraft(input: {
  product?: "kindai_estimator" | "kindai_leads";
  dailyBudgetAud?: number;
  audienceFocus?: string;
}): Promise<CampaignDraft> {
  const response = await fetch("/api/ad-engine/campaign-draft", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Could not create campaign draft");
  const payload = (await response.json()) as { draft: CampaignDraft };
  return payload.draft;
}

export async function publishPausedCampaignDraft(input: {
  product?: "kindai_estimator" | "kindai_leads";
  dailyBudgetAud?: number;
  audienceFocus?: string;
}): Promise<{ draft: CampaignDraft; publishResult: MetaDraftPublishResult }> {
  const response = await fetch("/api/ad-engine/campaign-draft/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      confirm: "CREATE_PAUSED_META_DRAFT",
    }),
  });
  if (!response.ok) throw new Error("Could not create paused Meta draft");
  return response.json();
}
