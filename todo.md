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
