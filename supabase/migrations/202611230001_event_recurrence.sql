alter table public.events
  add column if not exists recurrence_frequency text,
  add column if not exists recurrence_weekdays smallint[],
  add column if not exists recurrence_end_date date,
  add column if not exists recurrence_count smallint;

alter table public.events
  drop constraint if exists events_recurrence_shape;
alter table public.events
  add constraint events_recurrence_shape check (
    (
      recurrence_frequency is null
      and recurrence_weekdays is null
      and recurrence_end_date is null
      and recurrence_count is null
    )
    or
    (
      recurrence_frequency in ('weekly', 'biweekly', 'monthly')
      and (recurrence_end_date is not null) <> (recurrence_count is not null)
      and (recurrence_count is null or recurrence_count between 1 and 52)
      and (
        (
          recurrence_frequency in ('weekly', 'biweekly')
          and recurrence_weekdays is not null
          and cardinality(recurrence_weekdays) between 1 and 7
          and recurrence_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
        )
        or
        (recurrence_frequency = 'monthly' and recurrence_weekdays is null)
      )
    )
  );

grant select (
  recurrence_frequency, recurrence_weekdays, recurrence_end_date,
  recurrence_count
) on public.events to anon;

create table if not exists public.event_occurrences (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  occurrence_index smallint not null check (occurrence_index between 0 and 51),
  slug text not null unique check (
    char_length(slug) <= 120
    and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  constraint event_occurrences_time_order check (
    ends_at is null or ends_at > starts_at
  ),
  constraint event_occurrences_event_index_unique unique (
    event_id, occurrence_index
  )
);

create index if not exists event_occurrences_schedule_idx
  on public.event_occurrences (starts_at, id);
create index if not exists event_occurrences_event_idx
  on public.event_occurrences (event_id, occurrence_index);

alter table public.event_occurrences enable row level security;

create or replace function public.event_is_approved(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events
    where id = p_event_id
      and moderation_status = 'approved'
  );
$$;

revoke all on function public.event_is_approved(uuid)
  from public, anon, authenticated;
grant execute on function public.event_is_approved(uuid) to anon;

drop policy if exists "Approved event occurrences are public"
  on public.event_occurrences;
create policy "Approved event occurrences are public"
on public.event_occurrences for select
to anon
using (
  public.event_is_approved(event_id)
);

revoke all on public.event_occurrences from public, anon, authenticated;
grant select (
  id, event_id, occurrence_index, slug, starts_at, ends_at
) on public.event_occurrences to anon;
grant select, insert, update, delete on public.event_occurrences to service_role;

create or replace function public.replace_event_occurrences(
  p_event_id uuid,
  p_occurrences jsonb,
  p_publish boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_frequency text;
  occurrence_total integer;
begin
  if jsonb_typeof(p_occurrences) <> 'array' then
    raise exception 'Occurrences must be an array';
  end if;

  select recurrence_frequency
  into target_frequency
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  occurrence_total := jsonb_array_length(p_occurrences);
  if target_frequency is null and occurrence_total <> 0 then
    raise exception 'A one-time event cannot have occurrence records';
  end if;
  if target_frequency is not null and occurrence_total not between 1 and 52 then
    raise exception 'A recurring event must have between 1 and 52 occurrences';
  end if;

  delete from public.event_occurrences where event_id = p_event_id;

  if occurrence_total > 0 then
    insert into public.event_occurrences (
      event_id, occurrence_index, slug, starts_at, ends_at
    )
    select
      p_event_id,
      occurrence_index,
      slug,
      starts_at,
      ends_at
    from jsonb_to_recordset(p_occurrences) as occurrence(
      occurrence_index smallint,
      slug text,
      starts_at timestamptz,
      ends_at timestamptz
    );

    if (select count(*) from public.event_occurrences where event_id = p_event_id)
      <> occurrence_total then
      raise exception 'Occurrence count mismatch';
    end if;
  end if;

  if p_publish then
    update public.events
    set moderation_status = 'approved', reviewed_at = now()
    where id = p_event_id;
  end if;
end;
$$;

revoke all on function public.replace_event_occurrences(uuid, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function public.replace_event_occurrences(uuid, jsonb, boolean)
  to service_role;
