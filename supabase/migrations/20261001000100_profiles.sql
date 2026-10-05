begin;

create type public.app_role as enum ('citizen', 'officer', 'issuer_admin', 'root_authority');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'citizen',
  created_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles(role);
alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;
create policy profiles_read_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
-- No client INSERT/UPDATE/DELETE grants or policies. Role mutations require
-- the service role (or an operator using the SQL editor as postgres).

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- Deliberately ignore raw_user_meta_data, including any requested role.
  insert into public.profiles(id, role) values (new.id, 'citizen');
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Existing accounts receive the same unprivileged default.
insert into public.profiles(id, role)
  select id, 'citizen'::public.app_role from auth.users
  on conflict (id) do nothing;

commit;
