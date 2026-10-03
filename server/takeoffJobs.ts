import { createHash } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { and, eq, inArray } from 'drizzle-orm';
import { estimates, lineItems, planUploads, takeoffJobs, users } from '../drizzle/schema';
import { getDb } from './db';
import { lockEstimate, saveTotals } from './estimateEdits';
import { buildAiLineItemRows } from './routes/insertAiLineItems';

type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
export type Job = typeof takeoffJobs.$inferSelect;
export function hasPaidAccess(user: Pick<typeof users.$inferSelect, 'subscriptionTier' | 'subscriptionStatus'>) {
  return user.subscriptionTier !== 'free' && ['active', 'trialing', 'cancelling'].includes(user.subscriptionStatus ?? '');
}
export async function beginTakeoff(db: Db, userId: number, estimateId: number, requestId: string, payload: unknown, urls: string[], textMode = false, scopeDoc = false) {
  if (!/^[a-zA-Z0-9_-]{16,64}$/.test(requestId)) throw new TRPCError({ code: 'BAD_REQUEST', message: 'A stable submission ID is required' });
  const id = `${userId}:${requestId}`;
  const requestHash = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return db.transaction(async tx => {
    const [user] = await tx.select().from(users).where(eq(users.id, userId)).limit(1).for('update');
    if (!user) throw new TRPCError({ code: 'UNAUTHORIZED' });
    const [existing] = await tx.select().from(takeoffJobs).where(eq(takeoffJobs.id, id)).limit(1);
    if (existing) {
      if (existing.requestHash !== requestHash || existing.estimateId !== estimateId) throw new TRPCError({ code: 'CONFLICT', message: 'Submission ID already belongs to another request' });
      if (existing.status === 'completed') return { ...existing, result: typeof existing.result === 'string' ? JSON.parse(existing.result) : existing.result };
      if (existing.status === 'running' && existing.leaseExpiresAt > new Date()) throw new TRPCError({ code: 'CONFLICT', message: 'This scan is still running. Retry the same submission after it finishes; it will not be submitted again while it is running.' });
      if (existing.attempts >= 3) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Scan retry limit reached. Contact support with your submission ID.' });
      await lockEstimate(tx, userId, estimateId, existing.expectedVersion);
      const leaseExpiresAt = new Date(Date.now() + 30 * 60_000);
      await tx.update(takeoffJobs).set({ status: 'running', leaseExpiresAt, attempts: existing.attempts + 1 }).where(eq(takeoffJobs.id, id));
      return { ...existing, status: 'running' as const, leaseExpiresAt, attempts: existing.attempts + 1 };
    }
    const estimate = await lockEstimate(tx, userId, estimateId);
    if (estimate.aiTakeoffData) throw new TRPCError({ code: 'CONFLICT', message: 'This estimate already has a takeoff. Create a new estimate to preserve its original evidence.' });
    const paid = hasPaidAccess(user);
    if (!paid && !user.emailVerified) throw new TRPCError({ code: 'FORBIDDEN', message: 'Verify your email with the sign-in provider before using your free scan.' });
    if (!paid && (textMode || scopeDoc || urls.length !== 1)) throw new TRPCError({ code: 'FORBIDDEN', message: 'The free scan covers one drawing sheet. Select one sheet without an additional scope document.' });
    if (urls.length) {
      const uploads = await tx.select().from(planUploads).where(and(eq(planUploads.userId, userId), inArray(planUploads.url, urls)));
      if (new Set(uploads.map(u => u.url)).size !== new Set(urls).size) throw new TRPCError({ code: 'FORBIDDEN', message: 'Upload plans to your own account before scanning.' });
      if (!paid && uploads.some(u => u.pageCount !== 1)) throw new TRPCError({ code: 'FORBIDDEN', message: 'Select exactly one PDF drawing sheet for the free scan.' });
    }
    if (!paid) {
      const [claim] = await tx.select().from(takeoffJobs).where(eq(takeoffJobs.freeUserId, userId)).limit(1);
      if (claim) throw new TRPCError({ code: 'FORBIDDEN', message: 'Your lifetime free scan is already reserved or used. Retry the original failed submission or choose Pro.' });
    }
    const job: typeof takeoffJobs.$inferInsert = { id, userId, freeUserId: paid ? null : userId, estimateId, expectedVersion: estimate.version, requestHash, requestPayload: payload, status: 'running', attempts: 1, leaseExpiresAt: new Date(Date.now() + 30 * 60_000) };
    await tx.insert(takeoffJobs).values(job);
    return { ...job, result: null, createdAt: new Date() } as Job;
  });
}
export async function failTakeoff(db: Db, job: Job) {
  await db.update(takeoffJobs).set({ status: 'failed' }).where(and(eq(takeoffJobs.id, job.id), eq(takeoffJobs.status, 'running'), eq(takeoffJobs.attempts, job.attempts)));
}
export async function completeTakeoff(db: Db, job: Job, result: { items: Parameters<typeof buildAiLineItemRows>[1]; confidence: number; assumptions: string[] }, labourRate = 95, useTradePrice = true) {
  return db.transaction(async tx => {
    const estimate = await lockEstimate(tx, job.userId, job.estimateId, job.expectedVersion);
    const [currentJob] = await tx.select().from(takeoffJobs).where(eq(takeoffJobs.id, job.id)).limit(1).for('update');
    if (!currentJob || currentJob.status !== 'running' || currentJob.attempts !== job.attempts || currentJob.leaseExpiresAt <= new Date()) throw new TRPCError({ code: 'CONFLICT', message: 'This scan attempt expired or was replaced. Retry the original submission.' });
    const rows = buildAiLineItemRows(job.estimateId, result.items, { labourRate, useTradePrice });
    if (!rows.length) throw new Error('No takeoff items returned. Retry the original submission.');
    for (let i = 0; i < rows.length; i += 50) await tx.insert(lineItems).values(rows.slice(i, i + 50));
    await tx.update(estimates).set({ aiConfidenceScore: Math.round(result.confidence), aiAssumptions: result.assumptions, aiTakeoffData: result.items }).where(eq(estimates.id, job.estimateId));
    const saved = await saveTotals(tx, estimate);
    await tx.update(takeoffJobs).set({ status: 'completed', result }).where(eq(takeoffJobs.id, job.id));
    return saved;
  });
}
