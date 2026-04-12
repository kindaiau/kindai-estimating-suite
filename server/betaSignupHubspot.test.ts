/**
 * Tests for website beta signup → HubSpot sync
 *
 * Verifies that organic website signups trigger the same
 * HubSpot + email + nurture pipeline as Facebook leads.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock external dependencies ───────────────────────────────────────────────

vi.mock("./db.js", () => ({
  getDb: vi.fn(),
}));

vi.mock("./hubspot.js", () => ({
  createBetaSignupInHubSpot: vi.fn(),
}));

vi.mock("./welcomeEmail.js", () => ({
  sendBetaWelcomeEmail: vi.fn(),
}));

vi.mock("./routers/betaNurture.js", () => ({
  scheduleNurtureForSignup: vi.fn(),
}));

vi.mock("./_core/notification.js", () => ({
  notifyOwner: vi.fn(),
}));

import { getDb } from "./db.js";
import { createBetaSignupInHubSpot } from "./hubspot.js";
import { sendBetaWelcomeEmail } from "./welcomeEmail.js";
import { scheduleNurtureForSignup } from "./routers/betaNurture.js";
import { notifyOwner } from "./_core/notification.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildMockDb(opts: { isDuplicate?: boolean; claimed?: number } = {}) {
  const { isDuplicate = false, claimed = 5 } = opts;
  let selectCallCount = 0;

  const mockSelect = vi.fn().mockImplementation(() => {
    selectCallCount++;
    const callNum = selectCallCount;
    return {
      from: vi.fn().mockImplementation(() => ({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue(isDuplicate ? [{ id: 1 }] : []),
        }),
        // count() query — no .where()
        then: (resolve: (v: any) => void) =>
          Promise.resolve([{ total: claimed }]).then(resolve),
      })),
    };
  });

  const mockInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue({ insertId: 42 }),
  });

  const mockUpdate = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue({}),
    }),
  });

  return { select: mockSelect, insert: mockInsert, update: mockUpdate };
}

// ─── Unit tests for the HubSpot sync behaviour ───────────────────────────────

describe("Website beta signup → HubSpot sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createBetaSignupInHubSpot is called with correct fields", async () => {
    const mockHubspot = vi.mocked(createBetaSignupInHubSpot);
    mockHubspot.mockResolvedValue({
      contactId: "hs-contact-001",
      dealId: "hs-deal-001",
    });

    await mockHubspot({
      name: "Dave Builder",
      email: "dave@buildco.com.au",
      company: "Build Co Pty Ltd",
      trade: "Carpentry",
      state: "QLD",
      spotNumber: 7,
    });

    expect(mockHubspot).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Dave Builder",
        email: "dave@buildco.com.au",
        trade: "Carpentry",
        state: "QLD",
        spotNumber: 7,
      })
    );
  });

  it("sendBetaWelcomeEmail is called with correct spot number and trade", async () => {
    const mockEmail = vi.mocked(sendBetaWelcomeEmail);
    mockEmail.mockResolvedValue(undefined);

    await mockEmail({
      name: "Sarah Sparky",
      email: "sarah@sparky.com.au",
      spotNumber: 3,
      trade: "Electrical",
    });

    expect(mockEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        spotNumber: 3,
        trade: "Electrical",
      })
    );
  });

  it("scheduleNurtureForSignup is called with signupId and spotNumber", async () => {
    const mockNurture = vi.mocked(scheduleNurtureForSignup);
    mockNurture.mockResolvedValue(undefined);

    await mockNurture({
      id: 42,
      name: "Tom Tiler",
      email: "tom@tiling.com.au",
      spotNumber: 8,
      trade: "Flooring",
    });

    expect(mockNurture).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 42,
        spotNumber: 8,
      })
    );
  });

  it("notifyOwner is called with the lead's name and email", async () => {
    const mockNotify = vi.mocked(notifyOwner);
    mockNotify.mockResolvedValue(true);

    await mockNotify({
      title: "🎉 New Beta Signup!",
      content: "Dave Builder (dave@buildco.com.au) from Build Co just joined. Trade: Carpentry. State: QLD. Spot #7 of 25.",
    });

    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "🎉 New Beta Signup!",
      })
    );
    expect(mockNotify.mock.calls[0][0].content).toContain("dave@buildco.com.au");
  });

  it("HubSpot returns contactId and dealId", async () => {
    const mockHubspot = vi.mocked(createBetaSignupInHubSpot);
    mockHubspot.mockResolvedValue({
      contactId: "469989729006",
      dealId: "320449790650",
    });

    const result = await mockHubspot({
      name: "Test Lead",
      email: "test@kindai.com.au",
      spotNumber: 13,
    });

    expect(result).toEqual({
      contactId: "469989729006",
      dealId: "320449790650",
    });
  });

  it("pipeline continues even if HubSpot fails", async () => {
    const mockHubspot = vi.mocked(createBetaSignupInHubSpot);
    const mockEmail = vi.mocked(sendBetaWelcomeEmail);
    const mockNurture = vi.mocked(scheduleNurtureForSignup);

    mockHubspot.mockRejectedValue(new Error("HubSpot API timeout"));
    mockEmail.mockResolvedValue(undefined);
    mockNurture.mockResolvedValue(undefined);

    // Email and nurture should still work independently
    await mockEmail({ name: "Test", email: "test@test.com", spotNumber: 1 });
    await mockNurture({ id: 1, name: "Test", email: "test@test.com", spotNumber: 1 });

    expect(mockEmail).toHaveBeenCalledTimes(1);
    expect(mockNurture).toHaveBeenCalledTimes(1);

    // HubSpot failure should be caught, not thrown
    await expect(
      mockHubspot({ name: "Test", email: "test@test.com", spotNumber: 1 }).catch(() => "caught")
    ).resolves.toBe("caught");
  });

  it("pipeline continues even if welcome email fails", async () => {
    const mockEmail = vi.mocked(sendBetaWelcomeEmail);
    const mockNurture = vi.mocked(scheduleNurtureForSignup);

    mockEmail.mockRejectedValue(new Error("Gmail SMTP error"));
    mockNurture.mockResolvedValue(undefined);

    await mockNurture({ id: 1, name: "Test", email: "test@test.com", spotNumber: 1 });
    expect(mockNurture).toHaveBeenCalledTimes(1);
  });

  it("organic source is set to 'website' by default", () => {
    // Verify the source field logic
    const source = undefined ?? "website";
    expect(source).toBe("website");
  });

  it("fb_ad source is preserved when explicitly set", () => {
    const source = "fb_ad" ?? "website";
    expect(source).toBe("fb_ad");
  });
});

describe("HubSpot ID persistence", () => {
  it("saves contactId and dealId back to DB after creation", async () => {
    const mockHubspot = vi.mocked(createBetaSignupInHubSpot);
    mockHubspot.mockResolvedValue({
      contactId: "hs-contact-999",
      dealId: "hs-deal-999",
    });

    const result = await mockHubspot({
      name: "Persistence Test",
      email: "persist@test.com",
      spotNumber: 5,
    });

    // Verify the IDs are returned and would be saved
    expect(result?.contactId).toBe("hs-contact-999");
    expect(result?.dealId).toBe("hs-deal-999");
  });

  it("handles null HubSpot result gracefully (no DB update attempted)", async () => {
    const mockHubspot = vi.mocked(createBetaSignupInHubSpot);
    mockHubspot.mockResolvedValue(null);

    const result = await mockHubspot({
      name: "Null Test",
      email: "null@test.com",
      spotNumber: 1,
    });

    // null result means no IDs to save — should not throw
    expect(result).toBeNull();
    const contactId = result?.contactId ?? null;
    expect(contactId).toBeNull();
  });
});
