# Testing Supabase Dynamic Values Design

Date: 2026-04-23
Branch: `Testing`
Scope: `modules/taxes`, `modules/insurance`, `modules/Gp`, `modules/mortgage`

## Summary

Make the `Testing` branch module pages load displayed values from Supabase through the existing Vercel API layer, without changing layout, copy, or visual design. Supabase becomes the primary source for displayed values when a matching metric exists. Missing Supabase rows must surface visibly in the UI so the team can identify fields that still require data population.

## Goals

- Keep all current module layouts and styling intact.
- Use the existing `Testing` branch architecture built around `Supabase + Vercel API + HTML/JS`.
- Ensure each module page requests dynamic values from Supabase.
- Ensure all displayed values on each module can be hydrated from Supabase when rows exist.
- Show a consistent missing-state token for bound fields when Supabase does not provide a value.
- Preserve the current Vercel preview and deployment flow on the `Testing` branch.

## Non-Goals

- No design refresh or content rewrite.
- No frontend framework migration.
- No attempt to normalize every descriptive text field into Supabase in this pass.
- No branch work outside `Testing`.

## Current State

The `Testing` worktree already contains:

- `api/metrics.js` for reading and writing Supabase-backed rows.
- `api/public-config.js` for browser realtime bootstrap.
- `assets/js/supabase-data.js` as the shared frontend runtime for fetching metrics and applying them to `data-metric-key` elements.
- Supabase seed and setup files that already include dynamic rows for taxes, insurance, GP, and selected mortgage metrics.

The gap is page wiring. The module pages still render static values directly in HTML or module-specific JavaScript, and the shared Supabase runtime is not yet attached to the displayed fields in a consistent way.

## Recommended Approach

Use a shared DOM-annotation approach across modules.

1. Add stable `data-metric-key` bindings to displayed value fields.
2. Load the shared `assets/js/supabase-data.js` runtime on each module page.
3. Let the runtime request values from `/api/metrics` and replace the bound DOM content.
4. Replace fallback-static rendering for bound fields with a visible missing-state token when Supabase does not return a row.

This approach reuses the architecture already present in `Testing`, keeps changes localized, and avoids page-by-page custom fetching logic except where mortgage needs a small bridge after workbook rendering.

## Data Behavior

### Source of Truth

For displayed values, Supabase is the primary source of truth on the `Testing` branch.

- If a matching Supabase row exists, the UI displays the Supabase value.
- If a matching Supabase row does not exist, the UI displays a consistent missing-state token.
- The page must not silently keep the old static or workbook-derived displayed value for bound fields.

### Missing-State Rule

Missing Supabase values are intentional signals, not silent fallbacks.

- Bound fields should render a clear placeholder such as `Missing` or `Missing in Supabase`.
- The placeholder should be text-only and use existing page styles so no design work is introduced.
- This behavior helps QA, content loading, and data validation during preview and production checks.

### Runtime Failure Rule

If `/api/metrics` fails entirely:

- The page structure should still load.
- Bound fields should move into the same missing/error state rather than pretending the original static values are current.
- Console logging can remain for diagnosis, but the visible UI behavior should continue to surface that dynamic data is unavailable.

## Module Design

### Taxes

Taxes is the cleanest fit for direct annotation.

- Wrap displayed numeric, currency, percent, and count values in stable `data-metric-key` elements.
- Load the shared Supabase runtime on the page.
- Keep labels, narrative notes, headings, and table copy static.
- Use the existing seeded metrics where possible and extend the seed generation if additional visible values need keys.

### Insurance

Insurance follows the same annotation pattern as taxes, with one additional structured area.

- Bind the visible stat cards, coverage values, premium values, and trend table values to metric keys.
- Keep the page structure and inline trend-chart rendering intact.
- Update the inline trend renderer so the values it prints are sourced from Supabase-backed rows when available.
- If a trend metric is missing, the corresponding rendered output should visibly show the missing-state token rather than a stale hardcoded amount.

### GP

GP is also a direct annotation case.

- Bind displayed capital amounts, percentages, counts, and table values.
- Preserve the current deal structure, sponsor summary, and partner mapping layout.
- Leave narrative text and labels static.

### Mortgage

Mortgage requires a small bridge because the page is currently rendered from workbook-backed JavaScript instead of static annotated HTML.

- Keep `current-debt-data.js` as the structural page input for now.
- Continue using the existing mortgage rendering code to build cards, table rows, detail rows, and snapshot rows.
- After the mortgage page renders, attach stable metric keys to the visible value outputs and run a Supabase hydration pass over them.
- Bound mortgage values must show the missing-state token when Supabase rows are absent, even if the workbook JS has a default value.

This keeps the module structure intact while making Supabase the effective source for displayed values.

## Metric Keys and Seed Data

The implementation should prefer deterministic, stable metric keys tied to visible fields.

- Reuse the existing extracted keys for taxes, insurance, and GP where the current seed pipeline already matches visible values.
- Extend the annotation and extraction scripts where necessary so every displayed value that should be dynamic has a key and an entry path into Supabase seed files.
- Keep the mortgage hand-authored metrics for workbook-derived outputs, and add new keys if the page currently renders values that are not yet represented in Supabase.

## API and Frontend Contract

No major API redesign is required.

- Continue using `GET /api/metrics` for reads.
- Continue using `/api/public-config` for realtime bootstrap.
- Continue using `assets/js/supabase-data.js` as the shared runtime.

Frontend work should focus on:

- ensuring each module page loads the shared runtime,
- ensuring each module exposes all intended displayed values to that runtime,
- ensuring missing rows are rendered visibly rather than hidden by local defaults.

## Verification Plan

Verification should confirm behavior at three levels.

### Local/Code Verification

- Module pages include the shared runtime script.
- Bound fields are present for all intended displayed values.
- Tests continue to pass, and any new helper behavior has focused coverage if logic changes are introduced.

### Preview Verification

- Open each module page on the `Testing` Vercel preview.
- Confirm the page requests `/api/metrics`.
- Confirm Supabase-backed values appear in the UI.
- Confirm missing rows visibly render the missing-state token.

### Live Data Verification

- Update one or more rows in Supabase for each module.
- Refresh or wait for realtime update behavior.
- Confirm the corresponding displayed field changes without a code redeploy.

## Risks

- Existing extraction scripts currently focus on values that are easy to detect in HTML. Some structured or JS-rendered outputs may need targeted key assignment.
- Mortgage has the highest implementation risk because values are rendered through workbook-backed JavaScript before they can be replaced.
- If missing-state handling is too aggressive at the runtime level, it could affect pages or fields that are not yet meant to be dynamic. The implementation should scope missing-state behavior to explicitly bound fields only.

## Implementation Boundaries

This design is intentionally narrow.

- Work only in the `Testing` branch/worktree.
- Do not change the visual design.
- Do not broaden scope into admin tooling or schema redesign.
- Focus on getting every module page to display Supabase values when available and visibly expose missing rows when not.
