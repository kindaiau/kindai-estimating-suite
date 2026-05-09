import { Router } from "express";
import { z } from "zod";
import { generateAdCopy } from "./creativeCopy";
import { ingestDailyMetaMetrics } from "./ingestion";
import { buildDecisionPlan } from "./decisionEngine";
import { buildCampaignDraft } from "./campaignDraft";
import { getMarketingBrain } from "./marketingBrain";
import { MetaMarketingApiClient } from "./metaMarketingApi";

export const adEngineRouter = Router();

const copySchema = z.object({
  productBenefits: z.string().min(3).max(1000),
  audiencePainPoints: z.string().min(3).max(1000),
  offer: z.string().max(300).optional(),
  tone: z.string().max(100).optional(),
});

const campaignDraftSchema = z.object({
  product: z.enum(["kindai_estimator", "kindai_leads"]).optional(),
  dailyBudgetAud: z.number().min(1).max(500).optional(),
  audienceFocus: z.string().max(300).optional(),
});

const publishDraftSchema = campaignDraftSchema.extend({
  confirm: z.literal("CREATE_PAUSED_META_DRAFT"),
});

adEngineRouter.get("/brain", (_req, res) => {
  res.json(getMarketingBrain());
});

adEngineRouter.get("/overview", async (_req, res) => {
  const ingestion = await ingestDailyMetaMetrics();
  const rows = ingestion.rows.map((row) => ({
    ...row,
    currentBudget: Math.max(row.spend, 25),
    creativeScore: row.ctr >= 2 ? 82 : 64,
    placementCount: 3,
  }));
  const actions = await buildDecisionPlan(rows, true);

  res.json({
    source: ingestion.source,
    isLive: ingestion.source === "meta",
    dataWarning:
      ingestion.source === "mock"
        ? "Meta Marketing API is not configured. Showing mock data so the dashboard can be tested safely."
        : ingestion.storage.reason === "database-not-configured"
          ? "Live Meta data was fetched, but the database is not configured so rows were not stored."
          : undefined,
    storage: ingestion.storage,
    summary: ingestion.summary,
    actions,
    topCreatives: rows
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 4)
      .map((row) => ({
        id: row.adId ?? row.adSetId,
        name: row.adName ?? row.adSetName,
        roas: row.roas,
        ctr: row.ctr,
        spend: row.spend,
      })),
  });
});

adEngineRouter.post("/generate-copy", async (req, res) => {
  const input = copySchema.parse(req.body);
  const variants = await generateAdCopy(input);
  res.json({ variants });
});

adEngineRouter.post("/campaign-draft", async (req, res) => {
  const input = campaignDraftSchema.parse(req.body);
  const draft = await buildCampaignDraft(input);
  res.json({ draft });
});

adEngineRouter.post("/campaign-draft/publish", async (req, res) => {
  const input = publishDraftSchema.parse(req.body);
  const draft = await buildCampaignDraft(input);
  const client = new MetaMarketingApiClient();
  const publishResult = await client.publishPausedCampaignDraft(draft);
  res.json({ draft, publishResult });
});
