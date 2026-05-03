import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { QuoteAssuranceReport } from "../../server/assurance";
import type { BenchmarkAiResult, BenchmarkExpectedCase, BenchmarkScore } from "../../server/benchmarkScoring";

type SummaryCase = {
  caseId: string;
  title: string;
  trade: string;
  model: string;
  overallScore: number;
  itemRecallPercent: number;
  quantityAccuracyPercent: number;
  warningRecallPercent: number;
  falsePositiveCount: number;
  assuranceRisk: string;
  assuranceCanIssue: boolean;
  assuranceApprovalLevel: string;
  meetsMinimum: boolean | null;
};

type BenchmarkSummary = {
  runId: string;
  createdAt: string;
  mode: string;
  market?: {
    country?: string;
    currency?: string;
    basis?: string;
  };
  casesDir: string;
  outDir: string;
  caseCount: number;
  averages: {
    overallScore: number;
    itemRecallPercent: number;
    quantityAccuracyPercent: number;
    warningRecallPercent: number;
    meanQuantityErrorPercent: number;
  };
  blockedQuoteCount: number;
  cases: SummaryCase[];
};

type CaseRunResult = {
  caseId: string;
  title: string;
  trade: string;
  mode: string;
  model: string;
  expected: BenchmarkExpectedCase;
  aiResult: BenchmarkAiResult;
  score: BenchmarkScore;
  assurance: QuoteAssuranceReport;
  meetsMinimum: boolean | null;
  createdAt: string;
};

function parseArgs(): Map<string, string> {
  const args = new Map<string, string>();
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = process.argv[i + 1];
    if (!next || next.startsWith("--")) {
      args.set(key, "true");
    } else {
      args.set(key, next);
      i++;
    }
  }
  return args;
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function latestResultDir(resultsRoot: string): Promise<string> {
  const entries = await readdir(resultsRoot, { withFileTypes: true });
  const dirs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(resultsRoot, entry.name))
    .sort();
  if (dirs.length === 0) {
    throw new Error(`No benchmark result directories found in ${resultsRoot}`);
  }
  return dirs[dirs.length - 1];
}

async function loadCases(resultsDir: string): Promise<CaseRunResult[]> {
  const casesDir = path.join(resultsDir, "cases");
  const entries = await readdir(casesDir, { withFileTypes: true });
  const caseFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => path.join(casesDir, entry.name))
    .sort();

  return Promise.all(caseFiles.map((filePath) => readJson<CaseRunResult>(filePath)));
}

