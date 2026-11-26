-- Additive organizer attribution for calendar event cards.
-- Do not run automatically. Apply in the Supabase SQL editor after Raj
-- approves, and before the code that reads these columns is deployed.

alter table public.events
  add column if not exists organizer_type text,
  add column if not exists organizer_name text;

alter table public.events
  drop constraint if exists events_organizer_shape;
alter table public.events
  add constraint events_organizer_shape check (
    (
      organizer_type is null
      and organizer_name is null
    )
    or
    (
      organizer_type in ('member', 'shared')
      and organizer_name is not null
      and char_length(organizer_name) between 1 and 40
    )
  );

-- Public reads use the anon role with column-level grants. Public
-- submissions insert through the service_role client, so no extra
-- insert grant for anon is required.
grant select (organizer_type, organizer_name) on public.events to anon;
