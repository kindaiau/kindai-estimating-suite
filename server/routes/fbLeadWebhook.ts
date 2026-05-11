/**
 * Facebook Lead Ads Webhook — Kindai Estimating Suite
 *
 * Receives lead data from Zapier (triggered by new Facebook Lead Ads submissions).
 * Flow:
 *   1. Zapier catches new lead from FB Form (ID: 1729232091575876)
 *   2. Zapier POSTs lead data to POST /api/webhooks/fb-lead
 *   3. This endpoint saves the lead to beta_signups table
 *   4. Creates HubSpot contact + deal
 *   5. Sends welcome email via Gmail SMTP
 *   6. Schedules 4-email nurture sequence
 *
 * Security: Validates a shared secret header (WEBHOOK_SECRET env var).
 * If not set, logs a warning but still processes (for initial testing).
 */

import { Router, type Request, type Response } from "express";
import { getDb } from "../db.js";
import { betaSignups } from "../../drizzle/schema.js";
import { eq, count } from "drizzle-orm";
import { createBetaSignupInHubSpot } from "../hubspot.js";
import { sendBetaWelcomeEmail } from "../welcomeEmail.js";
import { scheduleNurtureForSignup } from "../routers/betaNurture.js";
import { buildMetaUserData, sendMetaConversionEvent } from "../metaCapi.js";

export const fbLeadWebhookRouter = Router();

interface FbLeadPayload {
  // Core fields from Facebook Lead Form
  name?: string;
  full_name?: string;
  email?: string;
  email_address?: string;
  phone?: string;
  phone_number?: string;
  company?: string;
  company_name?: string;
  trade?: string;
  state?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_path?: string;
  referrer_host?: string;
  // Facebook metadata
  lead_id?: string;
  form_id?: string;
  page_id?: string;
  created_time?: string;
  // Zapier may pass these
  first_name?: string;
  last_name?: string;
}

function extractName(payload: FbLeadPayload): string {
  if (payload.full_name) return payload.full_name.trim();
  if (payload.name) return payload.name.trim();
  if (payload.first_name || payload.last_name) {
    return `${payload.first_name ?? ""} ${payload.last_name ?? ""}`.trim();
  }
  return "Unknown";
}

function extractEmail(payload: FbLeadPayload): string | null {
  return payload.email ?? payload.email_address ?? null;
}

function extractPhone(payload: FbLeadPayload): string | undefined {
  return payload.phone ?? payload.phone_number ?? undefined;
}

function extractCompany(payload: FbLeadPayload): string | undefined {
  return payload.company ?? payload.company_name ?? undefined;
}

