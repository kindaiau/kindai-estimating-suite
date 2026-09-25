# Founding Workflow Setup SOP

**Purpose:** Deliver one paid cabinet or joinery workflow setup, prove repeat use on two real jobs, and record a clear continue, repair or stop decision.  
**Owner:** Matthew Symons  
**Trigger:** An applicant is approved and the A$2,750 including-GST payment is confirmed by Stripe webhook.  
**Offer version:** `founding_pilot_setup_sprint / 1.0-draft`  
**Version:** 1.0 — 26 September 2026

---

## 1. Inputs and Prerequisites

- Applicant is an Australian cabinet-making or commercial-joinery decision-maker.
- Administrator has approved the application and fixed scope.
- Customer has accepted the human-review, privacy, input and refund terms.
- Checkout was created by an administrator for the approved application.
- Payment amount, currency, customer email, offer ID and metadata were validated by webhook.
- Customer has one named reviewer, two representative jobs, up to 150 price-book rows and no more than 20 written rules.
- Each source file is a supported PDF, JPG or PNG and no larger than 32MB.
- Production has passed application, email, admin approval, checkout, webhook, access, upload, generation, correction and export smoke tests.

## 2. Qualification and Approval

Accept only when all answers are yes.

| Criterion | Required answer |
|---|---|
| Trade | Cabinet making or commercial joinery |
| Authority | Applicant can approve purchase and nominate the final estimator |
| Workflow | One repeated estimating workflow |
| Jobs | Two near-term or completed representative jobs |
| Inputs | Authorised plans, price-book data and written rules are ready |
| Review | Customer accepts that every result is a draft |
| Scope | Customer accepts one business, one user and one workflow |
| Price | Customer accepts A$2,500 ex-GST / A$2,750 including GST |

The administrator records **approved, waitlisted or declined** with a reason. Approval is not payment and does not reserve a place indefinitely.

## 3. Payment Invitation

1. Confirm the approved application's name, email and scope.
2. Create checkout only through the admin-gated payment procedure.
3. Send the immutable offer version and payment link.
4. Do not mark the customer paid from a browser redirect or manual database change.
5. Start delivery only after the Stripe webhook validates A$2,750 AUD and the expected metadata.
6. Allocate one of five places only after verified payment.

## 4. Setup Session

1. Book one 90-minute session.
2. Restate the fixed scope, two-job limit and review responsibility.
3. Use the approved secure upload method; do not accept private plans through the public form.
4. Import no more than 150 agreed price-book rows.
5. Record no more than 20 written estimating rules, each with a stable rule ID.
6. Define three acceptance checks for the first workflow before generation.
7. Record the customer's current manual steps and buyer-reported baseline. Do not convert an estimate into a verified saving.

## 5. First Real Job

1. Confirm the selected scope in one sentence.
2. Upload only approved source files.
3. Generate the draft with `evaluation-prompt-v1.md` or the tested production equivalent.
4. Review project summary, assumptions, quantities, source references, price-book mappings, labour, waste, markup, exclusions and GST.
5. For each correction, record field, original value, corrected value, reason and severity.
6. Stop after invented evidence, cross-customer data, a material privacy incident or repeated critical quantity errors.

| Severity | Meaning |
|---|---|
| Critical | Could materially misprice the job, misstate scope or expose data |
| Major | Requires estimator correction before commercial use |
| Minor | Presentation or low-impact detail |
| Accepted | Customer confirms the item is usable as shown |

## 6. Second Real Job

1. Use a distinct job from the same approved workflow.
2. Reuse only the approved price-book rows and rules.
3. Measure setup reuse, generation duration, estimator review time and correction severity.
4. Do not change the scope to rescue a poor result.
5. Ask the customer whether they would use the workflow again without founder assistance.

## 7. Day 7 and Day 30 Checkpoints

At Day 7, record defects, unresolved questions, founder time, support requests and whether job two is scheduled. At Day 30, record usable outcome, repeat use, total founder time, direct cost, incidents and continuation intent.

Choose one closeout status:

- **Scale same offer:** all mandatory gates pass.
- **Continue narrow:** value exists but one repeatability or economic gate is unresolved.
- **Repair and rerun:** product, data, workflow or safety gate failed.
- **Stop:** paid demand or usable workflow is unsupported.

## 8. Measurement

| Metric | Definition |
|---|---|
| Paid demand | Full-price verified payments, not applications |
| First usable outcome | Customer confirms job-one draft is useful after review |
| Repeat use | Customer completes job two in the same workflow |
| Critical-error rate | Critical corrections divided by reviewed line items |
| Review burden | Minutes from first draft to customer-approved draft |
| Founder time | All sales, setup, cleanup, support and review time per customer |
| Contribution margin | Revenue excluding GST minus payment, model and founder-delivery costs |
| Continuation intent | Customer requests a paid continuation after the six included months |

## 9. Success and Stop Gates

- [ ] At least three of five places paid at full price.
- [ ] At least four of five customers judge the first reviewed draft useful.
- [ ] At least three of five complete a distinct second job.
- [ ] Median founder time is no more than five hours per customer.
- [ ] Contribution margin is at least 50% before acquisition.
- [ ] No critical privacy or trust incident occurs.
- [ ] At least three customers request continuation after the included period.

Failure of safety pauses recruitment immediately. Failure of founder-time or margin gates requires narrower scope or a higher next-cohort price, not more free work.

## 10. Failure Handling

| If this happens | Action | Owner |
|---|---|---|
| Application is not a fit | Decline with a short reason; do not create checkout | Matthew |
| Payment amount or metadata mismatches | Reject activation and investigate | Product / finance owner |
| File exceeds 32MB | Ask the customer to split or compress it; do not bypass the limit | Matthew |
| Plan is unreadable | Mark the run inconclusive; do not guess | Product lead |
| Draft invents source evidence | Stop, record critical defect and pause claims | Product lead |
| Customer requests another trade or workflow | Quote separately only after the first cohort closes | Matthew |
| Customer requests unlimited free access | Decline; direct them to the representative sample | Matthew |
| Customer declines recording | Continue delivery without recording; do not use publicly | Matthew |
| Customer data appears in another account | Stop immediately and start the incident process | Security owner |
| Checkout or onboarding fails | Do not take payment through a workaround | Product lead |

## 11. Definition of Done

The customer has two reviewed job records, corrections and founder time are logged, included access is correctly provisioned, private data is handled under approved terms, and the account has a dated continue, repair or stop decision. No public case study is created without separate written permission.
