/**
 * Ebook Lead Magnet Email System — Kindai Estimating Suite
 *
 * "From Plans to Quote in Minutes" — free guide for Australian tradies.
 *
 * Email sequence:
 *   Day 0  — Instant delivery: ebook + welcome
 *   Day 2  — The #1 quoting mistake tradies make
 *   Day 4  — How to review an AI estimate safely
 *   Day 7  — ROI worksheet using the reader's own numbers
 *   Day 10 — Founding Workflow Setup invitation
 */

import { sendEmail } from "./resendSender";
import {
  brandedEmailWrap,
  brandedCta,
  brandedInfoBox,
  brandedH2,
  brandedP,
  brandedSignature,
  brandedStep,
  BRAND,
} from "./emailBrand";

const EBOOK_URL =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663471157879/iNXMpnBeEkBKgRDm.pdf";
const PRICING_URL = "https://kindaiestimator.com/pricing";
const DEMO_URL = "https://kindaiestimator.com/demo";
const EVALUATION_URL = "https://kindaiestimator.com/evaluation";

// ─── Day 0: Instant Ebook Delivery ──────────────────────────────────────────

export async function sendEbookDelivery(opts: {
  to: string;
  name: string;
}): Promise<string | null> {
  const firstName = opts.name.split(" ")[0];

  const body = `
    ${brandedH2("Here's your free guide, " + firstName + " 👋")}
    ${brandedP(`Thanks for grabbing a copy of <strong style="color:${BRAND.textWhite};">From Plans to Quote in Minutes</strong> — the 12-page guide on how Australian tradies can quote faster, protect their margins, and win more work.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.textWhite};font-size:17px;font-weight:700;">📖 Your free guide is ready to download</p>
      <p style="margin:0 0 16px;color:${BRAND.textBody};font-size:15px;">Inside you'll find:</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">✅ Why slow quotes are costing you jobs (and how to fix it)</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">✅ How AI reads your plans and builds a GST-ready quote in 60 seconds</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">✅ The 80% time saving that changes how you run your business</p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;">✅ Real numbers: what quoting is actually costing you per year</p>
    `, BRAND.orange)}
    ${brandedCta("Download Your Free Guide →", EBOOK_URL)}
    ${brandedP(`While you're reading it — if you want to see the actual software in action, you can try a live demo right now. No sign-up, no credit card.`)}
    ${brandedCta("Try the Live Demo (No Sign-Up)", DEMO_URL)}
    ${brandedP(`Any questions, just reply to this email. I read every one.`)}
    ${brandedSignature("Matt Symons", "Co-founder, Kindai")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `Here's your free guide, ${firstName} — From Plans to Quote in Minutes`,
    html: brandedEmailWrap({
      bodyHtml: body,
      footerText: "You received this because you requested the free Kindai guide.",
    }),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });
}

// ─── Day 2: The #1 Quoting Mistake ──────────────────────────────────────────

export async function sendEbookNurtureDay2(opts: {
  to: string;
  name: string;
}): Promise<string | null> {
  const firstName = opts.name.split(" ")[0];

  const body = `
    ${brandedH2("The #1 mistake tradies make when quoting")}
    ${brandedP(`Hey ${firstName},`)}
    ${brandedP(`Hope you got a chance to read the guide. I wanted to share something that comes up with almost every tradie I talk to.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.orange};font-size:18px;font-weight:700;">The mistake: quoting from memory.</p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;line-height:1.7;">You've done a job like this 50 times. You know roughly what it costs. So you pull a number from your head, add a bit for materials, and send it off. Sometimes you win. Sometimes you wonder why you're not making money on jobs you thought were easy.</p>
    `, BRAND.hotPink)}
    ${brandedP(`The problem isn't that you don't know your trade. You know it better than anyone. The problem is that <strong style="color:${BRAND.textWhite};">memory doesn't account for current material prices, award rate changes, or the one item you always forget to include.</strong>`)}
    ${brandedP(`That's what Kindai fixes. It reads the plans, pulls your price book, applies current labour rates, and builds the first draft. You review it, adjust anything that doesn't look right, and send it.`)}
    ${brandedP(`The AI handles the grunt work. You stay in control of the final quote.`)}
    ${brandedCta("See How It Works (Free Demo)", DEMO_URL)}
    ${brandedSignature("Matt", "Co-founder, Kindai")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `The #1 quoting mistake (and how to avoid it)`,
    html: brandedEmailWrap({
      bodyHtml: body,
      footerText: "You received this because you downloaded the Kindai free guide.",
    }),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });
}

