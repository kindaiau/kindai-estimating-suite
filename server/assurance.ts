import { GST_RATE } from "../shared/trades";

export type AssuranceSeverity = "info" | "low" | "medium" | "high" | "critical";
export type AssuranceCheckStatus = "pass" | "warning" | "fail";
export type AssuranceRiskLevel = "low" | "medium" | "high" | "critical";
export type ApprovalLevel = "standard" | "estimator_review" | "senior_estimator" | "director_signoff";

export type AssuranceCheck = {
  id: string;
  title: string;
  status: AssuranceCheckStatus;
  severity: AssuranceSeverity;
  message: string;
  recommendedAction: string;
};

export type AssuranceLineItemRisk = {
  lineItemId?: number;
  description: string;
  riskLevel: AssuranceRiskLevel;
  reasons: string[];
  recommendedAction: string;
};

export type QuoteAssuranceReport = {
  quoteValue: number;
  valueBand: "routine" | "managed" | "high_value" | "enterprise";
  riskScore: number;
  overallRisk: AssuranceRiskLevel;
  approvalLevel: ApprovalLevel;
  canIssue: boolean;
  issueBlocks: string[];
  warnings: string[];
  checks: AssuranceCheck[];
  lineItemRisks: AssuranceLineItemRisk[];
  summary: string;
};

export type AssuranceEstimateInput = {
  total?: unknown;
  subtotal?: unknown;
  margin?: unknown;
  aiConfidenceScore?: number | null;
  aiAssumptions?: unknown;
  complianceChecked?: boolean | null;
  status?: string | null;
  trade?: string | null;
};

export type AssuranceLineItemInput = {
  id?: number;
  description?: string | null;
  category?: string | null;
  unit?: string | null;
  quantity?: unknown;
  unitRate?: unknown;
  subtotal?: unknown;
  wasteFactor?: unknown;
  isFromAi?: boolean | null;
  notes?: string | null;
  section?: string | null;
};

export type DerivedAssuranceEstimate = AssuranceEstimateInput & {
  subtotal: number;
  gstAmount: number;
  total: number;
  margin: number;
};

