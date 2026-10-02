# Domain migration — prepared, not applied

No hosting-layer redirect configuration for the active React/Vite/Express deployment was found. `docker/Dockerfile` starts the separate Python/FastAPI stack, not this Node application. `.github/workflows/ci.yml` validates code but does not establish which hosting service serves kindai.au. Applying an Express catch-all or inventing a Vercel file would not satisfy a real hosting-layer migration.

Source inventory:

- Browser routing: `client/src/App.tsx` retains existing project/estimate, billing, login, quote acceptance, privacy and legacy campaign paths.
- Manus callback: `/api/oauth/callback`, registered in `server/_core/oauth.ts`; redirect URI depends on the browser origin (`client/src/const.ts`). Session cookies do not automatically migrate between domains.
- Supabase: email confirmation returns to `${window.location.origin}/onboarding` in `client/src/contexts/SupabaseAuthContext.tsx`. Both origins must be configured in the provider while transitioning.
- Xero: `/api/xero/callback` exchanges using the original origin carried in base64-encoded state (the callback does not verify a signature). Do not redirect in-flight callback requests. The unverified state/user mapping requires a separate OAuth security fix before enabling or migrating Xero.
- Stripe: `/api/stripe/webhook` receives a raw signed body before JSON middleware. Keep the old webhook endpoint alive until the new destination is configured and tested. Do not send HTTP301 for webhook POSTs.
- Existing source references include `kindaiestimator.com`, `kindaibook-55hbndtb.manus.space`, and historical `kindai.com.au`. Source references alone do not establish domain ownership or the active CDN.

Required hosting-layer rule contract, once host ownership/TLS and callbacks are verified:

1. Match only explicitly approved old hosts; never build Location from arbitrary Host headers.
2. Redirect browser GET/HEAD navigation with HTTP301 to `https://kindai.au` plus the original path and original query bytes.
3. Exclude `/api/*`, provider callbacks, webhook routes and non-GET/HEAD methods during transition. Keep their current handlers available until providers are moved and verified.
4. Preserve `/quote/accept/:token`, `/swms/sign/:token`, `/estimates/:id`, `/projects/:id`, `/login?next=...`, and checkout success/cancellation query parameters.
5. Do not redirect requests already at kindai.au; prevent loops. Do not replace legacy paths with the homepage.

Verification cases to run against a **preview of the actual CDN/host configuration** (not performed on live domains):

| Request | Required result |
| --- | --- |
| GET old-host `/estimates/42?tab=items` | 301, Location `https://kindai.au/estimates/42?tab=items` |
| GET old-host `/login?next=%2Festimates%2F42` | 301, identical encoded query |
| GET old-host `/quote/accept/test-token?a=1&a=2` | 301, same path and duplicate query parameters |
| GET old-host `/api/oauth/callback?code=test&state=test` | Existing callback, no migration redirect |
| POST old-host `/api/stripe/webhook` | Existing raw-body signature handler, no redirect |
| GET kindai.au `/pricing` | No migration redirect |
| GET unknown-host `/pricing` | No rule match |

Evidence still required: hosting/CDN provider and config repository, domain ownership and TLS coverage, active deployment commit, provider callback allowlists (redacted), cookie configuration, Stripe webhook destination/signature-delivery evidence, and the signed-off list of old hosts. No DNS, redirects or deployments were changed.
