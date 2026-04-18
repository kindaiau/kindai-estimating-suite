# Kindai Estimating Suite — Project TODO

## Phase 1: Architecture & Schema
- [x] Initialize project with db/server/user scaffold
- [x] Write todo.md
- [x] Design and apply database schema (users, projects, estimates, line_items, materials, labour_rates)
- [x] Write shared trade constants and compliance data

## Phase 2: Core Platform & Branding
- [x] Design system: Kindai brand colors, typography, global CSS
- [x] AppLayout with dark sidebar navigation (responsive, mobile hamburger)
- [x] Landing/home page with trade selector cards and feature highlights
- [x] Auth flow (login, logout, role-based access)

## Phase 3: Trade Workbenches (10 trades)
- [x] Unified EstimateBuilder workbench (supports all 10 trades)
- [x] Electrical estimator workbench
- [x] Plumbing estimator workbench
- [x] Carpentry estimator workbench
- [x] Concreting estimator workbench
- [x] HVAC estimator workbench
- [x] Flooring estimator workbench
- [x] Landscaping estimator workbench
- [x] Cabinetry estimator workbench
- [x] Rendering/Plaster estimator workbench
- [x] Cabinet Making estimator workbench

## Phase 4: Materials Library
- [x] Materials library page with CRUD
- [x] Trade filter and search
- [x] Waste factor configuration
- [x] Pricing units (per unit, per m², per linear meter)
- [ ] Trade-specific default materials seeded per trade (future)
- [ ] Supplier price comparison panel (future)

## Phase 5: Labour Calculator
- [x] Labour rates management page
- [x] Fair Work Act base rates per trade (seed defaults)
- [x] Penalty rates (overtime, Saturday, Sunday, public holiday)
- [x] Allowances (travel, tool)
- [x] Configurable hourly rates per trade

## Phase 6: AI Takeoff Engine
- [x] AI plan analysis tRPC procedure (LLM integration)
- [x] Trade-specific AI prompts for all 10 trades with Australian market pricing
- [x] Confidence scoring and assumption logging
- [x] Takeoff results display and one-click add to estimate
- [x] AI Quote Summary generator
- [ ] PDF plan upload to S3 (future)

## Phase 7: Quote Builder
- [x] Quote builder page with line item editor (grouped by category)
- [x] GST (10%) calculation engine
- [x] Quote number generation (KAI-YYYY-XXXXXX format)
- [x] Quote summary tab with terms and disclaimer
- [x] Client-facing quote acceptance page
- [ ] PDF generation (future)
- [ ] Digital signature capture (future)
- [ ] Email delivery (future)

## Phase 8: Australian Compliance Engine
- [x] GST 10% automatic calculation on all estimates
- [x] State-based licensing prompts (QBCC, VBA, NSW Fair Trading, SA, WA, TAS, NT, ACT)
- [x] WHS/OH&S compliance notices per trade
- [x] AS/NZS standards references per trade
- [x] Quote disclaimer per trade
- [x] Compliance acknowledgement checkbox

## Phase 9: Project Dashboard
- [x] Dashboard with estimate stats (total projects, sent, accepted, won value)
- [x] Projects list with status management
- [x] ProjectDetail with estimate list
- [x] Trade-specific icons and colour coding
- [x] Recent projects widget

## Phase 10: Accounting Export
- [ ] Export estimates to CSV (Xero/MYOB/QuickBooks compatible) (future)
- [ ] GST-compliant line item formatting (future)

## Phase 11: Testing
- [x] 20 vitest unit tests passing
- [x] Auth tests (me, logout)
- [x] Compliance tests (10 trades, state licensing, standards)
- [x] GST calculation tests
- [x] Labour rate penalty calculation tests
- [x] Margin calculation tests
- [x] Australian state validation tests

## Branding Overhaul (User Feedback Round 2)
- [x] Rebrand Dashboard with Kindai wow-factor: origami crane logo, rainbow gradients, colourful trade cards
- [x] Polish all inner pages with consistent Kindai brand (Projects, EstimateBuilder, Materials, Labour, Profile)
- [x] Ensure mobile-first simplicity — tradie on a building site can use it one-handed
- [x] Fix server module import error (routers/projects restart)

## AI Vision Takeoff Engine (KILLER FEATURE)
- [x] Backend: Image/PDF upload to S3 storage
- [x] Backend: GPT-4 Vision analysis — symbol detection, room identification, dimension extraction
- [x] Backend: Material extraction engine — identifies every material needed from plan analysis
- [x] Backend: Dual pricing engine — retail (Bunnings) vs trade/wholesale pricing per material
- [x] Backend: Labour benchmark calculator — industry-standard rates per trade per task
- [x] Backend: Markup percentage calculator — tradie sets their margin on materials
- [x] Backend: Supplier recommendation engine — best suppliers per trade per region
- [x] Frontend: Camera capture / photo upload (mobile-first)
- [x] Frontend: PDF plan upload with drag-and-drop
- [x] Frontend: Plan preview with AI annotation overlay
- [x] Frontend: Full materials breakdown table (retail vs trade pricing columns)
- [x] Frontend: Labour cost breakdown with benchmark references
- [x] Frontend: Markup slider/input with live total recalculation
- [x] Frontend: Supplier recommendations panel with "Send Order" action
- [x] Frontend: One-click "Generate Quote" from AI takeoff results
- [x] Redesign landing page hero to showcase AI Vision as the #1 feature
- [x] Redesign dashboard quick-start to prioritise "Scan a Plan" CTA
- [x] Write vitest tests for Vision Takeoff engine (27 tests passing)

## Stripe Payment Integration
- [x] Add Stripe feature scaffold (webdev_add_feature)
- [x] Request Stripe API keys from user (auto-configured)
- [x] Create subscription tiers: Free, Pro ($49/mo), Business ($149/mo)
- [x] Build Stripe checkout session creation (server-side)
- [x] Build Stripe webhook handler for subscription events
- [x] Build customer portal for billing management
- [x] Create Pricing page UI with Kindai branding
- [x] Add subscription status to user profile and dashboard
- [x] Gate premium features behind subscription tier (plan limits defined)
- [x] Write vitest tests for Stripe integration (18 tests passing)

