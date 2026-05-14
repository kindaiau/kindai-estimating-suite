import { describe, expect, it } from "vitest";
import { buildQuoteAssuranceReport, deriveAssuranceEstimate } from "./assurance";

const labour = {
  id: 2,
  category: "Labour",
  description: "Licensed labour",
  unit: "hr",
  quantity: "120",
  unitRate: "110",
  subtotal: "13200",
  isFromAi: false,
};

describe("quote assurance", () => {
  it("blocks million-dollar AI-assisted quotes until review and compliance are complete", () => {
    const report = buildQuoteAssuranceReport(
      {
        total: "1250000",
        subtotal: "1136363.64",
        margin: "18",
        aiConfidenceScore: 82,
        aiAssumptions: ["Switchboard size assumed from partial drawing"],
        complianceChecked: false,
        status: "draft",
      },
      [
        {
          id: 1,
          category: "Materials",
          description: "Main switchboard allowance",
          unit: "lot",
          quantity: "1",
          unitRate: "250000",
          subtotal: "250000",
          isFromAi: true,
        },
        labour,
      ]
    );

    expect(report.canIssue).toBe(false);
    expect(report.valueBand).toBe("enterprise");
    expect(report.approvalLevel).toBe("director_signoff");
    expect(report.issueBlocks.join(" ")).toContain("Compliance");
    expect(report.issueBlocks.join(" ")).toContain("Draft");
  });

  it("clears high-value quotes after estimator review, compliance, and evidence notes", () => {
    const report = buildQuoteAssuranceReport(
      {
        total: "320000",
        subtotal: "290909.09",
        margin: "18",
        aiConfidenceScore: 91,
        aiAssumptions: ["Measured from full drawing set"],
        complianceChecked: true,
        status: "review",
      },
      [
        {
          id: 1,
          category: "Materials",
          description: "Cable tray package",
          unit: "lm",
          quantity: "850",
          unitRate: "45",
          subtotal: "38250",
          isFromAi: true,
          notes: "Measured from E-201 and E-202 cable tray layout.",
        },
        labour,
      ]
    );

    expect(report.canIssue).toBe(true);
    expect(report.valueBand).toBe("high_value");
    expect(report.approvalLevel).toBe("senior_estimator");
  });

  it("warns but does not block managed quotes with ordinary review issues", () => {
    const report = buildQuoteAssuranceReport(
      {
        total: "85000",
        subtotal: "77272.73",
        margin: "12",
        aiConfidenceScore: 81,
        aiAssumptions: ["Bathroom fixture count assumed from text scope"],
        complianceChecked: false,
        status: "draft",
      },
      [
        {
          id: 1,
          category: "Materials",
          description: "Fixture package",
          unit: "ea",
          quantity: "18",
          unitRate: "650",
          subtotal: "11700",
          isFromAi: true,
        },
        labour,
      ]
    );

    expect(report.canIssue).toBe(true);
    expect(report.valueBand).toBe("managed");
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it("blocks invalid quotes with no line items", () => {
    const report = buildQuoteAssuranceReport(
      {
        total: "0",
        subtotal: "0",
        margin: "15",
        complianceChecked: false,
        status: "draft",
      },
      []
    );

    expect(report.canIssue).toBe(false);
    expect(report.issueBlocks[0]).toContain("No line items");
  });

  it("derives consistent totals from line items and margin", () => {
    const derived = deriveAssuranceEstimate(
      {
        margin: "20",
        status: "review",
      },
      [
        {
          category: "Materials",
          description: "Cable",
          quantity: "10",
          unitRate: "15",
          wasteFactor: "10",
          subtotal: "165",
        },
        labour,
      ]
    );

    expect(derived.margin).toBe(20);
    expect(derived.subtotal).toBeCloseTo(16038);
    expect(derived.gstAmount).toBeCloseTo(1603.8);
    expect(derived.total).toBeCloseTo(17641.8);
  });
});
