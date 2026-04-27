/**
 * Apology / Welcome-Back Email — Kindai Estimating Suite
 *
 * Sent to beta signups who've been waiting because the email system was broken.
 * Written in Matt Symons' voice: direct, warm, honest, no excuses.
 * Includes optional ebook gift link.
 *
 * Sent via Resend API (kindai.com.au domain).
 */

import {
  brandedEmailWrap,
  brandedCta,
  brandedInfoBox,
  brandedStep,
  brandedH2,
  brandedP,
  brandedSignature,
  BRAND,
} from "./emailBrand";
import { sendEmail } from "./resendSender";

const BASE_URL = BRAND.baseUrl;

export interface ApologyEmailData {
  name: string;
  email: string;
  spotNumber: number;
  trade?: string;
  /** Optional: URL to a gift ebook PDF */
  ebookUrl?: string;
  /** Optional: ebook title */
  ebookTitle?: string;
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(" ")[0] || fullName;
}

export function buildApologyHtml(data: ApologyEmailData): string {
  const firstName = getFirstName(data.name);
  const tradeText = data.trade ? ` for ${data.trade}` : "";

  // Ebook gift section (only if URL provided)
  const ebookSection = data.ebookUrl
    ? `
    <!-- Gift section -->
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.yellow};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">🎁 A GIFT FOR YOUR PATIENCE</p>
      <p style="margin:0 0 16px;color:${BRAND.textBody};font-size:15px;line-height:1.7;">
        To say thanks for sticking with us, here's a free copy of <strong style="color:${BRAND.textWhite};">${data.ebookTitle || "our ebook"}</strong>. No strings attached.
      </p>
      <a href="${data.ebookUrl}" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:50px;">Download Your Free Copy</a>
    `, BRAND.yellow)}`
    : "";

  const bodyHtml = `
    <!-- Founding member badge -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${BRAND.gradient};border-radius:12px;padding:10px 20px;">
        <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FOUNDING MEMBER #${data.spotNumber}</span>
      </div>
    </div>

    ${brandedH2(`Hey ${firstName},`)}

    ${brandedP(`I owe you an apology. You signed up for the Kindai beta and then... crickets. No welcome email, no onboarding, nothing. That's on me.`)}

    ${brandedP(`The honest truth? Our email system broke and I didn't catch it fast enough. Your signup went through, your spot was saved, but the welcome email never made it to your inbox. Not good enough — I know.`)}

    ${brandedP(`The good news: <strong style="color:${BRAND.orange};">it's fixed now</strong>, and your account is fully active. You're Founding Member <strong style="color:${BRAND.orange};">#${data.spotNumber}</strong> — that hasn't changed, and your founding member pricing is locked in forever.`)}

    ${ebookSection}

    <!-- What you can do right now -->
    <p style="margin:24px 0 16px;color:${BRAND.textWhite};font-size:18px;font-weight:700;">Here's what you can do right now</p>

    ${brandedStep(1, `Head to <a href="${BASE_URL}" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">kindaiestimator.com</a> and sign in`)}
    ${brandedStep(2, `Click <strong style="color:${BRAND.textWhite};">AI Takeoff</strong> — our AI estimating engine`)}
    ${brandedStep(3, `Describe any job${tradeText} and watch it build a full quote in under 60 seconds`)}

    ${brandedCta("Jump Into Kindai Now", `${BASE_URL}/dashboard`)}

    <!-- What's coming -->
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.green};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">WHAT'S COMING THIS WEEK</p>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">✅ AI Vision Takeoff — scan a plan, get a full quote</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">✅ PDF quote export — branded, GST-compliant, ready to send</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">✅ Materials library — real Aussie trade pricing built in</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">✅ Your feedback shaping every update</td></tr>
      </table>
    `, BRAND.green)}

    <!-- Personal close -->
    ${brandedP(`I'm building Kindai to save tradies like you hours every week on quoting. But I can only make it great with your feedback. Try it out, break it, tell me what's missing — reply directly to this email. I read every single one.`)}

    ${brandedSignature()}

    <p style="margin:16px 0 0;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">
      P.S. Know a tradie who'd love this? Forward them: <a href="${BASE_URL}/beta" style="color:${BRAND.orange};text-decoration:none;">kindaiestimator.com/beta</a>
    </p>
  `;

  return brandedEmailWrap({ bodyHtml });
}

export async function sendApologyEmail(data: ApologyEmailData): Promise<string | null> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email] RESEND_API_KEY not set — skipping apology email for ${data.email}`);
    return null;
  }

  const firstName = getFirstName(data.name);
  const subject = `Hey ${firstName} — I owe you an apology (and your Kindai beta access)`;

  const messageId = await sendEmail({
    to: data.email,
    subject,
    html: buildApologyHtml(data),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });

  if (!messageId) {
    console.warn(`[Email] Apology email failed for ${data.email}`);
  } else {
    console.log(`[Email] Apology email sent to ${data.email} — Resend ID: ${messageId}`);
  }

  return messageId;
}
