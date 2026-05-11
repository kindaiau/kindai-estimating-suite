/**
 * Ebook Nurture Cron Processor — Kindai Estimating Suite
 *
 * Runs every 15 minutes (called from server/index.ts).
 * Checks ebook_leads for leads that are due for Day 2, 4, 7, or 10 nurture emails
 * and sends them via Resend.
 *
 * Sequence:
 *   Day 2  — The #1 quoting mistake tradies make
 *   Day 4  — Social proof: how other tradies are using Kindai
 *   Day 7  — ROI calculator: what slow quoting is actually costing you
 *   Day 10 — Last chance: your free pilot spot is waiting
 */

import { getDb } from "./db";
import { ebookLeads } from "../drizzle/schema";
import { and, lte, eq } from "drizzle-orm";
import {
  sendEbookNurtureDay2,
  sendEbookNurtureDay4,
  sendEbookNurtureDay7,
  sendEbookNurtureDay10,
} from "./ebookEmail";

const DAY_MS = 24 * 60 * 60 * 1000;

interface NurtureStep {
  dayOffset: number;
  field: "nurtureDay2SentAt" | "nurtureDay4SentAt" | "nurtureDay7SentAt" | "nurtureDay10SentAt";
  sentAtField: keyof typeof ebookLeads.$inferSelect;
  sendFn: (opts: { to: string; name: string }) => Promise<string | null>;
  label: string;
}

const EBOOK_NURTURE_STEPS: NurtureStep[] = [
  {
    dayOffset: 2,
    field: "nurtureDay2SentAt",
    sentAtField: "nurtureDay2SentAt",
    sendFn: sendEbookNurtureDay2,
    label: "Day 2 — Quoting mistake",
  },
  {
    dayOffset: 4,
    field: "nurtureDay4SentAt",
    sentAtField: "nurtureDay4SentAt",
    sendFn: sendEbookNurtureDay4,
    label: "Day 4 — Social proof",
  },
  {
    dayOffset: 7,
    field: "nurtureDay7SentAt",
    sentAtField: "nurtureDay7SentAt",
    sendFn: sendEbookNurtureDay7,
    label: "Day 7 — ROI calculator",
  },
  {
    dayOffset: 10,
    field: "nurtureDay10SentAt",
    sentAtField: "nurtureDay10SentAt",
    sendFn: sendEbookNurtureDay10,
    label: "Day 10 — Last chance",
  },
];

export async function processEbookNurtureEmails(): Promise<{
  processed: number;
  sent: number;
  failed: number;
}> {
  const db = await getDb();
  if (!db) return { processed: 0, sent: 0, failed: 0 };

  const now = Date.now();
  let totalProcessed = 0;
  let totalSent = 0;
  let totalFailed = 0;

  for (const step of EBOOK_NURTURE_STEPS) {
    // Find leads that:
    // 1. Have received the ebook (ebookSentAt is not null)
    // 2. Were signed up at least dayOffset days ago
    // 3. Haven't received this nurture email yet (sentAtField is null)
    const cutoff = now - step.dayOffset * DAY_MS;

    // Fetch all leads that received the ebook and signed up before the cutoff
    const allLeads = await db
      .select()
      .from(ebookLeads)
      .where(
        and(
          // ebookSentAt is not null — they received the ebook
          lte(ebookLeads.ebookSentAt, now),
          // signed up at least dayOffset days ago (createdAt is a timestamp, convert to ms)
          lte(ebookLeads.createdAt, new Date(cutoff))
        )
      );

    // Filter in JS: only leads where this nurture step hasn't been sent yet
    const dueLeads = allLeads.filter((lead) => lead[step.sentAtField] === null);

    for (const lead of dueLeads) {
      totalProcessed++;
      try {
        const messageId = await step.sendFn({ to: lead.email, name: lead.name });

        if (messageId) {
          // Mark this step as sent
          await db
            .update(ebookLeads)
            .set({ [step.field]: Date.now() } as any)
            .where(eq(ebookLeads.id, lead.id));
          totalSent++;
          console.log(`[EbookNurture] Sent ${step.label} to ${lead.email}`);
        } else {
          totalFailed++;
          console.warn(`[EbookNurture] Failed to send ${step.label} to ${lead.email}`);
        }
      } catch (err: any) {
        totalFailed++;
        console.error(`[EbookNurture] Error sending ${step.label} to ${lead.email}:`, err.message);
      }
    }
  }

  if (totalProcessed > 0) {
    console.log(
      `[EbookNurture] Processed ${totalProcessed} nurture emails: ${totalSent} sent, ${totalFailed} failed`
    );
  }

  return { processed: totalProcessed, sent: totalSent, failed: totalFailed };
}
