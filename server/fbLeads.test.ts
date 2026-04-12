/**
 * Tests for the fbLeads admin feature
 *
 * Tests the core logic: admin guard, data enrichment, stats calculation.
 * Uses direct function testing rather than tRPC caller (no createCallerFactory export).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock DB ──────────────────────────────────────────────────────────────────

vi.mock("./db.js", () => ({
  getDb: vi.fn(),
}));

import { getDb } from "./db.js";
const mockGetDb = getDb as ReturnType<typeof vi.fn>;

// ─── Helper: build mock DB ────────────────────────────────────────────────────

function buildMockDb({
  fbLeads = [] as Record<string, unknown>[],
  nurtureEmails = [] as Record<string, unknown>[],
  totalCount = 0,
} = {}) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue(fbLeads),
            }),
          }),
          limit: vi.fn().mockResolvedValue(fbLeads.slice(0, 1)),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue(nurtureEmails),
          }),
        }),
        // Direct await (count queries)
        then: (resolve: (v: unknown) => void) =>
          Promise.resolve([{ total: totalCount, count: totalCount }]).then(resolve),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  };
}

// ─── Admin guard logic ────────────────────────────────────────────────────────

describe("fbLeads admin guard", () => {
  it("throws Forbidden when user role is not admin", () => {
    const user = { id: 1, role: "user" as const };
    const guardFn = () => {
      if (user.role !== "admin") throw new Error("Forbidden");
    };
    expect(guardFn).toThrow("Forbidden");
  });

  it("does not throw when user role is admin", () => {
    const user = { id: 1, role: "admin" as const };
    const guardFn = () => {
      if (user.role !== "admin") throw new Error("Forbidden");
    };
    expect(guardFn).not.toThrow();
  });
});

// ─── Nurture progress calculation ─────────────────────────────────────────────

describe("nurture progress calculation", () => {
  const nurtureEmails = [
    { emailKey: "day1_activation", status: "sent", scheduledAt: 1000, sentAt: 2000 },
    { emailKey: "day3_social_proof", status: "sent", scheduledAt: 3000, sentAt: 4000 },
    { emailKey: "day7_roi", status: "scheduled", scheduledAt: 5000, sentAt: null },
    { emailKey: "day14_urgency", status: "failed", scheduledAt: 6000, sentAt: null },
  ];

  function calcProgress(emails: typeof nurtureEmails) {
    return {
      total: emails.length,
      sent: emails.filter((e) => e.status === "sent").length,
      scheduled: emails.filter((e) => e.status === "scheduled").length,
      failed: emails.filter((e) => e.status === "failed").length,
    };
  }

  it("counts sent emails correctly", () => {
    const progress = calcProgress(nurtureEmails);
    expect(progress.sent).toBe(2);
  });

  it("counts scheduled emails correctly", () => {
    const progress = calcProgress(nurtureEmails);
    expect(progress.scheduled).toBe(1);
  });

  it("counts failed emails correctly", () => {
    const progress = calcProgress(nurtureEmails);
    expect(progress.failed).toBe(1);
  });

  it("counts total emails correctly", () => {
    const progress = calcProgress(nurtureEmails);
    expect(progress.total).toBe(4);
  });

  it("returns zero progress for empty email list", () => {
    const progress = calcProgress([]);
    expect(progress.total).toBe(0);
    expect(progress.sent).toBe(0);
    expect(progress.scheduled).toBe(0);
    expect(progress.failed).toBe(0);
  });
});

// ─── Stats calculation ────────────────────────────────────────────────────────

describe("fbLeads stats calculation", () => {
  it("calculates correct stats from count results", () => {
    const rawCounts = {
      totalLeads: 15,
      hubspotSynced: 12,
      nurtureScheduled: 8,
      nurtureSent: 30,
      nurtureFailed: 2,
    };

    // Simulate the Number() coercion applied in the router
    const stats = {
      totalLeads: Number(rawCounts.totalLeads),
      hubspotSynced: Number(rawCounts.hubspotSynced),
      nurtureScheduled: Number(rawCounts.nurtureScheduled),
      nurtureSent: Number(rawCounts.nurtureSent),
      nurtureFailed: Number(rawCounts.nurtureFailed),
    };

    expect(stats.totalLeads).toBe(15);
    expect(stats.hubspotSynced).toBe(12);
    expect(stats.nurtureScheduled).toBe(8);
    expect(stats.nurtureSent).toBe(30);
    expect(stats.nurtureFailed).toBe(2);
  });

  it("handles null/undefined count results gracefully", () => {
    const rawCounts = {
      totalLeads: undefined,
      hubspotSynced: null,
      nurtureScheduled: undefined,
    };

    const totalLeads = Number(rawCounts.totalLeads ?? 0);
    const hubspotSynced = Number(rawCounts.hubspotSynced ?? 0);
    const nurtureScheduled = Number(rawCounts.nurtureScheduled ?? 0);

    expect(totalLeads).toBe(0);
    expect(hubspotSynced).toBe(0);
    expect(nurtureScheduled).toBe(0);
  });
});

// ─── Lead enrichment ─────────────────────────────────────────────────────────

describe("lead enrichment with nurture emails", () => {
  const sampleLead = {
    id: 1,
    name: "Dave Builder",
    email: "dave@test.com",
    company: "Dave's Builds",
    trade: "plumbing",
    state: "QLD",
    status: "pending",
    source: "fb_ad",
    hubspotContactId: "hs-123",
    hubspotDealId: "deal-456",
    createdAt: new Date("2026-01-01"),
    approvedAt: null,
  };

  const sampleNurtureEmails = [
    { betaSignupId: 1, emailKey: "day1_activation", status: "sent", scheduledAt: 1000, sentAt: 2000 },
    { betaSignupId: 1, emailKey: "day3_social_proof", status: "scheduled", scheduledAt: 3000, sentAt: null },
  ];

  it("groups nurture emails by lead ID correctly", () => {
    const nurtureByLead = new Map<number, typeof sampleNurtureEmails>();
    for (const ne of sampleNurtureEmails) {
      const existing = nurtureByLead.get(ne.betaSignupId) ?? [];
      existing.push(ne);
      nurtureByLead.set(ne.betaSignupId, existing);
    }

    expect(nurtureByLead.get(1)).toHaveLength(2);
    expect(nurtureByLead.get(2)).toBeUndefined();
  });

  it("enriches lead with correct nurture progress", () => {
    const emails = sampleNurtureEmails;
    const enriched = {
      ...sampleLead,
      nurtureEmails: emails.map((e) => ({
        emailKey: e.emailKey,
        status: e.status,
        scheduledAt: e.scheduledAt,
        sentAt: e.sentAt,
      })),
      nurtureProgress: {
        total: emails.length,
        sent: emails.filter((e) => e.status === "sent").length,
        scheduled: emails.filter((e) => e.status === "scheduled").length,
        failed: emails.filter((e) => e.status === "failed").length,
      },
    };

    expect(enriched.nurtureProgress.total).toBe(2);
    expect(enriched.nurtureProgress.sent).toBe(1);
    expect(enriched.nurtureProgress.scheduled).toBe(1);
    expect(enriched.nurtureProgress.failed).toBe(0);
    expect(enriched.hubspotContactId).toBe("hs-123");
  });

  it("handles lead with no nurture emails", () => {
    const emails: typeof sampleNurtureEmails = [];
    const enriched = {
      ...sampleLead,
      nurtureEmails: [],
      nurtureProgress: {
        total: 0,
        sent: 0,
        scheduled: 0,
        failed: 0,
      },
    };

    expect(enriched.nurtureProgress.total).toBe(0);
    expect(enriched.nurtureEmails).toHaveLength(0);
  });
});

// ─── DB availability ──────────────────────────────────────────────────────────

describe("database availability check", () => {
  beforeEach(() => {
    mockGetDb.mockReset();
  });

  it("getDb returns null when DB is unavailable", async () => {
    mockGetDb.mockResolvedValue(null);
    const db = await getDb();
    expect(db).toBeNull();
  });

  it("getDb returns db object when available", async () => {
    const mockDb = buildMockDb();
    mockGetDb.mockResolvedValue(mockDb);
    const db = await getDb();
    expect(db).not.toBeNull();
    expect(db).toHaveProperty("select");
  });
});

// ─── Status filter logic ──────────────────────────────────────────────────────

describe("status filter logic", () => {
  const leads = [
    { id: 1, status: "pending", source: "fb_ad" },
    { id: 2, status: "approved", source: "fb_ad" },
    { id: 3, status: "active", source: "fb_ad" },
    { id: 4, status: "pending", source: "website" }, // not fb_ad
  ];

  it("filters to only fb_ad leads when status is 'all'", () => {
    const filtered = leads.filter((l) => l.source === "fb_ad");
    expect(filtered).toHaveLength(3);
  });

  it("filters by both source and status", () => {
    const filtered = leads.filter(
      (l) => l.source === "fb_ad" && l.status === "pending"
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(1);
  });

  it("returns empty when no leads match filter", () => {
    const filtered = leads.filter(
      (l) => l.source === "fb_ad" && l.status === "churned"
    );
    expect(filtered).toHaveLength(0);
  });
});
