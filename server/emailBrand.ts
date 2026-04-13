/**
 * Kindai Branded Email Template — Shared Module
 * 
 * ALL outgoing emails from Kindai MUST use this wrapper for consistent branding.
 * 
 * Brand colours (from the Kindai logo):
 *   Hot pink:  #FF2D78  (k, i letters)
 *   Orange:    #FF6B35  (n letter, bird wing)
 *   Yellow:    #FFD700  (bird wing tip)
 *   Green:     #00C853  (d letter)
 *   Blue:      #2979FF  (a, i letters)
 * 
 * Gradient:    linear-gradient(135deg, #FF2D78, #FF6B35)
 * Background:  #0d1117 (dark navy, NOT pure black)
 * Card bg:     #161b22
 * Border:      #30363d
 * Text:        #ffffff (headings), #c9d1d9 (body), #8b949e (muted)
 * Link:        #FF6B35
 * Font:        'Helvetica Neue', Helvetica, Arial, sans-serif
 * 
 * Rules:
 *   - NEVER include "free for Australian trades" in any email
 *   - All text must be Australian English (colour, labour, etc.)
 *   - Footer must include AU Spam Act compliant unsubscribe
 */

const LOGO_URL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663471157879/UNVDthJPfT4ofd4pppvMM2/kindai-logo_1dd661a8.png";
const BASE_URL = "https://kindaiestimator.com";

// ─── Brand colours ──────────────────────────────────────────────────────────

export const BRAND = {
  hotPink: "#FF2D78",
  orange: "#FF6B35",
  yellow: "#FFD700",
  green: "#00C853",
  blue: "#2979FF",
  gradient: "linear-gradient(135deg, #FF2D78, #FF6B35)",
  bgDark: "#0d1117",
  cardBg: "#161b22",
  border: "#30363d",
  textWhite: "#ffffff",
  textBody: "#c9d1d9",
  textMuted: "#8b949e",
  textDim: "#484f58",
  footerBg: "#010409",
  logoUrl: LOGO_URL,
  baseUrl: BASE_URL,
} as const;

// ─── Shared branded email wrapper ───────────────────────────────────────────

export interface BrandedEmailOptions {
  /** Main body HTML content (goes inside the card) */
  bodyHtml: string;
  /** Optional: override the footer text */
  footerText?: string;
  /** Optional: show "Powered by Kindai" instead of full footer (for client-facing emails) */
  minimalFooter?: boolean;
}

/**
 * Wraps any email body HTML in the standard Kindai branded template.
 * Dark background, gradient header bar, logo, consistent footer.
 */
export function brandedEmailWrap(opts: BrandedEmailOptions): string {
  const footer = opts.minimalFooter
    ? minimalFooterHtml()
    : fullFooterHtml(opts.footerText);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kindai Estimating Suite</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bgDark};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bgDark};padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Gradient top bar -->
          <tr>
            <td style="background:${BRAND.gradient};height:4px;border-radius:16px 16px 0 0;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header with logo -->
          <tr>
            <td style="background:${BRAND.cardBg};padding:32px 48px 24px;text-align:center;border-bottom:1px solid ${BRAND.border};">
              <img src="${BRAND.logoUrl}" alt="Kindai" width="140" style="display:block;margin:0 auto;height:auto;" />
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:${BRAND.cardBg};padding:32px 48px;">
              ${opts.bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${BRAND.footerBg};border-radius:0 0 16px 16px;padding:24px 48px;text-align:center;border-top:1px solid ${BRAND.border};">
              ${footer}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function fullFooterHtml(customText?: string): string {
  return `
    <p style="margin:0 0 8px;color:${BRAND.textDim};font-size:13px;">
      <a href="${BRAND.baseUrl}" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">kindaiestimator.com</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:matt@kindaiestimator.com" style="color:${BRAND.textDim};text-decoration:none;">matt@kindaiestimator.com</a>
    </p>
    <p style="margin:0 0 8px;color:${BRAND.textDim};font-size:12px;">
      ${customText || "Kindai Estimating Suite &middot; AI estimating software for Australian tradies"}
    </p>
    <p style="margin:0;color:#30363d;font-size:11px;">
      You received this because you signed up for the Kindai beta.
      To stop these emails, reply &ldquo;unsubscribe&rdquo; to <a href="mailto:matt@kindaiestimator.com" style="color:#30363d;text-decoration:none;">matt@kindaiestimator.com</a>.
      Kindai Pty Ltd &middot; Australia
    </p>`;
}

function minimalFooterHtml(): string {
  return `
    <p style="margin:0 0 4px;color:${BRAND.textDim};font-size:12px;">
      Powered by <a href="${BRAND.baseUrl}" style="color:${BRAND.orange};text-decoration:none;font-weight:600;">Kindai</a>
      &nbsp;&middot;&nbsp; AI Estimating for Australian Tradies
    </p>
    <p style="margin:0;color:#30363d;font-size:11px;">
      <a href="mailto:matt@kindaiestimator.com" style="color:#30363d;text-decoration:none;">matt@kindaiestimator.com</a>
    </p>`;
}

// ─── Reusable components ────────────────────────────────────────────────────

/** Branded CTA button (gradient hot pink → orange) */
export function brandedCta(text: string, url: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr><td align="center">
    <a href="${url}" style="display:inline-block;background:${BRAND.gradient};color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:50px;letter-spacing:0.5px;">${text}</a>
  </td></tr>
</table>`;
}

/** Branded info box (dark card with left accent border) */
export function brandedInfoBox(html: string, accentColor?: string): string {
  const accent = accentColor || BRAND.orange;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;border-radius:12px;border-left:3px solid ${accent};margin:24px 0;">
  <tr><td style="padding:24px 28px;">
    ${html}
  </td></tr>
</table>`;
}

/** Branded numbered step */
export function brandedStep(num: number, text: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0;">
  <tr>
    <td style="background:${BRAND.gradient};color:#ffffff;font-size:13px;font-weight:800;border-radius:50%;width:28px;height:28px;text-align:center;vertical-align:middle;min-width:28px;">${num}</td>
    <td style="padding-left:14px;color:${BRAND.textBody};font-size:15px;">${text}</td>
  </tr>
</table>`;
}

/** Standard heading style */
export function brandedH2(text: string): string {
  return `<h2 style="margin:0 0 20px;color:${BRAND.textWhite};font-size:24px;font-weight:700;">${text}</h2>`;
}

/** Standard body paragraph */
export function brandedP(text: string): string {
  return `<p style="margin:0 0 16px;color:${BRAND.textBody};font-size:16px;line-height:1.7;">${text}</p>`;
}

/** Signature block */
export function brandedSignature(name: string = "Matt Symons", title: string = "Co-founder, Kindai"): string {
  return `<p style="margin:24px 0 0;color:${BRAND.textMuted};font-size:14px;">
  &mdash; ${name}<br/>${title}
</p>`;
}
