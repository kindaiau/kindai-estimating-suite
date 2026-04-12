/**
 * Gmail Sender Tests — Kindai Estimating Suite
 *
 * Tests the gmailSender module by mocking the exported gmailTransport singleton.
 * Does NOT make real network calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock nodemailer with inline factory ─────────────────────────────────────

vi.mock("nodemailer", () => {
  const sendMail = vi.fn();
  const verify = vi.fn();
  const createTransport = vi.fn(() => ({ sendMail, verify }));
  return { default: { createTransport }, createTransport };
});

// ─── Import module under test AFTER mock ─────────────────────────────────────

import { sendEmail, verifyGmailConnection, gmailTransport } from "./gmailSender";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const transport = gmailTransport as unknown as {
  sendMail: ReturnType<typeof vi.fn>;
  verify: ReturnType<typeof vi.fn>;
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── sendEmail tests ──────────────────────────────────────────────────────────

describe("sendEmail", () => {
  it("returns true when sendMail succeeds", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "test-msg-id-123" });

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Hello</p>",
    });

    expect(result).toBe(true);
    expect(transport.sendMail).toHaveBeenCalledOnce();
  });

  it("sends to the correct recipient", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "abc" });

    await sendEmail({
      to: "dave@sparkysolutions.com.au",
      subject: "Welcome",
      html: "<p>Welcome</p>",
    });

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.to).toBe("dave@sparkysolutions.com.au");
  });

  it("uses fromName in the From header", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "abc" });

    await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      fromName: "Matt Symons — Kindai",
    });

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.from).toContain("Matt Symons");
  });

  it("uses replyTo when provided", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "abc" });

    await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
      replyTo: "matt@kindaiestimator.com",
    });

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.replyTo).toBe("matt@kindaiestimator.com");
  });

  it("falls back to default replyTo when not provided", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "abc" });

    await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
    });

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.replyTo).toBe("matt@kindaiestimator.com");
  });

  it("returns false when sendMail throws", async () => {
    transport.sendMail.mockRejectedValueOnce(new Error("SMTP connection refused"));

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
    });

    expect(result).toBe(false);
  });

  it("sends HTML content correctly", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "abc" });

    const html = "<h1>Welcome to Kindai</h1><p>Your spot is #1</p>";
    await sendEmail({
      to: "test@example.com",
      subject: "Welcome",
      html,
    });

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.html).toBe(html);
  });

  it("sends subject correctly", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "abc" });

    await sendEmail({
      to: "test@example.com",
      subject: "Founding Member #5 — Welcome to Kindai Beta",
      html: "<p>Hi</p>",
    });

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.subject).toBe("Founding Member #5 — Welcome to Kindai Beta");
  });

  it("uses default fromName when not provided", async () => {
    transport.sendMail.mockResolvedValueOnce({ messageId: "abc" });

    await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hi</p>",
    });

    const callArgs = transport.sendMail.mock.calls[0][0];
    expect(callArgs.from).toContain("Kindai");
  });
});

// ─── verifyGmailConnection tests ──────────────────────────────────────────────

describe("verifyGmailConnection", () => {
  it("returns true when verify succeeds", async () => {
    transport.verify.mockResolvedValueOnce(true);

    const result = await verifyGmailConnection();
    expect(result).toBe(true);
  });

  it("returns false when verify throws", async () => {
    transport.verify.mockRejectedValueOnce(new Error("Invalid credentials"));

    const result = await verifyGmailConnection();
    expect(result).toBe(false);
  });
});
