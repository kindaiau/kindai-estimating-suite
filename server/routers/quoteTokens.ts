import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { quoteTokens, estimates, lineItems, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import crypto from "crypto";
import { buildQuoteAssuranceReport } from "../assurance";

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export const quoteTokensRouter = router({
  // Send quote to client — creates a token and returns the public URL
  sendQuote: protectedProcedure.input(z.object({
    estimateId: z.number().int().positive(),
    clientName: z.string().min(1).max(255),
    clientEmail: z.string().email().optional().or(z.literal("")),
    message: z.string().max(2000).optional(),
    expiryDays: z.number().int().min(1).max(90).default(30),
    origin: z.string().url(), // frontend origin for building the URL
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Verify estimate belongs to user
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)));

    if (!estimate) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Estimate not found" });
    }

    const items = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.estimateId, input.estimateId));
    const assurance = buildQuoteAssuranceReport(estimate, items);
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
        eq(quoteTokens.userId, ctx.user.id)
      ));

    // Create new token
    await db.insert(quoteTokens).values({
      estimateId: input.estimateId,
      userId: ctx.user.id,
      token,
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

    const quoteUrl = `${input.origin}/quote/accept/${token}`;

    return {
      token,
      quoteUrl,
      expiresAt,
      clientEmail: input.clientEmail || null,
    };
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
        estimateTitle: estimates.title,
        estimateTotal: estimates.total,
        estimateTrade: estimates.trade,
      })
      .from(quoteTokens)
      .leftJoin(estimates, eq(quoteTokens.estimateId, estimates.id))
      .where(eq(quoteTokens.userId, ctx.user.id))
      .orderBy(quoteTokens.createdAt);

    return tokens;
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
        .where(eq(quoteTokens.id, qt.id));
    }

    // Get estimate details
    const [estimate] = await db
      .select()
      .from(estimates)
      .where(eq(estimates.id, qt.estimateId));

    if (!estimate) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Estimate not found" });
    }

    // Get line items
    const items = await db
      .select()
      .from(lineItems)
      .where(eq(lineItems.estimateId, qt.estimateId));

    // Get sender info (company name, ABN, phone)
    const [sender] = await db
      .select({
        name: users.name,
        companyName: users.companyName,
        abn: users.abn,
        phone: users.phone,
        email: users.email,
        licenseNumber: users.licenseNumber,
      })
      .from(users)
      .where(eq(users.id, qt.userId));

    return {
      token: qt,
      estimate,
      items,
      sender,
    };
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
  }),
});
