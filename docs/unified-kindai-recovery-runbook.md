# Recovery and migration runbook — prepared, not executed in production

## Deployment prerequisites

Read `AGENTS.md`, `docs/unified-kindai-audit.md`, and `docs/unified-kindai-launch-evidence.md`. Capture the deployment commit, schema version, backup restore proof and owner-approved maintenance window. These are required operational inputs, not completed work. No production SQL, DNS, deployments, provider calls or payment calls were performed during this change.

`drizzle/0020_unified_kindai.sql` and `drizzle/0021_recovery_and_integrity.sql` are reviewable, forward-only SQL proposals. They are deliberately not registered as automatically applied migrations in the Drizzle journal. Inspect the real schema before choosing the migration mechanism; do not run schema push. Rehearse on an isolated restored copy, compare row counts and existing subscription IDs/prices, and verify rollback by restoring that copy. The local tests build a disposable database from the updated schema; they do not prove migration compatibility with production.

Stop new submissions and drain existing takeoffs before migration. Apply 0020 only if not already present, then 0021 through the approved migration process. Existing jobs receive an expired lease; their request hashes and lifetime claims remain. Old job payloads remain null: original callers may resubmit the identical request, but the recovery UI cannot reconstruct missing inputs. Never reset lifetime claims just to retry a scan.

Historical quote snapshots remain null. Do not backfill them from today's mutable estimate: that would fabricate the originally offered price. Existing public links will require contractor reissue before review/acceptance. Preserve accepted/declined records and archived PDFs for reconciliation. Review this compatibility impact before rollout.

Roll back application code only to a version compatible with the expanded schema. Do not drop new tables/columns containing quotes or audit history. If restoration is required, first capture post-migration changes and follow the approved restore/reconciliation procedure; no destructive rollback script is supplied.

## Interrupted takeoff recovery

Each attempt reserves a 30-minute lease in `takeoff_jobs`. `beginTakeoff` locks the user, checks the original request hash and estimate version, and permits only one replacement attempt after lease expiry. `completeTakeoff` verifies the attempt number, running state and unexpired lease under a transaction before committing items, original AI evidence, totals and completion. `failTakeoff` is fenced by attempt number. Late workers cannot persist into a newer attempt.

The signed-in user's Recent scans panel on `/ai-takeoff` retrieves only their jobs and original payloads. A completed job opens its saved estimate. A failed or expired attempt retries the same ID and payload; at most three attempts are allowed, including the initial attempt. Active leases disable retry. Keep the free-user claim even when all attempts fail. Support can inspect job ID, status, attempts, estimate/version and timestamps without copying blueprint URLs or model output into logs.

A lease is a persistence guard, not cancellation of a provider request. A timed-out provider call may still finish or incur cost; retry is never advertised as exactly-once provider billing. Jobs exceeding 30 minutes cannot save and need retry/support. After an interrupted deployment, wait for lease expiry; do not manually mark active jobs completed. After three failures, investigate provider availability and the input, then establish an explicitly reviewed support resolution. Human edits made during a takeoff cause a version conflict; preserve those edits and resolve deliberately rather than resetting the version.

## Legacy email verification

Legacy accounts stay unverified until the account's stored email receives and confirms an eight-digit Resend code. No blanket backfill or email-based account merge is performed. Codes expire after ten minutes, permit five guesses, and can be requested once per minute, at most five times per 24-hour window. Challenge and email verification writes are transactional; wrong guesses commit their counter. A changed account email invalidates the challenge. Configure and verify the Resend sender before staging this flow. Missing email delivery fails closed. Existing paid users keep their subscription access.

## Issued quotes

`sendQuote` checks ownership and expectedVersion, locks the estimate, computes the existing authoritative pricing result and records immutable items, totals, version and sender details in the token's snapshot. It supersedes only pending/viewed links. Accepted/declined history stays intact. Public review reads the snapshot; response transitions serialize under the token lock. Later estimate edits represent later work and cannot alter the issued snapshot. The estimate PDF endpoint remains version-checked and uses the same pricing module. The public issued-link UI does not offer an archived PDF download; use archived issued artifacts when required for historical evidence.

## Stripe events

Entitlement updates retrieve current subscription state while holding the account row lock; they never infer status from an old invoice payload. Event ID and entitlement writes commit together. An unavailable provider/database causes a retryable webhook failure. Old subscriptions cannot change the current subscription. A new checkout can replace a terminated subscription only when the provider confirms the incoming subscription is newer. Legacy price tiers are retained; unknown new price mappings fail closed.

Exercise duplicate, delayed and reversed deliveries in Stripe test mode during staging (not done here). Verify checkout-before-update and update-before-checkout recovery, cancellation, failed payment then recovery, and historical subscription events. Existing pilot notification side effects remain outside the entitlement ledger; exactly-once pilot email delivery is not guaranteed. Meta uses the stable checkout event ID. Do not replay events through production to test this change.

## Xero

Configure `PUBLIC_APP_ORIGIN` and the exact `/api/xero/callback` allowlist before rollout. Each OAuth request creates a ten-minute opaque state, stored hashed and bound to the initiating browser's HttpOnly SameSite=Lax cookie. The callback atomically consumes the state before any token exchange, rejects forged/expired/replayed states, and writes only the recorded user's connection. In-flight old base64 states fail closed and require reconnecting from Settings. Do not redirect callback routes during domain migration. Expired state rows and email challenges may be deleted by an approved housekeeping job; no scheduler was deployed here.
