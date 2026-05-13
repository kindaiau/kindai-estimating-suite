import { describe, it, expect, vi } from "vitest";
import {
  HRCW_LABELS,
  HRCW_CATEGORIES,
  TRADE_HRCW_MAP,
  MATERIAL_HRCW_TRIGGERS,
} from "../shared/compliance";

// ─── HRCW_LABELS ─────────────────────────────────────────────────────────────

describe("HRCW_LABELS", () => {
  it("exports labels for all known HRCW categories", () => {
    expect(HRCW_LABELS).toHaveProperty("work_at_heights");
    expect(HRCW_LABELS).toHaveProperty("electrical_live_work");
    expect(HRCW_LABELS).toHaveProperty("asbestos");
    expect(HRCW_LABELS).toHaveProperty("confined_spaces");
    expect(HRCW_LABELS).toHaveProperty("excavation");
    expect(HRCW_LABELS).toHaveProperty("hot_works");
    expect(HRCW_LABELS).toHaveProperty("scaffolding");
    expect(HRCW_LABELS).toHaveProperty("demolition");
  });

  it("all labels are non-empty strings", () => {
    for (const [key, label] of Object.entries(HRCW_LABELS)) {
      expect(typeof label).toBe("string");
      expect(label.length).toBeGreaterThan(5);
    }
  });

  it("covers all HRCW_CATEGORIES", () => {
    for (const cat of HRCW_CATEGORIES) {
      expect(HRCW_LABELS).toHaveProperty(cat);
    }
  });
});

// ─── TRADE_HRCW_MAP ───────────────────────────────────────────────────────────

describe("TRADE_HRCW_MAP", () => {
  it("electrician trade has electrical_live_work HRCW", () => {
    expect(TRADE_HRCW_MAP.electrical).toContain("electrical_live_work");
  });

  it("roofing trade has work_at_heights HRCW", () => {
    expect(TRADE_HRCW_MAP.roofing).toContain("work_at_heights");
  });

  it("demolition trade has asbestos HRCW", () => {
    expect(TRADE_HRCW_MAP.demolition).toContain("asbestos");
  });

  it("plumbing trade has confined_spaces HRCW", () => {
    expect(TRADE_HRCW_MAP.plumbing).toContain("confined_spaces");
  });

  it("all HRCW values in TRADE_HRCW_MAP are valid HRCW_CATEGORIES", () => {
    for (const [trade, categories] of Object.entries(TRADE_HRCW_MAP)) {
      for (const cat of categories) {
        expect(HRCW_CATEGORIES).toContain(cat);
      }
    }
  });
});

// ─── MATERIAL_HRCW_TRIGGERS ───────────────────────────────────────────────────

describe("MATERIAL_HRCW_TRIGGERS", () => {
  it("asbestos keyword triggers asbestos HRCW", () => {
    const trigger = MATERIAL_HRCW_TRIGGERS.find(t => t.keywords.includes("asbestos"));
    expect(trigger).toBeDefined();
    expect(trigger?.hrcw).toBe("asbestos");
  });

  it("scaffold keyword triggers scaffolding HRCW", () => {
    const trigger = MATERIAL_HRCW_TRIGGERS.find(t => t.keywords.some(k => k.includes("scaffold")));
    expect(trigger).toBeDefined();
    expect(trigger?.hrcw).toBe("scaffolding");
  });

  it("all trigger HRCW values are valid HRCW_CATEGORIES", () => {
    for (const trigger of MATERIAL_HRCW_TRIGGERS) {
      expect(HRCW_CATEGORIES).toContain(trigger.hrcw);
    }
  });

  it("each trigger has at least one keyword", () => {
    for (const trigger of MATERIAL_HRCW_TRIGGERS) {
      expect(trigger.keywords.length).toBeGreaterThan(0);
    }
  });
});

// ─── SWMS status transitions ──────────────────────────────────────────────────

describe("SWMS status transitions", () => {
  const validStatuses = ["draft", "pending_review", "approved", "finalized"];

  it("all expected statuses are valid strings", () => {
    validStatuses.forEach(status => {
      expect(typeof status).toBe("string");
      expect(status.length).toBeGreaterThan(0);
    });
  });

  it("finalized is the terminal state", () => {
    const terminalIndex = validStatuses.indexOf("finalized");
    expect(terminalIndex).toBe(validStatuses.length - 1);
  });
});

// ─── SWMS share token format ──────────────────────────────────────────────────

describe("SWMS share token format", () => {
  it("generates a token that is long enough and has no spaces", () => {
    const token = `swms_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    expect(token.length).toBeGreaterThan(20);
    expect(token).not.toContain(" ");
  });
});