// ─── Day 4: Safe review process ──────────────────────────────────────────────

export async function sendEbookNurtureDay4(opts: {
  to: string;
  name: string;
}): Promise<string | null> {
  const firstName = opts.name.split(" ")[0];

  const body = `
    ${brandedH2("How to review an AI estimate without trusting it blindly")}
    ${brandedP(`Hey ${firstName},`)}
    ${brandedP(`AI can prepare a useful first draft, but the draft still needs an estimator. The safest evaluation is to compare the output with a job you already understand.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.textWhite};font-size:17px;font-weight:700;">Four things to check before a quote leaves your business</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">1. Quantities against the source drawings</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">2. Missing scope, exclusions and provisional items</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">3. Your actual labour, supplier and waste assumptions</p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;">4. Current compliance and tax requirements</p>
    `, BRAND.green)}
    ${brandedP(`The public sample lets you inspect the estimate structure without uploading a private plan. If the workflow looks relevant, the next step is the paid Cabinet & Joinery Founding Workflow Setup.`)}
    ${brandedCta("Explore the estimating sample", DEMO_URL)}
    ${brandedSignature("Matt", "Co-founder, Kindai")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `How to review an AI estimate safely`,
    html: brandedEmailWrap({
      bodyHtml: body,
      footerText: "You received this because you downloaded the Kindai free guide.",
    }),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });
}

// ─── Day 7: ROI Calculator ───────────────────────────────────────────────────

export async function sendEbookNurtureDay7(opts: {
  to: string;
  name: string;
}): Promise<string | null> {
  const firstName = opts.name.split(" ")[0];

  const body = `
    ${brandedH2("Put a value on quoting time using your own numbers")}
    ${brandedP(`Hey ${firstName},`)}
    ${brandedP(`Generic savings claims are not useful. Use the numbers from your own business instead.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 16px;color:${BRAND.orange};font-size:17px;font-weight:700;">Your baseline</p>
      ${brandedStep(1, `Record the average hours spent preparing and checking one quote.`)}
      ${brandedStep(2, `Multiply by the number of quotes your team prepares each month.`)}
      ${brandedStep(3, `Multiply by the loaded hourly cost of the people doing that work.`)}
      <p style="margin:16px 0 0;color:${BRAND.textWhite};font-size:16px;font-weight:700;">That is the cost to compare with a measured KindAI evaluation.</p>
    `, BRAND.orange)}
    ${brandedInfoBox(`
      <p style="margin:0 0 8px;color:${BRAND.green};font-size:17px;font-weight:700;">What to measure in the evaluation</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">Draft preparation time and estimator review time</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">Missed items, wrong quantities and pricing corrections</p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;">Whether the approved workflow is repeatable on the next job</p>
    `, BRAND.green)}
    ${brandedCta("Apply for Founding Workflow Setup", EVALUATION_URL)}
    ${brandedSignature("Matt", "Co-founder, Kindai")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `What slow quoting is actually costing you (the real numbers)`,
    html: brandedEmailWrap({
      bodyHtml: body,
      footerText: "You received this because you downloaded the Kindai free guide.",
    }),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });
}

// ─── Day 10: Paid setup invitation ───────────────────────────────────────────

export async function sendEbookNurtureDay10(opts: {
  to: string;
  name: string;
}): Promise<string | null> {
  const firstName = opts.name.split(" ")[0];

  const body = `
    ${brandedH2(`${firstName}, one real job is enough to test the fit`)}
    ${brandedP(`Hey ${firstName},`)}
    ${brandedP(`This is the last email in this sequence. I won't keep nudging you after this.`)}
    ${brandedP(`If KindAI may fit your cabinet or joinery workflow, apply for the fixed A$2,500 plus GST setup. We confirm fit, scope and payment before asking for private files.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.textWhite};font-size:17px;font-weight:700;">The paid setup covers:</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">One cabinet or joinery workflow and one user</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">Two reviewed real jobs with visible assumptions and corrections</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">Thirty days of email support</p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;">Six months of Sole Tradie with no automatic renewal</p>
    `, BRAND.hotPink)}
    ${brandedCta("Apply for Founding Workflow Setup", EVALUATION_URL)}
    ${brandedP(`Either way, I hope the guide was useful. Good luck with the quoting.`)}
    ${brandedSignature("Matt", "Co-founder, Kindai")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `${firstName}, test KindAI on one real job`,
    html: brandedEmailWrap({
      bodyHtml: body,
      footerText: "You received this because you downloaded the Kindai free guide. This is the last email in the sequence.",
    }),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });
}
