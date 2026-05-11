/**
 * Re-queue all failed nurture emails with staggered send times.
 * Since users already got the apology email today, we space out the nurture sequence.
 */
import 'dotenv/config';
import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const emailKeyDelays = {
  'day1_activation': 1 * HOUR_MS,      // 1 hour from now
  'day3_social_proof': 3 * DAY_MS,     // 3 days from now
  'day7_roi': 7 * DAY_MS,              // 7 days from now
  'day14_urgency': 14 * DAY_MS,        // 14 days from now
};

// Get all failed emails
const [failed] = await conn.execute(
  "SELECT id, emailKey FROM beta_nurture_emails WHERE status = 'failed'"
);

console.log(`Found ${failed.length} failed nurture emails to re-queue`);

for (const email of failed) {
  const delay = emailKeyDelays[email.emailKey] || DAY_MS;
  const newSendAt = new Date(Date.now() + delay);
  
  const newScheduledAt = Date.now() + delay;
  await conn.execute(
    'UPDATE beta_nurture_emails SET status = ?, errorMessage = NULL, scheduledAt = ? WHERE id = ?',
    ['scheduled', newScheduledAt, email.id]
  );
  console.log(`  ✅ Re-queued #${email.id} (${email.emailKey}) → send at ${new Date(newScheduledAt).toISOString()}`);
}

// Also update scheduled emails that have past scheduledAt dates (bigint ms)
const nowMs = Date.now();
const [pastDue] = await conn.execute(
  "SELECT id, emailKey, scheduledAt FROM beta_nurture_emails WHERE status = 'scheduled' AND scheduledAt < ?",
  [nowMs]
);

console.log(`\nFound ${pastDue.length} past-due scheduled emails to reschedule`);

for (const email of pastDue) {
  const delay = emailKeyDelays[email.emailKey] || DAY_MS;
  const newScheduledAt = nowMs + delay;
  
  await conn.execute(
    'UPDATE beta_nurture_emails SET scheduledAt = ? WHERE id = ?',
    [newScheduledAt, email.id]
  );
  console.log(`  ✅ Rescheduled #${email.id} (${email.emailKey}) → send at ${new Date(newScheduledAt).toISOString()}`);
}

// Final summary
const [summary] = await conn.execute(
  "SELECT status, COUNT(*) as cnt FROM beta_nurture_emails GROUP BY status"
);
console.log('\nFinal status summary:');
for (const row of summary) {
  console.log(`  ${row.status}: ${row.cnt}`);
}

await conn.end();
process.exit(0);
