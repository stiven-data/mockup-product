# Mockup Product Feature Platform Homepage

Static HTML mockups converted into a simple data-driven demo using `Supabase + Vercel API`.

## Architecture

- `Supabase`: stores the KPI dataset in `public.ingestion_data`
- `Vercel API`: exposes `/api/metrics` for reads and writes plus `/api/public-config` for browser realtime bootstrap
- `Browser fallback`: if `/api/metrics` is unavailable, the pages fall back to direct Supabase access with the publishable key
- `HTML/JS`: each view keeps its existing structure and replaces hardcoded values through `data-metric-key`

## Current modules

- `mortgage`
- `insurance`
- `taxes`
- `gp`

## Supabase setup

1. Run `supabase/schema.sql`
2. Run `supabase/seed_ingestion_data.sql`

`ingestion_data` now supports safe label enrichment without changing `metric_key`:

- `label`: legacy/raw label kept for compatibility
- `display_label`: preferred human label shown by the editor
- `search_label`: human/searchable text used by the editor filter
- `ui_context`: frontend text context used for traceability/backfill

## Vercel env vars

Copy `.env.example` into the active Vercel project environment variables for both `Preview` and
`Production`:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Local verification

Run:

```powershell
node --test
```

## Workflow summary

1. Source metrics are extracted from repo mockups and workbook-backed JS.
2. Data is loaded into `ingestion_data`.
3. HTML views request metrics from `/api/metrics`.
4. Matching `data-metric-key` spans are replaced on page load.
5. `index.html` includes a live editor for existing rows in `public.ingestion_data`.
6. The editor only changes `value_display`, `value_numeric`, and `source_context` so metric wiring
   stays stable.
7. Realtime subscriptions refresh open pages when the same metric changes remotely.
8. Hovering a dynamic metric shows basic source traceability.
