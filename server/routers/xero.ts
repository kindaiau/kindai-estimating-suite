import { z } from "zod";
import { requireDatabase } from "../_core/errors";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { companyProfiles, estimates, lineItems, projects } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { ENV } from "../_core/env";

// ─── Xero API Helpers ───────────────────────────────────────────────────────
const XERO_AUTH_URL = "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";
const XERO_API_BASE = "https://api.xero.com/api.xro/2.0";
const XERO_CONNECTIONS_URL = "https://api.xero.com/connections";

async function refreshXeroToken(db: any, profileId: number, refreshToken: string): Promise<string> {
  const clientId = ENV.xeroClientId;
  const clientSecret = ENV.xeroClientSecret;
  if (!clientId || !clientSecret) throw new Error("Xero credentials not configured");

  const response = await fetch(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("[Xero] Token refresh failed:", err);
    // Clear stored tokens on auth failure
    await db.update(companyProfiles).set({
      xeroAccessToken: null,
      xeroRefreshToken: null,
      xeroTokenExpiresAt: null,
      xeroTenantId: null,
      xeroConnectedAt: null,
    } as any).where(eq(companyProfiles.id, profileId));
    throw new Error("Xero authentication expired. Please reconnect.");
  }

  const data = await response.json();
  await db.update(companyProfiles).set({
    xeroAccessToken: data.access_token,
    xeroRefreshToken: data.refresh_token,
    xeroTokenExpiresAt: Date.now() + (data.expires_in * 1000),
  } as any).where(eq(companyProfiles.id, profileId));

  return data.access_token;
}

async function getValidXeroToken(db: any, userId: number): Promise<{ token: string; tenantId: string; profileId: number }> {
  const [profile] = await db.select().from(companyProfiles)
    .where(eq(companyProfiles.userId, userId))
    .limit(1);

  if (!profile?.xeroRefreshToken || !profile?.xeroTenantId) {
    throw new Error("Xero not connected. Please connect your Xero account first.");
  }

  // Check if token is expired (with 5 min buffer)
  const isExpired = !profile.xeroTokenExpiresAt || (profile.xeroTokenExpiresAt as number) < Date.now() + 300_000;
  
  if (isExpired) {
    const newToken = await refreshXeroToken(db, profile.id, profile.xeroRefreshToken);
    return { token: newToken, tenantId: profile.xeroTenantId, profileId: profile.id };
  }

  return { token: profile.xeroAccessToken!, tenantId: profile.xeroTenantId, profileId: profile.id };
}

