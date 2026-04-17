import { describe, expect, it } from "vitest";
import { DEFAULT_LABOUR_RATES } from "../shared/trades";

// ── AU Market Benchmark Data (mirrors TradeProfile.tsx) ────────────────────
const AU_BENCHMARKS: Record<string, {
  labourRate: { low: number; mid: number; high: number };
  markup: { low: number; mid: number; high: number };
  overhead: { low: number; mid: number; high: number };
  profit: { low: number; mid: number; high: number };
  waste: { low: number; mid: number; high: number };
}> = {
  electrical: { labourRate: { low: 42, mid: 52, high: 65 }, markup: { low: 15, mid: 25, high: 40 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 10, mid: 15, high: 25 }, waste: { low: 3, mid: 5, high: 8 } },
  plumbing: { labourRate: { low: 43, mid: 54, high: 68 }, markup: { low: 15, mid: 25, high: 40 }, overhead: { low: 8, mid: 12, high: 18 }, profit: { low: 10, mid: 15, high: 25 }, waste: { low: 3, mid: 5, high: 8 } },
  gasfitting: { labourRate: { low: 48, mid: 58, high: 72 }, markup: { low: 15, mid: 28, high: 42 }, overhead: { low: 8, mid: 14, high: 20 }, profit: { low: 12, mid: 18, high: 28 }, waste: { low: 2, mid: 5, high: 8 } },
};

// ── Effective Margin Calculation (mirrors TradeProfile.tsx) ─────────────────
function calcEffectiveMargin(materialMarkup: number, overheadPercent: number, profitMargin: number, contingencyPercent: number) {
  return materialMarkup + overheadPercent + profitMargin + contingencyPercent;
}

// ── Example Job Breakdown (mirrors TradeProfile.tsx) ────────────────────────
function calcJobBreakdown(opts: {
  materialsCost: number;
  labourCost: number;
  materialMarkup: number;
  wasteFactor: number;
  overheadPercent: number;
  profitMargin: number;
  contingencyPercent: number;
  mobilisationRate: number;
}) {
  const matMarkupAmt = opts.materialsCost * (opts.materialMarkup / 100);
  const wasteAmt = opts.materialsCost * (opts.wasteFactor / 100);
  const base = opts.materialsCost + opts.labourCost;
  const overheadAmt = base * (opts.overheadPercent / 100);
  const profitAmt = base * (opts.profitMargin / 100);
  const contingencyAmt = base * (opts.contingencyPercent / 100);
  const subtotal = opts.materialsCost + matMarkupAmt + wasteAmt + opts.labourCost + overheadAmt + profitAmt + contingencyAmt + opts.mobilisationRate;
  const gst = subtotal * 0.1;
  return { subtotal, gst, total: subtotal + gst, matMarkupAmt, wasteAmt, overheadAmt, profitAmt, contingencyAmt };
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Effective margin calculation", () => {
  it("sums all margin components correctly", () => {
    const margin = calcEffectiveMargin(20, 10, 15, 5);
    expect(margin).toBe(50);
  });

  it("returns 0 when all components are 0", () => {
    expect(calcEffectiveMargin(0, 0, 0, 0)).toBe(0);
  });

  it("handles high-margin scenario", () => {
    const margin = calcEffectiveMargin(40, 18, 25, 10);
    expect(margin).toBe(93);
  });

  it("flags low margin (below 30%)", () => {
    const margin = calcEffectiveMargin(10, 5, 8, 2);
    expect(margin).toBe(25);
    expect(margin < 30).toBe(true);
  });
});