## Pricing Model Restructure (Value-Based)
- [x] Research enterprise estimating software pricing (Procore $20K-$150K+, PlanSwift $1.7K, Bluebeam $3.2K, CostX $10K-$30K+)
- [x] Research Australian estimator salary data ($95K-$150K+ loaded cost)
- [x] Redesign pricing: 5 tiers (Free, Solo $49/mo, Trade Business $199/mo, Commercial $799/mo, Enterprise $1,499/mo)
- [x] Update Stripe products with new pricing structure + ROI calculator
- [x] Rebuild Pricing page with value-based messaging, competitor comparison table, and ROI badges
- [x] Add ROI calculator showing cost savings vs full-time estimator (17x-55x return)
- [x] Update billing router and webhook handler for new tier IDs
- [x] Migrate database enum for subscriptionTier
- [x] Write tests for new pricing model (56 tests passing)

## Bug Fixes
- [x] Fix projectId NaN error on AI Takeoff page — allow takeoff without pre-selected project
- [x] Ensure AI Takeoff works end-to-end on mobile (plan upload → analysis → results)

## Bug Fix: AI Takeoff NaN Error
- [ ] Fix projectId NaN — AI Takeoff auto-creates project when none selected
- [ ] Validate trade selected before allowing analyse button
- [ ] Test full mobile flow: upload → analyse → results

## Per-Trade Customisation & Automation
- [x] Trade profile settings page (logo, brand colours, business name, ABN, licence number)
- [x] Per-trade supplier connections (custom supplier name, contact, account number, email)
- [x] Branded email templates per trade (quote delivery, follow-up, supplier order)
- [x] Email automation flows: quote sent → 3-day follow-up → 7-day reminder
- [x] Supplier order email: auto-generate materials order from AI takeoff results
- [x] SMTP / email provider settings (SendGrid/SMTP per user)
- [x] Quote email preview with user's own branding

## Demo Mode & Video
- [x] No-login demo mode for AI Takeoff with pre-loaded sample electrical plan
- [x] Demo mode shows full flow: upload → AI analysis → materials → pricing → quote
- [x] "Try Demo" CTA on landing page (no sign-up required)
- [x] Animated demo video showing scan-to-quote flow
- [x] Embed demo video on landing page (Script 4 explainer — CDN hosted)
- [x] Replace broken AI-generated video with real screen recording (no gibberish text)
- [x] Update landing page bounce-rate CTAs

## PDF Quote Export (Most-Requested Feature)
- [x] Server-side PDF generation using puppeteer-core + system Chromium
- [x] Branded PDF template: Kindai header, trade logo, ABN, licence, GST breakdown
- [x] Line items table with materials + labour + markup + GST
- [x] Compliance disclaimers per trade on PDF footer
- [x] "Download PDF" button on EstimateBuilder page
- [x] PDF stored in S3 and linked from estimate record

## Default Materials Seeding
- [x] Seed 151 default materials across all 10 trades with real 2024-25 Australian pricing
- [x] Electrical: cable, GPOs, switchboards, conduit, circuit breakers, data (Clipsal/HPM/Schneider pricing)
- [x] Plumbing: copper pipe, PEX, PVC drainage, tapware, hot water units (Reece/Tradelink pricing)
- [x] Carpentry: framing timber, plywood, doors, fixings (Bowens/Bunnings Trade pricing)
- [x] Concreting: concrete mix, reinforcing mesh, formwork, DPC, sealers (Boral/Hanson pricing)
- [x] HVAC: split systems, ducted, ductwork, refrigerant pipe (Daikin/Mitsubishi pricing)
- [x] Flooring: hybrid, laminate, timber, carpet, tiles, underlay (Carpet Court/Beaumont pricing)
- [x] Landscaping: turf, mulch, pavers, retaining walls, irrigation (Turf Farm/Holman pricing)
- [x] Cabinetry: cabinet boxes, benchtops, hardware (Kaboodle/Blum/Laminex pricing)
- [x] Rendering: render coats, mesh, primers, EPS insulation (Rockcote/Dulux pricing)
- [x] Cabinet Making: sheet material, hardware, edging, wardrobe systems (Blum/Laminex pricing)

## Enterprise Pricing Restructure (B2B Value-Based) — COMPLETE
- [x] Research competitor enterprise pricing benchmarks (Procore $20K-$150K+, PlanSwift $2K, Buildxact $5K, Cubit $3.5K, CostX $30K+)
- [x] Define new 5-tier pricing: Free Trial, Sole Trader, Small Builder, Mid-Tier Builder, Enterprise
- [x] Price points: $0 / $149/mo / $499/mo / $1,499/mo / $3,999/mo (custom enterprise)
- [x] Update Stripe products.ts with new pricing + ROI data + paybackDays
- [x] Rebuild Pricing page with enterprise B2B positioning ("Stop paying $130K-$180K/yr for a full-time estimator")
- [x] Add interactive ROI calculator with tier selector
- [x] Add competitor comparison table (vs hiring estimator, vs Procore, vs PlanSwift, vs Buildxact, vs Cubit, vs CostX)
- [x] Add "The risk you're not pricing in" section (underquoting, time cost, missed opportunities)
- [x] Update database enum for new subscription tiers (0005_unknown_tomas.sql migration)
- [x] Update billing router and webhook handler for new tier IDs
- [x] 66 tests passing (all green)

## Enterprise Upgrade — $100M Builder Grade

### Multi-User Team Management & RBAC
- [ ] Team invitations: owner can invite users by email with role assignment
- [ ] Roles: Owner, Estimator, Project Manager, Quantity Surveyor, Viewer (read-only)
- [ ] Role-based feature gates: Viewers cannot edit, Estimators cannot delete projects
- [ ] Team members table in DB with role + status (pending/active/suspended)
- [ ] Team management UI page: invite, remove, change roles, suspend users
- [ ] Per-project access control: assign team members to specific projects only

