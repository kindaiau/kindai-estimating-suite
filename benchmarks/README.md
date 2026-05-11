# Kindai AI Benchmark Pack

This folder is the repeatable investor-facing benchmark harness for Kindai takeoff accuracy.

The goal is not to claim the AI can safely quote million-dollar projects without review. The goal is to prove, with representative plan sets, what the model extracts correctly, where it misses scope, and whether Kindai blocks high-risk quotes until human assurance is complete.

## Australian Market Basis

All benchmark cases should be Australian construction market cases unless explicitly marked otherwise.

- Currency must be AUD.
- GST treatment must be explicit: ex GST, inc GST, or mixed/unknown.
- Quantities must use metric units and Australian trade language.
- Pricing should be checked against Australian supplier quotes, subcontractor quotes, labour productivity, preliminaries, margin, and local allowances.
- Labour assumptions should reflect Australian licensing, award/EBA conditions where applicable, normal hours, overtime, travel, access, and state/territory constraints.
- Risk warnings should consider Australian compliance and delivery context, including NCC/BCA obligations, AS/NZS trade requirements where applicable, state/territory WHS and licensing, shutdown windows, access constraints, fire sealing, and commissioning/certification.
- Each case should state its state or territory basis when local labour, access, compliance, or supplier pricing could materially change the result.

## Workflow

1. Create 10-20 benchmark cases under `benchmarks/cases/<case-id>/`.
2. Put public or signed plan URLs in `manifest.json`.
3. Put independently verified expected quantities in `expected.json`.
4. Run a live model benchmark:

```bash
OPENAI_API_KEY=... OPENAI_MODEL=gpt-5.5 corepack pnpm benchmark:run
```

5. Generate the investor report:

```bash
corepack pnpm benchmark:report
```

For local validation without OpenAI credentials, run the sample score-only mode:

```bash
corepack pnpm benchmark:score
corepack pnpm benchmark:report
```

## What Investors Should See

- Item recall: did the AI find the expected scope?
- Quantity accuracy: were quantities inside an agreed tolerance?
- Warning recall: did the AI flag missing, unclear, or dangerous scope?
- False positives: did the AI invent items?
- Quote assurance: did Kindai block high-value/risky quotes from being issued?
- Market discipline: did the AI keep pricing and assumptions in the Australian market instead of drifting into generic overseas rates or terminology?

## Case Quality Rules

- Expected quantities must be prepared or reviewed by a human estimator.
- Include mixed difficulty: clean PDFs, phone photos, partial drawings, unclear legends, revisions, and high-value commercial packages.
- Include known risk traps: missing schedules, provisional allowances, compliance exclusions, fire sealing, access constraints, and revision conflicts.
- Do not use private client documents unless the URLs and storage permissions are approved for model processing.
- Keep a record of the estimator, source price books, supplier quotes, subcontractor quotes, and plan revision used to prepare expected quantities.
