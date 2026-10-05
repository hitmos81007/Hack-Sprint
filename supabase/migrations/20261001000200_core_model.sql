begin;

alter table public.profiles
  add column display_name text not null default '',
  add column preferred_lang text not null default 'en' check (preferred_lang in ('en','hi','ta'));
grant update(display_name, preferred_lang) on public.profiles to authenticated;
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy profiles_service on public.profiles for all to service_role
  using (true) with check (true);

create type public.record_status as enum ('pending','active','revoked');
create type public.alert_status as enum ('pending','sent','failed');

create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = (select auth.uid());
$$;
revoke all on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;

create table public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 200),
  category text not null,
  wallet_address text not null unique check (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  status public.record_status not null default 'pending',
  onchain_tx text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);
create unique index institutions_wallet_lower_idx on public.institutions(lower(wallet_address));
create index institutions_owner_idx on public.institutions(created_by);
create index institutions_status_idx on public.institutions(status);

create table public.officers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id),
  institution_id uuid not null references public.institutions(id),
  name text not null,
  role_title text not null,
  wallet_address text not null check (wallet_address ~ '^0x[0-9a-fA-F]{40}$'),
  credential jsonb,
  status public.record_status not null default 'pending',
  expires_at timestamptz not null
);
create unique index officers_wallet_lower_idx on public.officers(lower(wallet_address));
create index officers_institution_idx on public.officers(institution_id);
create index officers_status_expiry_idx on public.officers(status, expires_at);

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  citizen_id uuid references public.profiles(id) on delete set null,
  code text not null check (code ~ '^[0-9]{6}$'),
  claimed_entity text not null,
  claimed_category text not null,
  expires_at timestamptz not null default (now() + interval '2 minutes'),
  used_at timestamptz,
  attempts integer not null default 0 check (attempts between 0 and 5)
);
create index challenges_citizen_idx on public.challenges(citizen_id);
create index challenges_expiry_idx on public.challenges(expires_at);

create table public.verification_events (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.challenges(id),
  officer_id uuid references public.officers(id) on delete set null,
  result text not null,
  reason text not null,
  duration_ms integer not null check (duration_ms >= 0),
  created_at timestamptz not null default now()
);
create index verification_events_challenge_idx on public.verification_events(challenge_id);
create index verification_events_officer_idx on public.verification_events(officer_id);
create index verification_events_created_idx on public.verification_events(created_at);

create table public.scam_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  id_hash text not null check (id_hash ~ '^0x[0-9a-fA-F]{64}$'),
  id_type text not null check (id_type in ('phone','upi','wallet')),
  category text not null,
  anchored_tx text,
  created_at timestamptz not null default now(),
  unique(reporter_id, id_hash)
);
create index scam_reports_hash_idx on public.scam_reports(id_hash);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
  risk_score integer not null check (risk_score between 0 and 100),
  verdict text not null,
  tactics text[] not null default '{}',
  provider text not null check (provider in ('hybrid','heuristics','heuristics-fallback')),
  latency_ms integer not null check (latency_ms >= 0),
  input_text text,
  created_at timestamptz not null default now()
);
comment on column public.analyses.input_text is 'NULL by default. Application may populate only after explicit user opt-in; redact before LLM use.';
create index analyses_user_created_idx on public.analyses(user_id, created_at desc);
create index analyses_hash_idx on public.analyses(input_hash);

create table public.guardians (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('webhook','telegram')),
  target text not null,
  created_at timestamptz not null default now()
);
create index guardians_user_idx on public.guardians(user_id);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  sent_at timestamptz,
  status public.alert_status not null default 'pending'
);
create index alerts_user_idx on public.alerts(user_id);
create index alerts_analysis_idx on public.alerts(analysis_id);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count integer not null default 1 check (count > 0),
  primary key(key, window_start)
);
create index rate_limits_window_idx on public.rate_limits(window_start);

