-- Corrective grant for projects where the initial links-hub migration has
-- already been applied. Supabase secret keys assume the service_role role.
grant select, insert, update, delete
  on public.link_categories, public.links
  to service_role;

grant select, insert, update, delete
  on public.links_admin_login_limits
  to service_role;
