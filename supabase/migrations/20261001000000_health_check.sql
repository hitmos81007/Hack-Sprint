-- Minimal connectivity probe. No application data, tables or privileged access.
-- Future application tables must enable RLS and define explicit policies.
begin;

create or replace function public.health_check()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select true; $$;

revoke all on function public.health_check() from public;
grant execute on function public.health_check() to anon, authenticated;

commit;
