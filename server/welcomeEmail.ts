/**
 * Beta Welcome Email
 * Sends a personalised welcome email to new beta sign-ups via Gmail (Zapier MCP).
 * Falls back gracefully if the email service is unavailable.
 */

export interface WelcomeEmailData {
  name: string;
  email: string;
  spotNumber: number;
  trade?: string;
}

function getFirstName(fullName: string): string {
  return fullName.trim().split(" ")[0] || fullName;
}

export async function sendBetaWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const firstName = getFirstName(data.name);
  const tradeText = data.trade ? ` for ${data.trade}` : "";

  const subject = `🎉 You're Founding Member #${data.spotNumber} — Welcome to Kindai Beta`;

  const body = `G'day ${firstName},

You legend — you just claimed spot #${data.spotNumber} of 25 in the Kindai Estimating Suite beta.

You're now a Founding Member. Here's what that means for you:

✅ Full platform access — completely free during beta (normally $149–$499/month)
✅ Your feedback shapes the product directly
✅ Founding member pricing locked in when we go paid
✅ Your business listed as a Kindai Founding Partner

---

GETTING STARTED (takes 5 minutes):

1. Head to kindaiestimator.com and sign in
2. Click "AI Takeoff" in the dashboard
3. Type a job description${tradeText} — e.g. "3 bedroom house, 20 power points, 15 downlights"
4. Watch the AI build your full quote in under 60 seconds

---

WHAT WE NEED FROM YOU:

Run 2–3 real quotes this week and let us know:
- What worked brilliantly
- What felt off
- What you wish it did

Reply directly to this email — I read every single one.

---

Welcome to the team. Let's build something that actually works for tradies.

Matt Symons
Co-founder, Kindai
matt@kindaiestimator.com
kindaiestimator.com

P.S. Got a mate in the trades who'd love this? Forward them this link: kindaiestimator.com/beta — we'll open more spots if demand is there.`;

  // Use the built-in LLM/notification infrastructure to send via Gmail
  // We POST to the Zapier Gmail send tool via fetch
  try {
    const zapierWebhookUrl = process.env.ZAPIER_GMAIL_WEBHOOK_URL;
    
    if (zapierWebhookUrl) {
      // If a Zapier webhook is configured, use it
      await fetch(zapierWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: data.email,
          subject,
          body,
          from_name: "Matt Symons — Kindai",
        }),
      });
      console.log(`[Email] Welcome email sent to ${data.email} via Zapier webhook`);
    } else {
      // Log the email content for manual sending / debugging
      console.log(`[Email] Welcome email ready for ${data.email} (spot #${data.spotNumber})`);
      console.log(`[Email] Subject: ${subject}`);
      console.log(`[Email] Body preview: ${body.substring(0, 200)}...`);
      // TODO: Wire to Gmail MCP or Brevo when webhook URL is configured
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Failed to send welcome email to ${data.email}:`, message);
    throw err;
  }
}
