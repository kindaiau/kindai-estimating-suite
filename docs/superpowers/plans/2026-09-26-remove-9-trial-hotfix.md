# Remove the A$9 Trial Hotfix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the A$9 / 21-day Pro trial from every production customer touchpoint and make the public checkout route unavailable.

**Architecture:** Apply a narrow patch to the current `main` branch rather than merging the larger market-reset branch. Remove the public trial UI, the tRPC mutation, the Stripe checkout helper, and dormant nurture references while preserving existing full-price subscription plans and the free demo.

**Tech Stack:** React, TypeScript, tRPC, Stripe, Vitest, Vite

**Spec:** Matthew Symons' instruction to remove the A$9 trial from KindAI.

## Global Constraints

- Do not merge the larger cabinet/plumbing market-reset branch as part of this hotfix.
- Do not change full-price subscription amounts.
- Do not create or modify Stripe products in the live account.
- Production deployment requires explicit approval after review.
- The source must contain no active A$9, Pro Trial, 21-day trial, trial checkout ID, or trial checkout mutation.

---

### Task 1: Add the Regression Gate

**Files:**
- Create: `server/trialRemoval.test.ts`

**Interfaces:**
- Consumes: repository TypeScript source under `client/src` and `server`
- Produces: a Vitest failure whenever retired trial language or identifiers reappear

- [ ] **Step 1: Write a failing source-scan test**
- [ ] **Step 2: Run `pnpm vitest run server/trialRemoval.test.ts` and verify it fails on current main**

### Task 2: Remove Trial UI, Email and Checkout Code

**Files:**
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/pages/Pricing.tsx`
- Modify: `client/src/pages/BetaExpired.tsx`
- Modify: `server/stripe/products.ts`
- Modify: `server/stripe/stripe.ts`
- Modify: `server/routers/billing.ts`
- Modify: `server/ebookEmail.ts`
- Modify: `server/ebook.test.ts`

**Interfaces:**
- Consumes: current full-price plans and existing `/pricing` and `/demo` routes
- Produces: full-price/demo CTAs with no public trial checkout path

- [ ] **Step 1: Remove trial-specific React state, forms, imports and copy**
- [ ] **Step 2: Remove the trial product constant, Stripe helper and tRPC mutation**
- [ ] **Step 3: Replace nurture CTAs with demo/pricing actions**
- [ ] **Step 4: Run the regression test and affected email tests**

### Task 3: Verify and Open a Small PR

**Files:**
- Test: full repository

**Interfaces:**
- Consumes: completed hotfix
- Produces: a reviewable GitHub PR based directly on `main`

- [ ] **Step 1: Run `pnpm check`**
- [ ] **Step 2: Run `pnpm test`**
- [ ] **Step 3: Run `pnpm build`**
- [ ] **Step 4: Scan the production bundle for retired trial terms**
- [ ] **Step 5: Commit, push and open the hotfix PR**
- [ ] **Step 6: Stop before merge/deployment and request explicit production approval**