### Tender & Bid Management
- [ ] Tender module: create tender packages with scope of works, drawings, due date
- [ ] Subcontractor invite system: send tender invitations by email with secure link
- [ ] Bid submission portal: subcontractors submit bids via public link (no login required)
- [ ] Bid comparison table: side-by-side comparison of all received bids per trade
- [ ] Bid levelling: normalise bids to same scope for fair comparison
- [ ] Award tender: mark winning bid, auto-generate subcontract summary
- [ ] Tender status tracking: Draft → Issued → Bids Received → Awarded → Closed

### Full Audit Trail
- [ ] Audit log table: every create/update/delete logged with userId, timestamp, entity, before/after JSON
- [ ] Audit trail UI: filterable log per project, per user, per entity type
- [ ] Immutable audit records: no delete on audit_logs table
- [ ] Export audit trail to CSV for compliance/legal purposes

### Cost Control Dashboard (Budget vs Actual)
- [ ] Cost codes system: assign WBS/cost codes to line items (AS 1181 standard)
- [ ] Budget vs actual tracking per project per cost code
- [ ] Variation management: log approved variations with cost impact and approval chain
- [ ] Subcontractor cost tracking: committed costs vs invoiced vs paid
- [ ] Cashflow forecast: monthly spend projection vs budget
- [ ] Cost overrun alerts: notify PM when cost code exceeds budget by X%
- [ ] Executive summary dashboard: total portfolio value, margin %, at-risk projects

### Accounting Integration
- [ ] Xero export: GST-compliant CSV/JSON in Xero format (invoices, bills, cost codes)
- [ ] MYOB export: MYOB AccountRight compatible export format
- [ ] QuickBooks export: QBO format for international users
- [ ] Export history: track what was exported and when

### Enterprise Security & Compliance
- [ ] Session management: view and revoke active sessions per user
- [ ] Two-factor authentication (2FA) prompt for enterprise tier
- [ ] Data encryption at rest indicator (documented in security page)
- [ ] IP allowlisting for enterprise accounts (config only)
- [ ] GDPR/Privacy Act compliance page with data retention policy
- [ ] SOC 2 readiness checklist (documented)

## Plumbing UX Deep-Dive — 5 Townhouse Development Scenario

### Estimate Structure (Multi-Section)
- [ ] Replace flat line-item list with structured sections: Preliminaries, Drainage (Sewer), Drainage (Stormwater), Trenching & Excavation, Cold Water Rough-In, Hot Water System, Internal Fixtures & Fittings, Appliance Installs, Commissioning & Testing
- [ ] Each section has its own subtotal, labour hours, and materials cost
- [ ] Section collapse/expand for large estimates
- [ ] Section-level notes field (e.g. "Drainage: Allow for rock excavation contingency")
- [ ] Multi-building quantity multiplier: "x5 townhouses" applies to all internal sections automatically

### Plumbing Materials Library (Comprehensive)
- [ ] Drainage: uPVC pipe (40mm, 50mm, 80mm, 100mm, 150mm), bends, junctions, inspection openings, gully traps, floor wastes, P-traps, S-traps
- [ ] Stormwater: uPVC 90mm, 100mm, 150mm, downpipe connectors, pits, sumps, charged lines
- [ ] Trenching: allow rates per linear metre (hand dig, machine dig, backfill, compaction, reinstatement)
- [ ] Cold water: copper 15mm, 20mm, 25mm, 32mm; PEX 16mm, 20mm; poly pipe; isolation valves; pressure limiting valve; water meter connection
- [ ] Hot water: copper 15mm, 20mm; tempering valve; expansion valve; pressure relief valve; sacrificial anode; lagging/insulation
- [ ] Hot water units: Rheem 250L electric, 315L electric, Rinnai 26L continuous flow, Dux 250L heat pump, Stiebel Eltron 300L heat pump
- [ ] Fixtures: toilet suites (Caroma, Fowler), basins (various), showers (rail, overhead), baths, laundry tubs, kitchen sinks
- [ ] Tapware: mixers (Methven, Caroma, Grohe), pillar taps, shower sets, bath sets
- [ ] Appliances: dishwasher connection, washing machine connection, gas bayonet, outdoor tap

### AI Takeoff — Plumbing Plan Analysis
- [ ] Upgrade plumbing AI prompt to handle multi-building hydraulic plans
- [ ] Detect: fixture schedule, pipe sizing notes, invert levels, drainage layout, hot water locations
- [ ] Output structured by section (drainage, cold water, hot water, fixtures, appliances)
- [ ] Identify number of wet areas per unit (bathrooms, ensuites, laundries, kitchens)
- [ ] Calculate linear metres of pipe runs from plan dimensions
- [ ] Flag assumptions clearly: "Assumed 1.5m trench depth — confirm with hydraulic engineer"
- [ ] Multi-building detection: "5 identical units detected — quantities shown per unit x5"

### Labour Rates — Plumbing Specific
- [ ] Licensed plumber rate: $95–$115/hr (base, QLD/NSW/VIC)
- [ ] Apprentice rate: $35–$55/hr
- [ ] Labour units per task: rough-in per wet area, fixture install per type, drain per linear metre, hot water install per unit
- [ ] Trenching: machine $180–$250/hr, hand dig $85/hr
- [ ] Commissioning: pressure test, CCTV inspection, council inspection allowance

### Quote Output — Plumbing Specific
- [ ] Quote shows breakdown by section with subtotals
- [ ] Separate materials and labour columns per section
- [ ] Provisional sum items (e.g. "Rock excavation — PS $5,000")
- [ ] Exclusions list: "Excludes: gas work, electrical to hot water, council fees, hydraulic engineer"
- [ ] Inclusions list: "Includes: all rough-in, fit-off, hot water installation, commissioning"
- [ ] QBCC/VBA/NSW Fair Trading licence number on quote
- [ ] Payment schedule: 30% deposit, 40% rough-in complete, 30% on completion

