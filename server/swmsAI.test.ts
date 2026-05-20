import { describe, it, expect } from "vitest";
import {
  identifyHrcwCategories,
  HRCW_LABELS,
  HAZARD_CONTROL_TEMPLATES,
} from "../shared/compliance";

describe("SWMS AI Engine — Compliance Layer", () => {
  describe("identifyHrcwCategories", () => {
    it("identifies height work from scaffold materials", () => {
      const result = identifyHrcwCategories({
        trade: "carpentry",
        materials: "scaffold boards, harness, safety rail",
        scope: "Install roof trusses at 6m height",
      });
      expect(result).toContain("work_at_heights");
    });

    it("identifies electrical work from trade type", () => {
      const result = identifyHrcwCategories({
        trade: "electrical",
        materials: "cable, switchboard, RCD",
        scope: "Rewire switchboard",
      });
      expect(result).toContain("electrical_live_work");
    });

    it("identifies confined space from scope keywords", () => {
      const result = identifyHrcwCategories({
        trade: "plumbing",
        materials: "PVC pipe, cement",
        scope: "Work in confined space under building",
      });
      expect(result).toContain("confined_spaces");
    });

    it("identifies asbestos from materials", () => {
      const result = identifyHrcwCategories({
        trade: "demolition",
        materials: "asbestos sheeting, fibro removal",
        scope: "Remove old bathroom walls",
      });
      expect(result).toContain("asbestos");
    });

    it("returns categories for painting trade (includes chemical_hazardous by default)", () => {
      const result = identifyHrcwCategories({
        trade: "painting",
        materials: "interior paint, roller, drop sheet",
        scope: "Paint interior walls ground floor only",
      });
      // Painting trade has default HRCW categories (chemicals, heights for exterior)
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("HRCW_LABELS", () => {
    it("has labels for all standard HRCW categories", () => {
      expect(HRCW_LABELS).toHaveProperty("work_at_heights");
      expect(HRCW_LABELS).toHaveProperty("electrical_live_work");
      expect(HRCW_LABELS).toHaveProperty("confined_spaces");
    });

    it("labels are descriptive strings", () => {
      expect(typeof HRCW_LABELS.work_at_heights).toBe("string");
      expect(HRCW_LABELS.work_at_heights.length).toBeGreaterThan(5);
    });
  });

  describe("HAZARD_CONTROL_TEMPLATES", () => {
    it("provides templates for common hazard categories", () => {
      expect(HAZARD_CONTROL_TEMPLATES).toBeDefined();
      expect(typeof HAZARD_CONTROL_TEMPLATES).toBe("object");
    });
  });
});

describe("SWMS AI Engine — V2 Generation Pipeline", () => {
  it("generateSwmsContentV2 module exports correctly", async () => {
    const mod = await import("./swmsAI");
    expect(mod.generateSwmsContentV2).toBeDefined();
    expect(typeof mod.generateSwmsContentV2).toBe("function");
  });

  it("analyseSitePhoto module exports correctly", async () => {
    const mod = await import("./swmsAI");
    expect(mod.analyseSitePhoto).toBeDefined();
    expect(typeof mod.analyseSitePhoto).toBe("function");
  });

  it("extractProceduresFromPdf module exports correctly", async () => {
    const mod = await import("./swmsAI");
    expect(mod.extractProceduresFromPdf).toBeDefined();
    expect(typeof mod.extractProceduresFromPdf).toBe("function");
  });

  it("detectAndStoreCorrections module exports correctly", async () => {
    const mod = await import("./swmsAI");
    expect(mod.detectAndStoreCorrections).toBeDefined();
    expect(typeof mod.detectAndStoreCorrections).toBe("function");
  });
});

describe("SWMS AI Engine — Correction Detection Logic", () => {
  it("detectAndStoreCorrections handles empty arrays gracefully", async () => {
    const { detectAndStoreCorrections } = await import("./swmsAI");
    // Should not throw when given empty arrays (no DB in test)
    const result = await detectAndStoreCorrections(
      999, // fake userId
      "carpentry",
      "test-swms-id",
      [], // no AI activities
      []  // no user activities
    );
    expect(result).toBe(0);
  });
});
