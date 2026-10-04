import { lockEstimate } from "../estimateEdits";
import { priceEstimate, savedPricingMatches } from "../estimatePricing";
import { appOrigin } from "../xeroState";
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quoteTokens, estimates, lineItems, users } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { buildQuoteAssuranceReport, deriveAssuranceEstimate } from "../assurance";

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export const quoteTokensRouter = router({
  // Send quote to client — creates a token and returns the public URL
  sendQuote: protectedProcedure.input(z.object({
    estimateId: z.number().int().positive(),
    expectedVersion: z.number().int().positive(),
    clientName: z.string().min(1).max(255),
    clientEmail: z.string().email().optional().or(z.literal("")),
    message: z.string().max(2000).optional(),
    expiryDays: z.number().int().min(1).max(90).default(30),
    origin: z.string().url(), // frontend origin for building the URL
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    return db.transaction(async db => {
    const estimate = await lockEstimate(db, ctx.user.id, input.estimateId, input.expectedVersion);
    const items = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.estimateId, input.estimateId));
    if (!savedPricingMatches(estimate, items)) throw new TRPCError({
      code: 'PRECONDITION_FAILED', message: 'Saved pricing needs Recalculate. Review the newly saved version before issuing this quote.',
    });
    const totals = priceEstimate(items, estimate.margin);
    const snapshot = {
      estimate: { id: estimate.id, title: estimate.title, trade: estimate.trade, notes: estimate.notes, version: estimate.version, ...totals },
      items,
      sender: { name: ctx.user.name, companyName: ctx.user.companyName, abn: ctx.user.abn, phone: ctx.user.phone, email: ctx.user.email, licenseNumber: ctx.user.licenseNumber },
    };
    const assurance = buildQuoteAssuranceReport(deriveAssuranceEstimate(estimate, items), items);
    if (!assurance.canIssue) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Quote assurance blocked sending: ${assurance.issueBlocks[0]}`,
      });
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expiryDays);

    // Deactivate any existing pending tokens for this estimate
    await db
      .update(quoteTokens)
      .set({ status: "expired" })
      .where(and(
        eq(quoteTokens.estimateId, input.estimateId),
        eq(quoteTokens.userId, ctx.user.id),
        sql`${quoteTokens.status} IN ('pending', 'viewed')`
      ));

    // Create new token
    await db.insert(quoteTokens).values({
      estimateId: input.estimateId,
      userId: ctx.user.id,
      token,
      snapshot,
      clientName: input.clientName,
      clientEmail: input.clientEmail || null,
      message: input.message,
      expiresAt,
      sentAt: new Date(),
      status: "pending",
    });

    await db
      .update(estimates)
      .set({ status: "sent" })
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)));

    const quoteUrl = `${appOrigin(input.origin)}/quote/accept/${token}`;

    return {
      token,
      quoteUrl,
      expiresAt,
      clientEmail: input.clientEmail || null,
    };
    });
  }),

  // Get all sent quotes for the current user
  listSentQuotes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const tokens = await db
      .select({
        id: quoteTokens.id,
        token: quoteTokens.token,
        clientName: quoteTokens.clientName,
        clientEmail: quoteTokens.clientEmail,
        status: quoteTokens.status,
        expiresAt: quoteTokens.expiresAt,
        sentAt: quoteTokens.sentAt,
        viewedAt: quoteTokens.viewedAt,
        respondedAt: quoteTokens.respondedAt,
        estimateId: quoteTokens.estimateId,
        snapshot: quoteTokens.snapshot,
        estimateTitle: estimates.title,
        estimateTotal: estimates.total,
        estimateTrade: estimates.trade,
      })
      .from(quoteTokens)
      .leftJoin(estimates, eq(quoteTokens.estimateId, estimates.id))
      .where(eq(quoteTokens.userId, ctx.user.id))
      .orderBy(quoteTokens.createdAt);

    return tokens.map(({ snapshot: raw, ...token }) => {
      const snapshot = typeof raw === 'string' ? JSON.parse(raw) as NonNullable<typeof raw> : raw;
      return snapshot ? { ...token, estimateTitle: snapshot.estimate.title, estimateTotal: snapshot.estimate.total, estimateTrade: snapshot.estimate.trade } : token;
    });
  }),

  // Public: get quote by token (no auth required)
  getByToken: publicProcedure.input(z.object({
    token: z.string().min(1),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [qt] = await db
      .select()
      .from(quoteTokens)
      .where(eq(quoteTokens.token, input.token));

    if (!qt) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
    }

    if (qt.status === "expired" || (qt.expiresAt && qt.expiresAt < new Date())) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This quote link has expired" });
    }

    // Mark as viewed if first time
    if (qt.status === "pending") {
      await db
        .update(quoteTokens)
        .set({ status: "viewed", viewedAt: new Date() })
        .where(and(eq(quoteTokens.id, qt.id), eq(quoteTokens.status, "pending")));
    }

    if (!qt.snapshot) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'This legacy quote needs to be reissued by the contractor before it can be reviewed or accepted.' });
    const snapshot = typeof qt.snapshot === 'string' ? JSON.parse(qt.snapshot) as NonNullable<typeof qt.snapshot> : qt.snapshot;
    return { token: qt, ...snapshot };

  }),

  // Public: accept or decline a quote
  respond: publicProcedure.input(z.object({
    token: z.string().min(1),
    action: z.enum(["accepted", "declined"]),
    clientSignature: z.string().optional(),
    clientNotes: z.string().max(1000).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    return db.transaction(async db => {
    const [qt] = await db
      .select()
      .from(quoteTokens)
      .where(eq(quoteTokens.token, input.token)).for("update");

    if (!qt) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
    }

    if (qt.status === "expired" || (qt.expiresAt && qt.expiresAt < new Date())) {
      throw new TRPCError({ code: "FORBIDDEN", message: "This quote link has expired" });
    }

    if (!qt.snapshot) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Ask the contractor to reissue this legacy quote." });

    if (qt.status === "accepted" || qt.status === "declined") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "This quote has already been responded to" });
    }

    await db
      .update(quoteTokens)
      .set({
        status: input.action,
        respondedAt: new Date(),
        clientSignature: input.clientSignature,
        clientNotes: input.clientNotes,
      })
      .where(eq(quoteTokens.id, qt.id));

    return { success: true, status: input.action };
    });
  }),
});
