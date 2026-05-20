import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { ebookLeads } from "../../drizzle/schema";
import { sendEbookDelivery } from "../ebookEmail";
import {
  buildLeadEvent,
  createMetaEventId,
  getRequestMetaContext,
  sendMetaConversionEventSafely,
} from "../metaCapi";

const DEFAULT_LANDING_PAGE_URL = "https://kindaibook-55hbndtb.manus.space";
const DEFAULT_ALLOWED_ORIGINS = new Set([
  DEFAULT_LANDING_PAGE_URL,
  "https://kindaiestimator.com",
  "https://www.kindaiestimator.com",
  "http://localhost:3000",
  "http://localhost:5173",
]);

const leadCaptureSchema = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().min(1).max(255).optional(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  trade: z.string().trim().max(64).optional(),
  source: z.string().trim().max(128).optional(),
  utmSource: z.string().trim().max(128).optional(),
  utmCampaign: z.string().trim().max(128).optional(),
  utmMedium: z.string().trim().max(128).optional(),
  eventId: z.string().trim().max(255).optional(),
  eventSourceUrl: z.string().trim().url().max(2048).optional(),
  fbp: z.string().trim().max(255).optional(),
  fbc: z.string().trim().max(255).optional(),
});

function getAllowedOrigins() {
  const configured = process.env.LEAD_CAPTURE_ALLOWED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...(configured ?? []), ...Array.from(DEFAULT_ALLOWED_ORIGINS)]);
}

function applyCors(req: Request, res: Response) {
  const origin = req.headers.origin;
  if (origin && getAllowedOrigins().has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function leadCaptureCors(req: Request, res: Response, next: NextFunction) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}

function buildLeadName(input: z.infer<typeof leadCaptureSchema>) {
  if (input.name) return input.name;
  const joined = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
  return joined || "Kindai lead";
}

async function handleLeadCapture(req: Request, res: Response) {
  const parsed = leadCaptureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      success: false,
      error: "Invalid lead payload",
      issues: parsed.error.flatten().fieldErrors,
    });
  }

  const input = parsed.data;
  const db = await getDb();
  if (!db) {
    return res.status(503).json({ success: false, error: "Database unavailable" });
  }

  const email = input.email.toLowerCase();
  const name = buildLeadName(input);
  const eventSourceUrl = input.eventSourceUrl ?? req.headers.referer ?? DEFAULT_LANDING_PAGE_URL;

  try {
    const existing = await db
      .select({ id: ebookLeads.id, ebookSentAt: ebookLeads.ebookSentAt })
      .from(ebookLeads)
      .where(eq(ebookLeads.email, email))
      .limit(1);

    let leadId: number;
    let alreadyRegistered = false;
    let ebookSent = Boolean(existing[0]?.ebookSentAt);

    if (existing.length > 0) {
      alreadyRegistered = true;
      leadId = existing[0].id;
    } else {
      const [inserted] = await db
        .insert(ebookLeads)
        .values({
          name,
          email,
          trade: input.trade,
          source: input.source ?? "kindai_book_landing_page",
          utmSource: input.utmSource,
          utmCampaign: input.utmCampaign,
          utmMedium: input.utmMedium,
        })
        .$returningId();

      leadId = inserted.id;
    }

    if (!ebookSent) {
      try {
        const messageId = await sendEbookDelivery({ to: email, name });
        if (messageId) {
          ebookSent = true;
          await db
            .update(ebookLeads)
            .set({ ebookSentAt: Date.now() })
            .where(eq(ebookLeads.id, leadId));
        }
      } catch (err: unknown) {
        console.error("[LeadCapture] Ebook delivery failed:", err instanceof Error ? err.message : String(err));
      }
    }

    const requestContext = getRequestMetaContext(req, { fbp: input.fbp, fbc: input.fbc });
    const eventId = input.eventId || createMetaEventId("lead_capture", leadId);

    sendMetaConversionEventSafely(
      buildLeadEvent({
        email,
        name,
        phone: input.phone,
        eventId,
        eventSourceUrl,
        source: input.source ?? "kindai_book_landing_page",
        trade: input.trade,
        ...requestContext,
        customData: {
          content_name: "Kindai Ebook Download",
          landing_page: DEFAULT_LANDING_PAGE_URL,
          lead_id: leadId,
          already_registered: alreadyRegistered,
          utm_source: input.utmSource,
          utm_medium: input.utmMedium,
          utm_campaign: input.utmCampaign,
        },
      }),
      `lead capture ${leadId}`
    );

    console.log(`[LeadCapture] ${alreadyRegistered ? "Existing" : "New"} ebook lead captured: ${email} (${name})`);

    return res.json({
      success: true,
      alreadyRegistered,
      ebookSent,
      leadId,
      metaEventId: eventId,
    });
  } catch (err: unknown) {
    console.error("[LeadCapture] Failed to capture lead:", err instanceof Error ? err.message : String(err));
    return res.status(500).json({ success: false, error: "Lead capture failed" });
  }
}

export const leadCaptureRouter = Router();

leadCaptureRouter.use(leadCaptureCors);
leadCaptureRouter.options(["/", "/ebook"], (_req, res) => res.status(204).end());
leadCaptureRouter.post("/", handleLeadCapture);
leadCaptureRouter.post("/ebook", handleLeadCapture);
