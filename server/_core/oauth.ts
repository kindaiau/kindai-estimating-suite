import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import {
  buildMetaUserData,
  extractMetaClickIdentifiers,
  sendMetaConversionEvent,
} from "../metaCapi";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // ─── Meta CAPI: CompleteRegistration ──────────────────────────────────
      const { fbp, fbc } = extractMetaClickIdentifiers(req.headers.cookie);
      const clientIpAddress =
        (req.headers["x-forwarded-for"] as string | undefined)
          ?.split(",")
          .map((v) => v.trim())
          .find(Boolean) ?? req.socket.remoteAddress ?? undefined;
      const clientUserAgent = req.headers["user-agent"] ?? undefined;

      sendMetaConversionEvent({
        eventName: "CompleteRegistration",
        eventId: `oauth_reg_${userInfo.openId}_${Date.now()}`,
        actionSource: "website",
        eventSourceUrl: "https://kindaiestimator.com/",
        customData: {
          content_name: "OAuth Login/Registration",
          status: "complete",
          currency: "AUD",
          value: 0,
          login_method: userInfo.loginMethod ?? userInfo.platform ?? "unknown",
        },
        userData: buildMetaUserData({
          email: userInfo.email ?? undefined,
          name: userInfo.name ?? undefined,
          clientIpAddress,
          clientUserAgent,
          fbp,
          fbc,
        }),
      }).catch((err: unknown) => {
        console.error(
          "[Meta CAPI] Failed to send CompleteRegistration event:",
          err instanceof Error ? err.message : String(err)
        );
      });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
