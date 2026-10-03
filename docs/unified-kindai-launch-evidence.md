# Launch evidence, 2026-10-03 UTC

Classification: **NOT READY**. The code changes and local checks below are complete; commercial acceptance and runtime evidence are outstanding. No production configuration is inferred from source defaults.

## A. Engine and deployment

Provider routing remains documented in `unified-kindai-audit.md`: OpenAI requires its key, media, no supplied tools and no function/tool messages; otherwise Forge/Gemini is selected. There is no automatic OpenAI error fallback. Source defaults do not establish deployed models, account data policies or throughput.

Read-only public evidence: `kindai.au`, `kindaiestimator.com` and `www.kindaiestimator.com` resolved to Cloudflare-addressed IPs. HTTPS requests returned 403 in this workspace. `www.kindai.au` did not resolve here. The connected Vercel team listed **zero projects**. These results do not identify the origin hosting provider, prove TLS/callback coverage, or validate redirect rules. No live configuration changed. The exact route/callback inventory and proposed migration contract remain in `unified-kindai-domain-migration.md`.

Public provider documents inspected:

- [OpenAI data controls](https://platform.openai.com/docs/guides/your-data): API inputs are not used for training by default, but abuse-monitoring retention and Responses application-state retention are distinct. ZDR/MAM need approval and account/project configuration; image/file exceptions and model-specific caching constraints exist. The current Responses payload does not explicitly set `store:false`. No account-level ZDR evidence was available. Do not publish a ZDR claim.
- [Google Gemini API terms](https://ai.google.dev/gemini-api/terms), effective March 23, 2026: paid and unpaid services have materially different data-use terms. Paid-service terms still describe limited safety logging. Kindai's Gemini request goes through **Forge**, so direct Google terms do not establish the Forge account's contractual handling.
- [Manus privacy page](https://manus.im/privacy): accessible extraction returned only its title, not substantive retention terms. A Forge-specific DPA, subprocessor list, retention/deletion policy and account contract are still required.

Required deployment evidence: deployed commit/container digest; non-secret provider/model selections; account/project retention approval and settings; hosting origin/CDN rules export; TLS host coverage; Manus/Supabase/Xero allowlists; Stripe webhook destinations and signature-test evidence; storage retention/encryption/region controls. Do not provide credentials or raw customer drawings in evidence logs.

## B. Contractor correction loop and recovery

The prior patch established transactional owned add/edit/delete, exact scaled-integer pricing, audit history, version conflicts, canonical React Query updates and versioned PDF snapshots. This follow-up adds:

- `server/takeoffJobs.ts`: 30-minute attempt leases, fenced completion/failure and bounded retry; `routers/ai.ts` exposes owned recent jobs; `RecoverTakeoff.tsx` resumes original payloads.
- `server/routers/emailVerification.ts` and `VerifyAccountEmail.tsx`: verified legacy-account email via Resend codes, rate/guess limits, expiry and replay rejection. No identity/account merging.
- `server/routers/quoteTokens.ts`: owned version-checked immutable issued snapshots, transactional issue/response and preserved accepted/declined history. Legacy links require deliberate reissue.
- `server/stripe/reconcile.ts`: locked authoritative provider reconciliation plus transactional event ledger, without rewriting historic Stripe prices.
- `server/xeroState.ts`, `routers/xero.ts`, `routes/xeroCallback.ts`: expiring, one-use, browser-bound opaque callback state and configured origin.

Quote item/rate changes still use `estimateEdits.ts` and `estimatePricing.ts`. The issued snapshot is an archival record, not a competing editable quote or calculation engine. Original AI evidence remains untouched.

## C. Launch gaps and evidence still required

| Priority | Finding / evidence | Scenario and smallest next action | Reproducible acceptance check |
|---|---|---|---|
| High | GST/Stripe Tax configuration unavailable | A$149 could be displayed incorrectly relative to checkout. Owner/accountant must state inclusive or exclusive, confirm GST registration, product tax code, registrations and automatic-tax setting; supply redacted Price/Checkout/Tax configuration. Checkout remains blocked until explicit settings exist. | Stripe test-mode monthly/yearly invoice matches approved tax treatment, 14900/149000 base amounts, total and renewal period; legacy subscriptions unchanged. |
| High | Commercial benchmark unavailable | Dense vector drawings may omit fixtures or misread scale. Provide licensed representative multi-page hydraulic/gas/plumbing drawings, adjudicated takeoff truth and permission/budget for benchmark model runs. | Measure fixture precision/recall, quantities/units, omissions, per-sheet and end-to-end p50/p95 latency, failure rate and cost; record model/version, sheet selection, revisions and reviewer corrections. Do not translate synthetic preparation timings into AI promises. |
| High | Real hosting and retention terms unverified | Incorrect redirects lose callback sessions; unsupported privacy assurances misstate processing. Obtain the deployment and provider documents listed in A; rehearse the actual host rules before approval. | Preview tests in domain inventory preserve paths/queries and exclude APIs/callbacks; provider agreements match every active processor and storage location. |
| Medium | Migration compatibility needs rehearsal | Existing issued links have no historical snapshot; old interrupted jobs have no stored payload. Rehearse migration/restore and agree on reissue/support handling. | Restored staging copy preserves rows, accepted history, subscription IDs/prices and free claims; null snapshots cannot be accepted as current mutable quotes. |
| Medium | Lease does not cancel provider execution | An old request can finish after expiry or incur provider cost. Monitor timeouts and follow recovery runbook; do not promise exactly-once external execution. | Expired worker fails to persist, new attempt commits once, late failure cannot overwrite it. Verified locally. |
| Medium | Legacy pilot email side effects not exactly-once | Retried pilot checkout may send another notification. Add a provider-idempotent outbox before extending pilot notification guarantees. | Duplicate delivery produces one externally accepted email with stable idempotency key; not verified here. |

Launch ZIP: the newly supplied `Pasted text.txt` repeats the brief. No ZIP was attached or found among accessible Drive ZIP files. Layout fidelity to the launch asset remains unverified.

## D. Validation and minimum remaining action

Local validation on this follow-up:

- TypeScript check passes; production build passes with the existing large-main-chunk warning (~519 KB gzip).
- Full Vitest: **384 passed, 5 skipped**, 26 files passed and 3 skipped. Focused disposable MariaDB suite: **26 passed**, including expired-attempt races/fencing, immutable issue/acceptance, Xero replay/browser/expiry, legacy code verification and Stripe duplicates/out-of-order failures/rollback. Provider/email/payment behavior uses mocks.
- Browser checks at **375px and 1440px**: homepage ROI/keyboard skip link; editing canonical totals and conflict draft preservation; export disabled during drafts; keyboard email-code confirmation; retry preserves original submission ID and displays provider errors. No horizontal overflow or JS errors in these mocked scenarios. Evidence: `docs/validation/recovery-ui.json` and existing UI artifacts.
- `scripts/benchmark-plan-preparation.ts`: synthetic 50-page vector PDF, 2,000 lines/page, selected sheet 37; five runs 4–12 ms locally, output one page. This tests PDF preparation only, not commercial drawing interpretation. `pdf-preparation-benchmark.json` records bytes and process peak RSS including fixture generation.
- Secret scanner passes. No production SQL migration was applied. The newly prepared migration's execution against an existing production-schema clone remains unverified.

Highest priorities before launch: approve and verify commercial GST/Stripe configuration; complete representative model benchmarks and provider retention evidence; rehearse migrations/recovery and redirects on the actual host. The exact operational steps are in `unified-kindai-recovery-runbook.md`. No readiness claim, live deployment, DNS change or merge is made.
