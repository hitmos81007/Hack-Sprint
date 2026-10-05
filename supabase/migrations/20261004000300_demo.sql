begin;
-- Set only by the local seed script's service role. Client profile updates cannot set this flag.
alter table public.profiles add column is_demo boolean not null default false;
commit;