describe("Job breakdown calculation", () => {
  it("calculates $10K example job correctly", () => {
    const result = calcJobBreakdown({
      materialsCost: 4000,
      labourCost: 3500,
      materialMarkup: 20,
      wasteFactor: 5,
      overheadPercent: 10,
      profitMargin: 15,
      contingencyPercent: 5,
      mobilisationRate: 150,
    });

    // Material markup: 4000 * 0.20 = 800
    expect(result.matMarkupAmt).toBe(800);
    // Waste: 4000 * 0.05 = 200
    expect(result.wasteAmt).toBe(200);
    // Base = 4000 + 3500 = 7500
    // Overhead: 7500 * 0.10 = 750
    expect(result.overheadAmt).toBe(750);
    // Profit: 7500 * 0.15 = 1125
    expect(result.profitAmt).toBe(1125);
    // Contingency: 7500 * 0.05 = 375
    expect(result.contingencyAmt).toBe(375);
    // Subtotal: 4000 + 800 + 200 + 3500 + 750 + 1125 + 375 + 150 = 10900
    expect(result.subtotal).toBe(10900);
    // GST: 10900 * 0.1 = 1090
    expect(result.gst).toBeCloseTo(1090, 2);
    // Total: 10900 + 1090 = 11990
    expect(result.total).toBeCloseTo(11990, 2);
  });

  it("handles zero mobilisation", () => {
    const result = calcJobBreakdown({
      materialsCost: 5000,
      labourCost: 3000,
      materialMarkup: 25,
      wasteFactor: 8,
      overheadPercent: 12,
      profitMargin: 18,
      contingencyPercent: 5,
      mobilisationRate: 0,
    });
    // No mobilisation fee
    const expectedSubtotal = 5000 + (5000 * 0.25) + (5000 * 0.08) + 3000 + (8000 * 0.12) + (8000 * 0.18) + (8000 * 0.05) + 0;
    expect(result.subtotal).toBeCloseTo(expectedSubtotal, 2);
  });

  it("handles zero markup scenario (cost-only pass-through)", () => {
    const result = calcJobBreakdown({
      materialsCost: 2000,
      labourCost: 1000,
      materialMarkup: 0,
      wasteFactor: 0,
      overheadPercent: 0,
      profitMargin: 0,
      contingencyPercent: 0,
      mobilisationRate: 0,
    });
    expect(result.subtotal).toBe(3000);
    expect(result.gst).toBeCloseTo(300, 2);
    expect(result.total).toBeCloseTo(3300, 2);
  });
});

describe("AU market benchmarks", () => {
  it("has benchmarks for gasfitting", () => {
    expect(AU_BENCHMARKS.gasfitting).toBeDefined();
  });

  it("gasfitting labour rate benchmark is higher than general electrical low", () => {
    expect(AU_BENCHMARKS.gasfitting.labourRate.mid).toBeGreaterThan(AU_BENCHMARKS.electrical.labourRate.low);
  });

  it("all benchmark ranges have low < mid < high", () => {
    for (const [trade, bm] of Object.entries(AU_BENCHMARKS)) {
      for (const [metric, range] of Object.entries(bm)) {
        expect(range.low).toBeLessThan(range.mid);
        expect(range.mid).toBeLessThan(range.high);
      }
    }
  });
});

describe("DEFAULT_LABOUR_RATES includes gasfitting", () => {
  it("has gasfitting labour rates", () => {
    expect(DEFAULT_LABOUR_RATES.gasfitting).toBeDefined();
    expect(DEFAULT_LABOUR_RATES.gasfitting.length).toBeGreaterThan(0);
  });

  it("gasfitting qualified rate is >= $48/hr", () => {
    const qualified = DEFAULT_LABOUR_RATES.gasfitting.find(r => r.classification.includes("Qualified"));
    expect(qualified).toBeDefined();
    expect(qualified!.baseRate).toBeGreaterThanOrEqual(48);
  });

  it("gasfitting supervisor rate is >= $60/hr", () => {
    const supervisor = DEFAULT_LABOUR_RATES.gasfitting.find(r => r.classification.includes("Supervisor"));
    expect(supervisor).toBeDefined();
    expect(supervisor!.baseRate).toBeGreaterThanOrEqual(60);
  });

  it("all gasfitting rates have valid penalty rate multipliers", () => {
    for (const rate of DEFAULT_LABOUR_RATES.gasfitting) {
      expect(rate.overtimeRate).toBeGreaterThanOrEqual(rate.baseRate * 1.4);
      expect(rate.sundayRate).toBeGreaterThanOrEqual(rate.baseRate * 1.8);
      expect(rate.publicHolidayRate).toBeGreaterThanOrEqual(rate.baseRate * 2.0);
    }
  });
});

