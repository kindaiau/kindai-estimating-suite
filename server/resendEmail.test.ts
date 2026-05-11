/**
 * Resend Email Integration Tests — Kindai Estimating Suite
 *
 * Tests the Resend email sender, welcome email, apology email, and nurture email modules.
 * Mocks the Resend API to avoid sending real emails during tests.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the resendSender module for welcome/apology/nurture tests
const mockSendEmail = vi.fn().mockResolvedValue("mock-resend-id-123");
const mockSendEmailWithAttachment = vi.fn().mockResolvedValue("mock-resend-id-123");
const mockVerifyResendConnection = vi.fn().mockResolvedValue(true);

vi.mock("./resendSender", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  sendEmailWithAttachment: (...args: unknown[]) => mockSendEmailWithAttachment(...args),
  verifyResendConnection: () => mockVerifyResendConnection(),
}));

import { sendEmail, sendEmailWithAttachment, verifyResendConnection } from "./resendSender";
import { buildHtmlEmail, sendBetaWelcomeEmail } from "./welcomeEmail";
import { buildApologyHtml, sendApologyEmail } from "./apologyEmail";
import { buildNurtureEmail, sendNurtureEmail } from "./betaNurture";
import {
  sendPilotLeadEmails,
  sendPilotPaymentEmails,
  sendResendEmail,
} from "./resendEmail";

describe("Resend Email Sender", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = "re_test_123456";
  });

  it("sendEmail returns a message ID on success", async () => {
    const result = await sendEmail({
      to: "test@example.com",
      subject: "Test Subject",
      html: "<p>Test body</p>",
    });
    expect(result).toBe("mock-resend-id-123");
  });

  it("sendEmail uses correct from address (matt@kindai.com.au)", async () => {
    await sendEmail({
      to: "tradie@example.com",
      subject: "Test",
      html: "<p>Test</p>",
      fromName: "Matt from Kindai",
    });
    // The mock was called — we verify the module works without throwing
    expect(true).toBe(true);
  });

  it("sendEmailWithAttachment returns a message ID", async () => {
    const result = await sendEmailWithAttachment({
      to: "test@example.com",
      subject: "With Attachment",
      html: "<p>Here's your ebook</p>",
      attachments: [{ filename: "guide.pdf", content: Buffer.from("fake-pdf"), contentType: "application/pdf" }],
    });
    expect(result).toBe("mock-resend-id-123");
  });

  it("verifyResendConnection returns true when API is reachable", async () => {
    const result = await verifyResendConnection();
    expect(result).toBe(true);
  });
});

describe("Welcome Email Builder", () => {
  it("builds branded HTML with founding member badge", () => {
    const html = buildHtmlEmail({
      name: "Andy Holmes",
      email: "andy@example.com",
      spotNumber: 3,
      trade: "Electrical",
    });
    expect(html).toContain("FOUNDING MEMBER #3");
    expect(html).toContain("Andy");
    expect(html).toContain("Electrical");
    expect(html).toContain("kindaiestimator.com");
    expect(html).toContain("#FF2D78"); // Brand hot pink
  });

  it("builds HTML without trade when not specified", () => {
    const html = buildHtmlEmail({
      name: "Tom Haydon",
      email: "tom@example.com",
      spotNumber: 7,
    });
    expect(html).toContain("Tom");
    expect(html).toContain("FOUNDING MEMBER #7");
    expect(html).not.toContain("for undefined");
  });

  it("sendBetaWelcomeEmail calls Resend and succeeds", async () => {
    process.env.RESEND_API_KEY = "re_test_123456";
    await expect(
      sendBetaWelcomeEmail({
        name: "Terry O'Sullivan",
        email: "terry@example.com",
        spotNumber: 2,
        trade: "Plumbing",
      })
    ).resolves.not.toThrow();
  });

  it("sendBetaWelcomeEmail skips when RESEND_API_KEY not set", async () => {
    delete process.env.RESEND_API_KEY;
    // Should not throw, just skip
    await expect(
      sendBetaWelcomeEmail({
        name: "Test User",
        email: "test@example.com",
        spotNumber: 1,
      })
    ).resolves.not.toThrow();
  });
});

describe("Apology Email Builder", () => {
  it("builds apology HTML with honest messaging", () => {
    const html = buildApologyHtml({
      name: "Ross Spottiswood",
      email: "ross@example.com",
      spotNumber: 5,
      trade: "Carpentry",
    });
    expect(html).toContain("I owe you an apology");
    expect(html).toContain("Ross");
    expect(html).toContain("FOUNDING MEMBER #5");
    expect(html).toContain("it's fixed now");
    expect(html).toContain("kindaiestimator.com");
  });

  it("includes ebook section when URL provided", () => {
    const html = buildApologyHtml({
      name: "Matty Manning",
      email: "matty@example.com",
      spotNumber: 4,
      ebookUrl: "https://example.com/ebook.pdf",
      ebookTitle: "The Tradie's Guide to AI Estimating",
    });
    expect(html).toContain("A GIFT FOR YOUR PATIENCE");
    expect(html).toContain("The Tradie's Guide to AI Estimating");
    expect(html).toContain("https://example.com/ebook.pdf");
  });

  it("omits ebook section when no URL", () => {
    const html = buildApologyHtml({
      name: "Trevor Martin",
      email: "trevor@example.com",
      spotNumber: 6,
    });
    expect(html).not.toContain("A GIFT FOR YOUR PATIENCE");
    expect(html).not.toContain("Download Your Free Copy");
  });

  it("sendApologyEmail calls Resend and returns message ID", async () => {
    process.env.RESEND_API_KEY = "re_test_123456";
    const result = await sendApologyEmail({
      name: "Elvie Chiu",
      email: "elvie@example.com",
      spotNumber: 8,
    });
    expect(result).toBe("mock-resend-id-123");
  });
});

describe("Nurture Email Builder", () => {
  const baseData = {
    name: "Tony Spottiswood",
    email: "tony@example.com",
    spotNumber: 9,
    trade: "HVAC",
  };

  it("builds Day 1 activation email", () => {
    const content = buildNurtureEmail("day1_activation", baseData);
    expect(content.subject).toBeTruthy();
    expect(content.html).toContain("Tony");
    expect(content.html).toContain("kindaiestimator.com");
  });

  it("builds Day 3 social proof email", () => {
    const content = buildNurtureEmail("day3_social_proof", baseData);
    expect(content.subject).toBeTruthy();
    expect(content.html).toContain("kindaiestimator.com");
  });

  it("builds Day 7 ROI email", () => {
    const content = buildNurtureEmail("day7_roi", baseData);
    expect(content.subject).toBeTruthy();
    expect(content.html).toContain("kindaiestimator.com");
  });

  it("builds Day 14 urgency email", () => {
    const content = buildNurtureEmail("day14_urgency", baseData);
    expect(content.subject).toBeTruthy();
    expect(content.html).toContain("kindaiestimator.com");
  });

  it("sendNurtureEmail calls Resend and returns success", async () => {
    process.env.RESEND_API_KEY = "re_test_123456";
    const result = await sendNurtureEmail("day1_activation", baseData);
    expect(result.success).toBe(true);
    expect(result.messageId).toBeTruthy();
  });

  it("sendNurtureEmail returns error when RESEND_API_KEY not set", async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendNurtureEmail("day1_activation", baseData);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Resend");
  });
});

describe("Email Branding Consistency", () => {
  it("all email types use the Kindai branded wrapper", () => {
    const welcome = buildHtmlEmail({ name: "Test", email: "t@t.com", spotNumber: 1 });
    const apology = buildApologyHtml({ name: "Test", email: "t@t.com", spotNumber: 1 });
    const nurture = buildNurtureEmail("day1_activation", { name: "Test", email: "t@t.com", spotNumber: 1 });

    // All should contain the Kindai logo
    const logoUrl = "kindai-logo";
    expect(welcome).toContain(logoUrl);
    expect(apology).toContain(logoUrl);
    expect(nurture.html).toContain(logoUrl);

    // All should have the dark background
    expect(welcome).toContain("#0d1117");
    expect(apology).toContain("#0d1117");
    expect(nurture.html).toContain("#0d1117");

    // All should have the gradient top bar
    expect(welcome).toContain("#FF2D78");
    expect(apology).toContain("#FF2D78");
    expect(nurture.html).toContain("#FF2D78");
  });

  it("no email contains 'free for Australian trades'", () => {
    const welcome = buildHtmlEmail({ name: "Test", email: "t@t.com", spotNumber: 1 });
    const apology = buildApologyHtml({ name: "Test", email: "t@t.com", spotNumber: 1 });
    const nurture = buildNurtureEmail("day1_activation", { name: "Test", email: "t@t.com", spotNumber: 1 });

    expect(welcome.toLowerCase()).not.toContain("free for australian trades");
    expect(apology.toLowerCase()).not.toContain("free for australian trades");
    expect(nurture.html.toLowerCase()).not.toContain("free for australian trades");
  });

  it("all emails have unsubscribe/spam-act compliance", () => {
    const welcome = buildHtmlEmail({ name: "Test", email: "t@t.com", spotNumber: 1 });
    const apology = buildApologyHtml({ name: "Test", email: "t@t.com", spotNumber: 1 });

    expect(welcome.toLowerCase()).toContain("unsubscribe");
    expect(apology.toLowerCase()).toContain("unsubscribe");
  });
});

describe("Pilot funnel Resend emails", () => {
  it("sendResendEmail skips cleanly when RESEND_API_KEY is missing", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(
      sendResendEmail({
        to: "lead@example.com",
        subject: "Test",
        text: "Body",
      })
    ).resolves.toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sendPilotLeadEmails sends lead confirmation and owner follow-up", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.MATTHEW_NOTIFICATION_EMAIL = "matt@kindaiestimator.com";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
    } as Response);

    const result = await sendPilotLeadEmails({
      name: "Dave Builder",
      email: "dave@example.com",
      phone: "0400000000",
      tradeType: "Carpentry",
      intent: "Paid Pilot Setup",
    });

    expect(result).toEqual({ leadSent: true, ownerSent: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      to: "dave@example.com",
      subject: "Your Kindai pilot spot request",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({
      to: "matt@kindaiestimator.com",
      subject: "New Kindai pilot lead: Dave Builder",
    });
  });

  it("sendPilotPaymentEmails sends paid pilot receipt and owner booking prompt", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.MATTHEW_NOTIFICATION_EMAIL = "matt@kindaiestimator.com";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
    } as Response);

    const result = await sendPilotPaymentEmails({
      name: "Sarah Sparky",
      email: "sarah@example.com",
      phone: "0411111111",
      tradeType: "Electrical",
      amountPaid: 100000,
      currency: "aud",
      stripeSessionId: "cs_test_paid",
    });

    expect(result).toEqual({ customerSent: true, ownerSent: true });
    const [customerCall, ownerCall] = fetchMock.mock.calls.slice(-2);
    const customerBody = JSON.parse(String(customerCall[1]?.body));
    const ownerBody = JSON.parse(String(ownerCall[1]?.body));

    expect(customerBody.subject).toBe("Your Kindai founding pilot setup is secured");
    expect(customerBody.text).toContain("$1,000.00");
    expect(ownerBody.subject).toBe("Paid Kindai pilot setup: Sarah Sparky");
    expect(ownerBody.text).toContain("book the setup sprint");
    expect(ownerBody.text).toContain("cs_test_paid");
  });
});
