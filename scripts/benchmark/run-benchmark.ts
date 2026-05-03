import "dotenv/config";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { buildQuoteAssuranceReport, type AssuranceLineItemInput } from "../../server/assurance";
import {
  scoreBenchmarkResult,
  type BenchmarkAiResult,
  type BenchmarkExpectedCase,
} from "../../server/benchmarkScoring";
import { invokeLLM, type MessageContent } from "../../server/_core/llm";
import { mediaContentsFromUrls } from "../../server/_core/mediaInputs";

type BenchmarkManifest = {
  caseId: string;
  title?: string;
  trade?: string;
  projectValueBand?: string;
  description?: string;
  context?: string[];
  market?: {
    country?: string;
    stateOrTerritory?: string;
    currency?: string;
    gstTreatment?: string;
    pricingBasis?: string;
    labourBasis?: string;
    standardsContext?: string[];
  };
  documentUrls?: string[];
};

type CaseRunResult = {
  caseId: string;
  title: string;
  trade: string;
  mode: "live" | "score-only";
  model: string;
  usage?: unknown;
  manifest: BenchmarkManifest;
  expected: BenchmarkExpectedCase;
  aiResult: BenchmarkAiResult;
  score: ReturnType<typeof scoreBenchmarkResult>;
  assurance: ReturnType<typeof buildQuoteAssuranceReport>;
  meetsMinimum: boolean | null;
  createdAt: string;
};

type Args = Map<string, string>;

function parseArgs(): Args {
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

function timestampId(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function listCaseDirectories(casesDir: string): Promise<string[]> {
  const entries = await readdir(casesDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(casesDir, entry.name))
    .sort();
}

function hasPlaceholderUrl(url: string): boolean {
  return /REPLACE_WITH_|INSERT_|localhost|example\.com/i.test(url);
}

function assertLiveDocuments(manifest: BenchmarkManifest) {
  const urls = manifest.documentUrls ?? [];
  if (urls.length === 0) {
    throw new Error(`${manifest.caseId} has no documentUrls in manifest.json`);
  }

  const badUrl = urls.find((url) => hasPlaceholderUrl(url));
  if (badUrl) {
    throw new Error(
      `${manifest.caseId} still has a placeholder or local document URL: ${badUrl}. Use a public or signed URL that OpenAI can fetch.`
    );
  }
}

function marketFromManifest(manifest: BenchmarkManifest) {
  return {
    country: manifest.market?.country ?? "Australia",
    stateOrTerritory: manifest.market?.stateOrTerritory ?? "Australia-wide benchmark",
    currency: manifest.market?.currency ?? "AUD",
    gstTreatment: manifest.market?.gstTreatment ?? "ex GST unless the benchmark case states otherwise",
    pricingBasis:
      manifest.market?.pricingBasis ??
      "Australian construction market rates, supplier quotes, subcontractor quotes, and estimator-reviewed local allowances.",
    labourBasis:
      manifest.market?.labourBasis ??
      "Australian labour productivity, licensing, award/EBA allowances where applicable, and state-specific access constraints.",
    standardsContext:
      manifest.market?.standardsContext ?? [
        "NCC/BCA compliance risks where applicable.",
        "AS/NZS trade compliance requirements where visible in the documents.",
        "State or territory WHS, licensing, shutdown, access, and preliminaries risks.",
      ],
  };
}

function aiResultSchema() {
  return {
    type: "object",
    properties: {
      marketBasis: { type: "string" },
      currency: { type: "string" },
      gstTreatment: { type: "string" },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            description: { type: "string" },
            category: { type: "string" },
            unit: { type: "string" },
            quantity: { type: "number" },
            unitRate: { type: "number" },
            subtotal: { type: "number" },
            confidence: { type: "number" },
            evidence: { type: "string" },
          },
          required: [
            "description",
            "category",
            "unit",
            "quantity",
            "unitRate",
            "subtotal",
            "confidence",
            "evidence",
          ],
          additionalProperties: false,
        },
      },
      warnings: { type: "array", items: { type: "string" } },
      assumptions: { type: "array", items: { type: "string" } },
      confidence: { type: "number" },
      total: { type: "number" },
    },
    required: ["marketBasis", "currency", "gstTreatment", "items", "warnings", "assumptions", "confidence", "total"],
    additionalProperties: false,
  };
}

