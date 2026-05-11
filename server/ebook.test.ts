/**
 * Ebook Lead Magnet Tests
 * Tests the ebook email sequence functions and capture flow
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the resendSender module
vi.mock("./resendSender", () => ({
  sendEmail: vi.fn().mockResolvedValue("test-message-id-ebook"),
  sendEmailWithAttachment: vi.fn().mockResolvedValue("test-message-id-attachment"),
}));

import {
  sendEbookDelivery,
  sendEbookNurtureDay2,
  sendEbookNurtureDay4,
  sendEbookNurtureDay7,
  sendEbookNurtureDay10,
} from "./ebookEmail";
import { sendEmail } from "./resendSender";

const mockSendEmail = vi.mocked(sendEmail);

describe("Ebook Email Sequence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Day 0: Ebook Delivery", () => {
    it("sends the ebook delivery email", async () => {
      const result = await sendEbookDelivery({
        to: "dave@example.com.au",
        name: "Dave Smith",
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(result).toBe("test-message-id-ebook");
    });

    it("uses correct subject line with first name", async () => {
      await sendEbookDelivery({ to: "test@test.com", name: "John Builder" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.subject).toContain("John");
      expect(call.subject).toContain("From Plans to Quote in Minutes");
    });

    it("sends from Matt's Kindai address", async () => {
      await sendEbookDelivery({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.fromName).toBe("Matt from Kindai");
      expect(call.replyTo).toBe("matt@kindaiestimator.com");
    });

    it("includes ebook download link in HTML", async () => {
      await sendEbookDelivery({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("manuscdn.com");
    });

    it("includes demo link in HTML", async () => {
      await sendEbookDelivery({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("kindaiestimator.com/demo");
    });

    it("returns null when sendEmail fails", async () => {
      mockSendEmail.mockResolvedValueOnce(null);
      const result = await sendEbookDelivery({ to: "test@test.com", name: "Test" });
      expect(result).toBeNull();
    });
  });

  describe("Day 2: Quoting Mistake Email", () => {
    it("sends the day 2 nurture email", async () => {
      const result = await sendEbookNurtureDay2({
        to: "dave@example.com.au",
        name: "Dave Smith",
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(result).toBe("test-message-id-ebook");
    });

    it("has correct subject about quoting mistake", async () => {
      await sendEbookNurtureDay2({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.subject).toContain("mistake");
    });

    it("includes demo link", async () => {
      await sendEbookNurtureDay2({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("kindaiestimator.com/demo");
    });
  });

  describe("Day 4: Social Proof Email", () => {
    it("sends the day 4 nurture email", async () => {
      const result = await sendEbookNurtureDay4({
        to: "dave@example.com.au",
        name: "Dave Smith",
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(result).toBe("test-message-id-ebook");
    });

    it("includes beta signup link", async () => {
      await sendEbookNurtureDay4({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("kindaiestimator.com/beta");
    });

    it("includes social proof quote from beta user", async () => {
      await sendEbookNurtureDay4({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("40 minutes");
    });
  });

  describe("Day 7: ROI Calculator Email", () => {
    it("sends the day 7 nurture email", async () => {
      const result = await sendEbookNurtureDay7({
        to: "dave@example.com.au",
        name: "Dave Smith",
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(result).toBe("test-message-id-ebook");
    });

    it("includes ROI numbers", async () => {
      await sendEbookNurtureDay7({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("$41,400");
    });

    it("includes beta signup CTA", async () => {
      await sendEbookNurtureDay7({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("kindaiestimator.com/beta");
    });
  });

  describe("Day 10: Last Chance Email", () => {
    it("sends the day 10 last chance email", async () => {
      const result = await sendEbookNurtureDay10({
        to: "dave@example.com.au",
        name: "Dave Smith",
      });

      expect(mockSendEmail).toHaveBeenCalledTimes(1);
      expect(result).toBe("test-message-id-ebook");
    });

    it("uses first name in subject", async () => {
      await sendEbookNurtureDay10({ to: "test@test.com", name: "Dave Smith" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.subject).toContain("Dave");
    });

    it("mentions pilot spot", async () => {
      await sendEbookNurtureDay10({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("pilot");
    });

    it("includes beta signup CTA", async () => {
      await sendEbookNurtureDay10({ to: "test@test.com", name: "Test User" });

      const call = mockSendEmail.mock.calls[0][0];
      expect(call.html).toContain("kindaiestimator.com/beta");
    });
  });

  describe("Email sequence coverage", () => {
    it("all 5 emails in sequence use correct fromName", async () => {
      const fns = [
        sendEbookDelivery,
        sendEbookNurtureDay2,
        sendEbookNurtureDay4,
        sendEbookNurtureDay7,
        sendEbookNurtureDay10,
      ];

      for (const fn of fns) {
        vi.clearAllMocks();
        await fn({ to: "test@test.com", name: "Test User" });
        const call = mockSendEmail.mock.calls[0][0];
        expect(call.fromName).toBe("Matt from Kindai");
        expect(call.replyTo).toBe("matt@kindaiestimator.com");
      }
    });

    it("all 5 emails include branded HTML wrapper", async () => {
      const fns = [
        sendEbookDelivery,
        sendEbookNurtureDay2,
        sendEbookNurtureDay4,
        sendEbookNurtureDay7,
        sendEbookNurtureDay10,
      ];

      for (const fn of fns) {
        vi.clearAllMocks();
        await fn({ to: "test@test.com", name: "Test User" });
        const call = mockSendEmail.mock.calls[0][0];
        // All emails should use the branded wrapper (dark background)
        expect(call.html).toContain("0d1117");
        expect(call.html).toContain("kindaiestimator.com");
      }
    });
  });
});