function numberFrom(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function assumptionsFrom(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  return [];
}

export function deriveAssuranceEstimate(
  estimate: AssuranceEstimateInput,
  lineItems: AssuranceLineItemInput[],
  marginOverride?: number
): DerivedAssuranceEstimate {
  const margin =
    typeof marginOverride === "number" && Number.isFinite(marginOverride)
      ? marginOverride
      : numberFrom(estimate.margin);

  const subtotalBeforeMargin = lineItems.reduce((sum, item) => {
    const itemSubtotal = numberFrom(item.subtotal);
    if (itemSubtotal > 0) return sum + itemSubtotal;
    const quantity = numberFrom(item.quantity);
    const unitRate = numberFrom(item.unitRate);
    const waste = numberFrom(item.wasteFactor) / 100;
    return sum + quantity * unitRate * (1 + waste);
  }, 0);

  const subtotal = subtotalBeforeMargin * (1 + margin / 100);
  const gstAmount = subtotal * GST_RATE;
  const total = subtotal + gstAmount;

  return {
    ...estimate,
    subtotal,
    gstAmount,
    total,
    margin,
  };
}

function quoteValueBand(value: number): QuoteAssuranceReport["valueBand"] {
  if (value >= 1_000_000) return "enterprise";
  if (value >= 250_000) return "high_value";
  if (value >= 50_000) return "managed";
  return "routine";
}

function approvalLevelFor(value: number): ApprovalLevel {
  if (value >= 1_000_000) return "director_signoff";
  if (value >= 250_000) return "senior_estimator";
  if (value >= 50_000) return "estimator_review";
  return "standard";
}

function riskFromScore(score: number): AssuranceRiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function addCheck(
  checks: AssuranceCheck[],
  issueBlocks: string[],
  warnings: string[],
  check: AssuranceCheck
) {
  checks.push(check);
  if (check.status === "fail") issueBlocks.push(check.message);
  if (check.status === "warning") warnings.push(check.message);
}

function analyseLineItem(
  item: AssuranceLineItemInput,
  totalValue: number,
  valueBand: QuoteAssuranceReport["valueBand"]
): AssuranceLineItemRisk | null {
  const quantity = numberFrom(item.quantity);
  const unitRate = numberFrom(item.unitRate);
  const subtotal = numberFrom(item.subtotal);
  const description = item.description || "Untitled line item";
  const lowerDescription = description.toLowerCase();
  const reasons: string[] = [];
  let severityScore = 0;

  if (quantity <= 0) {
    reasons.push("Quantity is zero or invalid.");
    severityScore += 40;
  }
  if (unitRate <= 0) {
    reasons.push("Unit rate is zero or invalid.");
    severityScore += 40;
  }
  if (subtotal <= 0) {
    reasons.push("Line subtotal is zero or invalid.");
    severityScore += 25;
  }
  if (totalValue > 0 && subtotal / totalValue >= 0.15) {
    reasons.push("Single line item represents 15% or more of the quote value.");
    severityScore += 18;
  }
  if (item.isFromAi && !item.notes) {
    reasons.push("AI-generated item has no stored source/evidence note.");
    severityScore += valueBand === "enterprise" || valueBand === "high_value" ? 28 : 12;
  }
  if ((item.unit || "").toLowerCase() === "lot" && subtotal >= 25_000) {
    reasons.push("Large lump-sum item should be broken down before issuing.");
    severityScore += 20;
  }
  if (/(allowance|provisional|assum|tbc|to be confirmed|estimate only)/i.test(lowerDescription)) {
    reasons.push("Description suggests an allowance, assumption, or unresolved scope.");
    severityScore += 16;
  }

  if (reasons.length === 0) return null;

  const riskLevel = riskFromScore(severityScore);
  return {
    lineItemId: item.id,
    description,
    riskLevel,
    reasons,
    recommendedAction:
      riskLevel === "critical" || riskLevel === "high"
        ? "Review this item, add evidence or calculation notes, and split lump sums where possible."
        : "Confirm the item during estimator review.",
  };
}

export function buildQuoteAssuranceReport(
  estimate: AssuranceEstimateInput,
  lineItems: AssuranceLineItemInput[]
): QuoteAssuranceReport {
  const quoteValue = numberFrom(estimate.total);
  const subtotal = numberFrom(estimate.subtotal);
  const margin = numberFrom(estimate.margin);
  const confidence = typeof estimate.aiConfidenceScore === "number" ? estimate.aiConfidenceScore : null;
  const assumptions = assumptionsFrom(estimate.aiAssumptions);
  const valueBand = quoteValueBand(quoteValue);
  const approvalLevel = approvalLevelFor(quoteValue);
  const aiItems = lineItems.filter((item) => item.isFromAi);
  const issueBlocks: string[] = [];
  const warnings: string[] = [];
  const checks: AssuranceCheck[] = [];

  let riskScore = 0;
  if (valueBand === "enterprise") riskScore += 35;
  else if (valueBand === "high_value") riskScore += 25;
  else if (valueBand === "managed") riskScore += 12;

  if (lineItems.length === 0) {
    riskScore += 45;
    addCheck(checks, issueBlocks, warnings, {
      id: "line-items-present",
      title: "Line Items Present",
      status: "fail",
      severity: "critical",
      message: "No line items are present, so the quote cannot be issued.",
      recommendedAction: "Add a complete line-item takeoff before issuing the quote.",
    });
  } else {
    addCheck(checks, issueBlocks, warnings, {
      id: "line-items-present",
      title: "Line Items Present",
      status: "pass",
      severity: "low",
      message: `${lineItems.length} line item${lineItems.length === 1 ? "" : "s"} found.`,
      recommendedAction: "Continue reviewing item-level risk flags.",
    });
  }

  if (aiItems.length > 0) {
    if (confidence === null) {
      riskScore += 16;
      addCheck(checks, issueBlocks, warnings, {
        id: "ai-confidence",
        title: "AI Confidence Recorded",
        status: "warning",
        severity: "medium",
        message: "AI-generated items exist but no AI confidence score is recorded.",
        recommendedAction: "Regenerate the takeoff or manually verify all AI-generated items.",
      });
    } else if (confidence < 70) {
      riskScore += 30;
      addCheck(checks, issueBlocks, warnings, {
        id: "ai-confidence",
        title: "AI Confidence",
        status: valueBand === "routine" ? "warning" : "fail",
        severity: "high",
        message: `AI confidence is ${confidence}%, which is too low for a quote of this value.`,
        recommendedAction: "Re-run analysis with clearer documents or manually verify the takeoff before issuing.",
      });
    } else if (confidence < 85) {
      riskScore += 14;
      addCheck(checks, issueBlocks, warnings, {
        id: "ai-confidence",
        title: "AI Confidence",
        status: valueBand === "enterprise" ? "fail" : "warning",
        severity: valueBand === "enterprise" ? "high" : "medium",
        message: `AI confidence is ${confidence}%; high-value AI-assisted quotes should be reviewed carefully.`,
        recommendedAction: "Senior estimator review is required before issuing.",
      });
    } else {
      addCheck(checks, issueBlocks, warnings, {
        id: "ai-confidence",
        title: "AI Confidence",
        status: "pass",
        severity: "low",
        message: `AI confidence is ${confidence}%.`,
        recommendedAction: "Keep assumptions and source evidence visible during review.",
      });
    }
  }

  if (assumptions.length > 0) {
    const seriousAssumptions = assumptions.filter((assumption) =>
      /(missing|unclear|assum|could not|unable|not visible|tbc|to be confirmed)/i.test(assumption)
    );
    riskScore += Math.min(18, assumptions.length * 2 + seriousAssumptions.length * 3);
    addCheck(checks, issueBlocks, warnings, {
      id: "assumptions",
      title: "Assumption Review",
      status: seriousAssumptions.length > 0 ? "warning" : "pass",
      severity: seriousAssumptions.length > 0 ? "medium" : "low",
      message:
        seriousAssumptions.length > 0
          ? `${seriousAssumptions.length} assumption${seriousAssumptions.length === 1 ? "" : "s"} mention missing, unclear, or assumed scope.`
          : `${assumptions.length} assumption${assumptions.length === 1 ? "" : "s"} recorded.`,
      recommendedAction: "Resolve critical assumptions in scope notes or exclusions before issuing.",
    });
  }

  const hasLabour = lineItems.some((item) => (item.category || "").toLowerCase().includes("labour"));
  if (!hasLabour && subtotal > 0) {
    riskScore += 14;
    addCheck(checks, issueBlocks, warnings, {
      id: "labour-present",
      title: "Labour Included",
      status: "warning",
      severity: "medium",
      message: "No labour line items were detected.",
      recommendedAction: "Confirm labour is included elsewhere or add explicit labour lines.",
    });
  } else if (lineItems.length > 0) {
    addCheck(checks, issueBlocks, warnings, {
      id: "labour-present",
      title: "Labour Included",
      status: "pass",
      severity: "low",
      message: "Labour appears in the estimate.",
      recommendedAction: "Check labour hours/rates against the project programme.",
    });
  }

  if (margin > 0 && margin < 10 && quoteValue >= 50_000) {
    riskScore += 16;
    addCheck(checks, issueBlocks, warnings, {
      id: "margin",
      title: "Margin Floor",
      status: "warning",
      severity: "medium",
      message: `Margin is ${margin}%, which may be too thin for a quote of this value.`,
      recommendedAction: "Confirm overhead, profit, contingency, and risk allowances.",
    });
  }

  if (quoteValue >= 250_000 && !estimate.complianceChecked) {
    riskScore += valueBand === "enterprise" ? 24 : 16;
    addCheck(checks, issueBlocks, warnings, {
      id: "compliance-check",
      title: "Compliance Sign-Off",
      status: "fail",
      severity: "high",
      message: "Compliance has not been confirmed for this high-value quote.",
      recommendedAction: "Complete compliance review before issuing.",
    });
  }

  if (quoteValue >= 250_000 && estimate.status === "draft") {
    riskScore += 20;
    addCheck(checks, issueBlocks, warnings, {
      id: "review-status",
      title: "Estimator Review Status",
      status: "fail",
      severity: "high",
      message: "High-value quotes must be moved out of Draft after estimator review before issuing.",
      recommendedAction: "Review the estimate, then mark it as Review before sending or exporting.",
    });
  }

  const lineItemRisks = lineItems
    .map((item) => analyseLineItem(item, quoteValue, valueBand))
    .filter((item): item is AssuranceLineItemRisk => Boolean(item));

  const highItemRisks = lineItemRisks.filter((item) => item.riskLevel === "high" || item.riskLevel === "critical");
  const criticalItemRisks = lineItemRisks.filter((item) => item.riskLevel === "critical");
  if (highItemRisks.length > 0) {
    riskScore += Math.min(25, highItemRisks.length * 6);
    const status: AssuranceCheckStatus = criticalItemRisks.length > 0 || valueBand !== "routine" ? "fail" : "warning";
    addCheck(checks, issueBlocks, warnings, {
      id: "line-item-risk",
      title: "Line Item Risk",
      status,
      severity: status === "fail" ? "high" : "medium",
      message: `${highItemRisks.length} line item${highItemRisks.length === 1 ? "" : "s"} need evidence, breakdown, or correction.`,
      recommendedAction: "Open the flagged line items and add evidence/calculation notes before issuing.",
    });
  }

  const boundedRiskScore = clamp(Math.round(riskScore), 0, 100);
  const overallRisk = riskFromScore(boundedRiskScore);
  const canIssue = issueBlocks.length === 0;
  const summary = canIssue
    ? `${valueBand.replace("_", " ")} quote cleared for issue with ${overallRisk} assurance risk.`
    : `${valueBand.replace("_", " ")} quote is blocked from issue until ${issueBlocks.length} assurance item${issueBlocks.length === 1 ? "" : "s"} are resolved.`;

  return {
    quoteValue,
    valueBand,
    riskScore: boundedRiskScore,
    overallRisk,
    approvalLevel,
    canIssue,
    issueBlocks,
    warnings,
    checks,
    lineItemRisks,
    summary,
  };
}
