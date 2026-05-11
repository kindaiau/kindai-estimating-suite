import { describe, expect, it } from "vitest";
import { scoreBenchmarkResult } from "./benchmarkScoring";

describe("benchmark scoring", () => {
  it("matches expected takeoff items by aliases and unit-normalised quantities", () => {
    const score = scoreBenchmarkResult(
      {
        caseId: "electrical-small",
        expectedItems: [
          {
            id: "gpo",
            description: "double power outlets",
            aliases: ["double GPO", "twin socket outlets"],
            unit: "ea",
            quantity: 24,
            tolerancePercent: 5,
          },
          {
            id: "cable",
            description: "2.5mm cable run",
            aliases: ["2.5 mm TPS cable"],
            unit: "m",
            quantity: 180,
            tolerancePercent: 10,
          },
        ],
        requiredWarnings: ["switchboard capacity is not visible"],
      },
      {
        items: [
          { description: "Double GPO points", unit: "each", quantity: 24 },
          { description: "2.5mm TPS cable run", unit: "lm", quantity: 190 },
        ],
        warnings: ["Switchboard capacity is not visible on the supplied plan."],
      }
    );

    expect(score.matchedItems).toBe(2);
    expect(score.quantityPasses).toBe(2);
    expect(score.warningRecallPercent).toBe(100);
    expect(score.falsePositiveCount).toBe(0);
    expect(score.overallScore).toBe(100);
  });

  it("penalises missed quantities, missed warnings, and false positive line items", () => {
    const score = scoreBenchmarkResult(
      {
        caseId: "commercial-risky",
        expectedItems: [
          { description: "distribution boards", unit: "ea", quantity: 3, tolerancePercent: 0 },
          { description: "main cable tray", unit: "m", quantity: 120, tolerancePercent: 10 },
        ],
        requiredWarnings: ["fire penetration sealing not specified"],
      },
      {
        items: [
          { description: "Distribution board", unit: "ea", quantity: 2 },
          { description: "Decorative lighting allowance", unit: "lot", quantity: 1 },
        ],
        assumptions: ["Ceiling heights assumed from typical commercial office layout."],
      }
    );

    expect(score.matchedItems).toBe(1);
    expect(score.quantityPasses).toBe(0);
    expect(score.falsePositiveCount).toBe(1);
    expect(score.matchedWarnings).toBe(0);
    expect(score.overallScore).toBeLessThan(40);
    expect(score.matches.find((match) => match.expectedDescription === "main cable tray")?.matched).toBe(false);
  });
});
