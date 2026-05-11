/**
 * Resend Email Sender — Kindai Estimating Suite
 *
 * Replaces the broken Gmail SMTP sender.
 * Uses Resend API (https://resend.com) for reliable transactional email delivery.
 * Domain: kindai.com.au (verified, DKIM + SPF confirmed)
 *
 * HubSpot remains the CRM — contacts, deals, engagement tracking.
 * Resend handles the actual email delivery.
 */

import { Resend } from "resend";

function getClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY || "";
  if (!apiKey) {
    throw new Error("RESEND_API_KEY not set");
  }
  return new Resend(apiKey);
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
}

/**
 * Send a transactional email via Resend API.
 * Returns the Resend message ID on success, or null on failure.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<string | null> {
  const fromName = opts.fromName ?? "Kindai Estimating Suite";
  const fromAddress = "matt@kindai.com.au";

  try {
    const client = getClient();
    const { data, error } = await client.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo ?? "matt@kindaiestimator.com",
    });

    if (error) {
      console.error(`[Resend] API error sending to ${opts.to}:`, error.message);
      return null;
    }

    console.log(`[Resend] Email sent to ${opts.to}: ${data?.id}`);
    return data?.id ?? null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Resend] Failed to send email to ${opts.to}: ${msg}`);
    return null;
  }
}

/**
 * Send email with a file attachment (e.g. ebook PDF).
 */
export async function sendEmailWithAttachment(opts: SendEmailOptions & {
  attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>;
}): Promise<string | null> {
  const fromName = opts.fromName ?? "Kindai Estimating Suite";
  const fromAddress = "matt@kindai.com.au";

  try {
    const client = getClient();
    const { data, error } = await client.emails.send({
      from: `${fromName} <${fromAddress}>`,
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo ?? "matt@kindaiestimator.com",
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: typeof a.content === "string" ? Buffer.from(a.content) : a.content,
        content_type: a.contentType,
      })),
    });

    if (error) {
      console.error(`[Resend] API error sending to ${opts.to}:`, error.message);
      return null;
    }

    console.log(`[Resend] Email with attachment sent to ${opts.to}: ${data?.id}`);
    return data?.id ?? null;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Resend] Failed to send email with attachment to ${opts.to}: ${msg}`);
    return null;
  }
}

/**
 * Verify the Resend API connection is working.
 */
export async function verifyResendConnection(): Promise<boolean> {
  try {
    const client = getClient();
    const { data, error } = await client.domains.list();
    if (error) {
      console.error("[Resend] Connection verification failed:", error.message);
      return false;
    }
    console.log(`[Resend] Connection verified — ${data?.data?.length ?? 0} domains found`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Resend] Connection verification failed: ${msg}`);
    return false;
  }
}