function buildLivePrompt(manifest: BenchmarkManifest): MessageContent[] {
  const urls = manifest.documentUrls ?? [];
  const market = marketFromManifest(manifest);
  return [
    ...mediaContentsFromUrls(urls),
    {
      type: "text",
      text: [
        `Benchmark case: ${manifest.caseId}`,
        `Title: ${manifest.title ?? manifest.caseId}`,
        `Trade: ${manifest.trade ?? "general construction"}`,
        `Project value band: ${manifest.projectValueBand ?? "unknown"}`,
        `Market basis: ${market.country}`,
        `State/territory basis: ${market.stateOrTerritory}`,
        `Currency: ${market.currency}`,
        `GST treatment: ${market.gstTreatment}`,
        `Pricing basis: ${market.pricingBasis}`,
        `Labour basis: ${market.labourBasis}`,
        `Description: ${manifest.description ?? "No description provided."}`,
        "",
        "Australian compliance and risk context:",
        ...market.standardsContext.map((line) => `- ${line}`),
        "",
        "Context:",
        ...(manifest.context ?? ["No additional context provided."]).map((line) => `- ${line}`),
        "",
        "Task:",
        "Perform a conservative construction takeoff from the supplied plans/photos.",
        "Return only visible or defensible quantities. Do not fabricate items that are not present.",
        "Add warnings for missing schedules, unclear legends, revision conflicts, provisional allowances, compliance risks, and anything that would block issue of a high-value quote.",
        "Use Australian estimating language, metric units, AUD pricing, and the stated GST treatment.",
        "If rates, GST treatment, state-specific allowances, union/EBA requirements, NCC/BCA details, AS/NZS compliance, licensing, shutdown windows, or WHS obligations are unclear, call that out in warnings rather than guessing.",
      ].join("\n"),
    },
  ];
}

async function runLiveAi(manifest: BenchmarkManifest): Promise<{
  aiResult: BenchmarkAiResult;
  model: string;
  usage?: unknown;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for live benchmark runs. Use benchmark:score for local fixture scoring.");
  }

  assertLiveDocuments(manifest);

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a senior Australian construction estimator performing an investor benchmark for the Australian market. Return strict JSON only. Be conservative, cite visible evidence, use AUD and metric units, and flag missing or unsafe Australian compliance/scope risks clearly.",
      },
      {
        role: "user",
        content: buildLivePrompt(manifest),
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "kindai_benchmark_takeoff",
        strict: true,
        schema: aiResultSchema(),
      },
    },
    thinkingBudget: 2048,
  });

  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") {
    throw new Error("Model returned non-string content; expected JSON string.");
  }

  return {
    aiResult: JSON.parse(content) as BenchmarkAiResult,
    model: response.model,
    usage: response.usage,
  };
}

function sumSubtotals(aiResult: BenchmarkAiResult): number {
  return aiResult.items.reduce((sum, item) => sum + (Number.isFinite(item.subtotal) ? item.subtotal ?? 0 : 0), 0);
}

function buildAssurance(manifest: BenchmarkManifest, aiResult: BenchmarkAiResult) {
  const total = Number.isFinite(aiResult.total) && aiResult.total ? aiResult.total : sumSubtotals(aiResult);
  const enterpriseLike = manifest.projectValueBand === "enterprise" || total >= 250_000;
  const lineItems: AssuranceLineItemInput[] = aiResult.items.map((item, index) => ({
    id: index + 1,
    description: item.description,
    category: item.category,
    unit: item.unit,
    quantity: item.quantity,
    unitRate: item.unitRate,
    subtotal: item.subtotal,
    isFromAi: true,
    notes: item.evidence,
  }));

  return buildQuoteAssuranceReport(
    {
      total,
      subtotal: total,
      margin: 15,
      aiConfidenceScore: aiResult.confidence,
      aiAssumptions: [...(aiResult.warnings ?? []), ...(aiResult.assumptions ?? [])],
      complianceChecked: !enterpriseLike,
      status: enterpriseLike ? "draft" : "review",
      trade: manifest.trade,
    },
    lineItems
  );
}

