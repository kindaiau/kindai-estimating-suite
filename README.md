# Kindai Estimating Suite

AI-assisted estimating and quoting software for Australian trades and joinery teams.

## What this repo contains

- React + Vite frontend in `./client`
- Express + tRPC backend in `./server`
- Drizzle schema in `./drizzle`

## Current product status

### Production-ready core

- Authentication and session handling
- Projects, estimates, line items, materials, labour rates
- Quote PDF generation and quote acceptance links
- Billing plans and Stripe checkout / customer portal wiring
- Trade profiles, suppliers, quote follow-ups, variations

### Beta / operationally dependent

- AI takeoff and AI-assisted content generation
- Storage-backed artefacts and PDF upload flows
- Email delivery and CRM integrations

### Partially exposed / roadmap

- Team management API is mounted, but there is no dedicated frontend workflow yet
- Tender management and audit log schema exist, but there is no user-facing UI in this repo

## Local development

### Prerequisites

- Node.js 24+
- Corepack enabled
- MySQL-compatible database

### Setup

1. Copy `.env.example` to `.env`
2. Fill in at least the startup-required variables:
   - `VITE_APP_ID`
   - `JWT_SECRET`
   - `OAUTH_SERVER_URL`
   - `DATABASE_URL`
3. Enable pnpm:

```bash
corepack enable
corepack prepare pnpm@10.4.1 --activate
```

4. Install dependencies:

```bash
pnpm install
```

5. Start the app:

```bash
pnpm dev
```

## Quality gates

Run these before merging:

```bash
pnpm check
pnpm test
pnpm build
```

## Deployment notes

- Startup now validates required auth and database environment variables
- Readiness is exposed at `GET /healthz`
- Optional features report as not ready when their env vars are missing
- Stripe webhooks must be registered at `/api/stripe/webhook`
- Storage currently depends on Forge proxy credentials configured via environment variables

## Investor / diligence notes

- CI runs install, typecheck, tests, build, and dependency review on pull requests
- This repo intentionally documents shipped vs partial features to avoid overstating readiness
- The app is demoable today, but some enterprise workflows still need frontend completion and operational hardening

## Known limitations

- No dedicated frontend for team management, tenders, or audit log review yet
- Build artefact size warnings still need bundle-splitting work
- AI, storage, and email features depend on external service credentials
