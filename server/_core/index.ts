import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe/webhook";
import { fbLeadWebhookRouter } from "../routes/fbLeadWebhook";
import { xeroCallbackRouter } from "../routes/xeroCallback";
import { orchestratedTakeoffRouter } from "../routes/orchestratedTakeoff";
import { seedMaterials } from "../seedMaterials";
import { processDueNurtureEmails } from "../routers/betaNurture";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

// Rate limiter for public LLM endpoints — prevents API cost abuse
const publicLLMRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per IP per 15 min on public AI endpoints
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait 15 minutes before trying again." },
  skip: (req) => {
    // Skip rate limiting for authenticated users — extract the actual session cookie value
    // (not just checking if the word "session" appears anywhere in the cookie string)
    const cookieHeader = req.headers.cookie || "";
    const sessionMatch = cookieHeader.match(/(?:^|;\s*)session=([^;]+)/);
    const sessionValue = sessionMatch ? decodeURIComponent(sessionMatch[1]).trim() : "";
    return sessionValue.length > 20; // Valid signed session JWTs are always >20 chars
  },
});

// General API rate limiter
const generalRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1); // Trust first proxy (Manus/CDN) for correct IP in rate limiting
  const server = createServer(app);

  // Security headers — must be first
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite HMR and CDN assets
    crossOriginEmbedderPolicy: false, // Disabled to allow embedded content
  }));

  // General rate limiting on all API routes
  app.use("/api", generalRateLimit);

  // Stripe webhook MUST be registered BEFORE json body parser
  registerStripeWebhook(app);

  // Configure body parser — 50MB supports 32MB files (base64 encoding adds ~33% overhead)
  // Mobile phone photos (iPhone 15 Pro: 15-25MB HEIC/JPEG) and multi-page PDFs need this headroom
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Facebook Lead Ads webhook (from Zapier) — registered after body parser
  app.use("/api/webhooks", fbLeadWebhookRouter);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  app.get("/.well-known/security.txt", (_req, res) => {
    res
      .type("text/plain")
      .send([
        "Contact: mailto:hello@kindaiestimator.com",
        "Preferred-Languages: en",
        "Canonical: https://kindaiestimator.com/.well-known/security.txt",
        "Policy: https://kindaiestimator.com/privacy-policy",
        "",
      ].join("\n"));
  });

  // Xero OAuth callback
  app.use(xeroCallbackRouter);

  // Orchestrated AI Takeoff (SSE streaming)
  app.use(orchestratedTakeoffRouter);

  // Apply stricter rate limiting to public LLM endpoints
  app.use("/api/trpc/demo.runDemo", publicLLMRateLimit);
  app.use("/api/trpc/helpAssistant.chat", publicLLMRateLimit);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Seed default materials library on startup (idempotent)
    seedMaterials().catch(err => console.warn("[Seed] Materials seed failed:", err.message));

    // ── Nurture email cron — runs every 15 minutes via Gmail SMTP ──
    setInterval(() => {
      processDueNurtureEmails().catch(err =>
        console.warn("[Nurture] Cron processing failed:", err.message)
      );
    }, 15 * 60 * 1000);
    // Also run once 30 seconds after startup to catch any emails that were due
    setTimeout(() => {
      processDueNurtureEmails().catch(err =>
        console.warn("[Nurture] Initial processing failed:", err.message)
      );
    }, 30_000);
    console.log("[Nurture] Cron started — processing due emails every 15 minutes via Gmail SMTP");
  });
}

startServer().catch(console.error);
