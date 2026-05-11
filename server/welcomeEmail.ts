/**
 * Beta Welcome Email — Kindai Estimating Suite
 * Uses shared branded email template (emailBrand.ts).
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

export interface WelcomeEmailData {
  name: string;
  email: string;
  spotNumber: number;
  trade?: string;
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(" ")[0] || fullName;
}

function getTradeUrl(_trade?: string): string {
  return `${BASE_URL}/dashboard`;
}

export function buildHtmlEmail(data: WelcomeEmailData): string {
  const firstName = getFirstName(data.name);
  const tradeText = data.trade ? ` for ${data.trade}` : "";
  const ctaUrl = getTradeUrl(data.trade);

  const bodyHtml = `
    <!-- Founding member badge -->
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${BRAND.gradient};border-radius:12px;padding:10px 20px;">
        <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FOUNDING MEMBER #${data.spotNumber}</span>
      </div>
    </div>

    ${brandedH2(`G'day ${firstName},`)}

    ${brandedP(`You just claimed spot <strong style="color:${BRAND.orange};">#${data.spotNumber} of 25</strong> in the Kindai Estimating Suite beta. You're one of the first tradies in Australia to get access to AI that actually understands your trade${tradeText}.`)}

    <!-- Perks box -->
    ${brandedInfoBox(`
      <p style="margin:0 0 16px;color:${BRAND.orange};font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">What you've unlocked</p>
      <table cellpadding="0" cellspacing="0">
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">&mdash; Full platform access during beta</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">&mdash; Your feedback shapes the product directly</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">&mdash; Founding member pricing locked in forever</td></tr>
        <tr><td style="padding:6px 0;color:${BRAND.textBody};font-size:15px;">&mdash; Listed as a Kindai Founding Partner</td></tr>
      </table>
    `)}

    <!-- Getting started -->
    <p style="margin:0 0 16px;color:${BRAND.textWhite};font-size:18px;font-weight:700;">Getting started (5 minutes)</p>

    ${brandedStep(1, `Head to <a href="${BASE_URL}" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">kindaiestimator.com</a> and sign in`)}
    ${brandedStep(2, `Click <strong style="color:${BRAND.textWhite};">AI Takeoff</strong> in your dashboard`)}
    ${brandedStep(3, `Describe a job${tradeText} — e.g. "3 bed house, 20 power points, 15 downlights"`)}
    ${brandedStep(4, `Watch the AI build your full GST-compliant quote in <strong style="color:${BRAND.textWhite};">under 60 seconds</strong>`)}

    ${brandedCta("Start Your First Quote", ctaUrl)}

    <!-- Personal note -->
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.textBody};font-size:15px;line-height:1.7;">
        Run 2&ndash;3 real quotes this week and let me know what worked, what felt off, and what you wish it did. Reply directly to this email &mdash; I read every single one.
      </p>
      ${brandedSignature()}
    `)}

    <p style="margin:0;color:${BRAND.textMuted};font-size:14px;line-height:1.6;">
      P.S. Got a tradie mate who'd love this? Forward them: <a href="${BASE_URL}/beta" style="color:${BRAND.orange};text-decoration:none;">kindaiestimator.com/beta</a>
    </p>
  `;

  return brandedEmailWrap({ bodyHtml });
}

function buildTextEmail(data: WelcomeEmailData): string {
  const firstName = getFirstName(data.name);
  const tradeText = data.trade ? ` for ${data.trade}` : "";
  const ctaUrl = getTradeUrl(data.trade);

  return `G'day ${firstName},

You just claimed spot #${data.spotNumber} of 25 in the Kindai Estimating Suite beta. You're one of the first tradies in Australia to get access to AI that actually understands your trade${tradeText}.

You're now a Founding Member. Here's what that means:

- Full platform access during beta
- Your feedback shapes the product directly
- Founding member pricing locked in forever
- Listed as a Kindai Founding Partner

---

GETTING STARTED (5 minutes):

1. Head to kindaiestimator.com and sign in
2. Click "AI Takeoff" in the dashboard
3. Type a job description${tradeText} — e.g. "3 bedroom house, 20 power points, 15 downlights"
4. Watch the AI build your full quote in under 60 seconds

Start here: ${ctaUrl}

---

Run 2-3 real quotes this week and let me know what worked, what felt off, and what you wish it did. Reply directly to this email — I read every single one.

— Matt Symons
Co-founder, Kindai
matt@kindaiestimator.com
kindaiestimator.com

P.S. Got a tradie mate who'd love this? Forward them: kindaiestimator.com/beta

---
You received this email because you signed up for the Kindai beta at kindaiestimator.com.
To unsubscribe, reply with "unsubscribe" to matt@kindaiestimator.com.`;
}

export async function sendBetaWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email] RESEND_API_KEY not set — skipping welcome email for ${data.email}`);
    return;
  }

  const subject = `G'day ${getFirstName(data.name)} — you're Founding Member #${data.spotNumber} of 25`;

  const messageId = await sendEmail({
    to: data.email,
    subject,
    html: buildHtmlEmail(data),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });

  if (!messageId) {
    console.warn(`[Email] Welcome email failed for ${data.email} (spot #${data.spotNumber})`);
  } else {
    console.log(`[Email] Welcome email sent to ${data.email} (spot #${data.spotNumber}) — Resend ID: ${messageId}`);
  }
}
