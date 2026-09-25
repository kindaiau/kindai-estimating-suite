# Premium Pricing Copy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make KindAI’s pricing and feature copy accurate, premium, and aligned with the plans the checkout system actually bills.

**Architecture:** Treat `server/stripe/products.ts` and enforced upload validators as the product truth. Align public pricing, feature pages, help copy, and structured metadata to those values without changing prices or billing behaviour.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Stripe product catalogue.

**Spec:** Live Scrapling audit from 24 September 2026 plus verified repository implementation on 26 September 2026.

## Global Constraints

- Do not change Stripe prices, checkout behaviour, subscriptions, or product entitlements.
- Present KindAI as a premium estimating system, not a cheap alternative.
- Use the implemented plan ladder: A$149 Sole Tradie with 1 user, A$450 Pro with 5 included users, A$1,499 Mid-Tier Builder with 20 included users, custom Enterprise with unlimited users.
- State the enforced plan-file limit as 32MB per file and up to 50 pages per job.
- Do not claim unlimited users where plans have included-user limits.
- Do not compare currencies as if they are equivalent.
- Keep AI outputs framed as review-ready drafts, not guaranteed final estimates.

---

### Task 1: Align public pricing and value positioning

**Files:**
- Modify: `client/src/pages/Pricing.tsx`
- Modify: `server/stripe/products.ts`
- Modify: `client/src/components/StructuredData.tsx`

**Interfaces:**
- Consumes: Product prices and limits from `PLANS` in `server/stripe/products.ts`.
- Produces: Accurate public plan cards, feature descriptions, FAQ answers, metadata, and premium CTA copy.

- [ ] **Step 1: Add copy-regression assertions**

Create a Vitest source consistency test that asserts the public pages contain 32MB, A$450, 5 included users, and 20 included users, while excluding 50MB, A$499, “No seat limits”, and KindAI “unlimited users” claims.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `corepack pnpm vitest run client/src/pages/pricingConsistency.test.ts`

Expected: FAIL against the current contradictory copy.

- [ ] **Step 3: Rewrite pricing copy**

Use outcome-led language about quote capacity, margin protection, company-specific pricing logic, team consistency, and estimator-level leverage. Reduce emphasis on low entry cost. Show included users directly in each plan.

- [ ] **Step 4: Align structured data and product descriptions**

Ensure JSON-LD and Stripe catalogue descriptions use the same plan names, prices, and premium positioning.

- [ ] **Step 5: Run the focused test and verify it passes**

Run: `corepack pnpm vitest run client/src/pages/pricingConsistency.test.ts`

Expected: PASS.

### Task 2: Align supporting feature and help copy

**Files:**
- Modify: `client/src/pages/CabinetJoinery.tsx`
- Modify: `client/src/pages/Help.tsx`
- Test: `client/src/pages/pricingConsistency.test.ts`

**Interfaces:**
- Consumes: The same 5-user Pro limit and 32MB upload limit.
- Produces: Consistent feature-page and help-page claims.

- [ ] **Step 1: Replace unlimited Pro team-access claim**

Change the cabinet feature page from unlimited Pro users to 5 included users.

- [ ] **Step 2: Clarify upload and speed claims**

Keep 32MB per file and up to 50 pages per job. Scope the 60-second promise to straightforward plans and describe larger sets as multi-minute workflows.

- [ ] **Step 3: Run repository checks**

Run: `corepack pnpm check`

Expected: PASS.

Run: `corepack pnpm test`

Expected: PASS.

Run: `corepack pnpm build`

Expected: PASS.

### Task 3: Review and delivery

**Files:**
- Review all modified files.

**Interfaces:**
- Consumes: Verified code changes and test results.
- Produces: One reviewable branch and pull request; no deployment.

- [ ] **Step 1: Search for residual contradictions**

Run repository searches for `50MB`, `A$499`, `No seat limits`, `unlimited users`, and the old cabinet-team claim.

- [ ] **Step 2: Review the diff for unapproved commercial changes**

Confirm no actual price, entitlement, Stripe, or checkout logic changed.

- [ ] **Step 3: Commit and push the branch**

Commit only the verified copy, regression test, and plan document. Push the branch and create a pull request for review.
