import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { betaSignups, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      // Use a connection pool instead of a single connection to handle concurrent requests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pool = mysql.createPool(ENV.databaseUrl).promise() as any;
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function checkDatabaseReadiness() {
  if (!ENV.databaseUrl) {
    return {
      configured: false,
      ready: false,
      error: "DATABASE_URL is not configured",
    };
  }

  const db = await getDb();
  if (!db) {
    return {
      configured: true,
      ready: false,
      error: "Database client could not be created",
    };
  }

  try {
    await db.execute(sql`select 1`);
    return {
      configured: true,
      ready: true,
    };
  } catch (error) {
    console.error("[Database] Readiness check failed:", error);
    return {
      configured: true,
      ready: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "defaultTrade"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });

    const normalizedEmail = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
    if (normalizedEmail) {
      const [paidSetup] = await db
        .select({
          status: betaSignups.status,
          intent: betaSignups.intent,
          paymentStatus: betaSignups.paymentStatus,
          accessExpiresAt: betaSignups.accessExpiresAt,
        })
        .from(betaSignups)
        .where(eq(betaSignups.email, normalizedEmail))
        .limit(1);

      const accessIsActive =
        paidSetup?.status === "active" &&
        paidSetup.intent === "Paid Pilot Setup" &&
        paidSetup.paymentStatus === "paid" &&
        paidSetup.accessExpiresAt &&
        new Date(paidSetup.accessExpiresAt).getTime() > Date.now();

      if (accessIsActive) {
        const [currentUser] = await db
          .select({ id: users.id, tier: users.subscriptionTier, status: users.subscriptionStatus })
          .from(users)
          .where(eq(users.openId, user.openId))
          .limit(1);

        if (currentUser && (currentUser.tier === "free" || currentUser.status === "pilot_active")) {
          await db
            .update(users)
            .set({
              subscriptionTier: "sole_trader",
              subscriptionStatus: "pilot_active",
              isBetaUser: true,
              betaExpiresAt: paidSetup.accessExpiresAt,
            })
            .where(eq(users.id, currentUser.id));
        }
      }
    }
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TODO: add feature queries here as your schema grows.
