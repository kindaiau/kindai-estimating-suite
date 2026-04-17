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

    // Decode state
    let stateData: { userId: number; origin: string };
    try {
      stateData = JSON.parse(Buffer.from(state as string, "base64url").toString());
    } catch {
      return res.status(400).send("Invalid state parameter");
    }

    const clientId = ENV.xeroClientId;
    const clientSecret = ENV.xeroClientSecret;
    if (!clientId || !clientSecret) {
      return res.status(500).send("Xero credentials not configured");
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
      console.error("[Xero] Token exchange failed:", err);
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
    const db = await getDb();
    if (!db) {
      return res.status(500).send("Database not available");
    }

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
    console.error("[Xero] Callback error:", err);
    return res.status(500).send("Xero connection failed: " + err.message);
  }
});
