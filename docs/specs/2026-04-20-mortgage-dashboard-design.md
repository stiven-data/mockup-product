# Mortgage Dashboard Design

Date: 2026-04-20
Module: `mockup-product/modules/mortgage`
Primary view target: `views/operational_view.html`
Scope: Mortgage strategic and operational mockups built only from mortgage statement data, with explicit handling of missing fields.

## Goal

Design two separate mortgage dashboard views that support decision-making using only data available from mortgage statements. The design must not invent fields, infer unavailable values, or silently fill data gaps.

The two views serve different decision horizons:

- Strategic view: high-level monthly evolution and current-loan summary.
- Operational view: statement-by-statement detail, validation, and gap management.

## Product Principles

- Use only data that is present in the mortgage statements or in the statement-derived monthly tracking dataset.
- Never fabricate missing fields such as contacts, servicer data, loan term, start date, or maturity date.
- Make data gaps visible in the UI instead of hiding the component.
- Keep the language descriptive rather than inferential unless a rule is explicitly supported by data.
- Separate executive reading from operational handling.

## Confirmed Design Decisions

- Use two separate views rather than one combined page.
- Default the strategic chart to the last 12 months.
- Group source tracing in a side panel rather than inline on every card.
- Keep missing contacts and servicer information visible as documented gaps.

## Available Data Confirmed From Current Mortgage Tracking

The current module already contains a statement-derived monthly series with these fields:

- `statementDate`
- `principalBalance`
- `taxEscrow`
- `insuranceEscrow`
- `otherEscrow`

The existing operational mockup also uses `totalDue` and `endingEscrowBalance`, but this design is centered on the statement-backed monthly components required by the user:

- Interest
- Taxes
- Insurance

Where a required field is not present in the currently accessible statement-backed dataset, the UI must show that as a gap instead of substituting another field.

## Known Gaps That Must Stay Visible

Unless explicitly present in the statements, the following must render as missing:

- Key contacts
- Contact email
- Contact phone
- Contact role
- Servicer details
- Loan amount
- Loan term
- Start date
- Maturity date

Recommended label pattern:

- `Not available in statements`
- `Missing from statements`
- `Required for operations, not present in available mortgage statements`

## View 1: Strategic Dashboard

### Purpose

Help a decision-maker understand how the monthly mortgage burden is evolving and what the latest statement says about the loan, without forcing them into document-level detail.

### Screen Structure

1. Header
2. Monthly components chart
3. Loan overview card
4. Servicer card
5. Key contacts card
6. Latest statement insight strip

### Component Hierarchy

#### 1. Header

Fields:

- Asset / loan name
- Date range label: `Last 12 months`
- Latest statement date

Why it matters:

- Establishes the reading frame immediately and avoids ambiguity about the time window.

#### 2. Monthly Components Chart

Primary visual on the page.

Series:

- `Interest`
- `Taxes`
- `Insurance`

Rules:

- Show the latest 12 monthly statements by default.
- Allow an optional toggle between `12M` and `All statements`.
- Use the statement month on the x-axis.
- If a component is missing for a month, display it as missing rather than interpolating.

Why it matters:

- Lets users see whether monthly burden changes are driven by financing cost, tax impounds, or insurance impounds.

#### 3. Loan Overview Card

Priority: high.

Display only fields explicitly supported by statements. Expected fields:

- `Outstanding balance`
- `Interest rate`
- `Statement date`
- `Due date`
- `Monthly total due`
- `Interest amount`
- `Tax escrow`
- `Insurance escrow`
- `Other escrow`, if present

If requested but unsupported by statements, render:

- `Loan amount`: `Not available in statements`
- `Loan term`: `Not available in statements`
- `Start date`: `Not available in statements`
- `Maturity date`: `Not available in statements`

Why it matters:

- Concentrates the latest loan state in one place and makes data coverage explicit.

#### 4. Servicer Card

Priority: medium.

Behavior:

- If the statement contains servicer or remittance entity details, show them.
- Otherwise show the card in a gap state.

Gap microcopy:

- `Servicer information is not present in the available mortgage statements.`

Why it matters:

- Supports operational follow-through and also highlights documentation risk.

