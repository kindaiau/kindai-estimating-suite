/**
 * Send apology emails to all beta signups
 * 
 * This script:
 * 1. Queries all beta signups from the database
 * 2. Approves any pending signups
 * 3. Sends the apology/welcome-back email to each one via Resend
 * 
 * Usage: node scripts/send-apology-emails.mjs
 */

import 'dotenv/config';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!RESEND_API_KEY) {
  console.error("RESEND_API_KEY not set");
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

// We'll use the Resend API directly via fetch and query the DB via mysql2
import mysql from 'mysql2/promise';

const EBOOK_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663471157879/iNXMpnBeEkBKgRDm.pdf";
const EBOOK_TITLE = "From Plans to Quote in Minutes — The Kindai Estimating Guide";

// Connect to database
const connection = await mysql.createConnection(DATABASE_URL);

// Get all beta signups
const [signups] = await connection.execute('SELECT * FROM beta_signups ORDER BY id ASC');
console.log(`\nFound ${signups.length} beta signups:\n`);

for (const signup of signups) {
  console.log(`  #${signup.id} — ${signup.name} (${signup.email}) — status: ${signup.status}`);
}

// Approve any pending signups first
const pendingSignups = signups.filter(s => s.status === 'pending');
if (pendingSignups.length > 0) {
  console.log(`\nApproving ${pendingSignups.length} pending signups...`);
  for (const signup of pendingSignups) {
    await connection.execute(
      'UPDATE beta_signups SET status = ?, approvedAt = NOW() WHERE id = ?',
      ['approved', signup.id]
    );
    console.log(`  ✅ Approved: ${signup.name} (#${signup.id})`);
  }
}

// Now build and send apology emails to ALL signups
console.log(`\nSending apology emails to all ${signups.length} signups...\n`);

// Import the email builder (we'll inline the Resend send since we can't easily import TS)
const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";
const BASE_URL = "https://kindaiestimator.com";

function getFirstName(fullName) {
  return fullName.trim().split(" ")[0] || fullName;
}

function buildApologyHtml(data) {
  const firstName = getFirstName(data.name);
  const tradeText = data.trade ? ` for ${data.trade}` : "";

  const ebookSection = data.ebookUrl ? `
    <!-- Gift section -->
    <div style="background:#161b22;border:1px solid #FFD700;border-radius:12px;padding:24px;margin:24px 0;">
      <p style="margin:0 0 12px;color:#FFD700;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">🎁 A GIFT FOR YOUR PATIENCE</p>
      <p style="margin:0 0 16px;color:#c9d1d9;font-size:15px;line-height:1.7;">
        To say thanks for sticking with us, here's a free copy of <strong style="color:#ffffff;">${data.ebookTitle}</strong>. No strings attached.
      </p>
      <a href="${data.ebookUrl}" style="display:inline-block;background:linear-gradient(135deg, #FF2D78, #FF6B35);color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:12px 32px;border-radius:50px;">Download Your Free Copy</a>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;">
<tr><td align="center" style="padding:32px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Gradient top bar -->
<tr><td style="height:4px;background:linear-gradient(135deg, #FF2D78, #FF6B35);border-radius:12px 12px 0 0;"></td></tr>

<!-- Logo -->
<tr><td style="background:#161b22;padding:32px 40px 16px;text-align:center;">
  <img src="${LOGO_URL}" alt="Kindai" width="120" style="width:120px;height:auto;">
</td></tr>

<!-- Body -->
<tr><td style="background:#161b22;padding:0 40px 32px;">

  <!-- Founding member badge -->
  <div style="text-align:center;margin-bottom:24px;">
    <div style="display:inline-block;background:linear-gradient(135deg, #FF2D78, #FF6B35);border-radius:12px;padding:10px 20px;">
      <span style="color:#ffffff;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">FOUNDING MEMBER #${data.spotNumber}</span>
    </div>
  </div>

  <h2 style="margin:0 0 16px;color:#ffffff;font-size:22px;font-weight:700;">Hey ${firstName},</h2>

  <p style="margin:0 0 16px;color:#c9d1d9;font-size:15px;line-height:1.7;">I owe you an apology. You signed up for the Kindai beta and then... crickets. No welcome email, no onboarding, nothing. That's on me.</p>

  <p style="margin:0 0 16px;color:#c9d1d9;font-size:15px;line-height:1.7;">The honest truth? Our email system broke and I didn't catch it fast enough. Your signup went through, your spot was saved, but the welcome email never made it to your inbox. Not good enough — I know.</p>

  <p style="margin:0 0 16px;color:#c9d1d9;font-size:15px;line-height:1.7;">The good news: <strong style="color:#FF6B35;">it's fixed now</strong>, and your account is fully active. You're Founding Member <strong style="color:#FF6B35;">#${data.spotNumber}</strong> — that hasn't changed, and your founding member pricing is locked in forever.</p>

  ${ebookSection}

  <!-- What you can do right now -->
  <p style="margin:24px 0 16px;color:#ffffff;font-size:18px;font-weight:700;">Here's what you can do right now</p>

  <div style="padding:12px 0;border-bottom:1px solid #30363d;">
    <span style="display:inline-block;width:28px;height:28px;background:linear-gradient(135deg, #FF2D78, #FF6B35);border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:700;margin-right:12px;">1</span>
    <span style="color:#c9d1d9;font-size:15px;">Head to <a href="${BASE_URL}" style="color:#FF6B35;text-decoration:none;font-weight:600;">kindaiestimator.com</a> and sign in</span>
  </div>
  <div style="padding:12px 0;border-bottom:1px solid #30363d;">
    <span style="display:inline-block;width:28px;height:28px;background:linear-gradient(135deg, #FF2D78, #FF6B35);border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:700;margin-right:12px;">2</span>
    <span style="color:#c9d1d9;font-size:15px;">Click <strong style="color:#ffffff;">AI Takeoff</strong> — our AI estimating engine</span>
  </div>
  <div style="padding:12px 0;border-bottom:1px solid #30363d;">
    <span style="display:inline-block;width:28px;height:28px;background:linear-gradient(135deg, #FF2D78, #FF6B35);border-radius:50%;text-align:center;line-height:28px;color:#fff;font-size:13px;font-weight:700;margin-right:12px;">3</span>
    <span style="color:#c9d1d9;font-size:15px;">Describe any job${tradeText} and watch it build a full quote in under 60 seconds</span>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin:32px 0;">
    <a href="${BASE_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg, #FF2D78, #FF6B35);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;">Jump Into Kindai Now</a>
  </div>

  <!-- What's coming -->
  <div style="background:#161b22;border:1px solid #00C853;border-radius:12px;padding:24px;margin:24px 0;">
    <p style="margin:0 0 12px;color:#00C853;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">WHAT'S COMING THIS WEEK</p>
    <table cellpadding="0" cellspacing="0">
      <tr><td style="padding:6px 0;color:#c9d1d9;font-size:15px;">✅ AI Vision Takeoff — scan a plan, get a full quote</td></tr>
      <tr><td style="padding:6px 0;color:#c9d1d9;font-size:15px;">✅ PDF quote export — branded, GST-compliant, ready to send</td></tr>
      <tr><td style="padding:6px 0;color:#c9d1d9;font-size:15px;">✅ Materials library — real Aussie trade pricing built in</td></tr>
      <tr><td style="padding:6px 0;color:#c9d1d9;font-size:15px;">✅ Your feedback shaping every update</td></tr>
    </table>
  </div>

  <p style="margin:0 0 16px;color:#c9d1d9;font-size:15px;line-height:1.7;">I'm building Kindai to save tradies like you hours every week on quoting. But I can only make it great with your feedback. Try it out, break it, tell me what's missing — reply directly to this email. I read every single one.</p>

  <!-- Signature -->
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #30363d;">
    <p style="margin:0;color:#ffffff;font-size:15px;font-weight:600;">Cheers,</p>
    <p style="margin:4px 0 0;color:#FF6B35;font-size:15px;font-weight:700;">Matt Symons</p>
    <p style="margin:4px 0 0;color:#8b949e;font-size:13px;">Founder, Kindai</p>
  </div>

  <p style="margin:16px 0 0;color:#8b949e;font-size:14px;line-height:1.6;">
    P.S. Know a tradie who'd love this? Forward them: <a href="${BASE_URL}/beta" style="color:#FF6B35;text-decoration:none;">kindaiestimator.com/beta</a>
  </p>

</td></tr>

<!-- Footer -->
<tr><td style="background:#0d1117;padding:24px 40px;text-align:center;border-top:1px solid #30363d;">
  <p style="margin:0 0 8px;color:#8b949e;font-size:12px;">Kindai Pty Ltd · Australia</p>
  <p style="margin:0;color:#8b949e;font-size:12px;">
    <a href="${BASE_URL}/unsubscribe" style="color:#8b949e;text-decoration:underline;">Unsubscribe</a> · 
    <a href="${BASE_URL}/privacy" style="color:#8b949e;text-decoration:underline;">Privacy Policy</a>
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// Send emails one by one with delay
let sent = 0;
let failed = 0;

for (const signup of signups) {
  const firstName = getFirstName(signup.name);
  const subject = `Hey ${firstName} — I owe you an apology (and your Kindai beta access)`;

  const html = buildApologyHtml({
    name: signup.name,
    email: signup.email,
    spotNumber: signup.id,
    trade: signup.trade,
    ebookUrl: EBOOK_URL,
    ebookTitle: EBOOK_TITLE,
  });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Matt from Kindai <matt@kindai.com.au>",
        to: [signup.email],
        subject,
        html,
        reply_to: "matt@kindaiestimator.com",
      }),
    });

    const result = await response.json();

    if (response.ok && result.id) {
      console.log(`  ✅ Sent to ${signup.name} (${signup.email}) — Resend ID: ${result.id}`);
      sent++;
    } else {
      console.error(`  ❌ Failed for ${signup.name} (${signup.email}):`, JSON.stringify(result));
      failed++;
    }
  } catch (err) {
    console.error(`  ❌ Error for ${signup.name} (${signup.email}):`, err.message);
    failed++;
  }

  // 1.5 second delay between sends
  await new Promise(r => setTimeout(r, 1500));
}

console.log(`\n========================================`);
console.log(`  DONE: ${sent} sent, ${failed} failed`);
console.log(`========================================\n`);

await connection.end();
process.exit(0);
