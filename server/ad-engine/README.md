# Kindai Ad Engine

Kindai Ad Engine ingests Meta Ads data, normalizes the key metrics, predicts ad-set performance and recommends campaign actions in monitor mode first.

## Setup

Add these environment variables when you are ready to connect live accounts:

- `META_MARKETING_ACCESS_TOKEN`
- `META_AD_ACCOUNT_ID`
- `META_MARKETING_API_VERSION`
- `META_PIXEL_ID`
- `META_CONVERSIONS_API_ACCESS_TOKEN`
- `META_TEST_EVENT_CODE`
- `META_PAGE_ID` if you want the agent to create paused ad creatives/ads, not just campaigns/ad sets.
- `OPENAI_API_KEY`

Without Meta credentials, ingestion returns mock data so the dashboard, model and tests still work.

## Data Flow

1. `metaMarketingApi.ts` reads daily campaign/ad-set metrics from Meta Marketing API.
2. `metrics.ts` turns raw Meta fields into spend, impressions, clicks, conversions, ROAS, CPA, CPM and CTR.
3. `storage.ts` writes raw payloads and normalized metrics into the existing Drizzle-backed database tables.
4. `models/predictPerformance.ts` creates a baseline prediction for ROAS and CPA.
5. `models/budgetAllocator.ts` reallocates budget with an epsilon-greedy style score.
6. `decisionEngine.ts` recommends pause, scale, rotate creative or monitor actions.

## Marketing Brain

`marketingBrain.ts` is the guardrail file for the agent. It currently sets:

- Primary goal: qualified lead / booked call.
- Primary product: Kindai Estimator at `https://kindaiestimator.com`.
- Secondary product: KindAI Leads at `https://kindaileads.manus.space`.
- First audience: Australian builders and trades.
- Test budget: $20-$50/day.
- Approval mode: on.
- Campaign creation: drafts only.

This is what keeps the agent focused on selling the current money product instead of writing generic AI founder ads.

## Cron

Run the daily job with:

```bash
pnpm tsx server/ad-engine/scheduleJobs.ts
```

Recommended schedule:

- Daily ingestion: every morning after Meta has settled the previous day.
- Model update: immediately after ingestion.
- Decision plan: immediately after the model update.
- Budget changes: monitor mode until Matthew approves live automation.

## Extending the Model

The current model is a deterministic baseline that behaves like a lightweight gradient-boosting score without adding a native ML dependency. When enough real rows exist, replace `predictPerformance.ts` with a trained model artifact and keep the same return type:

```ts
type PerformancePrediction = {
  adSetId: string;
  predictedRoas: number;
  predictedCpa: number;
  confidence: number;
};
```

That keeps the decision engine and dashboard stable while the model gets smarter.

## Campaign Drafts

Use this endpoint to produce a draft-only campaign plan:

```bash
curl -X POST http://localhost:3000/api/ad-engine/campaign-draft \
  -H "content-type: application/json" \
  --data '{"product":"kindai_estimator","dailyBudgetAud":30}'
```

The response includes paused Meta payloads for campaign, ad sets and ads. Nothing is published automatically.

To create the paused campaign/ad-set draft inside Meta, call:

```bash
curl -X POST http://localhost:3000/api/ad-engine/campaign-draft/publish \
  -H "content-type: application/json" \
  --data '{"product":"kindai_estimator","dailyBudgetAud":30,"confirm":"CREATE_PAUSED_META_DRAFT"}'
```

This endpoint always uses `PAUSED` status. If `META_PAGE_ID` is missing, it creates campaign/ad-set drafts only and skips ad creatives/ads.