async function xeroRequest(token: string, tenantId: string, path: string, options?: RequestInit) {
  const url = `${XERO_API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Xero-Tenant-Id": tenantId,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`[Xero] API error ${response.status}:`, err);
    throw new Error(`Xero API error: ${response.status} - ${err.slice(0, 200)}`);
  }

  return response.json();
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const xeroRouter = router({
  // ── Get connection status ────────────────────────────────────────────────
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    const [profile] = await db.select({
      xeroTenantId: companyProfiles.xeroTenantId,
      xeroConnectedAt: companyProfiles.xeroConnectedAt,
      xeroTokenExpiresAt: companyProfiles.xeroTokenExpiresAt,
    }).from(companyProfiles)
      .where(eq(companyProfiles.userId, ctx.user.id))
      .limit(1);

    return {
      connected: !!profile?.xeroTenantId,
      connectedAt: profile?.xeroConnectedAt ?? null,
      tenantId: profile?.xeroTenantId ?? null,
    };
  }),

  // ── Get OAuth URL ────────────────────────────────────────────────────────
  getAuthUrl: protectedProcedure.input(z.object({
    origin: z.string(),
  })).mutation(async ({ ctx, input }) => {
    const clientId = ENV.xeroClientId;
    if (!clientId) throw new Error("Xero Client ID not configured");

    const redirectUri = `${input.origin}/api/xero/callback`;
    const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, origin: input.origin })).toString("base64url");
    const scopes = "openid profile email accounting.transactions accounting.contacts accounting.settings offline_access";

    const url = `${XERO_AUTH_URL}?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&state=${state}`;

    return { url };
  }),

  // ── Disconnect Xero ──────────────────────────────────────────────────────
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    const db = requireDatabase(await getDb());
    await db.update(companyProfiles).set({
      xeroAccessToken: null,
      xeroRefreshToken: null,
      xeroTokenExpiresAt: null,
      xeroTenantId: null,
      xeroConnectedAt: null,
    } as any).where(eq(companyProfiles.userId, ctx.user.id));
    return { success: true };
  }),

  // ── Create or find a Xero contact from project client info ───────────────
  syncContact: protectedProcedure.input(z.object({
    projectId: z.number(),
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { token, tenantId } = await getValidXeroToken(db, ctx.user.id);

    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, input.projectId), eq(projects.userId, ctx.user.id)))
      .limit(1);
    if (!project) throw new Error("Project not found");
    if (!project.clientName) throw new Error("Project has no client name set");

    // Search for existing contact
    const searchResult = await xeroRequest(token, tenantId, `/Contacts?where=Name=="${encodeURIComponent(project.clientName)}"`);
    
    if (searchResult.Contacts && searchResult.Contacts.length > 0) {
      return { contactId: searchResult.Contacts[0].ContactID, name: searchResult.Contacts[0].Name, isNew: false };
    }

    // Create new contact
    const contactData: any = {
      Name: project.clientName,
    };
    if (project.clientEmail) contactData.EmailAddress = project.clientEmail;
    if (project.clientPhone) {
      contactData.Phones = [{ PhoneType: "MOBILE", PhoneNumber: project.clientPhone }];
    }
    if (project.address) {
      contactData.Addresses = [{
        AddressType: "STREET",
        AddressLine1: project.address,
        City: project.suburb || "",
        Region: project.state || "",
      }];
    }

    const createResult = await xeroRequest(token, tenantId, "/Contacts", {
      method: "POST",
      body: JSON.stringify({ Contacts: [contactData] }),
    });

    return {
      contactId: createResult.Contacts[0].ContactID,
      name: createResult.Contacts[0].Name,
      isNew: true,
    };
  }),

  // ── Push estimate as Xero invoice ────────────────────────────────────────
  createInvoice: protectedProcedure.input(z.object({
    estimateId: z.number(),
    contactId: z.string().optional(), // If not provided, will try to sync from project
    dueDate: z.string().optional(), // ISO date string
  })).mutation(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { token, tenantId } = await getValidXeroToken(db, ctx.user.id);

    // Load estimate
    const [estimate] = await db.select().from(estimates)
      .where(and(eq(estimates.id, input.estimateId), eq(estimates.userId, ctx.user.id)))
      .limit(1);
    if (!estimate) throw new Error("Estimate not found");

    // Load line items
    const items = await db.select().from(lineItems).where(eq(lineItems.estimateId, input.estimateId));

    // Get or create contact
    let contactId = input.contactId;
    if (!contactId) {
      const [project] = await db.select().from(projects)
        .where(eq(projects.id, estimate.projectId))
        .limit(1);
      if (project?.clientName) {
        const searchResult = await xeroRequest(token, tenantId, `/Contacts?where=Name=="${encodeURIComponent(project.clientName)}"`);
        if (searchResult.Contacts?.length > 0) {
          contactId = searchResult.Contacts[0].ContactID;
        }
      }
    }

    // Build invoice line items
    const invoiceLines = items.map(item => {
      const qty = parseFloat(item.quantity as string);
      const rate = parseFloat(item.unitRate as string);
      const waste = parseFloat(item.wasteFactor as string) / 100;
      const unitAmount = rate * (1 + waste);

      return {
        Description: `${item.category}: ${item.description}`,
        Quantity: qty,
        UnitAmount: Math.round(unitAmount * 100) / 100,
        AccountCode: "200", // Default sales account
        TaxType: "OUTPUT", // GST on income
      };
    });

    // Apply margin as a separate line
    const marginRate = parseFloat(estimate.margin as string) || 0;
    if (marginRate > 0) {
      const subtotalBeforeMargin = items.reduce((sum, item) => {
        const qty = parseFloat(item.quantity as string);
        const rate = parseFloat(item.unitRate as string);
        const waste = parseFloat(item.wasteFactor as string) / 100;
        return sum + qty * rate * (1 + waste);
      }, 0);
      const marginAmount = subtotalBeforeMargin * (marginRate / 100);
      invoiceLines.push({
        Description: `Margin (${marginRate}%)`,
        Quantity: 1,
        UnitAmount: Math.round(marginAmount * 100) / 100,
        AccountCode: "200",
        TaxType: "OUTPUT",
      });
    }

    // Calculate due date
    const dueDate = input.dueDate || new Date(Date.now() + (estimate.quoteValidDays || 30) * 86400000).toISOString().split("T")[0];

    const invoiceData: any = {
      Type: "ACCREC", // Accounts receivable (sales invoice)
      Status: "DRAFT",
      Date: new Date().toISOString().split("T")[0],
      DueDate: dueDate,
      Reference: estimate.quoteNumber || `KAI-${estimate.id}`,
      LineAmountTypes: "Exclusive", // Amounts are exclusive of GST
      LineItems: invoiceLines,
    };

    if (contactId) {
      invoiceData.Contact = { ContactID: contactId };
    }

    const result = await xeroRequest(token, tenantId, "/Invoices", {
      method: "POST",
      body: JSON.stringify({ Invoices: [invoiceData] }),
    });

    const invoice = result.Invoices[0];
    return {
      invoiceId: invoice.InvoiceID,
      invoiceNumber: invoice.InvoiceNumber,
      status: invoice.Status,
      total: invoice.Total,
      xeroUrl: `https://go.xero.com/AccountsReceivable/View.aspx?InvoiceID=${invoice.InvoiceID}`,
    };
  }),

  // ── List recent invoices ─────────────────────────────────────────────────
  listInvoices: protectedProcedure.input(z.object({
    limit: z.number().optional().default(10),
  })).query(async ({ ctx, input }) => {
    const db = requireDatabase(await getDb());
    const { token, tenantId } = await getValidXeroToken(db, ctx.user.id);

    const result = await xeroRequest(token, tenantId, `/Invoices?order=Date DESC&page=1&pageSize=${input.limit}`);
    
    return (result.Invoices || []).map((inv: any) => ({
      invoiceId: inv.InvoiceID,
      invoiceNumber: inv.InvoiceNumber,
      reference: inv.Reference,
      contactName: inv.Contact?.Name,
      status: inv.Status,
      total: inv.Total,
      amountDue: inv.AmountDue,
      date: inv.Date,
      dueDate: inv.DueDate,
    }));
  }),
});
