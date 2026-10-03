import { createHash, randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { oauthStates } from '../drizzle/schema';
import { getDb } from './db';
type Db = NonNullable<Awaited<ReturnType<typeof getDb>>>;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function appOrigin(requested?: string) {
  const configured = process.env.PUBLIC_APP_ORIGIN;
  if (!configured) throw new Error('PUBLIC_APP_ORIGIN must be configured');
  const origin = new URL(configured).origin;
  if (requested && new URL(requested).origin !== origin) throw new Error('Invalid application origin');
  return origin;
}
export async function issueXeroState(db: Db, userId: number, origin: string) {
  const state = randomBytes(32).toString('hex');
  const browser = randomBytes(32).toString('hex');
  await db.insert(oauthStates).values({ id: hash(state), userId, browserHash: hash(browser), origin: appOrigin(origin), expiresAt: new Date(Date.now() + 600_000) });
  return { state, browser };
}
export async function consumeXeroState(db: Db, state: string, browser: string) {
  if (!/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(browser)) throw new Error('Invalid OAuth state');
  return db.transaction(async tx => {
    const [record] = await tx.select().from(oauthStates).where(and(eq(oauthStates.id, hash(state)), eq(oauthStates.browserHash, hash(browser)))).limit(1).for('update');
    if (!record || record.expiresAt <= new Date()) throw new Error('Expired or invalid OAuth state; reconnect Xero');
    appOrigin(record.origin);
    await tx.delete(oauthStates).where(eq(oauthStates.id, record.id));
    return record;
  });
}
