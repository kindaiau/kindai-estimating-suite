import { describe, expect, it } from "vitest";
import {
  buildNurtureEmail,
  NURTURE_SEQUENCE,
  type NurtureEmailKey,
  type NurtureEmailData,
} from "./betaNurture";

// ─── Test data ───────────────────────────────────────────────────────────────

const SAMPLE_DATA: NurtureEmailData = {
  name: "Dave Johnson",
  email: "dave@sparkysolutions.com.au",
  spotNumber: 7,
  trade: "Electrical",
};

const SAMPLE_DATA_NO_TRADE: NurtureEmailData = {
  name: "Sarah Mitchell",
  email: "sarah@example.com",
  spotNumber: 12,
};

const ALL_KEYS: NurtureEmailKey[] = [
  "day1_activation",
  "day3_social_proof",
  "day7_roi",
  "day14_urgency",
];

// ─── Sequence structure tests ────────────────────────────────────────────────

describe("NURTURE_SEQUENCE", () => {
  it("contains exactly 4 emails", () => {
    expect(NURTURE_SEQUENCE).toHaveLength(4);
  });

  it("has correct day offsets in ascending order", () => {
    const offsets = NURTURE_SEQUENCE.map((s) => s.dayOffset);
    expect(offsets).toEqual([1, 3, 7, 14]);
  });

  it("has unique email keys", () => {
    const keys = NURTURE_SEQUENCE.map((s) => s.emailKey);
    expect(new Set(keys).size).toBe(4);
  });

  it("all email keys match the expected set", () => {
    const keys = NURTURE_SEQUENCE.map((s) => s.emailKey);
    expect(keys).toEqual(ALL_KEYS);
  });

  it("all items have non-empty labels", () => {
    for (const step of NURTURE_SEQUENCE) {
      expect(step.label.length).toBeGreaterThan(0);
    }
  });
});

// ─── Email content tests ─────────────────────────────────────────────────────

describe("buildNurtureEmail", () => {
  describe("all emails", () => {
    for (const key of ALL_KEYS) {
      it(`${key}: returns subject, html, and text`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.subject).toBeTruthy();
        expect(result.html).toBeTruthy();
        expect(result.text).toBeTruthy();
      });

      it(`${key}: HTML contains DOCTYPE and proper structure`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.html).toContain("<!DOCTYPE html>");
        expect(result.html).toContain("</html>");
        expect(result.html).toContain("</body>");
      });

      it(`${key}: includes Kindai logo`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.html).toContain("kindai-logo");
      });

      it(`${key}: includes unsubscribe notice (AU Spam Act)`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.html.toLowerCase()).toContain("unsubscribe");
        expect(result.text.toLowerCase()).toContain("unsubscribe");
      });

      it(`${key}: includes matt@kindaiestimator.com reply address`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.html).toContain("matt@kindaiestimator.com");
        expect(result.text).toContain("matt@kindaiestimator.com");
      });

      it(`${key}: includes kindaiestimator.com link`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.html).toContain("kindaiestimator.com");
        expect(result.text).toContain("kindaiestimator.com");
      });

      it(`${key}: personalises with first name`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.html).toContain("Dave");
        expect(result.text).toContain("Dave");
      });

      it(`${key}: text version does not contain HTML tags`, () => {
        const result = buildNurtureEmail(key, SAMPLE_DATA);
        expect(result.text).not.toMatch(/<[a-z][\s\S]*>/i);
      });
    }
  });

  describe("day1_activation", () => {
    it("subject mentions first name and 60 seconds", () => {
      const result = buildNurtureEmail("day1_activation", SAMPLE_DATA);
      expect(result.subject).toContain("Dave");
      expect(result.subject.toLowerCase()).toContain("60 seconds");
    });

    it("includes step-by-step instructions", () => {
      const result = buildNurtureEmail("day1_activation", SAMPLE_DATA);
      expect(result.html).toContain("AI Takeoff");
      expect(result.text).toContain("AI Takeoff");
    });

    it("includes trade name when provided", () => {
      const result = buildNurtureEmail("day1_activation", SAMPLE_DATA);
      expect(result.html).toContain("Electrical");
    });

    it("uses generic trade text when no trade provided", () => {
      const result = buildNurtureEmail("day1_activation", SAMPLE_DATA_NO_TRADE);
      expect(result.html).toContain("your trade");
    });
  });

  describe("day3_social_proof", () => {
    it("subject mentions tradies and speed", () => {
      const result = buildNurtureEmail("day3_social_proof", SAMPLE_DATA);
      expect(result.subject.toLowerCase()).toContain("tradies");
      expect(result.subject.toLowerCase()).toContain("faster");
    });

    it("includes testimonial quote", () => {
      const result = buildNurtureEmail("day3_social_proof", SAMPLE_DATA);
      expect(result.html).toContain("Beta tester");
    });

    it("includes stat cards (58 sec, $45K)", () => {
      const result = buildNurtureEmail("day3_social_proof", SAMPLE_DATA);
      expect(result.html).toContain("58 sec");
      expect(result.html).toContain("$45K");
    });
  });

  describe("day7_roi", () => {
    it("subject mentions $120K question", () => {
      const result = buildNurtureEmail("day7_roi", SAMPLE_DATA);
      expect(result.subject).toContain("$120K");
    });

    it("includes ROI breakdown table", () => {
      const result = buildNurtureEmail("day7_roi", SAMPLE_DATA);
      expect(result.html).toContain("$95K");
      expect(result.html).toContain("$38,400");
    });

    it("mentions founding member pricing", () => {
      const result = buildNurtureEmail("day7_roi", SAMPLE_DATA);
      expect(result.html.toLowerCase()).toContain("founding member");
    });
  });

  describe("day14_urgency", () => {
    it("subject is personal and honest", () => {
      const result = buildNurtureEmail("day14_urgency", SAMPLE_DATA);
      expect(result.subject).toContain("Dave");
      expect(result.subject.toLowerCase()).toContain("beta");
    });

    it("includes spot number", () => {
      const result = buildNurtureEmail("day14_urgency", SAMPLE_DATA);
      expect(result.html).toContain("#7 of 25");
    });

    it("includes the founding member perks checklist", () => {
      const result = buildNurtureEmail("day14_urgency", SAMPLE_DATA);
      expect(result.html).toContain("Full platform access");
      expect(result.html).toContain("Founding member pricing");
    });

    it("includes no-hard-feelings language", () => {
      const result = buildNurtureEmail("day14_urgency", SAMPLE_DATA);
      expect(result.text.toLowerCase()).toContain("no hard feelings");
    });
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("handles single-word name", () => {
    const data = { ...SAMPLE_DATA, name: "Davo" };
    const result = buildNurtureEmail("day1_activation", data);
    expect(result.html).toContain("Davo");
  });

  it("handles very long name gracefully", () => {
    const data = { ...SAMPLE_DATA, name: "Christopher Alexander Bartholomew Johnson III" };
    const result = buildNurtureEmail("day1_activation", data);
    expect(result.html).toContain("Christopher");
    expect(result.html).not.toContain("Christopher Alexander Bartholomew");
  });

  it("handles spot number 1", () => {
    const data = { ...SAMPLE_DATA, spotNumber: 1 };
    const result = buildNurtureEmail("day14_urgency", data);
    expect(result.html).toContain("#1 of 25");
  });

  it("handles spot number 25", () => {
    const data = { ...SAMPLE_DATA, spotNumber: 25 };
    const result = buildNurtureEmail("day14_urgency", data);
    expect(result.html).toContain("#25 of 25");
  });
});
