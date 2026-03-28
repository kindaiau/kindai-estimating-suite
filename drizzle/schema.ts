import {
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
