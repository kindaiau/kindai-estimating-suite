/**
 * Ebook Lead Magnet Email System — Kindai Estimating Suite
 *
 * "From Plans to Quote in Minutes" — free guide for Australian tradies.
 *
 * Email sequence:
 *   Day 0  — Instant delivery: ebook + welcome
 *   Day 2  — The #1 quoting mistake tradies make
 *   Day 4  — Social proof: how other tradies are using Kindai
 *   Day 7  — ROI calculator: what slow quoting is actually costing you
 *   Day 10 — Last chance: your free pilot spot is waiting
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
const BETA_URL = "https://kindaiestimator.com/beta";
const DEMO_URL = "https://kindaiestimator.com/demo";

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

// ─── Day 4: Social Proof ─────────────────────────────────────────────────────

export async function sendEbookNurtureDay4(opts: {
  to: string;
  name: string;
}): Promise<string | null> {
  const firstName = opts.name.split(" ")[0];

  const body = `
    ${brandedH2("What tradies are saying after their first quote")}
    ${brandedP(`Hey ${firstName},`)}
    ${brandedP(`I want to share something from one of our beta users — a cabinet maker in Adelaide who was spending 3+ hours on every commercial quote.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.textMuted};font-size:13px;font-style:italic;">Beta user feedback</p>
      <p style="margin:0 0 16px;color:${BRAND.textWhite};font-size:17px;font-weight:600;line-height:1.6;">"I uploaded the plans and had a first-pass quote in about 40 minutes instead of half a day. The AI got most of it right — I just adjusted a couple of line items. Sent it that afternoon."</p>
      <p style="margin:0;color:${BRAND.textMuted};font-size:14px;">— Cabinet maker, Adelaide SA</p>
    `, BRAND.green)}
    ${brandedP(`That's the shift. Not replacing the estimator — just removing the 3 hours of counting fixtures from scratch so you can spend 40 minutes reviewing and refining.`)}
    ${brandedP(`If you're quoting more than 2-3 jobs a week, that time saving compounds fast. 3 hours × 3 jobs × 50 weeks = <strong style="color:${BRAND.orange};">450 hours a year</strong> you could get back.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">What our beta users are doing with that time:</p>
      <p style="margin:0 0 6px;color:${BRAND.textBody};font-size:15px;">→ Quoting more jobs (more chances to win)</p>
      <p style="margin:0 0 6px;color:${BRAND.textBody};font-size:15px;">→ Spending more time on the tools (what they actually love)</p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;">→ Getting home earlier</p>
    `, BRAND.blue)}
    ${brandedCta("Claim Your Free Pilot Spot", BETA_URL)}
    ${brandedSignature("Matt", "Co-founder, Kindai")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `What tradies are saying after their first Kindai quote`,
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
    ${brandedH2("What slow quoting is actually costing you")}
    ${brandedP(`Hey ${firstName},`)}
    ${brandedP(`Let me do some quick maths with you.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 16px;color:${BRAND.orange};font-size:17px;font-weight:700;">The real cost of manual quoting</p>
      ${brandedStep(1, "Average time per quote: <strong style=\"color:${BRAND.textWhite};\">3 hours</strong>")}
      ${brandedStep(2, "Quotes per week: <strong style=\"color:${BRAND.textWhite};\">3 jobs</strong>")}
      ${brandedStep(3, "Your time value: <strong style=\"color:${BRAND.textWhite};\">$120/hr</strong> (conservative)")}
      <p style="margin:16px 0 0;color:${BRAND.textWhite};font-size:18px;font-weight:700;">= $56,160 per year in quoting time alone</p>
    `, BRAND.orange)}
    ${brandedP(`That's before you factor in the jobs you lost because your quote took 4 days instead of same-day.`)}
    ${brandedP(`With Kindai, that 3-hour quote becomes 40 minutes. The AI does the first-pass takeoff. You review and send.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 8px;color:${BRAND.green};font-size:17px;font-weight:700;">Time saved: ~2.3 hours per quote</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">3 quotes/week × 2.3 hrs × 50 weeks = <strong style=\"color:${BRAND.textWhite};\">345 hours/year</strong></p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;">At $120/hr = <strong style=\"color:${BRAND.green};\">$41,400 back in your pocket</strong></p>
    `, BRAND.green)}
    ${brandedP(`The pilot is free. No credit card. No lock-in. Just upload your first plan and see what the AI does with it.`)}
    ${brandedCta("Start Your Free Pilot →", BETA_URL)}
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

// ─── Day 10: Last Chance ─────────────────────────────────────────────────────

export async function sendEbookNurtureDay10(opts: {
  to: string;
  name: string;
}): Promise<string | null> {
  const firstName = opts.name.split(" ")[0];

  const body = `
    ${brandedH2("Your free pilot spot — last nudge, I promise")}
    ${brandedP(`Hey ${firstName},`)}
    ${brandedP(`This is the last email in this sequence — I won't keep nudging you after this.`)}
    ${brandedP(`I just wanted to make sure you knew: <strong style="color:${BRAND.textWhite};">the free pilot is still open</strong>, but we're keeping it to a small group so we can actually support everyone properly.`)}
    ${brandedInfoBox(`
      <p style="margin:0 0 12px;color:${BRAND.textWhite};font-size:17px;font-weight:700;">What you get in the free pilot:</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">✅ Full access to AI Takeoff — upload plans, get a quote draft</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">✅ Your own materials price book</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">✅ GST-ready quote builder</p>
      <p style="margin:0 0 8px;color:${BRAND.textBody};font-size:15px;">✅ Australian compliance engine (WHS, state licensing)</p>
      <p style="margin:0;color:${BRAND.textBody};font-size:15px;">✅ Direct access to me — reply to this email anytime</p>
    `, BRAND.hotPink)}
    ${brandedP(`If it's not for you, no hard feelings. But if you've been thinking about it — now's the time.`)}
    ${brandedCta("Claim Your Free Pilot Spot →", BETA_URL)}
    ${brandedP(`Either way — I hope the guide was useful. Good luck with the quoting.`)}
    ${brandedSignature("Matt", "Co-founder, Kindai")}
  `;

  return sendEmail({
    to: opts.to,
    subject: `${firstName}, your free pilot spot is still open`,
    html: brandedEmailWrap({
      bodyHtml: body,
      footerText: "You received this because you downloaded the Kindai free guide. This is the last email in the sequence.",
    }),
    fromName: "Matt from Kindai",
    replyTo: "matt@kindaiestimator.com",
  });
}
