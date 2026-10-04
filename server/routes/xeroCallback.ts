import { consumeXeroState } from "../xeroState";
import { parse } from "cookie";
import { Router } from "express";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { companyProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";

export const xeroCallbackRouter = Router();

xeroCallbackRouter.get("/api/xero/callback", async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).send("Missing code or state parameter");
    }

    if (typeof code !== 'string' || typeof state !== 'string') return res.status(400).send('Invalid callback');
    const db = await getDb();
    if (!db) return res.status(503).send('Database unavailable');
    let stateData;
    try {
      stateData = await consumeXeroState(db, state, parse(req.headers.cookie ?? '').kindai_xero_state ?? '');
    } catch {
      return res.status(400).send('Invalid or expired Xero connection. Start again from Settings.');
    }
    res.clearCookie('kindai_xero_state', { path: '/api/xero/callback' });

    const clientId = ENV.xeroClientId;
    const clientSecret = ENV.xeroClientSecret;
    if (!clientId || !clientSecret) {
      return res.status(500).send("Xero OAuth app is not configured. Customers connect their own Xero account after the platform connector is enabled.");
    }

    const redirectUri = `${stateData.origin}/api/xero/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch(XERO_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error("[Xero] Token exchange failed:", tokenResponse.status);
      return res.redirect(`${stateData.origin}/settings?xero=error&msg=token_exchange_failed`);
    }

    const tokens = await tokenResponse.json();

    // Get tenant ID from connections
    const connectionsResponse = await fetch(XERO_CONNECTIONS_URL, {
      headers: {
        "Authorization": `Bearer ${tokens.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!connectionsResponse.ok) {
      console.error("[Xero] Connections fetch failed");
      return res.redirect(`${stateData.origin}/settings?xero=error&msg=connections_failed`);
    }

    const connections = await connectionsResponse.json();
    if (!connections.length) {
      return res.redirect(`${stateData.origin}/settings?xero=error&msg=no_organisations`);
    }

    const tenantId = connections[0].tenantId;
    const tenantName = connections[0].tenantName;

    // Save to company profile (upsert)


    // Check if profile exists
    const [existing] = await db.select({ id: companyProfiles.id })
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, stateData.userId))
      .limit(1);

    if (existing) {
      await db.update(companyProfiles).set({
        xeroAccessToken: tokens.access_token,
        xeroRefreshToken: tokens.refresh_token,
        xeroTokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
        xeroTenantId: tenantId,
        xeroConnectedAt: new Date(),
      } as any).where(eq(companyProfiles.id, existing.id));
    } else {
      await db.insert(companyProfiles).values({
        userId: stateData.userId,
        xeroAccessToken: tokens.access_token,
        xeroRefreshToken: tokens.refresh_token,
        xeroTokenExpiresAt: Date.now() + (tokens.expires_in * 1000),
        xeroTenantId: tenantId,
        xeroConnectedAt: new Date(),
      } as any);
    }

    console.log(`[Xero] Connected for user ${stateData.userId} — org: ${tenantName}`);
    return res.redirect(`${stateData.origin}/settings?xero=success&org=${encodeURIComponent(tenantName)}`);
  } catch (err: any) {
    console.error("[Xero] Callback failed");
    return res.status(500).send("Xero connection failed. Restart from Settings.");
  }
});