## Expert AI Prompts — All 10 Trades (Section-by-Section + Labour + Margin)
- [ ] Electrical: sections = Preliminaries, Switchboard & Mains, Power (GPOs/circuits), Lighting, Data & Communications, Safety Systems (smoke/RCD), External/Outdoor, Commissioning
- [ ] Carpentry: sections = Preliminaries, Structural Framing, Roof Framing, External Cladding, Internal Linings, Doors & Frames, Windows & Glazing, Stairs & Balustrades, Joinery & Trim, Commissioning
- [ ] Concreting: sections = Preliminaries, Earthworks & Preparation, Formwork, Reinforcement, Concrete Supply & Pour, Finishing & Curing, Waterproofing, Commissioning
- [ ] HVAC: sections = Preliminaries, Equipment Supply, Refrigerant Pipework, Ductwork & Diffusers, Electrical Connections, Controls & BMS, Commissioning & Testing
- [ ] Flooring: sections = Preliminaries, Subfloor Preparation, Waterproofing (wet areas), Tiling, Timber/Laminate/Hybrid, Carpet, Skirting & Trims, Commissioning
- [ ] Landscaping: sections = Preliminaries, Demolition & Clearing, Earthworks & Drainage, Retaining Walls, Paving & Paths, Turf & Planting, Irrigation, Fencing, Lighting, Commissioning
- [ ] Cabinetry: sections = Preliminaries, Kitchen Cabinets, Bathroom Vanities, Laundry, Wardrobes, Benchtops, Splashbacks, Hardware & Accessories, Installation Labour
- [ ] Rendering: sections = Preliminaries, Substrate Preparation, Scratch Coat, Base Coat, Finish Coat, Texture & Paint, External Insulation (if EPS), Commissioning
- [ ] Cabinet Making: sections = Preliminaries, Sheet Material & Panels, Doors & Drawer Fronts, Hardware (hinges/runners/handles), Benchtops, Assembly Labour, Installation Labour, Commissioning
- [ ] All prompts include: labour rates per classification, margin/markup field, multi-building multiplier, provisional sums, exclusions list

## Industry Benchmarking Engine
- [ ] Database table: benchmark_rates (trade, section, metric, p25, p50, p75, p90, unit, state, updatedAt)
- [ ] Seed benchmark data for all 10 trades: labour rate ranges, material cost per m², total project cost per m² by type
- [ ] Benchmark comparison on EstimateBuilder: show user's rate vs P25/P50/P75 market range per section
- [ ] Visual indicator: green (competitive), amber (slightly high), red (significantly above market)
- [ ] "How does your quote compare?" panel on Quote Summary tab
- [ ] Win rate correlation: track accepted vs declined quotes and show user their actual win rate vs benchmark

## Quote Follow-Up Email Sequence
- [ ] Email sequence table: quote_follow_ups (estimateId, sequence, scheduledAt, sentAt, status, emailType)
- [ ] Trigger: when estimate status changes to "sent", auto-schedule 4 follow-up emails
- [ ] Day 1 (same day): "Your quote has been sent" confirmation to tradie + "Quote received" to client
- [ ] Day 3: Friendly check-in to client: "Just checking you received our quote — happy to answer any questions"
- [ ] Day 7: Value reinforcement email: "Still thinking it over? Here's what's included..." with quote summary
- [ ] Day 14: Final chase: "Our quote expires in [X] days — let us know if you'd like to proceed or discuss"
- [ ] Auto-cancel sequence when estimate is accepted or declined
- [ ] Email templates editable per user in Settings
- [ ] Unsubscribe/opt-out handling
- [ ] Email log visible in EstimateBuilder (sent, opened, clicked)

## Supplier Integration
- [ ] Supplier profiles table: user_suppliers (userId, supplierName, supplierUrl, accountNumber, tradeDiscount, isActive, notes)
- [ ] Supplier management page in Settings: add/edit/remove trade supplier accounts
- [ ] Pre-loaded supplier list per trade: Reece, Tradelink, Samios (plumbing); Middy's, Rexel, L&H (electrical); Bowens, Dahlsens, Mitre 10 (carpentry); Boral, Hanson, Holcim (concreting); etc.
- [ ] "Generate Order List" button on EstimateBuilder: exports all Materials line items as a formatted order list
- [ ] Order list format: supplier name, item description, quantity + 10% buffer, unit, estimated cost
- [ ] One-click "Open in Supplier Website" — opens supplier's website with order list pre-filled where API allows
- [ ] PDF/CSV export of order list for manual ordering
- [ ] Material matching: AI suggests which supplier stocks each item based on trade and location
- [ ] Price comparison: if user has multiple suppliers for same trade, show cheapest option per item

## Sprint: Send Quote + Acceptance + Variations + Demo Videos
- [ ] Send Quote to Client email button in EstimateBuilder
- [ ] Backend: sendQuote procedure — generate PDF, email to client with branded template
- [ ] Public quote acceptance page /quote/[token] — no login required
- [ ] Backend: quoteTokens table, createToken procedure, acceptQuote procedure
- [ ] Variations register — per-project variations tab
- [ ] Backend: variations table, CRUD router
- [ ] Variations UI — add variation, approve/reject, running contract sum
- [ ] Screen recording demo video — solo tradie (electrician, single house)
- [ ] Screen recording demo video — $50M commercial build (multi-trade, enterprise)

- [ ] AI Help Assistant — floating button on all authenticated pages
- [ ] AI Help chat panel — trade-aware, knows pricing, compliance, how-to guides
- [ ] System prompt includes all 10 trade sections, benchmarks, Australian compliance
- [ ] Context-aware: knows which page/trade/estimate user is currently on

