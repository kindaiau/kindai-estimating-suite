# Personal timber, wire and goat fencing

Extends the existing KindAI Estimating Suite at authenticated `/fencing`. The shared navigation includes **Fencing & goats**. Based on `main` at `b381f1de72e3d1f042fb75e34e89e533b4a1feb7` (28 August 2026); no replacement app or separately selected AI model.

## Use

1. Sign in and open Fencing & goats.
2. Choose timber palings, timber posts and mesh, timber rails and mesh, or plain wire. Enter measured straight fence runs separated by commas. Split at every corner and gate; leave gate openings out of run lengths.
3. Confirm spacing, waste, complete gate sets, rail stock size and pack sizes. Timber palings use 1.8m height and 150mm single-layer cover; linked mesh is 1.22m high and comes in 50m rolls. These fixed product dimensions are explicit, not inferred from video.
4. Record or select a short video. The browser samples eight JPEG frames with timestamps, up to 1024 pixels on the longest side. Review thumbnails, supply goat/horn details and notes, then press Review for goat fencing. Only those frames and notes go to the configured AI provider. Audio is not analysed. Clips must be at most 120 seconds and 100 MB. Browser codec support varies; unsupported clips have a clear error and MP4 fallback instruction.
5. Open the Bunnings product/search links and confirm exact product, pack size, store and suitability. Three exact products support a best-effort price check. No current price is prefilled; missing prices remain incomplete. Manual values are GST-inclusive and stamped with their store/source/date. Online checks do not claim local-store or PowerPass pricing.
6. Enter delivery and other site allowances (zero explicitly if none), then download CSV or print. This workspace uses in-memory state: leaving/reloading clears it. The CSV contains quantities, formulas, price provenance, allowances and incomplete-budget labelling; it is not an importable project backup. Print includes the AI report.

## Calculation scope

- Each run has independent ends. Quantities may be conservative at shared corners; no automatic post sharing.
- Mesh/wire end assemblies include terminal posts plus their stays and hardware, while the intermediate-post line excludes terminals. Gates include their own two posts and hardware. Concrete assumes one additional stay post per brace.
- Maximum timber bay length is the smaller of entered post spacing and rail stock length. Each rail is counted per bay, avoiding unsupported joins or overoptimistic linear-metre purchasing.
- Mesh roll quantities pool offcuts across runs and permit joins. Confirm joint and termination allowances on site.
- Timber nails/screws, staples, concrete and end assemblies are transparent allowances; confirm manufacturer and site requirements. This is a materials budget with optional other-cost allowance, not a structural design or full labour/profit quotation.
- Unknown Bunnings prices are never replaced by zero. Entering zero is an explicit user action (e.g. existing stock). Totals do not add GST again.

## AI integration and limits

`server/routers/fencing.ts` calls existing `invokeLLM`; existing `OPENAI_MODEL` and provider selection remain unchanged. Authentication is required for survey, status and price calls. Inputs are Zod-validated. Only JPEG data URLs are accepted for survey; arbitrary fetch URLs are rejected. Concurrent surveys by the same user are rejected. Provider failures return a plain error and never a fabricated report.

Industry prompt and Bunnings catalogue live in `config/industries/fencing.ts`. AI cites sampled timestamps, distinguishes observed conditions from unknowns and never updates confirmed measurements or material quantities. It cannot infer reliable real-world dimensions from uncalibrated video. Eight frames can miss hazards between samples. Goat suitability is not certified: mesh apertures require a product-specific check against horns, head size and kids.

Price lookup requests only three fixed Bunnings HTTPS URLs, rejects redirects, times out after ten seconds, bounds response bytes, and accepts only exact-product AUD JSON-LD Offers. Blocked/dynamic/store-dependent pages fall back to manual entry. No Bunnings account access, cart ordering, stock verification or automatic price refresh is claimed.

Sources reviewed 6 September 2026: Bunnings product links in the catalogue; NSW Agriculture _Goat fencing_, third edition 2003, https://www.dpird.nsw.gov.au/__data/assets/pdf_file/0005/178502/goat-fencing.pdf. The older guide supplies background on ground gaps, climbable objects and entrapment; it is not a modern product approval.

## Release and verification

Run `corepack pnpm check`, `corepack pnpm exec vitest run server/fencing.test.ts`, and `corepack pnpm build`.

Before relying on a released version, verify an authenticated iPhone recording/upload, one live provider review, and an actual local Bunnings product/price. Those live checks need the deployed suite's existing authentication and AI configuration. This change adds no credentials and changes no billing, emails, accounting, other trade calculations or model settings.
