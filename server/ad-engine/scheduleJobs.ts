import { buildDecisionPlan, applyDecisionPlan } from "./decisionEngine";
import { ingestDailyMetaMetrics } from "./ingestion";
import { trainPerformanceModel } from "./models/predictPerformance";

export async function runAdEngineDailyJob(date = new Date().toISOString().slice(0, 10)) {
  const ingestion = await ingestDailyMetaMetrics(date);
  const featureRows = ingestion.rows.map((row) => ({
    ...row,
    currentBudget: Math.max(row.spend, 25),
    creativeScore: row.ctr >= 2 ? 82 : 64,
    placementCount: 3,
  }));
  const model = trainPerformanceModel(featureRows);
  const actions = await buildDecisionPlan(featureRows, true);
  const apiResults = await applyDecisionPlan(actions, true);

  return {
    ingestion: {
      date: ingestion.date,
      source: ingestion.source,
      rowCount: ingestion.rows.length,
      summary: ingestion.summary,
      storage: ingestion.storage,
    },
    model,
    actions,
    apiResults,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdEngineDailyJob()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error("[AdEngine] Scheduled job failed", error);
      process.exit(1);
    });
}
