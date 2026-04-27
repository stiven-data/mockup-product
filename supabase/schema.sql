create extension if not exists pgcrypto;

create table if not exists ingestion_data (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  metric_key text not null unique,
  legacy_metric_key text,
  label text not null,
  display_label text,
  search_label text,
  value_numeric numeric,
  value_display text not null,
  value_type text not null default 'kpi',
  currency text,
  source_file text,
  source_context text,
  ui_context text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists ingestion_data
add column if not exists legacy_metric_key text;

alter table ingestion_data add column if not exists display_label text;
alter table ingestion_data add column if not exists search_label text;
alter table ingestion_data add column if not exists ui_context text;

create or replace function public.set_ingestion_data_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ingestion_data_updated_at on ingestion_data;

create trigger set_ingestion_data_updated_at
before update on ingestion_data
for each row
execute function public.set_ingestion_data_updated_at();

create index if not exists ingestion_data_module_idx on ingestion_data (module);
create index if not exists ingestion_data_legacy_metric_key_idx on ingestion_data (legacy_metric_key);
create index if not exists ingestion_data_search_label_idx on ingestion_data (search_label);

update ingestion_data
set
  display_label = coalesce(nullif(display_label, ''), nullif(search_label, ''), nullif(label, '')),
  search_label = coalesce(nullif(search_label, ''), nullif(display_label, ''), nullif(label, '')),
  ui_context = coalesce(nullif(ui_context, ''), nullif(source_context, ''))
where
  display_label is null
  or display_label = ''
  or search_label is null
  or search_label = ''
  or ui_context is null
  or ui_context = '';

alter table ingestion_data enable row level security;

drop policy if exists "Public read ingestion data" on ingestion_data;
drop policy if exists "Public update ingestion data" on ingestion_data;

create policy "Public read ingestion data"
on ingestion_data
for select
to anon
using (true);

create policy "Public update ingestion data"
on ingestion_data
for update
to anon
using (true)
with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'ingestion_data'
  ) then
    alter publication supabase_realtime add table ingestion_data;
  end if;
exception
  when undefined_object then
    null;
end;
$$;