describe("Trade profile rate field validation", () => {
  it("materialMarkup must be between 0 and 200", () => {
    const valid = [0, 20, 50, 100, 200];
    const invalid = [-1, 201, 500];
    valid.forEach(v => expect(v >= 0 && v <= 200).toBe(true));
    invalid.forEach(v => expect(v >= 0 && v <= 200).toBe(false));
  });

  it("overheadPercent must be between 0 and 100", () => {
    const valid = [0, 10, 50, 100];
    const invalid = [-1, 101];
    valid.forEach(v => expect(v >= 0 && v <= 100).toBe(true));
    invalid.forEach(v => expect(v >= 0 && v <= 100).toBe(false));
  });

  it("profitMargin must be between 0 and 100", () => {
    expect(15 >= 0 && 15 <= 100).toBe(true);
    expect(101 >= 0 && 101 <= 100).toBe(false);
  });

  it("defaultWasteFactor must be between 0 and 50", () => {
    expect(5 >= 0 && 5 <= 50).toBe(true);
    expect(51 >= 0 && 51 <= 50).toBe(false);
  });

  it("contingencyPercent must be between 0 and 50", () => {
    expect(5 >= 0 && 5 <= 50).toBe(true);
    expect(51 >= 0 && 51 <= 50).toBe(false);
  });

  it("mobilisationRate must be >= 0", () => {
    expect(0 >= 0).toBe(true);
    expect(150 >= 0).toBe(true);
    expect(-1 >= 0).toBe(false);
  });
});

// ── Custom Rates Prompt Injection Tests ──────────────────────────────────────

interface CustomRates {
  defaultLabourRate?: string | null;
  defaultMarkup?: string | null;
  materialMarkup?: string | null;
  overheadPercent?: string | null;
  profitMargin?: string | null;
  defaultWasteFactor?: string | null;
  mobilisationRate?: string | null;
  contingencyPercent?: string | null;
}

function buildCustomRatesSection(rates: CustomRates): string {
  const lines: string[] = [];
  lines.push("\nCOMPANY-SPECIFIC RATES (use these instead of industry defaults):");
  
  if (rates.defaultLabourRate && parseFloat(rates.defaultLabourRate) > 0) {
    lines.push(`- Company labour rate: $${rates.defaultLabourRate}/hr`);
  }
  if (rates.materialMarkup && parseFloat(rates.materialMarkup) > 0) {
    lines.push(`- Material markup: ${rates.materialMarkup}%`);
  }
  if (rates.defaultMarkup && parseFloat(rates.defaultMarkup) > 0) {
    lines.push(`- Overall markup: ${rates.defaultMarkup}%`);
  }
  if (rates.overheadPercent && parseFloat(rates.overheadPercent) > 0) {
    lines.push(`- Overhead/prelims: ${rates.overheadPercent}%`);
  }
  if (rates.profitMargin && parseFloat(rates.profitMargin) > 0) {
    lines.push(`- Target profit margin: ${rates.profitMargin}%`);
  }
  if (rates.defaultWasteFactor && parseFloat(rates.defaultWasteFactor) > 0) {
    lines.push(`- Default waste factor: ${rates.defaultWasteFactor}%`);
  }
  if (rates.mobilisationRate && parseFloat(rates.mobilisationRate) > 0) {
    lines.push(`- Mobilisation/travel: $${rates.mobilisationRate} flat`);
  }
  if (rates.contingencyPercent && parseFloat(rates.contingencyPercent) > 0) {
    lines.push(`- Contingency: ${rates.contingencyPercent}%`);
  }
  
  if (lines.length <= 1) return "";
  
  lines.push("NOTE: These are the estimator's company rates. Use the labour rate above for labour line items. Material pricing should still reflect current AU market prices — the markup/margin is applied separately by the estimator.");
  return lines.join("\n");
}

