import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { aiUsageEvents, users } from "../drizzle/schema";
import { getDb } from "./db";
import { getPlanById } from "./stripe/products";

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "pilot_active"]);

function monthStartUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function isDuplicateKeyError(error: unknown): boolean {
  const candidate = error as {
    code?: string;
    errno?: number;
    cause?: { code?: string; errno?: number };
  };
  return (
    candidate?.code === "ER_DUP_ENTRY" ||
    candidate?.errno === 1062 ||
    candidate?.cause?.code === "ER_DUP_ENTRY" ||
    candidate?.cause?.errno === 1062
  );
}

export async function requirePaidAiAccess(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  }

  const [user] = await db
    .select({
      tier: users.subscriptionTier,
      status: users.subscriptionStatus,
      role: users.role,
      isBetaUser: users.isBetaUser,
      betaExpiresAt: users.betaExpiresAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }

  if (user.role === "admin") {
    const adminPlan = getPlanById("mid_builder");
    if (!adminPlan) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Admin plan configuration missing" });
    }
    return { db, plan: adminPlan, user };
  }

  const pilotExpired = user.isBetaUser && user.betaExpiresAt
    ? new Date(user.betaExpiresAt).getTime() <= Date.now()
    : false;
  const paidTier = user.tier !== "free";
  const activeStatus = ACTIVE_SUBSCRIPTION_STATUSES.has(user.status ?? "none");

  if (!paidTier || !activeStatus || pilotExpired) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: pilotExpired
        ? "Your included Founding Workflow Setup access has ended. Choose a paid continuation before running another plan."
        : "A paid KindAI plan or active Founding Workflow Setup is required for this workspace.",
    });
  }

  const plan = getPlanById(user.tier);
  if (!plan || plan.limits.aiTakeoffsPerMonth === 0) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Your current plan does not include AI plan readings." });
  }

  return { db, plan, user };
}

export async function reservePlanReading(userId: number, requestKey: string) {
  const { db, plan } = await requirePaidAiAccess(userId);
  const normalizedKey = requestKey.slice(0, 255);
  const periodStart = monthStartUtc();

  const [existing] = await db
    .select({ id: aiUsageEvents.id, status: aiUsageEvents.status })
    .from(aiUsageEvents)
    .where(and(eq(aiUsageEvents.userId, userId), eq(aiUsageEvents.requestKey, normalizedKey)))
    .limit(1);

  if (existing && existing.status !== "failed") {
    return { id: existing.id, reused: true };
  }
  if (existing?.status === "failed") {
    await db.delete(aiUsageEvents).where(eq(aiUsageEvents.id, existing.id));
  }

  const insertReservation = async (quotaSlot: number | null) => {
    const result = await db.insert(aiUsageEvents).values({
      userId,
      requestKey: normalizedKey,
      quotaSlot,
      usageType: "plan_reading",
      status: "reserved",
      periodStart,
    });
    return Number((result as any)[0]?.insertId ?? (result as any).insertId);
  };

  const limit = plan.limits.aiTakeoffsPerMonth;
  if (limit < 0) {
    const id = await insertReservation(null);
    return { id, reused: false };
  }

  for (let slot = 1; slot <= limit; slot += 1) {
    try {
      const id = await insertReservation(slot);
      return { id, reused: false };
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;

      const [sameRequest] = await db
        .select({ id: aiUsageEvents.id, status: aiUsageEvents.status })
        .from(aiUsageEvents)
        .where(and(eq(aiUsageEvents.userId, userId), eq(aiUsageEvents.requestKey, normalizedKey)))
        .limit(1);
      if (sameRequest && sameRequest.status !== "failed") {
        return { id: sameRequest.id, reused: true };
      }
      // Another request owns this monthly slot. Try the next one.
    }
  }

  throw new TRPCError({
    code: "FORBIDDEN",
    message: `This account has used its ${limit} included AI plan readings for the current month.`,
  });
}

export async function completePlanReading(id: number, succeeded: boolean) {
  const db = await getDb();
  if (!db || !id) return;
  try {
    await db
      .update(aiUsageEvents)
      .set({
        status: succeeded ? "completed" : "failed",
        quotaSlot: succeeded ? undefined : null,
        completedAt: new Date(),
      })
      .where(eq(aiUsageEvents.id, id));
  } catch (error) {
    // Do not turn a completed customer operation into a failure. A reserved slot
    // remains counted and can be reconciled safely by an operator.
    console.error("[AI Usage] Failed to finalise reservation", {
      id,
      succeeded,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
