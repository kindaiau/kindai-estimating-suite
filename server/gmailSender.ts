import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = (process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");

export const gmailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
}

/**
 * Send a transactional email via Gmail SMTP.
 * Replaces the suspended Brevo SMTP integration.
 */
export async function sendEmail(opts: SendEmailOptions): Promise<boolean> {
  const fromName = opts.fromName ?? "Kindai Estimating Suite";
  const fromAddress = GMAIL_USER;

  try {
    const info = await gmailTransport.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo ?? "matt@kindaiestimator.com",
    });
    console.log(`[Gmail] Email sent to ${opts.to}: ${info.messageId}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Gmail] Failed to send email to ${opts.to}: ${msg}`);
    return false;
  }
}

/**
 * Verify the Gmail SMTP connection is working.
 * Used in tests and health checks.
 */
export async function verifyGmailConnection(): Promise<boolean> {
  try {
    await gmailTransport.verify();
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Gmail] SMTP verification failed: ${msg}`);
    return false;
  }
}
