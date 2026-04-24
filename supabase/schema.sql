create extension if not exists pgcrypto;

create table if not exists ingestion_data (
  id uuid primary key default gen_random_uuid(),
  module text not null,
  metric_key text not null unique,
  semantic_identifier text,
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
create index if not exists ingestion_data_semantic_identifier_idx on ingestion_data (semantic_identifier);

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
