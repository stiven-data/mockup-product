create extension if not exists unaccent;

create or replace function public.make_metric_slug(input_text text)
returns text
language sql
stable
as $$
  select trim(
    both '_' from regexp_replace(
      regexp_replace(
        lower(unaccent(coalesce(input_text, ''))),
        '[^a-z0-9]+',
        '_',
        'g'
      ),
      '_+',
      '_',
      'g'
    )
  );
$$;

create or replace function public.is_probably_display_value(input_text text)
returns boolean
language sql
stable
as $$
  select
    coalesce(trim(input_text), '') = ''
    or lower(trim(input_text)) in ('-', 'n/a', 'na', 'null', 'undefined')
    or trim(input_text) ~ '^[\$]?\s*[-+]?\d[\d,]*(\.\d+)?\s*%?$';
$$;

create or replace function public.resolve_metric_label(
  raw_label text,
  display_label text,
  search_label text,
  ui_context text,
  source_context text,
  module_name text,
  row_id uuid
)
returns text
language plpgsql
stable
as $$
declare
  candidate text;
  candidates text[] := array[
    display_label,
    search_label,
    ui_context,
    source_context,
    raw_label
  ];
begin
  foreach candidate in array candidates loop
    candidate := nullif(trim(candidate), '');
    if candidate is not null and not public.is_probably_display_value(candidate) then
      return candidate;
    end if;
  end loop;

  return initcap(replace(coalesce(module_name, 'metric'), '_', ' ')) || ' Metric ' || left(row_id::text, 8);
end;
$$;

alter table public.ingestion_data
  add column if not exists legacy_metric_key text,
  add column if not exists mockup_key text not null default 'default',
  add column if not exists metric_group text,
  add column if not exists sort_order integer,
  add column if not exists is_editable boolean not null default true,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.ingestion_data
set legacy_metric_key = metric_key
where coalesce(legacy_metric_key, '') = ''
  and coalesce(metric_key, '') <> '';

with prepared as (
  select
    id,
    module,
    public.resolve_metric_label(
      label,
      display_label,
      search_label,
      ui_context,
      source_context,
      module,
      id
    ) as clean_label
  from public.ingestion_data
),
ranked as (
  select
    p.id,
    p.clean_label,
    public.make_metric_slug(p.module || ' ' || p.clean_label) as base_metric_key,
    row_number() over (
      partition by public.make_metric_slug(p.module || ' ' || p.clean_label)
      order by d.metric_key, d.id
    ) as duplicate_sequence
  from prepared as p
  join public.ingestion_data as d
    on d.id = p.id
),
finalized as (
  select
    id,
    clean_label,
    case
      when duplicate_sequence = 1 then base_metric_key
      else base_metric_key || '_' || duplicate_sequence
    end as final_metric_key
  from ranked
)
update public.ingestion_data as t
set
  metric_key = f.final_metric_key,
  label = f.clean_label,
  display_label = f.clean_label,
  search_label = f.clean_label
from finalized as f
where t.id = f.id;

alter table public.ingestion_data
  alter column metric_key set not null,
  alter column label set not null,
  alter column value_type set not null,
  alter column value_display set not null,
  alter column mockup_key set not null,
  alter column is_editable set not null,
  alter column metadata set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ingestion_data_metric_key_slug_chk'
      and conrelid = 'public.ingestion_data'::regclass
  ) then
    alter table public.ingestion_data
      add constraint ingestion_data_metric_key_slug_chk
      check (metric_key = public.make_metric_slug(metric_key));
  end if;
end;
$$;

create index if not exists ingestion_data_mockup_key_idx on public.ingestion_data (mockup_key);
create index if not exists ingestion_data_metric_group_idx on public.ingestion_data (metric_group);

comment on column public.ingestion_data.metric_key is
'Stable semantic identifier used by frontend and backend for all reads and writes.';

comment on column public.ingestion_data.legacy_metric_key is
'Previous extraction/generated key retained for audit, rollback, and one-time migration support.';

comment on column public.ingestion_data.label is
'User-facing metric label. Safe to edit. Never use as a technical identifier.';

comment on column public.ingestion_data.semantic_identifier is
'Deprecated compatibility column. Do not use for reads or writes.';
