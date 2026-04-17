# Mortgage Decision Dashboard Design

**Date:** 2026-04-17

**Module:** `modules/mortgage/views`

**Goal:** Refactor the existing mortgage executive dashboard mockup into a decision-support screen for internal asset management teams, using standard multifamily benchmarks and the mortgage data already derived from Oasis at San Marco.

## Problem Summary

The current mockup reads as an informative KPI dashboard, but it does not yet behave like a mortgage decision surface. It shows status and trends, but it does not clearly answer:

- Is the mortgage healthy or at risk?
- What changed recently?
- What is driving the risk or opportunity?
- What should the team do now?
- Where should they act first?

The main gaps are:

- top-level KPIs are not mortgage-health first
- alerts are visible but not tightly linked to financial impact
- refinancing is shown as a generic option set rather than a recommendation frame
- priorities feel operational instead of financial and strategic
- trends exist, but the relationship between asset performance and mortgage safety is not explicit enough

## Design Direction

Keep the current page concept, page name, and five-block structure, but elevate the content into an institutional real estate dashboard that supports mortgage decisions in under 30 seconds of scanning.

The screen should feel:

- executive and concise
- mortgage-health oriented
- visually hierarchical
- benchmark-aware
- financially actionable

## Benchmarks

Use standard multifamily mock benchmarks for the visual states:

- `DSCR`
  - healthy: `>= 1.25x`
  - watchlist: `1.10x - 1.24x`
  - critical: `< 1.10x`
- `LTV`
  - healthy: `<= 65%`
  - watchlist: `66% - 75%`
  - critical: `> 75%`
- `Debt Yield`
  - healthy: `>= 8.0%`
  - watchlist: `6.5% - 7.9%`
  - critical: `< 6.5%`
- `Escrow Runway`
  - healthy: `>= 3.0 months`
  - watchlist: `2.0 - 2.9 months`
  - critical: `< 2.0 months`

## Data Model For Mockup

Keep the page static and local, with the JavaScript owning all mock-calculation logic.

Use the existing derived data and add the following mortgage-health calculations:

- `NOI`
  - use the T12 NOI value from the operating statement
- `Debt Yield`
  - `T12 NOI / current principal balance`
- `Debt Service`
  - use current monthly debt service and annualize when needed
- `DSCR`
  - mock as `NOI / annual debt service`
- `LTV`
  - derive from current loan balance and a mocked current valuation aligned with refi context
- `Escrow Runway`
  - `ending escrow balance / monthly escrow need`
- `Mortgage Health Score`
  - compact score or status based on DSCR, LTV, Debt Yield, escrow runway, and trend deterioration
- `Refinance Spread`
  - `current rate - market rate`
- `Estimated Annual Savings`
  - current annual interest carry vs refinance annual carry

## Screen Structure

### 1. Overview

Replace generic KPI logic with mortgage-health KPI cards.

Primary cards:

- `DSCR`
- `LTV`
- `NOI`
- `Debt Yield`
- `Escrow Runway` or `Current Rate`

Each card must show:

- current value
- direction vs prior period
- benchmark or target
- clear state: healthy, watchlist, critical

Add a compact top issue strip below the cards with 2-3 most important pressures, such as:

- DSCR below target
- Debt yield below healthy range
- Escrow runway tightening

### 2. Executive Decision Box

Add a prominent recommendation panel near the top, inside the Overview section or immediately below it.

This box answers:

- what should the asset manager do now
- why now
- what the expected impact is

Example content pattern:

- recommendation: refinance in next 90 days
- drivers:
  - DSCR below target
  - current rate above market
  - escrow cushion below preferred range
- impact:
  - annual savings
  - lower refinancing risk

Keep copy short and directive.

### 3. Trends

Keep three trend panels, but refocus them around mortgage safety:

- `NOI vs Debt Service`
- `Escrow balance / escrow runway`
- `Leverage trend` using principal or LTV

Optional if layout permits:

- `DSCR trend`
- `current rate vs market rate`

Each trend panel should include:

- a simple line chart
- a comparison chip
- one short insight line
- anomaly highlighting when a point is out of range

### 4. Alerts / Early Warnings

Alerts must become severity-based and mortgage-specific.

Each alert card should include:

- title
- severity
- why it matters
- financial or risk impact
- suggested action

Examples:

- DSCR below threshold
- escrow below 2 months of required coverage
- revenue leakage creating coverage compression
- refinance opportunity due to rate spread
- maturity or repricing pressure

### 5. Drivers / Segmentation

This section should clearly connect asset operations to mortgage performance.

Use three panels:

- `Revenue Leakage`
  - vacancy, bad debt, concessions
  - frame these as NOI compression drivers
- `Unit / Occupancy Exposure`
  - unstable units, notice, evict, vacant-rented
  - frame as cash flow and coverage risk
- `Refi Window / Capital Options`
  - current loan rate
  - market rate
  - spread in bps
  - annual savings estimate
  - takeout gap
  - recommendation status: monitor, evaluate, act now

### 6. Priorities

The table should feel like a financial action plan.

Columns:

- Priority
- Area
- Signal / Issue
- Financial Impact
- Risk Level
- Recommendation
- Owner
- Timing

Rows should mix:

- refinance analysis
- escrow sufficiency review
- collections improvement
- vacancy reduction in highest-risk units
- covenant monitoring

## Visual Rules

- preserve current title and subtitle logic
- preserve current five sections
- keep the page static and local
- keep text short and visual-first
- use color intentionally:
  - green for healthy
  - amber for watchlist
  - red for critical
- keep charts simple and consistent
- keep insights to one line where possible

## Files To Update

- `modules/mortgage/views/index.html`
- `modules/mortgage/views/styles.css`
- `modules/mortgage/views/script.js`

## Expected Outcome

After the refactor, the page should clearly answer:

1. Is this mortgage healthy or at risk?
2. What changed recently?
3. What is driving the risk or opportunity?
4. What should the team do now?
5. Where should they act first?
