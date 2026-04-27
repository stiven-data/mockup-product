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