## Trade Consolidation
- [ ] Merge Cabinetry + Cabinet Making into single "Cabinetry & Cabinet Making" trade
- [ ] Update shared trade constants (9 trades total now)
- [ ] Update AI prompts in ai.ts to combine both sections
- [ ] Update materials seed — merge both trade materials into one
- [ ] Update compliance data, landing page trade cards, navigation
- [ ] Update database migration to handle existing cabinetry/cabinet_making records

## Complete Trade List Expansion
- [ ] Research all licensed Australian construction trades (QBCC, VBA, NSW Fair Trading, SA CBS, WA Building & Energy)
- [ ] Merge Cabinetry + Cabinet Making into single "Cabinetry & Joinery" trade
- [ ] Add Surveying as standalone trade (Quantity Surveyor / Land Surveyor)
- [ ] Add all missing trades identified from research
- [ ] Update shared/trades.ts with complete trade list, compliance data, labour rates
- [ ] Update server/routers/ai.ts with expert prompts for all new trades
- [ ] Update server/pdfGenerator.ts compliance map for all trades
- [ ] Update server/routers/demo.ts trade enum and scenarios
- [ ] Update server/seedMaterials.ts with materials for all new trades
- [ ] Update all client UI pages with new trade list
- [ ] Update tests for new trade count

## Beta Launch System
- [ ] Add betaSignups table to drizzle schema
- [ ] Build betaSignups router (submit, count, check)
- [ ] Build /beta landing page with live counter, form, urgency
- [ ] Add "BETA" banner/badge to Home.tsx hero section
- [ ] Add beta badge to user dashboard profile
- [ ] Update Home.tsx hero CTA to include beta sign-up option
- [ ] Produce beta launch ad video (30s, direct-to-camera style)
- [ ] Write social ad copy for FB/Instagram/LinkedIn

## Website Copy & Video Fix
- [ ] Fix nonsensical/broken text in website explainer video
- [ ] Audit all website copy for gibberish or AI-generated nonsense words

## Meta Ads Campaign Creation (API)
- [ ] Create Meta Ads Campaign 1 (Cold Traffic) via Facebook Marketing API
- [ ] Create Meta Ads Campaign 2 (Retargeting) via Facebook Marketing API


## Enterprise Readiness — Cabinet/Joinery Brief (Apr 2026)
- [x] Create dedicated /cabinet-joinery landing page with correct copy and CTAs
- [x] Rewrite Pricing page: Pro A$299/mo + Enterprise Pilot + Enterprise custom
- [x] Remove all unverified claims (cut lists, CNC-ready, best supplier pricing, guaranteed compliance)
- [x] Replace all beta/replace-estimator language site-wide
- [x] Add real cabinet estimate proof block to cabinet landing page
- [x] Add /cabinet-joinery route to App.tsx

## Bug Fixes
- [x] AI Takeoff plan upload does nothing — fixed: removed trade-required gate on upload, added visual orange highlight on trade selector, dynamic button label guides user through steps

## Cabinet Making Demo Video & Enterprise Polish
- [ ] Record cabinet making demo screen recording (full AI takeoff flow)
- [ ] Process recording into polished MP4 and upload to CDN
- [ ] Add ElevenLabs voiceover when user provides cloned voice
- [ ] Wire Calendly booking link into Book Enterprise Pilot buttons
- [ ] Add cabinet making demo video to /cabinet-joinery page
- [x] Wire matt@kindaiestimator.com into all Book Enterprise Pilot buttons (CabinetJoinery, Pricing, Home, Support, Terms, Privacy, DataDeletion)
- [x] Create static image ad creatives (1080x1080) for FB/IG feed ads
- [x] Create 15-second vertical video ad (9:16) for Stories/Reels
- [x] Create 30-second square video ad (1:1) for Feed placement
- [x] Create og:image (1200x630) for social share previews
- [x] Wire og:image into all public pages
- [x] Upload all ad assets to CDN

## Ad Creative Rebranding & Teaser Videos
- [ ] Fix branding on existing ad creatives (kindai.com.au → kindaiestimator.com)
- [ ] Create teaser videos from animated logo and city explosion footage
- [ ] Build Meta Ads Campaign 1 — Lead Generation targeting AU tradies/builders
- [ ] Test full beta signup funnel (Brevo welcome email + HubSpot contact/deal)

## Meta Pixel Retargeting
- [ ] Set up Meta Pixel retargeting to capture visitors who didn't sign up
- [ ] Fire PageView on all pages, Lead event on beta signup completion
- [ ] Build custom audience logic: all visitors minus converters = retarget pool

## Welcome Email Fixes
- [x] Add Kindai origami crane logo to email header
- [x] Remove emoji from subject line (spam filter risk)
- [x] Trade-aware CTA link (Cabinet Making goes to /cabinet-joinery, others to /dashboard)
- [x] Add unsubscribe footer (AU Spam Act compliance)
- [x] Remove all emojis from email body (checkmarks replaced with dashes)

## About Us
- [ ] Create /about page with approved copy and add to navigation

## Demo Plan Upload
- [x] Add real plan upload (PDF/image) to demo page with AI processing
- [x] Show partial result, gate full quote behind beta signup CTA

## HubSpot CRM Fix
- [x] Fix HubSpot API key scopes so beta signups create contacts + deals correctly

## Meta Ads Campaign Setup
- [ ] Check FB content folder for uploaded images/videos
- [ ] Build Campaign 1 — Lead Generation targeting AU tradies
- [ ] Build Ad Sets with correct targeting
- [ ] Create Ads with uploaded creatives
- [ ] Verify full funnel: ad → landing → beta signup → HubSpot + Brevo