function trimMax(value: string | undefined, maxLength: number): string | undefined {
  const cleaned = value?.trim();
  return cleaned ? cleaned.slice(0, maxLength) : undefined;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

/**
 * POST /api/webhooks/fb-lead
 *
 * Accepts JSON body with lead data from Zapier.
 * Optional header: X-Webhook-Secret (matches WEBHOOK_SECRET env var)
 */
fbLeadWebhookRouter.post("/fb-lead", async (req: Request, res: Response) => {
  const startTime = Date.now();

  // ── Optional secret validation ──────────────────────────────────────────────
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers["x-webhook-secret"] as string | undefined;
    if (!provided || provided !== secret) {
      console.warn("[FB Lead Webhook] Rejected: invalid or missing X-Webhook-Secret");
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  } else {
    if (isProduction()) {
      console.error("[FB Lead Webhook] Rejected: WEBHOOK_SECRET is required in production");
      res.status(503).json({ error: "Webhook is not configured" });
      return;
    }

    console.warn("[FB Lead Webhook] WEBHOOK_SECRET not set — accepting all requests in development only");
  }

  // ── Parse payload ───────────────────────────────────────────────────────────
  const payload = req.body as FbLeadPayload;
  // Log only non-PII metadata to avoid storing personal data in logs
  console.log("[FB Lead Webhook] Received payload: lead_id=%s form_id=%s", payload.lead_id ?? "n/a", payload.form_id ?? "n/a");

  const name = extractName(payload);
  const email = extractEmail(payload);

  if (!email) {
    console.error("[FB Lead Webhook] Missing email in payload");
    res.status(400).json({ error: "email is required" });
    return;
  }

  const company = extractCompany(payload);
  const trade = payload.trade ?? undefined;

  // Sanitise state — must be a valid AU state enum or null (invalid values crash MySQL ENUM insert)
  const VALID_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"] as const;
  type AuState = typeof VALID_STATES[number];
  const rawState = (payload.state ?? "").toUpperCase().trim();
  const state: AuState | undefined = VALID_STATES.includes(rawState as AuState)
    ? (rawState as AuState)
    : undefined;

  try {
    const db = await getDb();
    if (!db) {
      console.error("[FB Lead Webhook] Database not available");
      res.status(503).json({ error: "Database unavailable" });
      return;
    }

    // ── 1. Check for duplicate ──────────────────────────────────────────────
    const existing = await db
      .select({ id: betaSignups.id })
      .from(betaSignups)
      .where(eq(betaSignups.email, email))
      .limit(1);

    if (existing.length > 0) {
      console.log(`[FB Lead Webhook] Duplicate lead: ${email} — skipping`);
      res.status(200).json({ ok: true, duplicate: true, message: "Lead already registered" });
      return;
    }

    // ── 2. Count existing signups to assign spot number ─────────────────────
    const [countResult] = await db.select({ total: count() }).from(betaSignups);
    const claimed = countResult?.total ?? 0;
    const spotNumber = claimed + 1;

    // ── 3. Insert into beta_signups ─────────────────────────────────────────
    const insertResult = await db.insert(betaSignups).values({
      name,
      email,
      company: company ?? null,
      trade: trade ?? null,
      state: state ?? null,
      source: "fb_ad",
      utmSource: trimMax(payload.utm_source, 128) ?? "facebook",
      utmMedium: trimMax(payload.utm_medium, 128) ?? "paid_social",
      utmCampaign: trimMax(payload.utm_campaign, 128),
      utmContent: trimMax(payload.utm_content, 128),
      utmTerm: trimMax(payload.utm_term, 128),
      landingPath: trimMax(payload.landing_path, 255),
      referrerHost: trimMax(payload.referrer_host, 255) ?? "facebook.com",
      status: "pending",
    });

    // MySQL insertId is on the result object directly
    const signupId = (insertResult as unknown as { insertId: number }).insertId ?? 0;
     console.log(`[FB Lead Webhook] Beta signup created: id=${signupId}, email=${email}, spot=#${spotNumber}`);

    // ── 3b. Meta CAPI: Lead (Facebook Ad lead) ──
    sendMetaConversionEvent({
      eventName: "Lead",
      eventId: `fb_lead_${signupId}_${Date.now()}`,
      actionSource: "website",
      eventSourceUrl: "https://kindaiestimator.com/beta",
      customData: {
        currency: "AUD",
        value: 0,
        content_name: "Facebook Lead Ad",
        content_category: "Kindai Beta Signup",
        source: "fb_ad",
        trade: trade,
        state: state,
        spot_number: spotNumber,
        lead_id: payload.lead_id,
      },
      userData: buildMetaUserData({
        email,
        name,
      }),
    }).catch((err: unknown) => {
      console.error(
        "[Meta CAPI] Failed to send FB lead event:",
        err instanceof Error ? err.message : String(err)
      );
    });

    // ── 4. HubSpot CRM ──────────────────────────────────────────────────────
    let hubspotResult: { contactId: string; dealId: string } | null = null;
    try {
      hubspotResult = await createBetaSignupInHubSpot({
        name,
        email,
        company,
        trade,
        state,
        spotNumber,
      });
      if (hubspotResult) {
        console.log(`[FB Lead Webhook] HubSpot: contactId=${hubspotResult.contactId}, dealId=${hubspotResult.dealId}`);
        // Persist HubSpot IDs back to the beta_signups row
        if (signupId) {
          await db.update(betaSignups)
            .set({
              hubspotContactId: hubspotResult.contactId,
              hubspotDealId: hubspotResult.dealId,
            })
            .where(eq(betaSignups.id, signupId));
        }
      }
    } catch (err: unknown) {
      console.error("[FB Lead Webhook] HubSpot failed (non-fatal):", err instanceof Error ? err.message : String(err));
    }

    // ── 5. Welcome email ────────────────────────────────────────────────────
    try {
      await sendBetaWelcomeEmail({
        name,
        email,
        spotNumber,
        trade,
      });
      console.log(`[FB Lead Webhook] Welcome email sent to ${email}`);
    } catch (err: unknown) {
      console.error("[FB Lead Webhook] Welcome email failed (non-fatal):", err instanceof Error ? err.message : String(err));
    }

    // ── 6. Schedule nurture sequence ────────────────────────────────────────
    try {
      await scheduleNurtureForSignup({
        id: signupId,
        email,
        name,
        trade,
        spotNumber,
      });
      console.log(`[FB Lead Webhook] Nurture sequence scheduled for ${email}`);
    } catch (err: unknown) {
      console.error("[FB Lead Webhook] Nurture scheduling failed (non-fatal):", err instanceof Error ? err.message : String(err));
    }

    const elapsed = Date.now() - startTime;
    console.log(`[FB Lead Webhook] Completed in ${elapsed}ms for ${email}`);

    res.status(200).json({
      ok: true,
      spotNumber,
      signupId,
      hubspotContactId: hubspotResult?.contactId ?? null,
      hubspotDealId: hubspotResult?.dealId ?? null,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[FB Lead Webhook] Fatal error: ${msg}`);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/webhooks/fb-lead
 * Facebook webhook verification endpoint (for direct FB webhook setup if needed)
 */
fbLeadWebhookRouter.get("/fb-lead", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  const verifyToken = process.env.FB_WEBHOOK_VERIFY_TOKEN;

  if (!verifyToken) {
    if (isProduction() && mode === "subscribe") {
      console.error("[FB Lead Webhook] Verification rejected: FB_WEBHOOK_VERIFY_TOKEN is required in production");
      res.status(503).json({ error: "Webhook verification is not configured" });
      return;
    }

    res.status(200).json({ status: "ok", endpoint: "fb-lead-webhook" });
    return;
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[FB Lead Webhook] Facebook verification challenge passed");
    res.status(200).send(challenge);
    return;
  }

  res.status(200).json({ status: "ok", endpoint: "fb-lead-webhook" });
});
