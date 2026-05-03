import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

const SPA_ROUTE_PATTERNS = [
  /^\/$/,
  /^\/dashboard$/,
  /^\/projects$/,
  /^\/projects\/[^/]+$/,
  /^\/projects\/[^/]+\/variations$/,
  /^\/estimates\/[^/]+$/,
  /^\/materials$/,
  /^\/labour$/,
  /^\/profile$/,
  /^\/ai-takeoff$/,
  /^\/pricing$/,
  /^\/billing$/,
  /^\/trade-profiles$/,
  /^\/demo$/,
  /^\/login$/,
  /^\/suppliers$/,
  /^\/followups$/,
  /^\/quote\/accept\/[^/]+$/,
  /^\/beta$/,
  /^\/privacy-policy$/,
  /^\/privacy$/,
  /^\/data-deletion$/,
  /^\/terms$/,
  /^\/terms-of-service$/,
  /^\/support$/,
  /^\/cabinet-joinery$/,
  /^\/about$/,
  /^\/help$/,
  /^\/admin\/fb-leads$/,
  /^\/settings$/,
  /^\/accuracy$/,
  /^\/motyl$/,
  /^\/moytle$/,
  /^\/getgas$/,
  /^\/404$/,
];

function spaStatusFor(url: string) {
  const pathname = url.split("?")[0].split("#")[0];
  return SPA_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname)) ? 200 : 404;
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(spaStatusFor(url)).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("/{*path}", (req, res) => {
    res.status(spaStatusFor(req.originalUrl)).sendFile(path.resolve(distPath, "index.html"));
  });
}
