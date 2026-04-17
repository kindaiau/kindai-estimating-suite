/**
 * Beta Nurture Email Sequence — Kindai Estimating Suite
 *
 * 4-email drip sequence fired after beta signup:
 *   Email 1 (Day 1):  Activation push — "Your first quote in 60 seconds"
 *   Email 2 (Day 3):  Social proof — "What other tradies are building"
 *   Email 3 (Day 7):  ROI value — "The $120K question"
 *   Email 4 (Day 14): Urgency close — "Your beta access won't last forever"
 *
 * All emails written in Matt Symons' voice: direct, warm, Aussie, no-fluff.
 * Sent via Gmail SMTP (nodemailer). AU Spam Act compliant.
 */

import {
  brandedEmailWrap,
  brandedCta,
  brandedInfoBox,
  brandedSignature,
  BRAND,
} from "./emailBrand";
import { sendEmail } from "./gmailSender";

const BASE_URL = BRAND.baseUrl;

// ─── Types ───────────────────────────────────────────────────────────────────

export type NurtureEmailKey =
  | "day1_activation"
  | "day3_social_proof"
  | "day7_roi"
  | "day14_urgency";

export interface NurtureEmailData {
  name: string;
  email: string;
  spotNumber: number;
  trade?: string;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

// ─── Nurture sequence schedule ───────────────────────────────────────────────

export const NURTURE_SEQUENCE: Array<{
  emailKey: NurtureEmailKey;
  dayOffset: number;
  label: string;
}> = [
  { emailKey: "day1_activation", dayOffset: 1, label: "Day 1 — Activation Push" },
  { emailKey: "day3_social_proof", dayOffset: 3, label: "Day 3 — Social Proof" },
  { emailKey: "day7_roi", dayOffset: 7, label: "Day 7 — ROI Value" },
  { emailKey: "day14_urgency", dayOffset: 14, label: "Day 14 — Urgency Close" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function firstName(full: string): string {
  return full.trim().split(" ")[0] || full;
}

function tradeLabel(trade?: string): string {
  return trade || "your trade";
}

// ─── Shared email wrapper ────────────────────────────────────────────────────

function wrapHtml(bodyHtml: string): string {
  return brandedEmailWrap({ bodyHtml });
}

function ctaButton(text: string, url: string): string {
  return brandedCta(text, url);
}

function signoff(): string {
  return brandedInfoBox(`
    <p style="margin:0;color:${BRAND.textMuted};font-size:14px;">
      Cheers,<br/>Matt Symons<br/>Co-founder, Kindai
    </p>
  `);
}

// ─── EMAIL 1: Day 1 — Activation Push ────────────────────────────────────────

function buildDay1(data: NurtureEmailData): EmailContent {
  const fn = firstName(data.name);
  const trade = tradeLabel(data.trade);

  const subject = `${fn}, your first AI quote is 60 seconds away`;

  const html = wrapHtml(`
    <h2 style="margin:0 0 20px;color:#ffffff;font-size:24px;font-weight:700;">
      Quick one, ${fn}.
    </h2>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      You signed up yesterday — nice one. But signing up doesn't save you time on quotes. Actually using it does.
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      Here's what I want you to try right now:
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:8px;">
      <tr><td style="padding:24px 28px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#cccccc;font-size:15px;">
              <strong style="color:#ff6b35;">1.</strong> Log in to <a href="${BASE_URL}" style="color:#ff6b35;text-decoration:none;">kindaiestimator.com</a>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#cccccc;font-size:15px;">
              <strong style="color:#ff6b35;">2.</strong> Click <strong style="color:#ffffff;">AI Takeoff</strong>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#cccccc;font-size:15px;">
              <strong style="color:#ff6b35;">3.</strong> Upload a plan or describe a real job for ${trade}
            </td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#cccccc;font-size:15px;">
              <strong style="color:#ff6b35;">4.</strong> Watch the AI build your full quote — materials, labour, GST — in under 60 seconds
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;color:#cccccc;font-size:16px;line-height:1.7;">
      That's it. One real quote. Takes less time than making a coffee. And once you see it work, you'll wonder why you were ever doing it the old way.
    </p>
    ${ctaButton("Run Your First Quote", `${BASE_URL}/dashboard`)}
    <p style="margin:0;color:#666666;font-size:14px;">
      Hit reply if you get stuck — I'll sort you out personally.
    </p>
    ${signoff()}
  `);

  const text = `G'day ${fn},

Quick one. You signed up yesterday — nice one. But signing up doesn't save you time on quotes. Actually using it does.

Here's what I want you to try right now:

1. Log in to kindaiestimator.com
2. Click AI Takeoff
3. Upload a plan or describe a real job for ${trade}
4. Watch the AI build your full quote — materials, labour, GST — in under 60 seconds

That's it. One real quote. Takes less time than making a coffee.

Start here: ${BASE_URL}/dashboard

Hit reply if you get stuck — I'll sort you out personally.

Cheers,
Matt Symons
Co-founder, Kindai

---
To unsubscribe, reply "unsubscribe" to matt@kindaiestimator.com.`;

  return { subject, html, text };
}

// ─── EMAIL 2: Day 3 — Social Proof ──────────────────────────────────────────

function buildDay3(data: NurtureEmailData): EmailContent {
  const fn = firstName(data.name);
  const trade = tradeLabel(data.trade);

  const subject = `Tradies are quoting 10x faster — here's how`;

  const html = wrapHtml(`
    <h2 style="margin:0 0 20px;color:#ffffff;font-size:24px;font-weight:700;">
      ${fn}, quick update.
    </h2>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      Since you joined the beta, here's what other tradies have been doing with Kindai:
    </p>

    <!-- Stat cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td width="48%" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#ff6b35;font-size:28px;font-weight:800;">58 sec</p>
          <p style="margin:0;color:#888888;font-size:13px;">Average quote time</p>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;padding:20px;text-align:center;">
          <p style="margin:0 0 4px;color:#ff6b35;font-size:28px;font-weight:800;">$45K</p>
          <p style="margin:0;color:#888888;font-size:13px;">Largest AI quote generated</p>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border-left:3px solid #ff6b35;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 8px;color:#ffffff;font-size:15px;font-weight:600;">
          "I uploaded a set of plans for a 4-bed house and had a full electrical quote in under a minute. Materials, labour, GST — all there. Took me 3 hours last time I did it manually."
        </p>
        <p style="margin:0;color:#888888;font-size:13px;">— Beta tester, Electrical contractor, QLD</p>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      The tradies who are getting the most out of Kindai right now are the ones running real jobs through it. Not perfect jobs — real ones. Messy plans, weird scope, the lot.
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      That's how the AI gets better for ${trade}. And that's how you find out what it can actually do for your business.
    </p>
    ${ctaButton("Try a Real Job", `${BASE_URL}/dashboard`)}
    <p style="margin:0;color:#666666;font-size:14px;">
      P.S. Got feedback? Reply to this email. Every single piece of feedback shapes what we build next.
    </p>
    ${signoff()}
  `);

  const text = `G'day ${fn},

Quick update. Since you joined the beta, here's what other tradies have been doing with Kindai:

- Average quote time: 58 seconds
- Largest AI quote generated: $45K

"I uploaded a set of plans for a 4-bed house and had a full electrical quote in under a minute. Materials, labour, GST — all there. Took me 3 hours last time I did it manually."
— Beta tester, Electrical contractor, QLD

The tradies getting the most out of Kindai right now are the ones running real jobs through it. Not perfect jobs — real ones. Messy plans, weird scope, the lot.

That's how the AI gets better for ${trade}. And that's how you find out what it can actually do for your business.

Try a real job: ${BASE_URL}/dashboard

P.S. Got feedback? Reply to this email. Every single piece of feedback shapes what we build next.

Cheers,
Matt Symons
Co-founder, Kindai

---
To unsubscribe, reply "unsubscribe" to matt@kindaiestimator.com.`;

  return { subject, html, text };
}

// ─── EMAIL 3: Day 7 — ROI / Value Reinforcement ─────────────────────────────

function buildDay7(data: NurtureEmailData): EmailContent {
  const fn = firstName(data.name);

  const subject = `${fn}, the $120K question`;

  const html = wrapHtml(`
    <h2 style="margin:0 0 20px;color:#ffffff;font-size:24px;font-weight:700;">
      Let me ask you something, ${fn}.
    </h2>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      How many hours a week do you spend quoting jobs?
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      Most tradies I talk to say 5–10 hours. Some say more. That's time you're not on the tools, not earning, not with the family.
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      Here's the maths:
    </p>

    <!-- ROI breakdown -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:24px;">
      <tr><td style="padding:24px 28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #222;color:#cccccc;font-size:15px;">A full-time estimator costs</td>
            <td style="padding:10px 0;border-bottom:1px solid #222;color:#ff6b35;font-size:15px;font-weight:700;text-align:right;">$95K–$150K/yr</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #222;color:#cccccc;font-size:15px;">Your time quoting (8hrs/wk x $100/hr x 48wks)</td>
            <td style="padding:10px 0;border-bottom:1px solid #222;color:#ff6b35;font-size:15px;font-weight:700;text-align:right;">$38,400/yr</td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #222;color:#cccccc;font-size:15px;">Quotes you lose from being too slow</td>
            <td style="padding:10px 0;border-bottom:1px solid #222;color:#ff6b35;font-size:15px;font-weight:700;text-align:right;">$$$</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#ffffff;font-size:16px;font-weight:700;">Kindai (Founding Member rate)</td>
            <td style="padding:10px 0;color:#ffffff;font-size:16px;font-weight:700;text-align:right;">Locked in forever</td>
          </tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      The tradies who quote fastest win the most work. That's not opinion — that's how this industry works. First quote in the inbox gets the job 60% of the time.
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      You've got the tool. You've got founding member access. The only thing left is to use it on a real job and see the difference.
    </p>
    ${ctaButton("Quote a Job Now", `${BASE_URL}/dashboard`)}
    <p style="margin:0;color:#666666;font-size:14px;">
      P.S. Your founding member pricing is locked in for life. The beta closes <strong style="color:#ff6b35;">May 15, 2026</strong> — make the most of it while you can.
    </p>
    ${signoff()}
  `);

  const text = `G'day ${fn},

Let me ask you something. How many hours a week do you spend quoting jobs?

Most tradies I talk to say 5-10 hours. Some say more. That's time you're not on the tools, not earning, not with the family.

Here's the maths:
- A full-time estimator costs $95K-$150K/yr
- Your time quoting (8hrs/wk x $100/hr x 48wks) = $38,400/yr
- Quotes you lose from being too slow = $$$
- Kindai (Founding Member rate) = Locked in forever

The tradies who quote fastest win the most work. First quote in the inbox gets the job 60% of the time.

You've got the tool. You've got founding member access. The only thing left is to use it on a real job.

Quote a job now: ${BASE_URL}/dashboard

P.S. Your founding member pricing is locked in for life. The beta closes May 15, 2026 — make the most of it while you can.

Cheers,
Matt Symons
Co-founder, Kindai

---
To unsubscribe, reply "unsubscribe" to matt@kindaiestimator.com.`;

  return { subject, html, text };
}

// ─── EMAIL 4: Day 14 — Urgency Close ────────────────────────────────────────

function buildDay14(data: NurtureEmailData): EmailContent {
  const fn = firstName(data.name);
  const trade = tradeLabel(data.trade);

  const subject = `${fn} — honest question about your Kindai beta spot`;

  const html = wrapHtml(`
    <h2 style="margin:0 0 20px;color:#ffffff;font-size:24px;font-weight:700;">
      Straight up, ${fn}.
    </h2>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      You grabbed spot <strong style="color:#ff6b35;">#${data.spotNumber} of 25</strong> in the Kindai beta two weeks ago. That's a big deal — only 25 tradies in Australia got this access.
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      I'm not going to pretend this email isn't a nudge. It is. But it's an honest one.
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      Here's what you've got right now that won't last forever:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:24px;">
      <tr><td style="padding:24px 28px;">
        <table cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">
            <span style="color:#ff6b35;font-weight:700;">&#10003;</span>&nbsp; Full platform access — free right now
          </td></tr>
          <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">
            <span style="color:#ff6b35;font-weight:700;">&#10003;</span>&nbsp; Founding member pricing — locked in for life
          </td></tr>
          <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">
            <span style="color:#ff6b35;font-weight:700;">&#10003;</span>&nbsp; Direct line to the founder (me) for feedback
          </td></tr>
          <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">
            <span style="color:#ff6b35;font-weight:700;">&#10003;</span>&nbsp; AI that's learning ${trade} from real Australian jobs
          </td></tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      The beta closes on <strong style="color:#ff6b35;">May 15, 2026</strong>. After that, pricing goes to standard rates and the founding member perks are gone. I'm not saying that to pressure you — I'm saying it because I don't want you to miss out.
    </p>
    <p style="margin:0 0 16px;color:#cccccc;font-size:16px;line-height:1.7;">
      If Kindai isn't for you, no hard feelings at all. But if you've been meaning to try it and just haven't got around to it — now's the time. One quote. Five minutes. See if it's worth it.
    </p>
    ${ctaButton("Use Your Beta Access", `${BASE_URL}/dashboard`)}
    <p style="margin:0;color:#666666;font-size:14px;">
      P.S. If something's stopping you — confusing, doesn't work for your trade, whatever — just reply and tell me. I'll fix it. That's literally why the beta exists.
    </p>
    ${signoff()}
  `);

  const text = `G'day ${fn},

Straight up. You grabbed spot #${data.spotNumber} of 25 in the Kindai beta two weeks ago. That's a big deal — only 25 tradies in Australia got this access.

I'm not going to pretend this email isn't a nudge. It is. But it's an honest one.

Here's what you've got right now that won't last forever:
- Full platform access — free right now
- Founding member pricing — locked in for life
- Direct line to the founder (me) for feedback
- AI that's learning ${trade} from real Australian jobs

The beta closes on May 15, 2026. After that, pricing goes to standard rates and the founding member perks are gone.

If Kindai isn't for you, no hard feelings at all. But if you've been meaning to try it and just haven't got around to it — now's the time. One quote. Five minutes. See if it's worth it.

Use your beta access: ${BASE_URL}/dashboard

P.S. If something's stopping you — confusing, doesn't work for your trade, whatever — just reply and tell me. I'll fix it. That's literally why the beta exists.

Cheers,
Matt Symons
Co-founder, Kindai

---
To unsubscribe, reply "unsubscribe" to matt@kindaiestimator.com.`;

  return { subject, html, text };
}

// ─── Email builder map ───────────────────────────────────────────────────────

const EMAIL_BUILDERS: Record<NurtureEmailKey, (data: NurtureEmailData) => EmailContent> = {
  day1_activation: buildDay1,
  day3_social_proof: buildDay3,
  day7_roi: buildDay7,
  day14_urgency: buildDay14,
};

export function buildNurtureEmail(
  key: NurtureEmailKey,
  data: NurtureEmailData
): EmailContent {
  return EMAIL_BUILDERS[key](data);
}

// ─── Send via Gmail SMTP ─────────────────────────────────────────────────────

export async function sendNurtureEmail(
  key: NurtureEmailKey,
  data: NurtureEmailData
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const content = buildNurtureEmail(key, data);

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn("[Nurture] GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping nurture email");
    return { success: false, error: "Gmail credentials not configured" };
  }

  const success = await sendEmail({
    to: data.email,
    subject: content.subject,
    html: content.html,
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });

  if (success) {
    return { success: true, messageId: `gmail-${Date.now()}` };
  }
  return { success: false, error: "Gmail SMTP send failed" };
}
