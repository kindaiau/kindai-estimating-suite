# PR #27 review repair — 5 October 2026 (Adelaide)

## Current state

PR #27 was already merged when this repair began: merge commit `ae107b1aebea39a508911ed39bdbed2f24d65945`. The repair starts from main `bbccc29` and belongs in a follow-up PR. The reviewed P1 and high-severity defects were still present in that main revision. No merge or deployment is performed by this repair.

The settled Pro offer remains A$149/month and A$1,490/year including GST. No offer/catalogue prices or analytics amounts are changed. No dependency graph setting or CI workflow is changed; PR #28 and the later CI changes remain separate.

## Findings and changes

| Review finding | Repair | Regression evidence |
| --- | --- | --- |
| Paid PDF silently reduced to selected sheet (P1) | Upload reads current server-owned entitlement before preparation. Paid uploads retain all sheets even if a stale client supplies selectedPage. Free PDFs default to sheet 1 or extract the chosen sheet. | Router test loads the stored PDF and checks both paid pages and the selected free sheet; rejects an out-of-range free sheet. Browser checks paid/free sheet messaging. |
| Duplicate checkouts and permanently reused keys (high/P2) | One durable account attempt, serialized with the same user lock as reconciliation. Persist key and exact parameters before Stripe creation. Retry lost responses with that key; reuse open sessions, expire conflicts, rotate expired attempts, and permit a new attempt after a mapped subscription is canceled. Provider subscription checks catch pre-webhook payments; old untracked subscription sessions are expired before replacement. | Same-plan and conflicting-interval races, lost response, expiry, completed pre-webhook block, canceled resubscription, provider failure, and old-session cleanup. |
| Duplicate paid subscriptions silently ignored (high) | Raise an explicit retriable billing reconciliation error without consuming the event or overwriting the mapped subscription. No automatic cancellation/refund. | Duplicate-active event leaves mapping and ledger unchanged. |
| Unknown replacement restores prior paid tier (high) | Unknown replacement gets effective free tier. Grandfathered fallback applies only to the already-mapped legacy subscription. Match known lookup keys exactly. | Enterprise-to-unknown replacement stays free on repeat; same mapped active legacy price remains grandfathered. |
| Canceled legacy subscriptions retain tier-only access (high) | Terminal states get free tier while retaining the subscription ID for stale-event checks. | Canceled and incomplete_expired legacy states lose tier and retain mapping. |
| Local verification overwritten by auth (P2/medium) | Auth upsert and challenge confirmation share the account lock. Preserve verification only for unchanged account email; reset it on an unconfirmed address change. | Real DB upserts exercise unchanged, changed-unconfirmed and changed-confirmed addresses. |
| Stale editor after agent/text takeoff (medium) | Invalidate getWithLineItems and the dependent assurance cache in both callbacks. | Browser changes rows through both actions and observes canonical snapshot refetches at 375px and 1440px. |
| DECIMAL formatting creates spurious corrections (medium) | Compare numeric corrections by decimal value; retain text comparisons for description/unit. | Description-only edit creates no numeric correction entries. |
| Demo default rejected (medium) | Default demo submits only sample trade/pricing options. Custom drawings/descriptions/scope route to authenticated takeoff. Normalize prebuilt sampleItems to items, fixing a second sample execution defect exposed by the test. | Sample router succeeds without model calls; customer input remains unauthorized. Browser checks default payload. |
| Agent section dropped (medium) | Optional section travels through the validated item contract and add_line_item tool. | Real tool-calling router test preserves Upper floor; ordinary edit preserves Ground floor. |
| Legacy quote totals differ from reviewed rows (medium) | Issuance rejects noncanonical saved line subtotals or totals and requests Recalculate/review of the new saved version. | Half-cent legacy quote rejected without token; recalculate saves canonical version; stale issuance rejected; reviewed version has consistent snapshot. |
| Automatic tax lacks address handling (medium) | Tax-enabled subscription checkout collects and saves customer address. | Offline Stripe request test checks billing_address_collection and customer_update.address. |

## Validation

- Full Vitest with the explicit disposable local MariaDB integration opt-in: **407 passed, 5 skipped**, 28 test files passed and 3 skipped. Provider/model/payment/email calls are mocked. The skipped external integration tests are not production evidence.
- Secret scanner and diff whitespace check pass.
- TypeScript and production build pass; existing main bundle size warning remains.
- Mocked Chromium checks at **375px and 1440px**: adjustable pricing before scan, correct full-PDF/free-sheet UI, canonical editor refetch after agent and text takeoff, default demo sample-only payload. No page errors; takeoff page has no horizontal overflow.
- Reproduction: run the existing disposable database setup, then `KINDAI_LOCAL_DB_TESTS=1 corepack pnpm test`; run `corepack pnpm check` and `corepack pnpm build`. Start Vite at 127.0.0.1:5173 and run `CHROMIUM_PATH=<chromium executable> node scripts/check-pr27-review-ui.mjs`.
- Evidence: `docs/validation/pr27-review-tests.txt` and `docs/validation/pr27-review-ui.json`.

## Exact remaining merge/release blockers

This patch does **not** supply the required production-readiness evidence in `docs/unified-kindai-launch-evidence.md`. Under the owner's conditional instruction, stop before merging the follow-up and do not deploy.

1. **Stripe commercial evidence:** approved GST registration/product tax code/registrations and explicit automatic-tax setting; redacted monthly/yearly test-mode Checkout/invoice evidence confirming inclusive GST amounts and renewal periods, signed webhook delivery and legacy subscription preservation. Mock request tests do not satisfy this.
2. **Actual Cloudflare/runtime evidence:** origin/deployed commit, host/TLS and redirect rules for kindai.au/kindaiestimator.com, API/callback exclusions, auth/Xero allowlists and webhook destinations; rehearse domain consolidation on the real preview host.
3. **Processing and commercial accuracy:** account-specific provider retention/DPA/settings plus storage region/encryption/retention controls; licensed representative multipage plumbing/gas/hydraulic drawings, adjudicated truth and measured omission/quantity accuracy, latency and cost. Synthetic PDF preparation and this two-page regression are not model benchmarks.
4. **Migration/recovery rehearsal:** restored staging-clone migration and rollback evidence for prepared 0020, 0021 and new **0022_pending_checkout.sql**. They remain unregistered/unapplied to production. Drain old checkout workers before rollout; replay lost-session and duplicate-subscription scenarios. Monitor explicit duplicate-live errors and resolve billing incidents deliberately; no silent refund or subscription deletion.
5. **Other recorded acceptance gaps:** launch ZIP/layout fidelity remains unavailable; legacy issued-link reissue handling needs acceptance; pilot notification exactly-once guarantees remain unverified and are not changed here.
6. **Follow-up review/CI:** check the repair PR's actual head-specific GitHub validation and Secret Scan results. Local passes do not replace them. Any GitHub action_required/dependency-graph problem is separate from these application repairs and must not be represented as executed CI.
