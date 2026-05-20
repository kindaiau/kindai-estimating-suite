# Kindai Estimating Suite Agent Rules

## Product Direction

Build one vertical AI SaaS platform for multiple trades. Do not create separate apps for each trade. Extend the shared backend, shared dashboard, shared CRM, shared AI layer, shared auth, and shared email system.

## Architecture Rules

- Keep industry-specific behavior in `config/industries/`.
- Use industry config for prompts, labels, workflows, onboarding copy, estimate templates, dashboard widgets, and landing-page messaging.
- Prefer reusable routers, components, hooks, and utilities over one-off page logic.
- Keep customer-owned integrations customer-owned. Do not hardcode Matthew's Xero, ServiceM8, supplier, or customer credentials.
- Use Resend for transactional email paths: auth support, onboarding, quote delivery, follow-ups, notifications, and CRM communication.
- AI may draft, label, summarize, and prepare follow-ups. AI must not send quotes, delete records, or contact customers without an explicit approved action.

## Code Quality

- TypeScript must stay strict.
- Validate inputs with Zod at API boundaries.
- Use tRPC/React Query for server state.
- Use Zustand only for lightweight client UI state.
- Keep UI accessible: clear labels, keyboard-friendly controls, readable contrast, and large click targets.
- Build calm, low-cognitive-load product UI. Avoid decorative complexity.
- Comments should explain non-obvious business rules only.

## Delivery Rules

- Audit existing implementation before rebuilding.
- Extend current estimator workflows where they already work.
- Run `corepack pnpm check` before handoff.
- Run targeted tests and `corepack pnpm build` when changing backend or route behavior.
- Missing external credentials should produce safe fallback behavior, not block the local app.
