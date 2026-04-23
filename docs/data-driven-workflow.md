# Data-Driven Workflow

## Goal

Convert static mockups into a simple dynamic system without rebuilding the frontend.

## Flow

1. Metrics are extracted from source HTML and workbook-backed mortgage data.
2. The curated dataset is stored in `public.ingestion_data`.
3. `api/metrics.js` reads the requested keys or module from Supabase.
4. Frontend HTML pages call `/api/metrics` on load.
5. Elements tagged with `data-metric-key` are updated in place.
6. Each metric keeps lightweight traceability through `source_file` and `source_context`.

## Why this shape

- Keeps the existing HTML mockups intact.
- Avoids adding a frontend framework too early.
- Gives a clean story for presentation: source -> database -> API -> UI.
- Leaves room to grow later into admin, automation, or historical snapshots.

## Minimal database design

Table: `ingestion_data`

- `module`
- `metric_key`
- `label`
- `value_numeric`
- `value_display`
- `value_type`
- `currency`
- `source_file`
- `source_context`
- `updated_at`

## Deployment checklist

1. Push the repo to Vercel.
2. Set `SUPABASE_URL`.
3. Set `SUPABASE_PUBLISHABLE_KEY`.
4. Confirm `public.ingestion_data` exists in Supabase.
5. Refresh any module page and verify values load from `/api/metrics`.
