create extension if not exists pgcrypto;

create table if not exists public.link_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  sort_order integer not null check (sort_order >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 180),
  url text not null check (char_length(url) between 1 and 2048),
  icon text check (icon is null or char_length(icon) <= 24),
  category_id uuid not null references public.link_categories(id) on delete cascade,
  sort_order integer not null check (sort_order >= 0),
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists link_categories_order_idx
  on public.link_categories (sort_order, created_at);
create index if not exists links_category_order_idx
  on public.links (category_id, sort_order, created_at);

alter table public.link_categories
  add constraint link_categories_sort_order_unique unique (sort_order)
  deferrable initially deferred;
alter table public.links
  add constraint links_category_sort_order_unique unique (category_id, sort_order)
  deferrable initially deferred;

create table if not exists public.links_admin_login_limits (
  identifier_hash text primary key check (char_length(identifier_hash) = 64),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  window_started_at timestamptz not null default now(),
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

revoke all on public.links_admin_login_limits from public, anon, authenticated;

create or replace function public.set_links_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_link_categories_updated_at on public.link_categories;
create trigger set_link_categories_updated_at
before update on public.link_categories
for each row execute function public.set_links_updated_at();

drop trigger if exists set_links_updated_at on public.links;
create trigger set_links_updated_at
before update on public.links
for each row execute function public.set_links_updated_at();

alter table public.link_categories enable row level security;
alter table public.links enable row level security;
alter table public.links_admin_login_limits enable row level security;

drop policy if exists "Visible link categories are public" on public.link_categories;
create policy "Visible link categories are public"
on public.link_categories for select
to anon
using (is_visible = true);

drop policy if exists "Visible links in visible categories are public" on public.links;
create policy "Visible links in visible categories are public"
on public.links for select
to anon
using (
  is_visible = true
  and exists (
    select 1 from public.link_categories
    where link_categories.id = links.category_id
      and link_categories.is_visible = true
  )
);

grant select on public.link_categories, public.links to anon;
revoke insert, update, delete on public.link_categories, public.links from anon, authenticated;
grant select, insert, update, delete on public.link_categories, public.links to service_role;
grant select, insert, update, delete on public.links_admin_login_limits to service_role;

create or replace function public.reorder_link_category(p_id uuid, p_direction text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.link_categories;
  adjacent_row public.link_categories;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'Invalid direction';
  end if;

  select * into current_row from public.link_categories where id = p_id for update;
  if not found then raise exception 'Category not found'; end if;

  if p_direction = 'up' then
    select * into adjacent_row from public.link_categories
      where (sort_order, created_at, id) < (current_row.sort_order, current_row.created_at, current_row.id)
      order by sort_order desc, created_at desc, id desc limit 1 for update;
  else
    select * into adjacent_row from public.link_categories
      where (sort_order, created_at, id) > (current_row.sort_order, current_row.created_at, current_row.id)
      order by sort_order, created_at, id limit 1 for update;
  end if;

  if found then
    update public.link_categories set sort_order = adjacent_row.sort_order where id = current_row.id;
    update public.link_categories set sort_order = current_row.sort_order where id = adjacent_row.id;
  end if;
end;
$$;

create or replace function public.reorder_link(p_id uuid, p_direction text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row public.links;
  adjacent_row public.links;
begin
  if p_direction not in ('up', 'down') then
    raise exception 'Invalid direction';
  end if;

  select * into current_row from public.links where id = p_id for update;
  if not found then raise exception 'Link not found'; end if;

  if p_direction = 'up' then
    select * into adjacent_row from public.links
      where category_id = current_row.category_id
        and (sort_order, created_at, id) < (current_row.sort_order, current_row.created_at, current_row.id)
      order by sort_order desc, created_at desc, id desc limit 1 for update;
  else
    select * into adjacent_row from public.links
      where category_id = current_row.category_id
        and (sort_order, created_at, id) > (current_row.sort_order, current_row.created_at, current_row.id)
      order by sort_order, created_at, id limit 1 for update;
  end if;

  if found then
    update public.links set sort_order = adjacent_row.sort_order where id = current_row.id;
    update public.links set sort_order = current_row.sort_order where id = adjacent_row.id;
  end if;
end;
$$;

create or replace function public.links_admin_check_login_limit(p_identifier_hash text)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_row public.links_admin_login_limits;
begin
  select * into limit_row from public.links_admin_login_limits
    where identifier_hash = p_identifier_hash;

  if limit_row.locked_until is not null and limit_row.locked_until > now() then
    return query select false, greatest(1, ceil(extract(epoch from (limit_row.locked_until - now())))::integer);
  else
    return query select true, 0;
  end if;
end;
$$;

create or replace function public.links_admin_record_login_failure(p_identifier_hash text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_identifier_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid identifier';
  end if;

  insert into public.links_admin_login_limits as limits
    (identifier_hash, attempt_count, window_started_at, locked_until, updated_at)
  values (p_identifier_hash, 1, now(), null, now())
  on conflict (identifier_hash) do update set
    attempt_count = case
      when limits.window_started_at < now() - interval '15 minutes' then 1
      else limits.attempt_count + 1
    end,
    window_started_at = case
      when limits.window_started_at < now() - interval '15 minutes' then now()
      else limits.window_started_at
    end,
    locked_until = case
      when (case when limits.window_started_at < now() - interval '15 minutes' then 1 else limits.attempt_count + 1 end) >= 5
        then now() + interval '15 minutes'
      else null
    end,
    updated_at = now();
end;
$$;

create or replace function public.links_admin_clear_login_limit(p_identifier_hash text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.links_admin_login_limits where identifier_hash = p_identifier_hash;
$$;

revoke all on function public.reorder_link_category(uuid, text) from public, anon, authenticated;
revoke all on function public.reorder_link(uuid, text) from public, anon, authenticated;
revoke all on function public.links_admin_check_login_limit(text) from public, anon, authenticated;
revoke all on function public.links_admin_record_login_failure(text) from public, anon, authenticated;
revoke all on function public.links_admin_clear_login_limit(text) from public, anon, authenticated;
grant execute on function public.reorder_link_category(uuid, text) to service_role;
grant execute on function public.reorder_link(uuid, text) to service_role;
grant execute on function public.links_admin_check_login_limit(text) to service_role;
grant execute on function public.links_admin_record_login_failure(text) to service_role;
grant execute on function public.links_admin_clear_login_limit(text) to service_role;

insert into public.link_categories (name, slug, sort_order)
values
  ('Our Socials', 'our-socials', 10),
  ('Community Links', 'community-links', 20)
on conflict (slug) do nothing;

insert into public.links (title, url, icon, category_id, sort_order)
select seed.title, seed.url, seed.icon, categories.id, seed.sort_order
from (values
  ('Instagram', 'https://www.instagram.com/stooopidcrew', 'instagram', 'our-socials', 10),
  ('Stooopid Crew | Strava', 'https://www.strava.com/clubs/2391274', 'strava', 'our-socials', 20),
  ('Donate to Help Yagil Through His Fight Against Glioblastoma, organized by Amine Labidi', 'https://www.gofundme.com/f/help-yagil-through-his-fight-against-glioblastoma?attribution_id=al%3Aa9d53cc2-5b0a-42d4-9458-6c533d7a1a84&lang=en_CA&ts=1789559435&utm_campaign=fp_sharesheet&utm_content=amp30-treatment-6&utm_medium=customer&utm_source=copy_link', 'heart', 'community-links', 10)
) as seed(title, url, icon, category_slug, sort_order)
join public.link_categories categories on categories.slug = seed.category_slug
where not exists (
  select 1 from public.links existing
  where existing.category_id = categories.id and existing.title = seed.title
);
