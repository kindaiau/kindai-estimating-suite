# Kindai Estimating Suite Architecture

## Current Stack

The current production app is React + Vite, Express, tRPC, Drizzle, MySQL-compatible persistence, Supabase Auth, Resend, Stripe, and the existing AI abstraction in `server/_core/llm.ts`.

The requested long-term target is Next.js 15, Supabase/PostgreSQL, Vercel, OpenAI SDK, Zustand, React Query, ShadCN UI, and TailwindCSS. This implementation extends the existing app first because it already contains the working estimator, quote, PDF, auth, dashboard, Resend, and trade-profile infrastructure.

## Core Model

Kindai is one centralized SaaS platform:

- One backend
- One dashboard
- One CRM
- One AI orchestration layer
- One authentication system
- Multiple trade-specific experiences through config

Trade-specific behavior lives in `config/industries/`.

Initial industries:

- `cabinet-makers`
- `electricians`

Future industries should be added by creating a new config file and registering it in `config/industries/index.ts`.

## AI Agents

### Acquisition Agent

Owns lead capture, lead scoring, qualification, source tracking, spam filtering, and attribution.

### Conversion Agent

Owns the CRM pipeline, quote/proposal drafts, reminders, AI follow-up drafts, and estimate handoff.

Pipeline stages:

- New Lead
- Qualified
- Quote Sent
- Follow-Up
- Won
- Lost

### Delivery Agent

Owns project onboarding, delivery tasks, workflow tracking, document generation, variations, and handover.

## Database

Existing estimator tables remain the source of truth for projects, estimates, line items, trade profiles, materials, labour, quote tokens, and follow-ups.

The SaaS layer adds:

- `organizations`
- `crm_leads`
- `crm_activities`
- `business_tasks`
- `delivery_projects`
- `automation_logs`
- `analytics_events`
- `prompt_templates`

Migration:

- `drizzle/0019_vertical_saas_platform.sql`

## Email

Resend is centralized through:

- `server/resendSender.ts`
- `server/email/templates.ts`

Email categories:

- Authentication support/welcome
- Onboarding
- Quote delivery
- Quote follow-up
- CRM notifications

## Frontend Routes

Public:

- `/cabinet-makers`
- `/electricians`

Protected:

- `/onboarding`
- `/dashboard`
- `/crm`
- `/estimator`
- `/automations`
- `/analytics`
- `/project-dashboard`

Existing estimator routes remain available:

- `/ai-takeoff`
- `/projects`
- `/materials`
- `/labour`
- `/trade-profiles`
- `/followups`
- `/settings`
- `/accuracy`

## Deployment

Current app deploys as a Vite frontend and bundled Express server. A future Vercel/Next.js migration should preserve the same domain model and routers, then move route handlers and server actions incrementally rather than rebuilding product logic.

## Future Trade Addition

1. Add `config/industries/<industry>.ts`.
2. Register it in `config/industries/index.ts`.
3. Add landing route.
4. Add estimate template rows/material defaults where needed.
5. Add tests for config and estimator fallback behavior.
6. Add SEO copy and lead form attribution.
