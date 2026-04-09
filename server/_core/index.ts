import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { getHealthSnapshot } from "./health";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { validateServerEnv } from "./env";
import { serveStatic, setupVite } from "./vite";
import { registerStripeWebhook } from "../stripe/webhook";
import { seedMaterials } from "../seedMaterials";

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
  const envStatus = validateServerEnv();
  const warnings = Object.entries(envStatus).filter(([, status]) => !status.ready);
  console.info("[Startup] Environment validation passed for required features.");
  if (warnings.length > 0) {
    console.warn(
      "[Startup] Optional feature configuration gaps:",
      warnings.map(([key, status]) => `${key}: ${status.missingRequired.join(", ")}`).join(" | ")
    );
  }

  const app = express();
  const server = createServer(app);
  // Stripe webhook MUST be registered BEFORE json body parser
  registerStripeWebhook(app);
  app.get("/healthz", async (_req, res) => {
    const snapshot = await getHealthSnapshot();
    res.status(snapshot.ok ? 200 : 503).json(snapshot);
  });
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
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
    console.log(
      `[Startup] Readiness endpoint available at http://localhost:${port}/healthz`
    );
    // Seed default materials library on startup (idempotent)
    seedMaterials().catch(err => console.warn("[Seed] Materials seed failed:", err.message));
  });
}

startServer().catch((error) => {
  console.error("[Startup] Server failed to start", error);
  process.exitCode = 1;
});
