import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { beginTakeoff } from './takeoffJobs';

// Exercise the actual retry transaction without a database or provider calls.
function fixture(status: string, freeUserId: number | null, completed = false) {
  const payload = { text: 'Synthetic plumbing drawing' };
  const user = { id: 1, subscriptionTier: 'pro', subscriptionStatus: status, emailVerified: true };
  const job = { id: '1:submission-one-123', estimateId: 1, requestHash: createHash('sha256').update(JSON.stringify(payload)).digest('hex'), freeUserId, status: completed ? 'completed' : 'failed', attempts: 1, expectedVersion: 1, result: { items: [] } };
  const rows = [[user], [job], [{ id: 1, userId: 1, version: 1 }]];
  const update = vi.fn(() => ({ set: () => ({ where: async () => {} }) }));
  const tx = { select: () => ({ from: () => ({ where: () => ({ limit: () => { const result = Promise.resolve(rows.shift()); return Object.assign(result, { for: () => result }); } }) }) }), update };
  const db = { transaction: (callback: any) => callback(tx) };
  return { run: () => beginTakeoff(db as any, 1, 1, 'submission-one-123', payload, [], true), update };
}

describe('takeoff retry entitlement recovery', () => {
  it.each(['canceled', 'cancelled', 'expired', 'past_due', 'unpaid', 'incomplete', 'incomplete_expired'])('blocks paid retry after entitlement becomes %s', async status => {
    const f = fixture(status, null);
    await expect(f.run()).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect(f.update).not.toHaveBeenCalled();
  });
  it.each(['active', 'trialing', 'cancelling'])('allows a bounded retry with current %s access', async status => {
    await expect(fixture(status, null).run()).resolves.toMatchObject({ attempts: 2 });
  });
  it('keeps completed paid results available after cancellation without starting work', async () => {
    const f = fixture('cancelled', null, true);
    await expect(f.run()).resolves.toMatchObject({ status: 'completed' });
    expect(f.update).not.toHaveBeenCalled();
  });
  it('preserves an already reserved free retry', async () => {
    await expect(fixture('cancelled', 1).run()).resolves.toMatchObject({ attempts: 2 });
  });
});
