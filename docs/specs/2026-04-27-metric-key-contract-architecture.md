# Metric Key Contract Architecture

**Date:** 2026-04-27

## Scope

This repo does not currently use a `metrics` table. The live Supabase table is `public.ingestion_data`, and it behaves as the metrics store. This design keeps that table and refactors it into the canonical metrics contract instead of creating a second source of truth.

## Problem Summary

The current model has three structural failures:

1. `metric_key` is often extraction-order metadata instead of a business identifier.
2. `label` is polluted with formatted values such as `$159,122.89` or `4%`.
3. Frontend lookups still need fallbacks (`semantic_identifier`, labels, legacy keys), which means the contract is not stable.

The result is predictable:

- reads are fragile
- updates are hard to target
- new metrics increase ambiguity
- UI text and database identifiers are coupled incorrectly

## Target Contract

`metric_key` is the only durable identifier.

Rules:

- Use `metric_key` for all reads, writes, caching, and DOM bindings.
- Use `label` only for user-facing text.
- Use `value_numeric` as the canonical raw value.
- Use `value_display` as the rendered value returned by the backend.
- Use `value_type` to drive formatting rules.
- Never use `label` in `WHERE`, `PATCH`, or business logic.
- Treat `legacy_metric_key` as migration-only history.
- Treat `semantic_identifier` as deprecated compatibility debt and remove it after the runtime no longer selects it.

## Recommended Key Format

Use lowercase snake case.

Pattern:

`<module>_<business_metric>_<qualifier>`

Examples:

- `taxes_property_tax_year_1`
- `taxes_tax_rate`
- `insurance_premium_annual`
- `mortgage_total_due`
- `gp_total_gp_sponsors`

Rules:

- prefer business meaning over UI structure
- do not encode DOM paths, view names, or extraction indexes
- do not encode formatting in the key
- include the module prefix to keep global uniqueness simple
- suffix duplicates only when the business concept is actually repeated, for example `_year_1`, `_year_2`

## Final Table Schema

Canonical fields:

```sql
create table public.ingestion_data (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  mockup_key text not null default 'default',
  metric_key text not null unique,
  legacy_metric_key text,
  label text not null,
  value_numeric numeric,
  value_display text not null,
  value_type text not null default 'text',
  currency text,
  metric_group text,
  sort_order integer,
  is_editable boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  source_file text,
  source_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Compatibility fields that should be retired after runtime cleanup:

- `display_label`
- `search_label`
- `ui_context`
- `semantic_identifier`

They can remain temporarily to avoid breaking the current JS runtime, but they are not part of the long-term contract.

## Backend Contract

### Read

`GET /api/metrics?module=taxes`

Response row shape:

```json
{
  "metric_key": "taxes_property_tax_year_1",
  "label": "Property Tax Year 1",
  "value_numeric": 159122.89,
  "value_display": "$159,122.89",
  "value_type": "currency",
  "module": "taxes"
}
```

### Update Value

`PATCH /api/metrics`

Request:

```json
{
  "metric_key": "taxes_property_tax_year_1",
  "value_numeric": 161000.00
}
```

Rules:

- the request key is always `metric_key`
- the backend finds the row by `metric_key`
- the backend updates `value_numeric`
- the backend regenerates `value_display`
- the backend returns the updated row

### Update Label

If labels are editable from an admin UI, still update by `metric_key`.

Request:

```json
{
  "metric_key": "taxes_property_tax_year_1",
  "label": "Property Tax Year 1"
}
```

This does not change the metric identity because the identity is the key, not the text.

## Frontend Contract

Frontend responsibilities:

- render `label`
- render `value_display`
- keep `metric_key` in component state or `data-metric-key`
- send only `metric_key` plus edited raw value on save

Do not do this:

- infer identity from visible text
- search by label
- rebuild keys client-side
- store business logic in DOM order

## Migration Strategy

### Phase 1. Preserve Existing Identity For Audit

Copy the current generated/extraction key into `legacy_metric_key`.

This gives a rollback handle and keeps lineage for debugging.

### Phase 2. Repair Labels

Rebuild `label` from the best human-readable source:

Priority:

1. `display_label`
2. `search_label`
3. `ui_context`
4. `source_context`
5. existing `label` only if it is not obviously a formatted value

Reject labels that look like:

- currency values
- percentages
- plain numerics
- placeholders like `-`, `N/A`, `null`

### Phase 3. Generate Stable Semantic Keys

Generate a base key from `module + cleaned label`, then slug it.

Example:

- module: `taxes`
- cleaned label: `Property Tax Year 1`
- key: `taxes_property_tax_year_1`

If duplicates remain after slugging, suffix them deterministically:

- `taxes_property_tax_year_1`
- `taxes_property_tax_year_1_2`

### Phase 4. Keep Compatibility Columns Temporarily

Until the runtime stops reading them:

- mirror cleaned `label` into `display_label`
- mirror cleaned `label` into `search_label`
- stop depending on `semantic_identifier`

### Phase 5. Update Runtime

Required follow-up in this repo:

- remove semantic-first lookup from [assets/js/supabase-data.js](/c:/Users/migue/OneDrive/Documents/valoris/XCREOS/mockups/mockup-product/assets/js/supabase-data.js)
- stop selecting `semantic_identifier` in [api/_lib/metrics.js](/c:/Users/migue/OneDrive/Documents/valoris/XCREOS/mockups/mockup-product/api/_lib/metrics.js)
- make the metrics editor show `label` as the primary caption in [assets/js/index-metrics-editor.js](/c:/Users/migue/OneDrive/Documents/valoris/XCREOS/mockups/mockup-product/assets/js/index-metrics-editor.js)
- update value saves so backend formatting is authoritative

## Dynamic Metrics

The structure supports new metrics without schema changes.

To add a new metric:

1. choose a stable semantic `metric_key`
2. choose a user-facing `label`
3. store raw numeric value in `value_numeric`
4. let the backend produce `value_display`
5. optionally assign `module`, `mockup_key`, `metric_group`, and `sort_order`

## Best Practices

- Define keys in seed/migration scripts, not in browser code.
- Keep label edits non-breaking by never using label as identity.
- Prefer backend-controlled formatting for `value_display`.
- Make `metric_key` globally unique.
- Add `mockup_key` and `metric_group` now so future mockups do not require schema churn.
- Keep a `legacy_metric_key` only during migration and audit windows.
- Use RLS intentionally. Supabase requires a matching `SELECT` policy for `UPDATE` to work.

## Warnings

- Do not keep both `metric_key` and `semantic_identifier` as active identifiers. That recreates the same ambiguity with better names.
- Do not accept frontend updates by label, even as a fallback.
- Do not generate new keys from current UI text after go-live. Key creation belongs in controlled ingestion/admin flows.
- Do not let the frontend submit both `value_numeric` and an arbitrary `value_display` as if both were authoritative.

## Supabase Notes

Relevant Supabase guidance verified on 2026-04-27:

- Supabase RLS docs state that `UPDATE` also needs a corresponding `SELECT` policy.
- Supabase Realtime docs still use `alter publication supabase_realtime add table ...` for Postgres changes.

Sources:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
