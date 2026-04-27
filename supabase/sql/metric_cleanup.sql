-- Preview rows where label looks like a formatted value instead of UI text.
select
  id,
  module,
  metric_key,
  label as current_label,
  display_label,
  search_label,
  ui_context,
  source_context,
  public.resolve_metric_label(
    label,
    display_label,
    search_label,
    ui_context,
    source_context,
    module,
    id
  ) as proposed_label
from public.ingestion_data
where public.is_probably_display_value(label)
order by module, metric_key;

-- Preview duplicate base keys before applying the migration.
with candidate_keys as (
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
    ) as proposed_label
  from public.ingestion_data
),
base_keys as (
  select
    module,
    proposed_label,
    public.make_metric_slug(module || ' ' || proposed_label) as base_metric_key
  from candidate_keys
)
select
  base_metric_key,
  count(*) as duplicate_count,
  string_agg(proposed_label, ' | ' order by proposed_label) as labels
from base_keys
group by base_metric_key
having count(*) > 1
order by duplicate_count desc, base_metric_key;

-- Apply label cleanup without changing keys.
update public.ingestion_data as t
set
  label = cleaned.clean_label,
  display_label = cleaned.clean_label,
  search_label = cleaned.clean_label
from (
  select
    id,
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
) as cleaned
where t.id = cleaned.id
  and (
    t.label is distinct from cleaned.clean_label
    or t.display_label is distinct from cleaned.clean_label
    or t.search_label is distinct from cleaned.clean_label
  );