## Beta Signup Nurture Email Sequence
- [x] Design 5-email nurture sequence strategy (Day 0 welcome already exists)
- [x] Write Email 2: Day 1 — "Your first quote in 60 seconds" (activation push)
- [x] Write Email 3: Day 3 — "What other tradies are saying" (social proof + case study)
- [x] Write Email 4: Day 7 — "The $120K question" (ROI/value reinforcement)
- [x] Write Email 5: Day 14 — "Your beta access expires soon" (urgency close)
- [x] Create server/betaNurture.ts with all email HTML templates
- [x] Create server/routers/betaNurture.ts with scheduling + sending procedures
- [x] Add beta_nurture_emails table to track sent/scheduled emails per signup
- [x] Wire nurture scheduling into beta signup flow (auto-schedule on signup)
- [ ] Add admin UI to view nurture email status per signup (future)
- [x] Write vitest tests for nurture sequence (55 tests passing)
- [x] AU Spam Act compliance: unsubscribe handling in every email

## Beta End Date (May 15, 2026)
- [x] Add beta end date countdown to beta signup page
- [x] Update nurture email templates with beta deadline urgency
- [x] Create reusable Meta Ads campaign creation skill

## Facebook Lead Form + Campaign Fix
- [ ] Delete draft "Kindai Beta - Cold Traffic - Leads" campaign
- [ ] Create Facebook Instant Lead Form on Kindai page (email, name, trade type)
- [ ] Update 3 existing ads to use lead form as destination
- [ ] Wire lead form submissions to beta signup + nurture sequence
- [ ] Re-encode yuv444p teaser videos to yuv420p for Facebook upload

## Estimating Accuracy Fix — Gas Separation + Scoping Questions
- [x] Audit current estimating prompts and benchmark data for gas vs water confusion
- [x] Separate gas install from general plumbing in trade categories
- [x] Add "Gas Install" trade category with gas-specific line items
- [x] Add "Gas Maintenance" trade category with service/repair line items
- [x] Build trade-specific scoping/pre-fill questions for all trades (gas install, gas maintenance, electrical, plumbing, HVAC, carpentry, concreting, cabinetry + default for others)
- [x] Update AI prompt to only quote what was asked (gas ≠ water) — plumbing now explicitly excludes gas
- [x] Add accurate gas benchmarks (AU pricing for gas lines, hot plates, HWS, meters, compliance certs)
- [ ] Allow companies to set their own rates/margins per trade category
- [ ] Test gas-specific estimate accuracy (manual testing needed)

## Website Analytics Audit
- [x] Pull real user traffic data and session behaviour
- [x] Identify bottlenecks in user journey (drop-offs, errors, slow pages)
- [x] Report findings to user

## Gas Estimate Accuracy Test
- [ ] Run a gas install estimate through the demo and verify pricing accuracy

## Video Re-encoding for Facebook
- [x] Re-encode teaser_city_logo_square.mp4 (yuv444p → yuv420p)
- [x] Re-encode teaser_city_logo_vertical.mp4 (yuv444p → yuv420p)
- [x] Re-encode all 6 teaser videos with yuv420p + silent audio for Facebook compatibility

## Company Rates/Margins Settings UI
- [x] Database already has tradeProfiles table with defaultMarkup, defaultLabourRate fields
- [x] Upgrade Defaults tab in Trade Profiles with comprehensive rates panel
- [x] Add material markup %, overhead/prelims %, profit margin %, waste factor, mobilisation rate
- [x] Add AU market benchmark comparison indicators
- [x] Add gas-install and gas-maintenance to Trade Profile page trade selector
- [x] Fix stale trade lists in LabourRates and Profile pages (missing gas trades)
- [x] Wire custom rates into the AI estimating prompt

## Wire Custom Rates into AI Estimating Prompts
- [x] Fetch user's trade profile rates when generating AI estimate
- [x] Inject custom material markup, labour rates, overhead, profit margin, waste factor into AI prompt
- [x] Fall back to AU benchmark defaults when user hasn't set custom rates
- [x] Wire saved trade profile defaults into AITakeoff UI (markup % and labour rate)
- [x] Test that custom rates flow through to AI output (35 tests passing)

## Fix beta.getStats Polling
- [x] Add staleTime to beta.getStats useQuery to prevent 298+ unnecessary API calls per session
- [x] Fix misleading fallback values (was showing 67/33 while loading, now shows 0/25)

## Facebook/Instagram Ad Campaign Strategy
- [x] Build targeting spec for AU tradies (electricians, plumbers, builders)
- [x] Create campaign structure recommendation with budget allocation
- [x] Provide ad creative recommendations and copy
- [x] Audited Meta Ads account — campaign exists but PAUSED, $0 spend, 0 impressions
- [x] Identified 3 ads ready to go (Cost Comparison, Underquoting Fear, Speed Hook)

## Gmail SMTP Email Wiring (replacing Brevo — suspended)
- [x] Store Gmail App Password as GMAIL_APP_PASSWORD secret
- [x] Install nodemailer and wire into email sender
- [x] Update welcomeEmail.ts to use Gmail SMTP
- [x] Update betaNurture.ts to use Gmail SMTP (label field restored, 215 tests passing)
- [x] Remove all Brevo references from codebase (brevoSender.ts deleted, Privacy Policy updated)
- [x] Nurture cron re-enabled via Gmail SMTP (15-min interval)

## FB Leads Admin Dashboard
- [x] Add hubspotContactId and hubspotDealId columns to betaSignups schema
- [x] Apply migration for new HubSpot columns
- [x] Update fbLeadWebhook to save HubSpot IDs to DB after creation
- [x] Create fbLeads tRPC router (list, getById, approve, stats — admin-only)
- [x] Register fbLeadsRouter in main routers.ts
- [x] Build FbLeadsDashboard admin page (stat cards, filterable table, nurture progress)
- [x] Add /admin/fb-leads route to App.tsx
- [x] Add admin-only "FB Leads" nav item to DashboardLayout sidebar
- [x] Write 17 vitest tests for fbLeads feature (203 total passing)

