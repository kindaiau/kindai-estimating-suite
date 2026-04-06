import {
  bigint,
  boolean,
  decimal,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Trade preferences
  defaultTrade: varchar("defaultTrade", { length: 64 }),
  companyName: text("companyName"),
  abn: varchar("abn", { length: 20 }),
  state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  // Stripe
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "sole_trader", "small_builder", "mid_builder", "enterprise"]).default("free").notNull(),
  subscriptionStatus: varchar("subscriptionStatus", { length: 32 }).default("none"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  clientPhone: varchar("clientPhone", { length: 20 }),
  address: text("address"),
  suburb: varchar("suburb", { length: 100 }),
  state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  postcode: varchar("postcode", { length: 10 }),
  trade: varchar("trade", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["draft", "quoted", "accepted", "declined", "invoiced", "completed"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ─── Estimates ────────────────────────────────────────────────────────────────
export const estimates = mysqlTable("estimates", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  trade: varchar("trade", { length: 64 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  version: int("version").default(1).notNull(),
  status: mysqlEnum("status", ["draft", "review", "sent", "accepted", "declined"]).default("draft").notNull(),
  // Financials
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).default("0.00").notNull(),
  gstAmount: decimal("gstAmount", { precision: 12, scale: 2 }).default("0.00").notNull(),
  total: decimal("total", { precision: 12, scale: 2 }).default("0.00").notNull(),
  margin: decimal("margin", { precision: 5, scale: 2 }).default("15.00"),
  // AI Takeoff
  planFileUrl: text("planFileUrl"),
  planFileKey: text("planFileKey"),
  aiConfidenceScore: int("aiConfidenceScore"),
  aiAssumptions: json("aiAssumptions"),
  aiTakeoffData: json("aiTakeoffData"),
  // Compliance
  complianceState: mysqlEnum("complianceState", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  complianceChecked: boolean("complianceChecked").default(false),
  complianceNotes: text("complianceNotes"),
  // Quote
  quoteNumber: varchar("quoteNumber", { length: 50 }),
  quoteValidDays: int("quoteValidDays").default(30),
  quoteTerms: text("quoteTerms"),
  quotePdfUrl: text("quotePdfUrl"),
  quotePdfKey: text("quotePdfKey"),
  clientSignature: text("clientSignature"),
  clientSignedAt: timestamp("clientSignedAt"),
  acceptanceToken: varchar("acceptanceToken", { length: 64 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Estimate = typeof estimates.$inferSelect;
export type InsertEstimate = typeof estimates.$inferInsert;

// ─── Line Items ───────────────────────────────────────────────────────────────
export const lineItems = mysqlTable("line_items", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: int("estimateId").notNull(),
  section: varchar("section", { length: 150 }), // e.g. "Sewer Drainage", "Stormwater", "Trenching & Excavation", "Cold Water Rough-In", "Hot Water System", "Internal Fixtures", "Appliance Installs", "Preliminaries"
  category: varchar("category", { length: 100 }).notNull(), // e.g. "Materials", "Labour", "Plant", "Subcontract"
  description: varchar("description", { length: 500 }).notNull(),
  unit: varchar("unit", { length: 30 }).notNull(), // e.g. "m²", "lm", "ea", "hr"
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitRate: decimal("unitRate", { precision: 10, scale: 2 }).notNull(),
  wasteFactor: decimal("wasteFactor", { precision: 5, scale: 2 }).default("0.00"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  isFromAi: boolean("isFromAi").default(false),
  notes: text("notes"),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type LineItem = typeof lineItems.$inferSelect;
export type InsertLineItem = typeof lineItems.$inferInsert;

// ─── Materials Library ────────────────────────────────────────────────────────
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = system/default material
  trade: varchar("trade", { length: 64 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  unit: varchar("unit", { length: 30 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  supplier: varchar("supplier", { length: 100 }),
  supplierCode: varchar("supplierCode", { length: 50 }),
  wasteFactor: decimal("wasteFactor", { precision: 5, scale: 2 }).default("5.00"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

// ─── Labour Rates ─────────────────────────────────────────────────────────────
export const labourRates = mysqlTable("labour_rates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null = system default
  trade: varchar("trade", { length: 64 }).notNull(),
  classification: varchar("classification", { length: 100 }).notNull(), // e.g. "Electrician - Grade 1"
  baseRate: decimal("baseRate", { precision: 8, scale: 2 }).notNull(), // $/hr
  overtimeRate: decimal("overtimeRate", { precision: 8, scale: 2 }),
  saturdayRate: decimal("saturdayRate", { precision: 8, scale: 2 }),
  sundayRate: decimal("sundayRate", { precision: 8, scale: 2 }),
  publicHolidayRate: decimal("publicHolidayRate", { precision: 8, scale: 2 }),
  travelAllowance: decimal("travelAllowance", { precision: 8, scale: 2 }).default("0.00"),
  toolAllowance: decimal("toolAllowance", { precision: 8, scale: 2 }).default("0.00"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LabourRate = typeof labourRates.$inferSelect;
export type InsertLabourRate = typeof labourRates.$inferInsert;

// ─── Compliance Profiles ──────────────────────────────────────────────────────
export const complianceProfiles = mysqlTable("compliance_profiles", {
  id: int("id").autoincrement().primaryKey(),
  trade: varchar("trade", { length: 64 }).notNull(),
  state: mysqlEnum("state", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT", "ALL"]).notNull(),
  licensingBody: varchar("licensingBody", { length: 200 }),
  licenseType: varchar("licenseType", { length: 200 }),
  licenseUrl: text("licenseUrl"),
  whsNotice: text("whsNotice"),
  standards: json("standards"), // array of { code, title, url }
  quoteDisclaimer: text("quoteDisclaimer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ComplianceProfile = typeof complianceProfiles.$inferSelect;

// ─── Trade Profiles (per-user, per-trade customisation) ───────────────────────
export const tradeProfiles = mysqlTable("trade_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trade: varchar("trade", { length: 64 }).notNull(), // e.g. "electrical"
  // Business branding
  businessName: varchar("businessName", { length: 255 }),
  abn: varchar("abn", { length: 20 }),
  licenseNumber: varchar("licenseNumber", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 320 }),
  website: varchar("website", { length: 255 }),
  address: text("address"),
  logoUrl: text("logoUrl"),
  brandColour: varchar("brandColour", { length: 7 }).default("#FF2D78"), // hex
  // Quote defaults
  defaultMarkup: decimal("defaultMarkup", { precision: 5, scale: 2 }).default("20.00"),
  defaultLabourRate: decimal("defaultLabourRate", { precision: 8, scale: 2 }),
  defaultValidDays: int("defaultValidDays").default(30),
  defaultTerms: text("defaultTerms"),
  defaultState: mysqlEnum("defaultState", ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "NT", "ACT"]),
  // Email automation
  emailFromName: varchar("emailFromName", { length: 255 }),
  emailFromAddress: varchar("emailFromAddress", { length: 320 }),
  emailSignature: text("emailSignature"),
  sendQuoteAutomatically: boolean("sendQuoteAutomatically").default(false),
  followUpEnabled: boolean("followUpEnabled").default(true),
  followUpDays: int("followUpDays").default(3),
  reminderEnabled: boolean("reminderEnabled").default(true),
  reminderDays: int("reminderDays").default(7),
  // Supplier connections
  suppliers: json("suppliers"), // array of { name, contactName, email, phone, accountNumber, notes }
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TradeProfile = typeof tradeProfiles.$inferSelect;
export type InsertTradeProfile = typeof tradeProfiles.$inferInsert;

// ─── Email Templates ──────────────────────────────────────────────────────────
export const emailTemplates = mysqlTable("email_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  trade: varchar("trade", { length: 64 }), // null = applies to all trades
  type: mysqlEnum("type", [
    "quote_delivery",   // Initial quote sent to client
    "quote_followup",   // 3-day follow-up
    "quote_reminder",   // 7-day reminder
    "quote_accepted",   // Confirmation when client accepts
    "supplier_order",   // Materials order sent to supplier
  ]).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  bodyHtml: text("bodyHtml").notNull(), // HTML with {{variables}}
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

// ─── Team Members (Enterprise Multi-User) ─────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(), // The account owner who invited this member
  userId: int("userId"), // null until invitation accepted
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  role: mysqlEnum("role", ["owner", "estimator", "project_manager", "quantity_surveyor", "viewer"]).notNull(),
  status: mysqlEnum("status", ["pending", "active", "suspended"]).default("pending").notNull(),
  inviteToken: varchar("inviteToken", { length: 64 }),
  inviteExpiresAt: timestamp("inviteExpiresAt"),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ─── Tenders (Bid Management) ─────────────────────────────────────────────────
export const tenders = mysqlTable("tenders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // owner
  projectId: int("projectId"),
  title: varchar("title", { length: 255 }).notNull(),
  tenderNumber: varchar("tenderNumber", { length: 50 }),
  trade: varchar("trade", { length: 64 }).notNull(),
  scopeOfWorks: text("scopeOfWorks"),
  siteAddress: text("siteAddress"),
  estimatedValue: decimal("estimatedValue", { precision: 14, scale: 2 }),
  dueDate: timestamp("dueDate"),
  status: mysqlEnum("status", ["draft", "issued", "bids_received", "under_review", "awarded", "closed"]).default("draft").notNull(),
  awardedBidId: int("awardedBidId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Tender = typeof tenders.$inferSelect;
export type InsertTender = typeof tenders.$inferInsert;

// ─── Tender Bids (Subcontractor Responses) ────────────────────────────────────
export const tenderBids = mysqlTable("tender_bids", {
  id: int("id").autoincrement().primaryKey(),
  tenderId: int("tenderId").notNull(),
  subcontractorName: varchar("subcontractorName", { length: 255 }).notNull(),
  subcontractorEmail: varchar("subcontractorEmail", { length: 320 }),
  subcontractorPhone: varchar("subcontractorPhone", { length: 20 }),
  subcontractorAbn: varchar("subcontractorAbn", { length: 20 }),
  bidAmount: decimal("bidAmount", { precision: 14, scale: 2 }),
  gstIncluded: boolean("gstIncluded").default(true),
  completionWeeks: int("completionWeeks"),
  inclusions: text("inclusions"),
  exclusions: text("exclusions"),
  notes: text("notes"),
  attachmentUrl: text("attachmentUrl"),
  submissionToken: varchar("submissionToken", { length: 64 }), // for public submission link
  status: mysqlEnum("status", ["invited", "submitted", "under_review", "shortlisted", "awarded", "declined"]).default("invited").notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TenderBid = typeof tenderBids.$inferSelect;
export type InsertTenderBid = typeof tenderBids.$inferInsert;

// ─── Audit Log (Immutable) ────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for system actions
  userName: varchar("userName", { length: 255 }),
  userEmail: varchar("userEmail", { length: 320 }),
  action: mysqlEnum("action", ["create", "update", "delete", "view", "export", "login", "logout", "invite", "accept", "award"]).notNull(),
  entityType: varchar("entityType", { length: 64 }).notNull(), // e.g. "estimate", "project", "tender"
  entityId: int("entityId"),
  entityName: varchar("entityName", { length: 255 }),
  projectId: int("projectId"), // for project-scoped filtering
  beforeData: json("beforeData"), // snapshot before change
  afterData: json("afterData"),  // snapshot after change
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Cost Codes (WBS / Budget Tracking) ──────────────────────────────────────
export const costCodes = mysqlTable("cost_codes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"), // null = company-level template
  code: varchar("code", { length: 30 }).notNull(), // e.g. "01.01", "ELEC-001"
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }), // e.g. "Preliminaries", "Structure", "Services"
  budgetAmount: decimal("budgetAmount", { precision: 14, scale: 2 }).default("0.00"),
  committedAmount: decimal("committedAmount", { precision: 14, scale: 2 }).default("0.00"),
  actualAmount: decimal("actualAmount", { precision: 14, scale: 2 }).default("0.00"),
  forecastAmount: decimal("forecastAmount", { precision: 14, scale: 2 }).default("0.00"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostCode = typeof costCodes.$inferSelect;
export type InsertCostCode = typeof costCodes.$inferInsert;

// ─── Variations (Change Orders) ───────────────────────────────────────────────
export const variations = mysqlTable("variations", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  estimateId: int("estimateId"),
  userId: int("userId").notNull(),
  variationNumber: varchar("variationNumber", { length: 50 }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  reason: mysqlEnum("reason", ["client_request", "design_change", "site_condition", "scope_omission", "regulatory", "other"]).default("client_request").notNull(),
  costImpact: decimal("costImpact", { precision: 14, scale: 2 }).notNull(), // positive = addition, negative = deduction
  timeImpactDays: int("timeImpactDays").default(0),
  status: mysqlEnum("status", ["draft", "submitted", "approved", "rejected", "on_hold"]).default("draft").notNull(),
  approvedBy: varchar("approvedBy", { length: 255 }),
  approvedAt: timestamp("approvedAt"),
  attachmentUrl: text("attachmentUrl"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Variation = typeof variations.$inferSelect;
export type InsertVariation = typeof variations.$inferInsert;

// ─── Quote Follow-ups (Automated Email Sequence) ──────────────────────────────
export const quoteFollowups = mysqlTable("quote_followups", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: int("estimateId").notNull(),
  userId: int("userId").notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }).notNull(),
  clientName: varchar("clientName", { length: 255 }),
  dayOffset: int("dayOffset").notNull(), // 1, 3, 7, or 14
  label: varchar("label", { length: 100 }),
  scheduledAt: bigint("scheduledAt", { mode: "number" }), // Unix ms
  sentAt: bigint("sentAt", { mode: "number" }),
  status: mysqlEnum("status", ["scheduled", "sent", "cancelled", "bounced"]).default("scheduled").notNull(),
  emailSubject: varchar("emailSubject", { length: 500 }),
  emailBody: text("emailBody"),
  openedAt: bigint("openedAt", { mode: "number" }),
  clickedAt: bigint("clickedAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuoteFollowup = typeof quoteFollowups.$inferSelect;
export type InsertQuoteFollowup = typeof quoteFollowups.$inferInsert;

// ─── Supplier Connections (Trade Account Integration) ─────────────────────────
export const supplierConnections = mysqlTable("supplier_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  supplierName: varchar("supplierName", { length: 255 }).notNull(),
  supplierWebsite: varchar("supplierWebsite", { length: 500 }),
  supplierType: mysqlEnum("supplierType", ["trade_account", "retail", "direct", "custom"]).default("trade_account").notNull(),
  trades: json("trades"), // array of trade strings this supplier covers
  accountNumber: varchar("accountNumber", { length: 100 }),
  contactName: varchar("contactName", { length: 255 }),
  contactEmail: varchar("contactEmail", { length: 320 }),
  contactPhone: varchar("contactPhone", { length: 20 }),
  discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }).default("0.00"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierConnection = typeof supplierConnections.$inferSelect;
export type InsertSupplierConnection = typeof supplierConnections.$inferInsert;

// ─── Quote Tokens (Public Quote Acceptance Links) ─────────────────────────────
export const quoteTokens = mysqlTable("quote_tokens", {
  id: int("id").autoincrement().primaryKey(),
  estimateId: int("estimateId").notNull(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }),
  clientEmail: varchar("clientEmail", { length: 320 }),
  status: mysqlEnum("status", ["pending", "viewed", "accepted", "declined", "expired"]).default("pending").notNull(),
  message: text("message"), // optional message to client
  expiresAt: timestamp("expiresAt"),
  viewedAt: timestamp("viewedAt"),
  respondedAt: timestamp("respondedAt"),
  clientSignature: text("clientSignature"), // base64 signature or name typed
  clientNotes: text("clientNotes"),
  pdfUrl: text("pdfUrl"), // S3 URL of the generated PDF
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuoteToken = typeof quoteTokens.$inferSelect;
export type InsertQuoteToken = typeof quoteTokens.$inferInsert;
