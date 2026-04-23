# Mockup Product Feature Platform Homepage

Static HTML mockups converted into a simple data-driven demo using `Supabase + Vercel API`.

## Architecture

- `Supabase`: stores the KPI dataset in `public.ingestion_data`
- `Vercel API`: exposes `/api/metrics` for reads and writes plus `/api/public-config` for browser realtime bootstrap
- `HTML/JS`: each view keeps its existing structure and replaces hardcoded values through `data-metric-key`

## Current modules

- `mortgage`
- `insurance`
- `taxes`
- `gp`

## Supabase setup

1. Run `supabase/schema.sql`
2. Run `supabase/seed_ingestion_data.sql`

## Vercel env vars

Copy `.env.example` into Vercel project environment variables:

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
6. Realtime subscriptions refresh open pages when the same metric changes remotely.
7. Hovering a dynamic metric shows basic source traceability.