## Website Signup → HubSpot Sync (Organic Leads)
- [x] Confirm website beta.signup already calls HubSpot, welcome email, and nurture
- [x] Fix HubSpot IDs not being saved back to DB row after creation
- [x] Verify beta_nurture_emails table and hubspot columns exist in production DB
- [x] Live end-to-end test: organic signup → HubSpot contact + deal + email + nurture all fire
- [x] Write 11 vitest tests for HubSpot sync behaviour (214 total passing)

## Email System Fix — Disable Gmail SMTP, HubSpot Only
- [x] Disable Gmail SMTP welcome email (welcomeEmail.ts) — logs only, no send
- [x] Disable Gmail SMTP nurture emails (betaNurture.ts) — logs only, no send
- [x] Disable 15-min nurture cron job (server/_core/index.ts) — commented out
- [x] Verify server restarts with "DISABLED" log message confirmed
- [x] HubSpot CRM contact + deal creation still working (unchanged)
- [x] Create lead flow diagram (before/after) for Matthew
- [ ] Set up HubSpot email workflows to replace Gmail SMTP sequences (future)
- [x] Remove "free for Australian trades" from all ad copy (rule saved to skill + ad-creatives.md)

## Test Lead Cleanup
- [x] Find all test leads in beta_signups database table
- [x] Delete test leads from database (beta_signups + beta_nurture_emails)
- [x] Delete test contacts/deals from HubSpot CRM
- [x] Verify email fix working end-to-end (no Gmail SMTP sends)
- [x] Create email-system-audit reusable skill

## Email Template Branding Audit
- [x] Audit all email templates in codebase (5 systems found: welcome, nurture, followup, trade profiles, PDF)
- [x] Create shared emailBrand.ts module with brand colours, logo, reusable components
- [x] Update welcomeEmail.ts to use shared branded template
- [x] Update betaNurture.ts to use shared branded template
- [x] Update emailFollowup.ts with wrapFollowupInBrand() function
- [x] Verify trade profile templates already on-brand (correct gradient)
- [x] Validate email-system-audit skill with branding section added

## AI Takeoff UX Overhaul
- [ ] Fix duplicate job details input (Scan Plan + Describe Job both show scope questions)
- [ ] Audit trade dropdown — identify and merge redundant trades (e.g., two gas trades, cabinetry + cabinet making)
- [ ] Verify all trades in dropdown work correctly with AI analysis
- [ ] Add more trade-specific scoping questions for accuracy
- [ ] Support multi-plan upload (tradies need to upload all building plans, especially trade-specific ones)
- [ ] Ensure plan upload is required OR job description is required (not both showing simultaneously)

## Mobile Chat Bug Fix
- [x] Fix AI chat widget on mobile — input field hidden behind keyboard, can't type follow-up messages
- [x] Ensure chat input always visible above keyboard on iOS/Android (visualViewport translateY + dvh fix)

## Advanced AI Premium Upgrade — 6 Features

