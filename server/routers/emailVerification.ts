import { createHash, randomInt } from 'node:crypto';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../_core/trpc';
import { getDb } from '../db';
import { emailChallenges, users } from '../../drizzle/schema';
import { sendResendEmail } from '../resendEmail';
const hash = (id: number, code: string) => createHash('sha256').update(`${id}:${code}`).digest('hex');
export const emailVerificationRouter = router({
  request: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb(); if (!db) throw new Error('Database unavailable');
    return db.transaction(async tx => {
      const [user] = await tx.select().from(users).where(eq(users.id, ctx.user.id)).for('update');
      if (user.emailVerified) return { sent: false, verified: true };
      if (!user.email || !z.string().email().safeParse(user.email).success) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Add a valid account email before verifying.' });
      const [old] = await tx.select().from(emailChallenges).where(eq(emailChallenges.userId, user.id));
      const now = new Date();
      const inWindow = old && now.getTime() - old.windowAt.getTime() < 86400_000;
      if (old && (now.getTime() - old.sentAt.getTime() < 60_000 || (inWindow && old.sends >= 5))) throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'Please wait before requesting another verification code. Maximum five requests per day.' });
      const code = String(randomInt(10_000_000, 100_000_000));
      const values = { userId: user.id, email: user.email, codeHash: hash(user.id, code), expiresAt: new Date(now.getTime() + 600_000), sentAt: now, windowAt: inWindow ? old.windowAt : now, sends: inWindow ? old.sends + 1 : 1, attempts: 0 };
      await tx.insert(emailChallenges).values(values).onDuplicateKeyUpdate({ set: values });
      if (!await sendResendEmail({ to: user.email, subject: 'Verify your Kindai account', text: `Your Kindai verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.` })) throw new TRPCError({ code: 'SERVICE_UNAVAILABLE', message: 'Verification email could not be sent. Please retry later.' });
      return { sent: true, verified: false };
    });
  }),
  confirm: protectedProcedure.input(z.object({ code: z.string().regex(/^\d{8}$/) })).mutation(async ({ ctx, input }) => {
    const db = await getDb(); if (!db) throw new Error('Database unavailable');
    const valid = await db.transaction(async tx => {
      const [user] = await tx.select().from(users).where(eq(users.id, ctx.user.id)).for('update');
      const [challenge] = await tx.select().from(emailChallenges).where(eq(emailChallenges.userId, user.id));
      if (!challenge || challenge.email !== user.email || challenge.expiresAt <= new Date() || challenge.attempts >= 5) return false;
      await tx.update(emailChallenges).set({ attempts: challenge.attempts + 1 }).where(eq(emailChallenges.userId, user.id));
      if (challenge.codeHash !== hash(user.id, input.code)) return false;
      await tx.update(users).set({ emailVerified: true }).where(eq(users.id, user.id));
      await tx.delete(emailChallenges).where(eq(emailChallenges.userId, user.id));
      return true;
    });
    if (!valid) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired code. Request a new code after the cooldown.' });
    return { verified: true };
  }),
});