async function runCase(caseDir: string, mode: "live" | "score-only"): Promise<CaseRunResult> {
  const manifest = await readJson<BenchmarkManifest>(path.join(caseDir, "manifest.json"));
  const expected = await readJson<BenchmarkExpectedCase>(path.join(caseDir, "expected.json"));
  const title = manifest.title ?? expected.title ?? manifest.caseId;
  const trade = manifest.trade ?? "general";
  const createdAt = new Date().toISOString();

  const aiRun =
    mode === "score-only"
      ? {
          aiResult: await readJson<BenchmarkAiResult>(path.join(caseDir, "sample-ai-result.json")),
          model: "sample-ai-result",
          usage: undefined,
        }
      : await runLiveAi(manifest);

  const score = scoreBenchmarkResult(expected, aiRun.aiResult);
  const assurance = buildAssurance(manifest, aiRun.aiResult);
  const meetsMinimum =
    typeof expected.minimumAcceptableScore === "number"
      ? score.overallScore >= expected.minimumAcceptableScore
      : null;

  return {
    caseId: manifest.caseId,
    title,
    trade,
    mode,
    model: aiRun.model,
    usage: aiRun.usage,
    manifest,
    expected,
    aiResult: aiRun.aiResult,
    score,
    assurance,
    meetsMinimum,
    createdAt,
  };
}

function average(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return 0;
  return Math.round((valid.reduce((sum, value) => sum + value, 0) / valid.length) * 10) / 10;
}

async function main() {
  const args = parseArgs();
  const mode = args.has("score-only") ? "score-only" : "live";
  const casesDir = path.resolve(process.cwd(), args.get("cases") ?? "benchmarks/cases");
  const outDir = path.resolve(process.cwd(), args.get("out") ?? path.join("benchmarks/results", timestampId()));
  const caseFilter = args.get("case");

  const caseDirs = (await listCaseDirectories(casesDir)).filter((caseDir) => {
    if (!caseFilter) return true;
    return path.basename(caseDir) === caseFilter;
  });

  if (caseDirs.length === 0) {
    throw new Error(`No benchmark cases found in ${casesDir}${caseFilter ? ` for --case ${caseFilter}` : ""}.`);
  }

  await mkdir(path.join(outDir, "cases"), { recursive: true });

  const results: CaseRunResult[] = [];
  for (const caseDir of caseDirs) {
    const result = await runCase(caseDir, mode);
    results.push(result);
    await writeFile(path.join(outDir, "cases", `${result.caseId}.json`), JSON.stringify(result, null, 2));
  }

  const summary = {
    runId: path.basename(outDir),
    createdAt: new Date().toISOString(),
    mode,
    market: {
      country: "Australia",
      currency: "AUD",
      basis: "Australian construction market benchmark pack. Case manifests may add state/territory, GST, labour, and compliance context.",
    },
    casesDir,
    outDir,
    caseCount: results.length,
    averages: {
      overallScore: average(results.map((result) => result.score.overallScore)),
      itemRecallPercent: average(results.map((result) => result.score.itemRecallPercent)),
      quantityAccuracyPercent: average(results.map((result) => result.score.quantityAccuracyPercent)),
      warningRecallPercent: average(results.map((result) => result.score.warningRecallPercent)),
      meanQuantityErrorPercent: average(results.map((result) => result.score.meanQuantityErrorPercent)),
    },
    blockedQuoteCount: results.filter((result) => !result.assurance.canIssue).length,
    cases: results.map((result) => ({
      caseId: result.caseId,
      title: result.title,
      trade: result.trade,
      model: result.model,
      overallScore: result.score.overallScore,
      itemRecallPercent: result.score.itemRecallPercent,
      quantityAccuracyPercent: result.score.quantityAccuracyPercent,
      warningRecallPercent: result.score.warningRecallPercent,
      falsePositiveCount: result.score.falsePositiveCount,
      assuranceRisk: result.assurance.overallRisk,
      assuranceCanIssue: result.assurance.canIssue,
      assuranceApprovalLevel: result.assurance.approvalLevel,
      meetsMinimum: result.meetsMinimum,
    })),
  };

  await writeFile(path.join(outDir, "summary.json"), JSON.stringify(summary, null, 2));

  console.log(`Benchmark ${mode} run complete: ${outDir}`);
  console.table(
    summary.cases.map((result) => ({
      case: result.caseId,
      score: result.overallScore,
      recall: result.itemRecallPercent,
      qty: result.quantityAccuracyPercent,
      warnings: result.warningRecallPercent,
      blocked: !result.assuranceCanIssue,
    }))
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
