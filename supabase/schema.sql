create extension if not exists pgcrypto;

create table if not exists ingestion_data (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  metric_key text not null unique,
  label text not null,
  value_numeric numeric,
  value_display text not null,
  value_type text not null default 'kpi',
  currency text,
  source_file text,
  source_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ingestion_data_module_idx on ingestion_data (module);

alter table ingestion_data enable row level security;

drop policy if exists "Public read ingestion data" on ingestion_data;

create policy "Public read ingestion data"
on ingestion_data
for select
to anon
using (true);