#### 5. Key Contacts Card

Priority: medium.

Expected fields if present:

- Name
- Role
- Email
- Phone

Default state in this project unless statement-backed:

- Visible card
- Gap badge
- Empty values replaced with `Not available in statements`

Why it matters:

- Keeps operational needs visible without pretending the source includes them.

#### 6. Latest Statement Insight Strip

Short descriptive summary based only on the latest statement and month-over-month comparison.

Allowed insight patterns:

- Largest component in latest statement
- Month-over-month increase or decrease
- Count of missing fields in summary cards

Disallowed:

- Risk labels that imply business rules not present in the data
- Liquidity or credit conclusions unsupported by the statements

Why it matters:

- Speeds comprehension while staying grounded in facts.

### Strategic Interactions

- Default filter: `Last 12 months`
- Optional toggle: `12M / All statements`
- Hover on chart: show month and exact values for `Interest`, `Taxes`, and `Insurance`
- Click on chart month: open operational view filtered to that statement

## View 2: Operational Dashboard

### Purpose

Help operators validate statement history, inspect a selected month, and understand which required fields are missing from the statements.

### Screen Structure

1. Header
2. Monthly statement table
3. Statement detail panel
4. Source and data gaps side panel
5. Operational servicer and contacts cards

### Component Hierarchy

#### 1. Header

Fields:

- Asset / loan name
- Active statement filter if one is selected
- Latest available statement

Why it matters:

- Maintains context when moving from summary to detail.

#### 2. Monthly Statement Table

Primary component on the page.

Columns:

- `Statement date`
- `Principal / outstanding balance`
- `Interest`
- `Taxes`
- `Insurance`
- `Other escrow`
- `Total due`
- `Source reference`

Rules:

- Sort by `statement date desc`
- Never backfill or estimate missing cells
- Missing values render as `Missing in statement`

Why it matters:

- Gives finance and operations teams a month-by-month audit surface.

#### 3. Statement Detail Panel

Opens when a table row is selected.

Contents:

- Full field list for that statement
- Component breakdown
- Highlighted missing fields

Why it matters:

- Turns a chart anomaly or table question into a usable operational investigation flow.

#### 4. Source & Data Gaps Sidebar

Persistent or collapsible side panel.

Sections:

- `Available from statements`
- `Missing from statements`
- `Latest source used`

Why it matters:

- Makes data quality visible and prevents the product from appearing incomplete when the real issue is source coverage.

#### 5. Operational Servicer / Contacts Cards

These remain visible in the operational view, but with stronger emphasis on actionability and gaps.

Gap microcopy:

- `This information is required for operations but is not present in the available mortgage statements.`

Why it matters:

- Keeps missing operational data visible where users feel the pain most.

### Operational Interactions

- Table sorted by latest statement first
- Row click opens the statement detail panel
- Side panel groups tracing instead of repeating it inline
- Optional utility filters:
  - `Show gaps only`
  - `Open latest statement`
  - Date range filter for audit review

## Data Display Rules

### Allowed

- Raw statement values
- Month-over-month descriptive comparisons
- Missing-state labels
- Availability labels such as `latest`, `historical`, `missing`

### Not Allowed

- Derived business-risk scores not explicitly defined by the product
- Financial conclusions requiring external context
- Silent substitution of non-statement fields into statement-driven cards
- Invented contact, lender, or lifecycle data

## Content and Tone Rules

Use descriptive language:

- `Taxes increased vs prior month`
- `Insurance is the largest tracked component in the latest statement`
- `Maturity date is not available in statements`

Avoid unsupported interpretation:

- `Tax pressure is becoming a liquidity risk`
- `The loan is operationally stressed`

## Recommended Visual Language

- Clean financial-dashboard layout
- Clear sectioning between summary and detail
- Neutral missing-data states with amber emphasis
- Cards, charts, and tables only where directly useful
- No decorative metrics without decision value

## Outcome

This design creates:

- One strategic view for fast executive reading
- One operational view for monthly validation and follow-through
- Explicit visibility into what statements do and do not contain
- A dashboard structure that supports decision-making without overstating the quality or completeness of the data
