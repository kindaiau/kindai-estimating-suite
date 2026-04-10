/**
 * Beta Welcome Email — Kindai Estimating Suite
 * Sends a branded welcome email via Brevo transactional API.
 * Fires on every successful beta sign-up.
 */

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";
const BASE_URL = "https://kindaiestimator.com";

// Maps trade names to their landing page paths
const TRADE_PATHS: Record<string, string> = {
  "Cabinet Making & Joinery": "/cabinet-joinery",
  "Electrical": "/dashboard",
  "Plumbing & Drainage": "/dashboard",
  "Carpentry & Joinery": "/dashboard",
  "Concreting": "/dashboard",
  "HVAC": "/dashboard",
  "Flooring": "/dashboard",
  "Landscaping & Irrigation": "/dashboard",
  "Rendering & Plastering": "/dashboard",
  "Painting & Decorating": "/dashboard",
};

function getTradeUrl(trade?: string): string {
  if (!trade) return `${BASE_URL}/dashboard`;
  const path = TRADE_PATHS[trade] ?? "/dashboard";
  return `${BASE_URL}${path}`;
}

export interface WelcomeEmailData {
  name: string;
  email: string;
  spotNumber: number;
  trade?: string;
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(" ")[0] || fullName;
}

function buildHtmlEmail(data: WelcomeEmailData): string {
  const firstName = getFirstName(data.name);
  const tradeText = data.trade ? ` for ${data.trade}` : "";
  const ctaUrl = getTradeUrl(data.trade);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Kindai Beta</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#111111;border-radius:16px 16px 0 0;padding:40px 48px 32px;text-align:center;border-bottom:1px solid #222;">
              <!-- Logo -->
              <img src="${LOGO_URL}" alt="Kindai Estimating Suite" width="160" style="display:block;margin:0 auto 24px;height:auto;" />
              <div style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#ff8c42);border-radius:12px;padding:10px 20px;margin-bottom:20px;">
                <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FOUNDING MEMBER #${data.spotNumber}</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:800;line-height:1.2;">
                G'day ${firstName},
              </h1>
              <p style="margin:12px 0 0;color:#888888;font-size:16px;">You're in. Welcome to the Kindai beta.</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#111111;padding:40px 48px;">

              <p style="margin:0 0 24px;color:#cccccc;font-size:16px;line-height:1.7;">
                You just claimed spot <strong style="color:#ff6b35;">#${data.spotNumber} of 25</strong> in the Kindai Estimating Suite beta. That's not nothing — you're one of the first tradies in Australia to get access to AI that actually understands your trade${tradeText}.
              </p>

              <!-- Perks box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;margin-bottom:32px;">
                <tr>
                  <td style="padding:28px 32px;">
                    <p style="margin:0 0 16px;color:#ff6b35;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">What you've unlocked</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">— Full platform access — <strong style="color:#ffffff;">free during beta</strong></td></tr>
                      <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">— Your feedback shapes the product directly</td></tr>
                      <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">— Founding member pricing locked in forever</td></tr>
                      <tr><td style="padding:6px 0;color:#cccccc;font-size:15px;">— Listed as a Kindai Founding Partner</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Getting started -->
              <p style="margin:0 0 16px;color:#ffffff;font-size:18px;font-weight:700;">Getting started (5 minutes)</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#ff6b35;color:#ffffff;font-size:13px;font-weight:800;border-radius:50%;width:28px;height:28px;text-align:center;vertical-align:middle;min-width:28px;">1</td>
                        <td style="padding-left:14px;color:#cccccc;font-size:15px;">Head to <a href="${BASE_URL}" style="color:#ff6b35;text-decoration:none;font-weight:600;">kindaiestimator.com</a> and sign in</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#ff6b35;color:#ffffff;font-size:13px;font-weight:800;border-radius:50%;width:28px;height:28px;text-align:center;vertical-align:middle;min-width:28px;">2</td>
                        <td style="padding-left:14px;color:#cccccc;font-size:15px;">Click <strong style="color:#ffffff;">AI Takeoff</strong> in your dashboard</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #1e1e1e;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#ff6b35;color:#ffffff;font-size:13px;font-weight:800;border-radius:50%;width:28px;height:28px;text-align:center;vertical-align:middle;min-width:28px;">3</td>
                        <td style="padding-left:14px;color:#cccccc;font-size:15px;">Describe a job${tradeText} — e.g. "3 bed house, 20 power points, 15 downlights"</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#ff6b35;color:#ffffff;font-size:13px;font-weight:800;border-radius:50%;width:28px;height:28px;text-align:center;vertical-align:middle;min-width:28px;">4</td>
                        <td style="padding-left:14px;color:#cccccc;font-size:15px;">Watch the AI build your full GST-compliant quote in <strong style="color:#ffffff;">under 60 seconds</strong></td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button — trade-aware -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#ff6b35,#ff8c42);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;">
                      Start Your First Quote
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Personal note -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;border-left:3px solid #ff6b35;margin-bottom:32px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <p style="margin:0 0 12px;color:#cccccc;font-size:15px;line-height:1.7;">
                      Run 2–3 real quotes this week and let me know what worked, what felt off, and what you wish it did. Reply directly to this email — I read every single one.
                    </p>
                    <p style="margin:0;color:#888888;font-size:14px;">
                      — Matt Symons, Co-founder, Kindai
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#666666;font-size:14px;line-height:1.6;">
                P.S. Got a tradie mate who'd love this? Forward them: <a href="${BASE_URL}/beta" style="color:#ff6b35;text-decoration:none;">kindaiestimator.com/beta</a> — we'll open more spots if demand is there.
              </p>

            </td>
          </tr>

          <!-- Footer with unsubscribe (AU Spam Act compliance) -->
          <tr>
            <td style="background:#0d0d0d;border-radius:0 0 16px 16px;padding:24px 48px;text-align:center;border-top:1px solid #1a1a1a;">
              <p style="margin:0 0 8px;color:#444444;font-size:13px;">
                <a href="${BASE_URL}" style="color:#ff6b35;text-decoration:none;font-weight:600;">kindaiestimator.com</a>
                &nbsp;·&nbsp;
                <a href="mailto:matt@kindaiestimator.com" style="color:#444444;text-decoration:none;">matt@kindaiestimator.com</a>
              </p>
              <p style="margin:0 0 8px;color:#333333;font-size:12px;">
                Kindai Estimating Suite · Australia's fastest AI estimating software for tradies
              </p>
              <p style="margin:0;color:#2a2a2a;font-size:11px;">
                You received this email because you signed up for the Kindai beta at kindaiestimator.com.
                To stop receiving emails, reply with "unsubscribe" to <a href="mailto:matt@kindaiestimator.com" style="color:#2a2a2a;text-decoration:none;">matt@kindaiestimator.com</a>.
                Kindai Pty Ltd · Australia
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildTextEmail(data: WelcomeEmailData): string {
  const firstName = getFirstName(data.name);
  const tradeText = data.trade ? ` for ${data.trade}` : "";
  const ctaUrl = getTradeUrl(data.trade);

  return `G'day ${firstName},

You just claimed spot #${data.spotNumber} of 25 in the Kindai Estimating Suite beta. That's not nothing — you're one of the first tradies in Australia to get access to AI that actually understands your trade${tradeText}.

You're now a Founding Member. Here's what that means:

- Full platform access — free during beta (normally $149-$499/month)
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
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.warn("[Email] BREVO_API_KEY not set — skipping welcome email");
    return;
  }

  const firstName = getFirstName(data.name);
  const subject = `Founding Member #${data.spotNumber} — Welcome to Kindai Beta`;

  const payload = {
    sender: {
      name: "Matt Symons — Kindai",
      email: "noreply@kindaiestimator.com",
    },
    to: [{ email: data.email, name: data.name }],
    replyTo: { email: "matt@kindaiestimator.com", name: "Matt Symons" },
    subject,
    htmlContent: buildHtmlEmail(data),
    textContent: buildTextEmail(data),
    tags: ["beta-welcome", "founding-member"],
    params: {
      firstName,
      spotNumber: data.spotNumber,
      trade: data.trade || "General",
    },
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${errorText}`);
  }

  const result = await response.json() as { messageId?: string };
  console.log(`[Email] Welcome email sent to ${data.email} (spot #${data.spotNumber}) — messageId: ${result.messageId}`);
}
