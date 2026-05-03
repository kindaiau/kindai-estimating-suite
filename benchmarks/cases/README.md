# Benchmark Case Format

Each case folder contains:

- `manifest.json`: project context and plan URLs the model can read.
- `expected.json`: estimator-reviewed quantities and required warnings.
- `sample-ai-result.json`: optional local fixture for score-only validation.

Every case should define the Australian market basis in `manifest.json`:

- `country`: usually `Australia`.
- `stateOrTerritory`: the local basis for pricing, labour, compliance, and access assumptions.
- `currency`: `AUD`.
- `gstTreatment`: ex GST, inc GST, or mixed/unknown.
- `pricingBasis`: supplier/subcontractor/local price-book basis.
- `labourBasis`: licensed Australian labour assumptions, productivity, award/EBA conditions where applicable, and access constraints.
- `standardsContext`: Australian compliance risks the AI must flag when unclear.

Use `REPLACE_WITH_PUBLIC_OR_SIGNED_PLAN_URL` in templates only. Live benchmark runs require URLs that OpenAI can fetch.