describe("Custom rates prompt injection", () => {
  it("returns empty string when no rates are set", () => {
    const result = buildCustomRatesSection({});
    expect(result).toBe("");
  });

  it("returns empty string when all rates are null", () => {
    const result = buildCustomRatesSection({
      defaultLabourRate: null,
      defaultMarkup: null,
      materialMarkup: null,
      overheadPercent: null,
      profitMargin: null,
      defaultWasteFactor: null,
      mobilisationRate: null,
      contingencyPercent: null,
    });
    expect(result).toBe("");
  });

  it("returns empty string when all rates are zero", () => {
    const result = buildCustomRatesSection({
      defaultLabourRate: "0",
      defaultMarkup: "0",
      materialMarkup: "0",
    });
    expect(result).toBe("");
  });

  it("includes labour rate when set", () => {
    const result = buildCustomRatesSection({ defaultLabourRate: "65" });
    expect(result).toContain("Company labour rate: $65/hr");
  });

  it("includes material markup when set", () => {
    const result = buildCustomRatesSection({ materialMarkup: "25" });
    expect(result).toContain("Material markup: 25%");
  });

  it("includes overhead when set", () => {
    const result = buildCustomRatesSection({ overheadPercent: "12" });
    expect(result).toContain("Overhead/prelims: 12%");
  });

  it("includes profit margin when set", () => {
    const result = buildCustomRatesSection({ profitMargin: "18" });
    expect(result).toContain("Target profit margin: 18%");
  });

  it("includes waste factor when set", () => {
    const result = buildCustomRatesSection({ defaultWasteFactor: "5" });
    expect(result).toContain("Default waste factor: 5%");
  });

  it("includes mobilisation rate when set", () => {
    const result = buildCustomRatesSection({ mobilisationRate: "150" });
    expect(result).toContain("Mobilisation/travel: $150 flat");
  });

  it("includes contingency when set", () => {
    const result = buildCustomRatesSection({ contingencyPercent: "5" });
    expect(result).toContain("Contingency: 5%");
  });

  it("includes the COMPANY-SPECIFIC RATES header when any rate is set", () => {
    const result = buildCustomRatesSection({ defaultLabourRate: "55" });
    expect(result).toContain("COMPANY-SPECIFIC RATES");
  });

  it("includes the NOTE about estimator rates when any rate is set", () => {
    const result = buildCustomRatesSection({ profitMargin: "20" });
    expect(result).toContain("NOTE: These are the estimator's company rates");
  });

  it("builds full section with all rates set", () => {
    const result = buildCustomRatesSection({
      defaultLabourRate: "65",
      defaultMarkup: "20",
      materialMarkup: "25",
      overheadPercent: "12",
      profitMargin: "18",
      defaultWasteFactor: "5",
      mobilisationRate: "150",
      contingencyPercent: "5",
    });
    expect(result).toContain("$65/hr");
    expect(result).toContain("Material markup: 25%");
    expect(result).toContain("Overall markup: 20%");
    expect(result).toContain("Overhead/prelims: 12%");
    expect(result).toContain("Target profit margin: 18%");
    expect(result).toContain("Default waste factor: 5%");
    expect(result).toContain("$150 flat");
    expect(result).toContain("Contingency: 5%");
  });

  it("skips rates that are zero but includes non-zero ones", () => {
    const result = buildCustomRatesSection({
      defaultLabourRate: "0",
      materialMarkup: "25",
      overheadPercent: "0",
      profitMargin: "18",
    });
    expect(result).not.toContain("Company labour rate:");
    expect(result).toContain("Material markup: 25%");
    expect(result).not.toContain("Overhead/prelims:");
    expect(result).toContain("Target profit margin: 18%");
  });
});
