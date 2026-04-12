/**
 * Facebook Lead Webhook Tests — Kindai Estimating Suite
 *
 * Tests the /api/webhooks/fb-lead endpoint logic.
 * Uses mocked DB, HubSpot, and email modules — no real network calls.
 *
 * DB query pattern used in the webhook:
 *   1. db.select({id}).from(betaSignups).where(eq(email)).limit(1)  → duplicate check
 *   2. db.select({total: count()}).from(betaSignups)                → spot count
 *   3. db.insert(betaSignups).values({...})                         → insert
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Paths are relative to THIS test file (server/fbLeadWebhook.test.ts)
// The webhook (server/routes/fbLeadWebhook.ts) imports from "../db.js" = server/db.ts
// Vitest resolves vi.mock paths relative to the test file, so we use "./db.js"
vi.mock("./db.js", () => ({ getDb: vi.fn() }));
vi.mock("./hubspot.js", () => ({ createBetaSignupInHubSpot: vi.fn() }));
vi.mock("./welcomeEmail.js", () => ({ sendBetaWelcomeEmail: vi.fn() }));
vi.mock("./routers/betaNurture.js", () => ({ scheduleNurtureForSignup: vi.fn() }));

import { getDb } from "./db.js";
import { createBetaSignupInHubSpot } from "./hubspot.js";
import { sendBetaWelcomeEmail } from "./welcomeEmail.js";
import { scheduleNurtureForSignup } from "./routers/betaNurture.js";
import { fbLeadWebhookRouter } from "./routes/fbLeadWebhook.js";

// ─── Test app ─────────────────────────────────────────────────────────────────

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/webhooks", fbLeadWebhookRouter);
  return app;
}

// ─── DB mock builder ──────────────────────────────────────────────────────────
// Matches the Drizzle ORM chained query pattern used in the webhook.
// Each call to buildMockDb() creates a fresh, independent mock.

function buildMockDb({
  isDuplicate = false,
  claimedCount = 0,
  insertId = 101,
} = {}) {
  let callIdx = 0;

  const mockDb = {
    select: vi.fn().mockImplementation(() => {
      callIdx++;
      const thisCall = callIdx;

      return {
        from: vi.fn().mockImplementation(() => {
          if (thisCall === 1) {
            // First select = duplicate check → has .where().limit()
            return {
              where: vi.fn().mockReturnValue({
                limit: vi.fn().mockResolvedValue(isDuplicate ? [{ id: 1 }] : []),
              }),
            };
          }
          // Second select = count() → resolves directly to [{ total: N }]
          return Promise.resolve([{ total: claimedCount }]);
        }),
      };
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({ insertId }),
    }),
  };

  return mockDb;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // clearAllMocks clears call history but NOT implementations.
  // We explicitly reset getDb so no previous test's mock leaks through.
  vi.clearAllMocks();
  (getDb as ReturnType<typeof vi.fn>).mockReset();
  delete process.env.WEBHOOK_SECRET;
  delete process.env.FB_WEBHOOK_VERIFY_TOKEN;
});

// ─── GET endpoint tests ───────────────────────────────────────────────────────

describe("GET /api/webhooks/fb-lead", () => {
  it("returns 200 with status ok for health check", async () => {
    const app = buildApp();
    const res = await request(app).get("/api/webhooks/fb-lead");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: "ok" });
  });

  it("handles Facebook webhook verification challenge", async () => {
    process.env.FB_WEBHOOK_VERIFY_TOKEN = "kindai-fb-verify-2026";
    const app = buildApp();
    const res = await request(app)
      .get("/api/webhooks/fb-lead")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "kindai-fb-verify-2026",
        "hub.challenge": "test-challenge-123",
      });
    expect(res.status).toBe(200);
    expect(res.text).toBe("test-challenge-123");
  });

  it("does not return challenge for wrong verify token", async () => {
    process.env.FB_WEBHOOK_VERIFY_TOKEN = "kindai-fb-verify-2026";
    const app = buildApp();
    const res = await request(app)
      .get("/api/webhooks/fb-lead")
      .query({
        "hub.mode": "subscribe",
        "hub.verify_token": "wrong-token",
        "hub.challenge": "test-challenge-123",
      });
    expect(res.text).not.toBe("test-challenge-123");
  });
});

// ─── Payload validation tests ─────────────────────────────────────────────────

describe("POST /api/webhooks/fb-lead — payload validation", () => {
  it("returns 400 when email is missing", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Dave Johnson" });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("email");
  });

  it("returns 503 when DB is unavailable", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Dave", email: "dave@test.com" });

    expect(res.status).toBe(503);
  });
});

// ─── Secret validation tests ──────────────────────────────────────────────────

describe("POST /api/webhooks/fb-lead — secret validation", () => {
  it("returns 401 when secret is set but header is missing", async () => {
    process.env.WEBHOOK_SECRET = "super-secret-123";
    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Dave", email: "dave@test.com" });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("returns 401 when secret header is wrong", async () => {
    process.env.WEBHOOK_SECRET = "super-secret-123";
    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .set("x-webhook-secret", "wrong-secret")
      .send({ name: "Dave", email: "dave@test.com" });
    expect(res.status).toBe(401);
  });

  it("proceeds when correct secret header is provided", async () => {
    process.env.WEBHOOK_SECRET = "super-secret-123";
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .set("x-webhook-secret", "super-secret-123")
      .send({ name: "Dave", email: "dave@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─── Name field variant tests ─────────────────────────────────────────────────

describe("POST /api/webhooks/fb-lead — name field variants", () => {
  it("accepts full_name field", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ full_name: "Dave Johnson", email: "dave@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("accepts first_name + last_name fields", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ first_name: "Sarah", last_name: "Mitchell", email: "sarah@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("accepts email_address field", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Tom", email_address: "tom@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ─── Duplicate detection tests ────────────────────────────────────────────────

describe("POST /api/webhooks/fb-lead — duplicate detection", () => {
  it("returns duplicate=true for existing email", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb({ isDuplicate: true }));
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Dave", email: "existing@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.duplicate).toBe(true);
    expect(createBetaSignupInHubSpot).not.toHaveBeenCalled();
    expect(sendBetaWelcomeEmail).not.toHaveBeenCalled();
  });
});

// ─── Integration flow tests ───────────────────────────────────────────────────

describe("POST /api/webhooks/fb-lead — integration flow", () => {
  it("calls HubSpot, welcome email, and nurture on new lead", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb({ claimedCount: 5 }));
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue({
      contactId: "hs-contact-123",
      dealId: "hs-deal-456",
    });
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({
        name: "Dave Johnson",
        email: "dave@sparkysolutions.com.au",
        company: "Sparky Solutions",
        trade: "Electrical",
        state: "NSW",
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.spotNumber).toBe(6); // 5 claimed + 1
    expect(createBetaSignupInHubSpot).toHaveBeenCalledOnce();
    expect(sendBetaWelcomeEmail).toHaveBeenCalledOnce();
    expect(scheduleNurtureForSignup).toHaveBeenCalledOnce();
  });

  it("still returns 200 even when HubSpot fails", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("HubSpot API down")
    );
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Dave", email: "dave@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(sendBetaWelcomeEmail).toHaveBeenCalledOnce();
    expect(scheduleNurtureForSignup).toHaveBeenCalledOnce();
  });

  it("still returns 200 even when email fails", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Gmail SMTP down")
    );
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockResolvedValue(4);

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Dave", email: "dave@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(scheduleNurtureForSignup).toHaveBeenCalledOnce();
  });

  it("still returns 200 even when nurture scheduling fails", async () => {
    (getDb as ReturnType<typeof vi.fn>).mockResolvedValue(buildMockDb());
    (createBetaSignupInHubSpot as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (sendBetaWelcomeEmail as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (scheduleNurtureForSignup as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("DB write failed")
    );

    const app = buildApp();
    const res = await request(app)
      .post("/api/webhooks/fb-lead")
      .send({ name: "Dave", email: "dave@test.com" });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