function pct(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

function money(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

function passLabel(value: boolean | null): string {
  if (value === null) return "No threshold";
  return value ? "Pass" : "Fail";
}

function assuranceLabel(assurance: QuoteAssuranceReport): string {
  return assurance.canIssue
    ? `${assurance.overallRisk}, can issue`
    : `${assurance.overallRisk}, blocked`;
}

function renderCaseTable(summary: BenchmarkSummary): string {
  const rows = summary.cases.map((caseResult) =>
    [
      caseResult.caseId,
      pct(caseResult.overallScore),
      pct(caseResult.itemRecallPercent),
      pct(caseResult.quantityAccuracyPercent),
      pct(caseResult.warningRecallPercent),
      String(caseResult.falsePositiveCount),
      caseResult.assuranceCanIssue ? "Can issue" : "Blocked",
      passLabel(caseResult.meetsMinimum),
    ].join(" | ")
  );

  return [
    "| Case | Overall | Recall | Quantity | Warnings | False Positives | Assurance | Threshold |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |",
    ...rows.map((row) => `| ${row} |`),
  ].join("\n");
}

function renderMissAnalysis(cases: CaseRunResult[]): string {
  const sections = cases.map((caseResult) => {
    const missed = caseResult.score.matches.filter((match) => !match.matched);
    const failedQuantity = caseResult.score.matches.filter((match) => match.matched && !match.withinTolerance);
    const falsePositives = caseResult.score.unmatchedPredictions;

    const lines = [`### ${caseResult.title}`];
    lines.push(`- Assurance: ${assuranceLabel(caseResult.assurance)}.`);
    lines.push(`- Quote value tested: ${money(caseResult.assurance.quoteValue)}.`);

    if (missed.length === 0 && failedQuantity.length === 0 && falsePositives.length === 0) {
      lines.push("- No missed expected items, failed quantity tolerances, or false positives were detected.");
      return lines.join("\n");
    }

    if (missed.length > 0) {
      lines.push(`- Missed expected items: ${missed.map((match) => match.expectedDescription).join(", ")}.`);
    }
    if (failedQuantity.length > 0) {
      lines.push(
        `- Quantity tolerance failures: ${failedQuantity
          .map(
            (match) =>
              `${match.expectedDescription} expected ${match.expectedQuantity} ${match.expectedUnit}, got ${match.actualQuantity} ${match.actualUnit}`
          )
          .join("; ")}.`
      );
    }
    if (falsePositives.length > 0) {
      lines.push(`- Unmatched AI items: ${falsePositives.map((item) => item.description).join(", ")}.`);
    }
    if (caseResult.assurance.issueBlocks.length > 0) {
      lines.push(`- Issue blocks: ${caseResult.assurance.issueBlocks.join(" ")}`);
    }

    return lines.join("\n");
  });

  return sections.join("\n\n");
}

function renderReport(summary: BenchmarkSummary, cases: CaseRunResult[]): string {
  const failedThresholds = summary.cases.filter((caseResult) => caseResult.meetsMinimum === false);
  const blocked = cases.filter((caseResult) => !caseResult.assurance.canIssue);

  return [
    "# Kindai AI Benchmark Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    `Run ID: ${summary.runId}`,
    `Mode: ${summary.mode}`,
    `Market: ${summary.market?.country ?? "Australia"}`,
    `Currency: ${summary.market?.currency ?? "AUD"}`,
    `Cases tested: ${summary.caseCount}`,
    "",
    "## Executive Summary",
    "",
    `- Average overall score: ${pct(summary.averages.overallScore)}`,
    `- Average item recall: ${pct(summary.averages.itemRecallPercent)}`,
    `- Average quantity accuracy: ${pct(summary.averages.quantityAccuracyPercent)}`,
    `- Average warning recall: ${pct(summary.averages.warningRecallPercent)}`,
    `- Average quantity error on matched items: ${pct(summary.averages.meanQuantityErrorPercent)}`,
    `- Quotes blocked by assurance: ${summary.blockedQuoteCount} of ${summary.caseCount}`,
    `- Cases below their minimum benchmark threshold: ${failedThresholds.length}`,
    "",
    "Investor interpretation: Kindai should be presented as an AI-assisted estimating and assurance system for the Australian construction market, not an unsupervised quoting engine. The benchmark shows extraction accuracy, highlights misses, and proves whether high-value quotes are stopped until review conditions are met.",
    "",
    "## Australian Market Basis",
    "",
    summary.market?.basis ??
      "This benchmark pack uses Australian construction market assumptions, AUD pricing, metric quantities, explicit GST treatment, and Australian compliance/risk review.",
    "",
    "- Rates and totals should be treated as AUD and must state whether they are ex GST or inc GST.",
    "- Expected quantities should be prepared against Australian drawings, trade terminology, supplier pricing, subcontractor pricing, and local labour/productivity assumptions.",
    "- High-value cases should test local compliance risks such as NCC/BCA obligations, AS/NZS trade requirements where applicable, state/territory WHS and licensing, shutdown/access constraints, preliminaries, and review sign-off.",
    "",
    "## Case Results",
    "",
    renderCaseTable(summary),
    "",
    "## Assurance Behavior",
    "",
    blocked.length === 0
      ? "No benchmark quotes were blocked by assurance in this run."
      : blocked
          .map(
            (caseResult) =>
              `- ${caseResult.caseId}: blocked with ${caseResult.assurance.overallRisk} risk. ${caseResult.assurance.summary}`
          )
          .join("\n"),
    "",
    "## Miss And Risk Analysis",
    "",
    renderMissAnalysis(cases),
    "",
    "## Limitations",
    "",
    "- Score-only mode uses stored sample AI results and proves the scoring/reporting harness, not live model quality.",
    "- Live results require production-like public or signed document URLs that OpenAI can fetch.",
    "- The benchmark is only investor-grade after the expected quantities are independently reviewed by a qualified estimator.",
    "- Passing a benchmark is not permission to issue a million-dollar quote without human sign-off.",
    "",
    "## Next Actions",
    "",
    "1. Replace template URLs with 10-20 real representative plan sets.",
    "2. Have expected quantities reviewed by a senior estimator before each run.",
    "3. Run the live benchmark with production OpenAI credentials.",
    "4. Add difficult mobile-photo cases, revision conflicts, and incomplete schedules.",
    "5. Use every failed benchmark item as a prompt, parsing, or workflow improvement ticket.",
  ].join("\n");
}

async function main() {
  const args = parseArgs();
  const resultsDir = args.get("results")
    ? path.resolve(process.cwd(), args.get("results") ?? "")
    : await latestResultDir(path.resolve(process.cwd(), "benchmarks/results"));

  const summary = await readJson<BenchmarkSummary>(path.join(resultsDir, "summary.json"));
  const cases = await loadCases(resultsDir);
  const report = renderReport(summary, cases);
  const outFile = path.join(resultsDir, "investor-report.md");

  await mkdir(resultsDir, { recursive: true });
  await writeFile(outFile, report);
  console.log(`Benchmark report written: ${outFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
