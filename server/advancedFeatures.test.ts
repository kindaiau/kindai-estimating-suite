import { describe, it, expect } from "vitest";

// ── Company Memory Router Tests ──
describe("Company Memory Router", () => {
  it("should export companyMemoryRouter with expected procedures", async () => {
    const { companyMemoryRouter } = await import("./routers/companyMemory");
    expect(companyMemoryRouter).toBeDefined();
    expect(companyMemoryRouter._def).toBeDefined();
    // Check procedures exist
    const procedures = Object.keys(companyMemoryRouter._def.procedures);
    expect(procedures).toContain("getProfile");
    expect(procedures).toContain("upsertProfile");
    expect(procedures).toContain("listPriceBook");
    expect(procedures).toContain("addPriceBookItem");
    expect(procedures).toContain("updatePriceBookItem");
    expect(procedures).toContain("deletePriceBookItem");
    expect(procedures).toContain("bulkImportPriceBook");
    expect(procedures).toContain("listTemplates");
    expect(procedures).toContain("createTemplate");
    expect(procedures).toContain("saveEstimateAsTemplate");
    expect(procedures).toContain("useTemplate");
    expect(procedures).toContain("deleteTemplate");
    expect(procedures).toContain("getCorrectionStats");
    expect(procedures).toContain("getAIContext");
  });

  it("should have correct procedure count", async () => {
    const { companyMemoryRouter } = await import("./routers/companyMemory");
    const procedures = Object.keys(companyMemoryRouter._def.procedures);
    expect(procedures.length).toBeGreaterThanOrEqual(14);
  });
});

// ── Corrections Router Tests ──
describe("Corrections Router", () => {
  it("should export correctionsRouter with expected procedures", async () => {
    const { correctionsRouter } = await import("./routers/corrections");
    expect(correctionsRouter).toBeDefined();
    const procedures = Object.keys(correctionsRouter._def.procedures);
    expect(procedures).toContain("recordCorrection");
    expect(procedures).toContain("batchRecord");
    expect(procedures).toContain("listForEstimate");
    expect(procedures).toContain("getLearningInsights");
    expect(procedures).toContain("recordOutcome");
    expect(procedures).toContain("listOutcomes");
    expect(procedures).toContain("getOutcome");
    expect(procedures).toContain("getAccuracyDashboard");
  });

  it("should have 8 procedures total", async () => {
    const { correctionsRouter } = await import("./routers/corrections");
    const procedures = Object.keys(correctionsRouter._def.procedures);
    expect(procedures.length).toBe(8);
  });
});

// ── Xero Router Tests ──
describe("Xero Router", () => {
  it("should export xeroRouter with expected procedures", async () => {
    const { xeroRouter } = await import("./routers/xero");
    expect(xeroRouter).toBeDefined();
    const procedures = Object.keys(xeroRouter._def.procedures);
    expect(procedures).toContain("getStatus");
    expect(procedures).toContain("getAuthUrl");
    expect(procedures).toContain("disconnect");
    expect(procedures).toContain("syncContact");
    expect(procedures).toContain("createInvoice");
    expect(procedures).toContain("listInvoices");
  });

  it("should have 6 procedures total", async () => {
    const { xeroRouter } = await import("./routers/xero");
    const procedures = Object.keys(xeroRouter._def.procedures);
    expect(procedures.length).toBe(6);
  });
});

// ── Schema Tests ──
describe("Advanced Feature Schema Tables", () => {
  it("should export companyProfiles table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.companyProfiles).toBeDefined();
  });

  it("should export priceBookItems table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.priceBookItems).toBeDefined();
  });

  it("should export estimateCorrections table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.estimateCorrections).toBeDefined();
  });

  it("should export jobOutcomes table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.jobOutcomes).toBeDefined();
  });

  it("should have xero fields on companyProfiles table", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("drizzle/schema.ts", "utf-8");
    expect(content).toContain("xeroTenantId");
    expect(content).toContain("xeroAccessToken");
    expect(content).toContain("xeroRefreshToken");
  });
});

// ── Correction Capture in Estimates Router ──
describe("Correction Capture in Estimates Router", () => {
  it("should import estimateCorrections in estimates router", async () => {
    // Verify the estimates router file has the correction capture code
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers/estimates.ts", "utf-8");
    expect(content).toContain("estimateCorrections");
    expect(content).toContain("Correction capture");
    expect(content).toContain("quantity_change");
    expect(content).toContain("rate_change");
    expect(content).toContain("waste_change");
    expect(content).toContain("description_change");
    expect(content).toContain("unit_change");
  });
});

// ── AI Memory Integration ──
describe("AI Memory Integration", () => {
  it("should have company memory injection in AI router", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/routers/ai.ts", "utf-8");
    expect(content).toContain("companyProfiles");
    expect(content).toContain("priceBookItems");
    expect(content).toContain("COMPANY PRICE BOOK");
    expect(content).toContain("COMPANY AI INSTRUCTIONS");
  });
});

// ── ENV Configuration ──
describe("ENV Configuration", () => {
  it("documents optional Xero OAuth app configuration", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("server/_core/env.ts", "utf-8");
    expect(content).toContain("xeroClientId");
    expect(content).toContain("xeroClientSecret");
  });
});