-- Explicit grants and RLS for every table; no blanket anonymous table access.
do $$ declare t text; begin
  foreach t in array array['institutions','officers','challenges','verification_events','scam_reports','analyses','guardians','alerts','rate_limits'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('create policy service_access on public.%I for all to service_role using (true) with check (true)', t);
  end loop;
end $$;

grant select, insert, update, delete on public.institutions, public.officers, public.analyses, public.guardians, public.alerts to authenticated;
grant select on public.challenges, public.verification_events to authenticated;
grant select, delete on public.scam_reports to authenticated;
grant insert(reporter_id, id_hash, id_type, category) on public.scam_reports to authenticated;
grant update(id_hash, id_type, category) on public.scam_reports to authenticated;

create policy institutions_read on public.institutions for select to authenticated
  using (created_by = (select auth.uid()) or (select public.current_app_role()) = 'root_authority');
create policy institutions_root on public.institutions for all to authenticated
  using ((select public.current_app_role()) = 'root_authority')
  with check ((select public.current_app_role()) = 'root_authority');
create policy institutions_issuer_insert on public.institutions for insert to authenticated
  with check ((select public.current_app_role()) = 'issuer_admin' and created_by = (select auth.uid()) and status = 'pending' and onchain_tx is null);
create policy institutions_issuer_update on public.institutions for update to authenticated
  using ((select public.current_app_role()) = 'issuer_admin' and created_by = (select auth.uid()) and status = 'pending')
  with check ((select public.current_app_role()) = 'issuer_admin' and created_by = (select auth.uid()) and status = 'pending' and onchain_tx is null);

create policy officers_read_own on public.officers for select to authenticated
  using (user_id = (select auth.uid()));
create policy officers_manage on public.officers for all to authenticated
  using ((select public.current_app_role()) = 'root_authority' or (
    (select public.current_app_role()) = 'issuer_admin' and exists (
      select 1 from public.institutions i where i.id = institution_id and i.created_by = (select auth.uid()) and i.status = 'active')))
  with check ((select public.current_app_role()) = 'root_authority' or (
    (select public.current_app_role()) = 'issuer_admin' and exists (
      select 1 from public.institutions i where i.id = institution_id and i.created_by = (select auth.uid()) and i.status = 'active')));

-- Views intentionally execute as migration owner, exposing only active public
-- identity fields. Base-table grants/RLS protect credential and account IDs.
create view public.public_institutions with (security_barrier = true) as
  select id, name, category, wallet_address from public.institutions where status = 'active';
create view public.public_officers with (security_barrier = true) as
  select o.id, o.institution_id, o.name, o.role_title, o.wallet_address, i.category
  from public.officers o join public.institutions i on i.id = o.institution_id
  where o.status = 'active' and o.expires_at > now() and i.status = 'active';
revoke all on public.public_institutions, public.public_officers from anon, authenticated;
grant select on public.public_institutions, public.public_officers to anon, authenticated;

create policy challenges_read_own on public.challenges for select to authenticated
  using (citizen_id = (select auth.uid()));
-- Challenge counters/expiry/use and audit writes stay server-managed so a
-- citizen cannot reset attempts or replay a used challenge via PostgREST.
create policy verification_events_read_own on public.verification_events for select to authenticated
  using (exists (select 1 from public.challenges c where c.id = challenge_id and c.citizen_id = (select auth.uid())));

create policy reports_own on public.scam_reports for all to authenticated
  using (reporter_id = (select auth.uid())) with check (reporter_id = (select auth.uid()));
create policy analyses_own on public.analyses for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy guardians_own on public.guardians for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy alerts_own on public.alerts for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and exists (
    select 1 from public.analyses a where a.id = analysis_id and a.user_id = (select auth.uid())));

create function public.increment_rate_limit(p_key text, p_window_start timestamptz)
returns integer language sql security invoker set search_path = '' as $$
  insert into public.rate_limits(key, window_start, count) values (p_key, p_window_start, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count;
$$;
revoke all on function public.increment_rate_limit(text, timestamptz) from public, anon, authenticated;
grant execute on function public.increment_rate_limit(text, timestamptz) to service_role;

commit;
