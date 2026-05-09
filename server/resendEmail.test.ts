import { afterEach, describe, expect, it, vi } from "vitest";
import {
  sendPilotLeadEmails,
  sendPilotPaymentEmails,
  sendResendEmail,
} from "./resendEmail";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("Resend pilot emails", () => {
  it("skips email cleanly when RESEND_API_KEY is missing", async () => {
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

  it("sends pilot lead confirmation and owner follow-up", async () => {
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

  it("sends paid pilot receipt and owner booking prompt", async () => {
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
    const customerBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const ownerBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));

    expect(customerBody.subject).toBe("Your Kindai founding pilot setup is secured");
    expect(customerBody.text).toContain("$1,000.00");
    expect(ownerBody.subject).toBe("Paid Kindai pilot setup: Sarah Sparky");
    expect(ownerBody.text).toContain("book the setup sprint");
    expect(ownerBody.text).toContain("cs_test_paid");
  });
});
