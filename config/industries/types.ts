export type IndustryKey = "cabinet-makers" | "electricians";

export type IndustryWorkflowStage = {
  id: string;
  label: string;
  description: string;
  agent: "acquisition" | "conversion" | "delivery";
};

export type EstimateTemplateItem = {
  category: "materials" | "labour" | "plant" | "compliance" | "delivery" | "margin";
  label: string;
  unit: string;
  defaultRate: number;
  notes: string;
};

export type DashboardWidgetConfig = {
  id: string;
  title: string;
  metric: string;
  helpText: string;
};

export type IndustryConfig = {
  key: IndustryKey;
  tradeId: string;
  name: string;
  shortName: string;
  audience: string;
  landingPath: string;
  crmLabels: {
    lead: string;
    customer: string;
    project: string;
    quote: string;
    primaryAsset: string;
    followUp: string;
  };
  onboarding: {
    headline: string;
    subcopy: string;
    setupSteps: string[];
  };
  prompts: {
    acquisition: string;
    conversion: string;
    delivery: string;
    estimatorSystem: string;
  };
  workflows: IndustryWorkflowStage[];
  estimateTemplates: EstimateTemplateItem[];
  dashboardWidgets: DashboardWidgetConfig[];
  landing: {
    seoTitle: string;
    seoDescription: string;
    heroTitle: string;
    heroCopy: string;
    painPoints: string[];
    benefits: string[];
    workflowExamples: string[];
    testimonials: Array<{ quote: string; name: string; role: string }>;
    faqs: Array<{ question: string; answer: string }>;
  };
};
