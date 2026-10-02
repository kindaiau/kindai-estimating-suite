# Marketing asset review — draft, not published or sent

The supplied scripts are targeting input, not deployment evidence. Preserve the original implementation constraints: React/Vite, one lifetime sheet per verified user, one new-sales Pro subscription, and no production actions in this task.

## Contractor-risk script

“On a commercial plumbing package, a missed item matters. I’m Matthew Symons. After 20 years operating GetGas in Adelaide, I wanted a clearer path from a drawing to a quote I could review and stand behind. Kindai brings the takeoff, your corrections, trade rates and GST-ready quote into one workflow. Start with one drawing-sheet scan free—no credit card. Check the draft quantities, rates and exclusions before you quote.”

Do not publish the proposed 3–5% industry error statistic without an attributable study, its population/methodology and a reason it applies to Australian hydraulic takeoff. 3–5% of $1.5m is $45k–$75k arithmetically, but that does not prove an equivalent loss of profit or that Kindai prevents it.

## Time-value script

“If quoting takes eight hours of your week, what would less time at the kitchen table mean? At an illustrative $95 an hour, those hours represent about $3,293 a month of time value. Kindai helps you move from a drawing through a reviewed takeoff to a branded GST quote. Adjust the time-saving assumptions on kindai.au to suit your own workflow. Your first drawing-sheet scan is free, with no credit card.”

This values all eight assumed hours; it is not the claimed saving. At an illustrative 30% reduction, the corresponding value is $988/month. Formula: hours/week × assumed saving fraction × $95 × 52/12. Do not call $95 the established national charge-out rate without a source. Do not promise 85% reduction, 60-second turnaround, perfect counting or guaranteed tender margins.

## Website stat blocks

- “Your time, valued clearly”: interactive assumptions at A$95/hour, 52/12 weeks/month. Label illustrative time value.
- “Your review stays in control”: edit quantities and rates, with saved revisions and correction history.
- “One quote workflow”: upload one sheet, review the takeoff, apply rates, export a branded GST-ready PDF with Pro.

## Privacy claims requiring evidence

| Supplied claim | Current evidence | Evidence required before advertising |
| --- | --- | --- |
| ZDR, no caching or training | Source selects OpenAI or Forge; provider contracts/settings unavailable | Provider-specific ZDR approval, endpoint eligibility, retention/training contract, logging policy |
| Free files purged within ten minutes | Uploads persist through storagePut; no such lifecycle job found | Object lifecycle + DB/job cleanup design and timed deletion/backup tests |
| DB row-level security | Drizzle/MySQL application ownership checks | Actual DB policy/control configuration and cross-tenant tests; do not call app checks RLS |
| AES-256 rate-book encryption | No deployed DB/storage encryption evidence | Provider encryption/KMS config, key-management and backup scope documentation |
| Isolated sandbox for every drawing | Not established by this pipeline | Runtime isolation topology, controls and verified threat model |

The privacy-page change is draft code. Existing legal entity, deletion and privacy commitments still need owner/legal and operational review; no compliance certification is implied.

## Revised seven-day sequence (gated, not scheduled)

1. Identify the real hosting/CDN layer and approve preserved-path redirect rules. Verify TLS/callbacks in staging. Do not introduce Next.js or redirect all paths to `/estimator`.
2. Obtain provider/storage/retention documentation and reconcile privacy text. No unsupported ZDR/RLS/encryption claim.
3. Confirm whether stated Pro prices include GST; confirm Stripe Tax behavior. Review mocked webhook tests and historical-subscription preservation before any live setup.
4. Validate verified-user free-sheet selection, quota races and failed-job recovery in staging. IP limits may supplement abuse prevention; they do not replace identity quota.
5. Prepare personal outreach drafts for smaller contractors. Send only when separately instructed and launch gates have passed.
6. Prepare commercial outreach using review/accountability language rather than guaranteed error prevention. Do not send or launch ads in this task.
7. Offer a walkthrough using a customer-authorized project or synthetic example. Obtain permission before accessing/sharing drawings or recording any identifiable client information. Do not promise perfect counts or silently intercept uploads.

No messages, campaigns, Loom recordings, live Stripe changes or deployments were performed.
