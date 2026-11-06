create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  legacy_source_id text unique,
  slug text unique,
  name text not null check (char_length(name) between 1 and 160),
  description text not null check (char_length(description) between 1 and 5000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'America/Toronto' check (timezone = 'America/Toronto'),
  venue text not null check (char_length(venue) between 1 and 240),
  address text check (address is null or char_length(address) between 1 and 400),
  rsvp_url text check (
    rsvp_url is null
    or (char_length(rsvp_url) <= 2048 and rsvp_url ~ '^https?://')
  ),
  event_status text check (event_status is null or event_status in ('cancelled', 'postponed')),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected')),
  image_path text unique check (
    image_path is null
    or (
      image_path ~ '^submissions/[0-9a-f-]{36}/[0-9a-f]{32}\.(webp|png|jpe?g)$'
      and image_path like 'submissions/' || id::text || '/%'
    )
  ),
  image_alt text check (image_alt is null or char_length(image_alt) <= 300),
  image_position text not null default 'center' check (
    char_length(image_position) <= 40
    and (
      image_position ~ '^(left|center|right)( (top|center|bottom))?$'
      or image_position ~ '^(100|[0-9]{1,2})% (100|[0-9]{1,2})%$'
    )
  ),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_slug_format check (
    slug is null
    or (char_length(slug) <= 120 and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
  ),
  constraint events_time_order check (ends_at is null or ends_at > starts_at),
  constraint approved_events_require_slug check (
    moderation_status <> 'approved' or slug is not null
  ),
  constraint event_image_requires_alt check (
    image_path is null or (image_alt is not null and char_length(image_alt) > 0)
  )
);

create index if not exists events_public_schedule_idx
  on public.events (starts_at, id)
  where moderation_status = 'approved';
create index if not exists events_moderation_queue_idx
  on public.events (moderation_status, submitted_at desc);

create or replace function public.set_events_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_events_updated_at on public.events;
create trigger set_events_updated_at
before update on public.events
for each row execute function public.set_events_updated_at();

alter table public.events enable row level security;

drop policy if exists "Approved events are public" on public.events;
create policy "Approved events are public"
on public.events for select
to anon
using (moderation_status = 'approved');

revoke all on public.events from public, anon, authenticated;
grant select (
  id, slug, name, description, starts_at, ends_at, timezone, venue, address,
  rsvp_url, event_status, image_path, image_alt, image_position, updated_at
) on public.events to anon;
grant select, insert, update, delete on public.events to service_role;

create table if not exists public.event_submission_limits (
  identifier_hash text primary key check (identifier_hash ~ '^[0-9a-f]{64}$'),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  window_started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.event_submission_limits enable row level security;
revoke all on public.event_submission_limits from public, anon, authenticated;
grant select, insert, update, delete on public.event_submission_limits to service_role;

create table if not exists public.event_submission_tokens (
  id uuid primary key,
  image_path text unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint event_submission_token_image_path check (
    image_path is null
    or (
      image_path ~ '^submissions/[0-9a-f-]{36}/[0-9a-f]{32}\.(webp|png|jpe?g)$'
      and image_path like 'submissions/' || id::text || '/%'
    )
  )
);

alter table public.event_submission_tokens enable row level security;
revoke all on public.event_submission_tokens from public, anon, authenticated;
grant select, insert, update, delete on public.event_submission_tokens to service_role;

create or replace function public.event_submission_consume_limit(p_identifier_hash text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_row public.event_submission_limits;
  window_length constant interval := interval '1 hour';
  maximum_attempts constant integer := 5;
begin
  if p_identifier_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid identifier';
  end if;

  delete from public.event_submission_limits
  where updated_at < now() - interval '24 hours';

  insert into public.event_submission_limits as limits
    (identifier_hash, attempt_count, window_started_at, updated_at)
  values (p_identifier_hash, 1, now(), now())
  on conflict (identifier_hash) do update set
    attempt_count = case
      when limits.window_started_at < now() - window_length then 1
      else limits.attempt_count + 1
    end,
    window_started_at = case
      when limits.window_started_at < now() - window_length then now()
      else limits.window_started_at
    end,
    updated_at = now()
  returning * into limit_row;

  return query select
    limit_row.attempt_count <= maximum_attempts,
    case
      when limit_row.attempt_count <= maximum_attempts then 0
      else greatest(
        1,
        ceil(extract(epoch from (limit_row.window_started_at + window_length - now())))::integer
      )
    end;
end;
$$;

revoke all on function public.event_submission_consume_limit(text)
  from public, anon, authenticated;
grant execute on function public.event_submission_consume_limit(text)
  to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  false,
  5242880,
  array['image/webp', 'image/png', 'image/jpeg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
