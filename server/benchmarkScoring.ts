export type BenchmarkExpectedItem = {
  id?: string;
  description: string;
  aliases?: string[];
  category?: string;
  unit: string;
  quantity: number;
  tolerancePercent?: number;
  evidence?: string;
  critical?: boolean;
};

export type BenchmarkExpectedCase = {
  caseId: string;
  title?: string;
  marketBasis?: string;
  currency?: string;
  gstTreatment?: string;
  expectedItems: BenchmarkExpectedItem[];
  requiredWarnings?: string[];
  expectedTotal?: number;
  totalTolerancePercent?: number;
  minimumAcceptableScore?: number;
  notes?: string[];
};

export type BenchmarkAiItem = {
  description: string;
  category?: string;
  unit: string;
  quantity: number;
  confidence?: number;
  unitRate?: number;
  subtotal?: number;
  evidence?: string;
};

export type BenchmarkAiResult = {
  marketBasis?: string;
  currency?: string;
  gstTreatment?: string;
  items: BenchmarkAiItem[];
  warnings?: string[];
  assumptions?: string[];
  confidence?: number;
  total?: number;
};

export type BenchmarkItemMatch = {
  expectedId?: string;
  expectedDescription: string;
  expectedUnit: string;
  expectedQuantity: number;
  actualDescription?: string;
  actualUnit?: string;
  actualQuantity?: number;
  matchScore: number;
  quantityErrorPercent?: number;
  tolerancePercent: number;
  withinTolerance: boolean;
  matched: boolean;
};

export type BenchmarkScore = {
  overallScore: number;
  itemRecallPercent: number;
  quantityAccuracyPercent: number;
  meanQuantityErrorPercent: number;
  warningRecallPercent: number;
  pricingVariancePercent?: number;
  falsePositiveCount: number;
  falsePositivePenaltyPercent: number;
  matchedItems: number;
  expectedItems: number;
  predictedItems: number;
  quantityPasses: number;
  requiredWarnings: number;
  matchedWarnings: number;
  matches: BenchmarkItemMatch[];
  unmatchedPredictions: BenchmarkAiItem[];
};

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "by",
  "for",
  "from",
  "in",
  "install",
  "installed",
  "installation",
  "new",
  "of",
  "on",
  "supply",
  "supplied",
  "the",
  "to",
  "with",
]);

const UNIT_ALIASES = new Map<string, string>([
  ["ea", "ea"],
  ["each", "ea"],
  ["item", "ea"],
  ["items", "ea"],
  ["no", "ea"],
  ["number", "ea"],
  ["point", "ea"],
  ["points", "ea"],
  ["m", "m"],
  ["metre", "m"],
  ["metres", "m"],
  ["meter", "m"],
  ["meters", "m"],
  ["lm", "m"],
  ["linearmetre", "m"],
  ["linearmeter", "m"],
  ["m2", "m2"],
  ["sqm", "m2"],
  ["sqmetre", "m2"],
  ["sqmeter", "m2"],
  ["squaremetre", "m2"],
  ["squaremeter", "m2"],
  ["m3", "m3"],
  ["cum", "m3"],
  ["cubicmetre", "m3"],
  ["cubicmeter", "m3"],
  ["hr", "hr"],
  ["hrs", "hr"],
  ["hour", "hr"],
  ["hours", "hr"],
  ["day", "day"],
  ["days", "day"],
  ["lot", "lot"],
  ["lump", "lot"],
  ["lumpsum", "lot"],
  ["allowance", "lot"],
]);

function roundPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10) / 10;
}

function numeric(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function normaliseUnit(unit: string | undefined): string {
  const compact = (unit || "")
    .toLowerCase()
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/[^a-z0-9]+/g, "");
  return UNIT_ALIASES.get(compact) ?? compact;
}

export function normaliseTokens(text: string | undefined): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function compactText(text: string): string {
  return normaliseTokens(text).join(" ");
}

