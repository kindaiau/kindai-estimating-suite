import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema';
import { getDb } from './db';
import { hasPaidAccess } from './takeoffJobs';
export async function requireProFeature(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database unavailable' });
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || !hasPaidAccess(user)) throw new TRPCError({ code: 'FORBIDDEN', message: 'This feature requires Pro or an active existing subscription.' });
}
