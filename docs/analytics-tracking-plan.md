# Analytics Tracking Plan

Kindai analytics should help the team make product and marketing decisions without recording raw visitor sessions or collecting unnecessary personal data.

## Setup

Recommended setup for product decisions is Umami or Plausible. Cloudflare Web Analytics is still useful for traffic and performance, but it does not receive the custom product events listed below.

Configure Umami with:

```bash
VITE_ANALYTICS_WEBSITE_ID=your-website-id
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
```

If the tracker script is hosted at a custom path, set:

```bash
VITE_ANALYTICS_SCRIPT_URL=https://analytics.example.com/script.js
```

Configure Plausible with:

```bash
VITE_PLAUSIBLE_DOMAIN=kindaiestimator.com
VITE_PLAUSIBLE_SCRIPT_URL=https://plausible.io/js/script.js
```

If the live host already injects a compatible tracker, leave `VITE_ANALYTICS_ALLOW_EXISTING_TRACKERS=true`. This lets Kindai send the same privacy-filtered product events to an existing `window.umami` or `window.plausible` tracker.

Set `VITE_ANALYTICS_DISABLED=true` to disable client analytics.

## Privacy Rules

- Do not send names, emails, phone numbers, addresses, filenames, URLs, tokens, quote links, client identifiers, or uploaded document details.
- Track funnel steps, counts, booleans, trade, state, plan tier, quote value totals, confidence scores, and non-sensitive error categories.
- Use session replay only after sensitive field masking is verified. It is not part of the default setup.

The client analytics helper drops risky property keys before events leave the browser.

## Core Questions

- Which acquisition channels bring serious Australian trade users?
- Which CTAs move visitors to pricing, demo, beta, or signup?
- Which plans get clicked most often?
- Where do users fail in upload, AI takeoff, quote generation, PDF export, and quote acceptance?
- How often do assurance checks block risky quotes?
- Which trades and states produce the highest engagement?

## Events

| Event | Purpose |
| --- | --- |
| `pricing_viewed` | Pricing page demand and campaign quality |
| `pricing_plan_clicked` | Plan interest by tier and billing interval |
| `checkout_started` | Paid conversion start |
| `enterprise_contact_clicked` | Enterprise intent |
| `beta_viewed` | Beta landing traffic |
| `beta_form_started` | Form engagement |
| `beta_signup_submitted` | Lead submission attempt |
| `beta_signup_succeeded` | Lead conversion |
| `beta_signup_failed` | Form/server friction |
| `demo_viewed` | Demo traffic |
| `demo_trade_selected` | Trade demand |
| `demo_plan_uploaded` | Demo upload engagement |
| `demo_takeoff_started` | Core product activation |
| `demo_takeoff_succeeded` | Demo success |
| `demo_takeoff_failed` | Demo failure mode |
| `ai_takeoff_viewed` | Logged-in takeoff page usage |
| `ai_takeoff_trade_selected` | Logged-in trade demand |
| `ai_takeoff_file_uploaded` | Upload success |
| `ai_takeoff_started` | Takeoff activation |
| `ai_takeoff_succeeded` | Takeoff success |
| `ai_takeoff_failed` | Takeoff friction |
| `quote_send_clicked` | Quote sending intent |
| `quote_send_succeeded` | Quote link generated |
| `quote_send_failed` | Quote send failure |
| `quote_pdf_clicked` | Export intent |
| `quote_pdf_succeeded` | PDF export success |
| `quote_pdf_failed` | PDF export failure |
| `quote_assurance_blocked` | Risk control doing its job |
| `quote_link_viewed` | Client quote portal views |
| `quote_response_submitted` | Client accepted/declined outcome |

## Dashboard Views To Build

- Visitor acquisition: source, medium, campaign, landing page.
- Marketing funnel: home/pricing/demo/beta to lead or checkout.
- Product activation: upload to takeoff started to takeoff succeeded.
- AI reliability: takeoff success rate, failure reasons, average confidence, average item count.
- Commercial workflow: quote send, PDF export, assurance blocks, quote acceptance.
- Market demand: trade and state breakdowns.