### Feature 1: Company Memory (Price Book, Saved Defaults, Per-Tenant Retrieval)
- [x] Add companyProfiles table (exclusions, inclusions, quote tone, job templates)
- [x] Add priceBookItems table (user's negotiated supplier pricing)
- [x] Add jobTemplates table (reusable starting-point estimates)
- [x] Build company profile settings page
- [x] Build price book upload/management UI
- [x] Build saved job templates UI
- [x] Wire company memory into AI takeoff prompts (retrieval-augmented generation)

### Feature 2: Human Correction Loop (Learning from Every Edit)
- [x] Add estimateCorrections table (AI said X, human changed to Y, with reason)
- [x] Wire correction capture into line item add/update/delete mutations
- [x] Build accuracy tracking dashboard (AI accuracy % over time)
- [x] Feed corrections back into AI prompts as retrieval hints
- [ ] Surface "AI is learning" indicators in the UI

### Feature 3: Multi-Step Orchestrated Workflow (Replace Single-Shot AI)
- [ ] Step 1: Plan interpretation (project type, units, trades detected)
- [ ] Step 2: Quantity extraction (per room/section with confidence flags)
- [ ] Step 3: Pricing lookup (user price book first, then benchmarks)
- [ ] Step 4: Business rules (margin floors, compliance, missing-data flags)
- [ ] Step 5: Human review (editable draft with per-item confidence)
- [ ] Step 6: Quote generation and export
- [ ] Progress UI showing each step with status indicators
- [ ] Multi-plan upload support (multiple pages per job)

### Feature 4: Approval Workflow + Audit Log
- [x] Extend estimate status to Draft → Under Review → Approved → Sent (updateEstimateStatus procedure)
- [ ] Add approvedBy/approvedAt fields to estimates
- [ ] Wire audit log entries for every estimate state change
- [ ] Build approval UI with review comments
- [ ] Manager dashboard: override rate, accuracy trends, approval bottlenecks

### Feature 5: Estimated-vs-Actual Learning (Job Outcome Feedback)
- [x] Add jobOutcomes table (actual cost, hours, materials vs quoted)
- [x] Build "How did this job go?" outcome capture form (Accuracy Dashboard)
- [x] Variance analysis: quoted vs actual by trade, item type
- [x] Profitability dashboard: most/least profitable job types (Accuracy Dashboard)
- [ ] Feed variance data back into future AI estimates

### Feature 6: Xero Integration (OAuth, Contact Sync, Invoice Push)
- [x] Store Xero OAuth credentials (Client ID + Secret)
- [x] Build Xero OAuth connection flow (/api/xero/callback)
- [x] Xero fields on companyProfiles (tokens, tenant ID, refresh logic)
- [x] Contact sync: Kindai clients ↔ Xero contacts
- [x] Invoice push: quote line items → Xero invoice draft
- [x] Xero connection status in settings UI
- [x] "Push to Xero" button on EstimateBuilder
- [x] Dashboard navigation cards for Company Memory, Accuracy Dashboard, AI Takeoff
- [x] Inline editing for line items (double-click to edit, correction auto-captured)
- [x] 231 tests passing (all green)

## Labour Productivity Data Injection + Multi-Step Orchestrated Workflow

### Labour Productivity Data (scraped from Methvin, Resene, WireWise, Blacktown QS)
- [x] Create labourProductivity.ts with task-level hours for all trades
- [x] Inject electrical productivity data (hrs/GPO, hrs/light, hrs/panel, complexity multipliers)
- [x] Inject plumbing productivity data (hrs/fixture from Methvin)
- [x] Inject painting productivity data (hrs/m² by surface type from Resene)
- [x] Inject tiling productivity data (m²/hr by tile size and room size)
- [x] Inject plastering productivity data (hrs/m² render, hardwall, skim)
- [x] Wire labourProductivity.ts into AI prompt builder (buildTradePrompt)

### Multi-Step Orchestrated AI Workflow (5 steps with progress)
- [x] Create orchestratedTakeoff.ts with 5-step pipeline (SSE streaming)
- [x] Step 1: Plan Interpretation (project type, trades, scope detection)
- [x] Step 2: Quantity Extraction (per-room/section with confidence flags)
- [x] Step 3: Pricing Lookup (price book first, then market benchmarks)
- [x] Step 4: Business Rules (margin floors, compliance, missing-data flags)
- [x] Step 5: Draft Assembly (editable draft with per-item confidence scores)
- [x] Replace single-shot analyzePlan/visionTakeoff with orchestrated pipeline
- [x] Add streaming SSE endpoint for real-time step progress
- [x] Build frontend progress UI (5-step stepper with live updates via OrchestrationProgress component)
- [ ] Add per-item confidence indicators in estimate line items (future)

## Pricing Restructure + Landing Page Premium Refresh

### Pricing Tiers (Free / Pro / Business / Enterprise / Enterprise+)
- [x] Update Pricing page with new 5-tier structure (Free / Pro $149 / Business $499 / Enterprise $1,499 / Enterprise+ custom)
- [x] Free: 3 text takeoffs/mo, 1 vision/mo, 5 projects, no company memory
- [x] Pro $149/mo: 20 text/10 vision, company memory, correction learning, PDF export, 50 projects
- [x] Business $499/mo: unlimited takeoffs, orchestrated AI, Xero, accuracy dashboard, 3 team members
- [x] Enterprise $1,499/mo: 10 team members, white-label branding, priority support
- [x] Enterprise+ custom pricing: unlimited team, dedicated account manager, custom contract
- [x] Enterprise+ shows "Talk to Us" CTA instead of price
- [ ] Update Stripe products.ts with new tier names (future — requires Stripe product sync)

### Landing Page Premium Refresh
- [x] Update hero headline to: "From Plans to Quote in Minutes. AI That Learns Your Rates, Your Rules, Your Business."
- [x] Update hero subheadline to reflect company memory + learning loop
- [x] Update trust badges (company memory, correction learning, Xero integration)
- [x] Build premium animated footer (framer-motion orbs, animated divider, 4-column layout, all systems status)
- [ ] Add "How It Works" section showing 5-step orchestrated workflow (future)
- [ ] Update features section to include: Company Memory, Correction Learning, Xero Integration, Accuracy Dashboard (future)
- [ ] Add social proof / trust signals section (future)

## Mobile Hero & Header Cleanup
- [x] Mobile hero: keep only "From Plans to Quote in Minutes" as large branded headline
- [x] Mobile hero: move "AI That Learns Your Rates..." lower in page body with bold brand colouring
- [x] Mobile hero: add more white space / breathing room
- [x] Sticky header: transparent on scroll with blur transition
- [x] Header: make "Estimating Suite" text bolder and better designed
- [x] Add scroll-triggered scale-up animation to "AI That Learns" section

## Full Mobile Audit & Demo Prep
- [x] Audit all landing page sections on mobile (375px) — no overflow, no clipping
- [x] Fix AI chat widget positioning on mobile — no overlap with content
- [x] Ensure all buttons are tap-friendly (min 44px touch targets)
- [x] Verify all text is readable on mobile (no truncation, no overflow)
- [x] Check all inner pages on mobile (dashboard, AI takeoff, pricing, demo, about, beta)
- [x] Confirm site functions end-to-end for demo readiness

## Help & Documentation Page
- [x] Build /help page with tabbed sections: Getting Started, Scanning Best Practices, Plan Upload Guide, Supported Trades, FAQs
- [x] Scanning best practices: printer types, resolution tips, PDF vs image, phone photo guidance
- [x] Getting started guide: step-by-step for new users and enterprise teams
- [x] Plan upload guide: file types, size limits, quality tips
- [x] FAQ section: common questions answered concisely
- [x] Add Help link to site footer and nav
- [x] Make page enterprise-appropriate (clean, professional, no fluff)

## Multi-File Plan Upload Upgrade
- [x] Increase per-file size limit from 16MB to 32MB (server + frontend validation)
- [x] Support uploading up to 50 plan pages per job (AITakeoff + DemoMode) — enterprise requirement
- [x] Smart AI batching: process pages in groups of 5, merge results into single combined takeoff
- [x] Multi-file drag-and-drop UI with file list, thumbnails, and remove buttons
- [x] Progress indicator showing batch processing status (e.g. "Analysing pages 1-5 of 50...")
- [x] Show page count badge on upload zone (e.g. "12 pages uploaded")
- [x] Combined takeoff result merges all page analyses, deduplicates items, sums quantities
- [x] Update Help/Docs page with multi-page scanning guidance and enterprise workflow

## Company Logo Upload (Branded Quotes)
- [x] Add logoUrl field to company_profiles table in drizzle schema
- [x] Add uploadLogo tRPC procedure (S3 upload, returns URL)
- [x] Build logo upload UI in Trade Profile branding tab (upload + preview + remove)
- [x] Wire logoUrl into PDF quote generator (replace Kindai logo with company logo)
- [x] Wire logoUrl into email templates (show company logo in email header)
- [x] Show fallback to Kindai logo if no company logo uploaded

## Mobile Login Fix
- [x] Add Login button to mobile header so existing users can sign in on mobile