function tokenOverlapScore(left: string, right: string): number {
  const leftTokens = new Set(normaliseTokens(left));
  const rightTokens = new Set(normaliseTokens(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let overlap = 0;
  for (const token of Array.from(leftTokens)) {
    if (rightTokens.has(token)) overlap++;
  }

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function descriptionScore(expected: BenchmarkExpectedItem, actual: BenchmarkAiItem): number {
  const actualText = compactText(actual.description);
  const candidates = [expected.description, ...(expected.aliases ?? [])];

  let best = 0;
  for (const candidate of candidates) {
    const expectedText = compactText(candidate);
    if (!expectedText || !actualText) continue;
    if (actualText.includes(expectedText) || expectedText.includes(actualText)) {
      best = Math.max(best, 1);
      continue;
    }
    best = Math.max(best, tokenOverlapScore(expectedText, actualText));
  }

  return best;
}

function unitsCompatible(expectedUnit: string, actualUnit: string): boolean {
  const expected = normaliseUnit(expectedUnit);
  const actual = normaliseUnit(actualUnit);
  if (!expected || !actual) return true;
  return expected === actual;
}

function warningMatched(requiredWarning: string, warningsText: string): boolean {
  const required = compactText(requiredWarning);
  const actual = compactText(warningsText);
  if (!required) return true;
  if (!actual) return false;
  if (actual.includes(required)) return true;
  return tokenOverlapScore(required, actual) >= 0.45;
}

export function scoreBenchmarkResult(
  expectedCase: BenchmarkExpectedCase,
  aiResult: BenchmarkAiResult
): BenchmarkScore {
  const expectedItems = expectedCase.expectedItems ?? [];
  const predictedItems = aiResult.items ?? [];
  const usedPredictionIndexes = new Set<number>();
  const matches: BenchmarkItemMatch[] = [];

  for (const expected of expectedItems) {
    let bestIndex = -1;
    let bestScore = 0;

    predictedItems.forEach((prediction, index) => {
      if (usedPredictionIndexes.has(index)) return;
      if (!unitsCompatible(expected.unit, prediction.unit)) return;

      const score = descriptionScore(expected, prediction);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const matched = bestIndex >= 0 && bestScore >= 0.42;
    if (!matched) {
      matches.push({
        expectedId: expected.id,
        expectedDescription: expected.description,
        expectedUnit: expected.unit,
        expectedQuantity: numeric(expected.quantity),
        matchScore: roundPercent(bestScore * 100),
        tolerancePercent: expected.tolerancePercent ?? 10,
        withinTolerance: false,
        matched: false,
      });
      continue;
    }

    usedPredictionIndexes.add(bestIndex);
    const prediction = predictedItems[bestIndex];
    const expectedQuantity = numeric(expected.quantity);
    const actualQuantity = numeric(prediction.quantity);
    const quantityErrorPercent =
      expectedQuantity === 0
        ? actualQuantity === 0
          ? 0
          : 100
        : Math.abs(actualQuantity - expectedQuantity) / Math.abs(expectedQuantity) * 100;
    const tolerancePercent = expected.tolerancePercent ?? 10;

    matches.push({
      expectedId: expected.id,
      expectedDescription: expected.description,
      expectedUnit: expected.unit,
      expectedQuantity,
      actualDescription: prediction.description,
      actualUnit: prediction.unit,
      actualQuantity,
      matchScore: roundPercent(bestScore * 100),
      quantityErrorPercent: roundPercent(quantityErrorPercent),
      tolerancePercent,
      withinTolerance: quantityErrorPercent <= tolerancePercent,
      matched: true,
    });
  }

  const matchedItems = matches.filter((match) => match.matched).length;
  const quantityPasses = matches.filter((match) => match.matched && match.withinTolerance).length;
  const quantityErrors = matches
    .filter((match) => match.matched && typeof match.quantityErrorPercent === "number")
    .map((match) => match.quantityErrorPercent ?? 0);
  const meanQuantityErrorPercent =
    quantityErrors.length > 0
      ? quantityErrors.reduce((sum, value) => sum + value, 0) / quantityErrors.length
      : 100;

  const requiredWarnings = expectedCase.requiredWarnings ?? [];
  const warningsText = [...(aiResult.warnings ?? []), ...(aiResult.assumptions ?? [])].join("\n");
  const matchedWarnings = requiredWarnings.filter((warning) => warningMatched(warning, warningsText)).length;

  const falsePositiveCount = Math.max(0, predictedItems.length - usedPredictionIndexes.size);
  const itemRecallPercent = expectedItems.length > 0 ? matchedItems / expectedItems.length * 100 : 100;
  const quantityAccuracyPercent = matchedItems > 0 ? quantityPasses / matchedItems * 100 : 0;
  const warningRecallPercent = requiredWarnings.length > 0 ? matchedWarnings / requiredWarnings.length * 100 : 100;
  const falsePositivePenaltyPercent =
    predictedItems.length > 0 ? falsePositiveCount / predictedItems.length * 100 : 0;

  const actualTotal = numeric(aiResult.total);
  const expectedTotal = numeric(expectedCase.expectedTotal);
  const pricingVariancePercent =
    expectedTotal > 0 && actualTotal > 0
      ? roundPercent(Math.abs(actualTotal - expectedTotal) / expectedTotal * 100)
      : undefined;

  const falsePositiveScore = Math.max(0, 100 - falsePositivePenaltyPercent);
  const overallScore =
    itemRecallPercent * 0.45 +
    quantityAccuracyPercent * 0.3 +
    warningRecallPercent * 0.15 +
    falsePositiveScore * 0.1;

  const unmatchedPredictions = predictedItems.filter((_, index) => !usedPredictionIndexes.has(index));

  return {
    overallScore: roundPercent(overallScore),
    itemRecallPercent: roundPercent(itemRecallPercent),
    quantityAccuracyPercent: roundPercent(quantityAccuracyPercent),
    meanQuantityErrorPercent: roundPercent(meanQuantityErrorPercent),
    warningRecallPercent: roundPercent(warningRecallPercent),
    pricingVariancePercent,
    falsePositiveCount,
    falsePositivePenaltyPercent: roundPercent(falsePositivePenaltyPercent),
    matchedItems,
    expectedItems: expectedItems.length,
    predictedItems: predictedItems.length,
    quantityPasses,
    requiredWarnings: requiredWarnings.length,
    matchedWarnings,
    matches,
    unmatchedPredictions,
  };
}
