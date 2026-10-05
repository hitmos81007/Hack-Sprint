begin;
-- Signed credentials and chain status must pass authorized route handlers.
-- Read policies remain; service writes still use explicit authorization in code.
revoke insert, update, delete on public.institutions, public.officers from authenticated;
alter table public.institutions add column chain_operation text check (chain_operation in ('approve','revoke')),
  add column operation_tx text check (operation_tx ~ '^0x[0-9a-fA-F]{64}$');

create function public.complete_institution_action(p_id uuid, p_action text, p_tx text, p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare inst public.institutions; applicant_role public.app_role;
begin
  if not exists(select 1 from public.profiles where id=p_actor and role='root_authority') then raise exception 'FORBIDDEN'; end if;
  if p_action not in ('approve','revoke') or p_tx !~ '^0x[0-9a-fA-F]{64}$' then raise exception 'INVALID_INPUT'; end if;
  select * into inst from public.institutions where id=p_id for update;
  if not found or inst.chain_operation is distinct from p_action then raise exception 'CONFLICT'; end if;
  if p_action='approve' then
    if inst.status <> 'pending' then raise exception 'CONFLICT'; end if;
    select role into applicant_role from public.profiles where id=inst.created_by for update;
    if applicant_role not in ('citizen','issuer_admin') then raise exception 'FORBIDDEN'; end if;
    update public.profiles set role='issuer_admin' where id=inst.created_by;
  elsif inst.status <> 'active' then raise exception 'CONFLICT';
  end if;
  update public.institutions set status=case when p_action='approve' then 'active'::public.record_status else 'revoked'::public.record_status end,
    onchain_tx=p_tx, chain_operation=null, operation_tx=null where id=p_id returning * into inst;
  return to_jsonb(inst);
end $$;

create function public.issue_officer_credential(p_id uuid, p_credential jsonb, p_actor uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare officer public.officers; inst public.institutions; applicant_role public.app_role;
begin
  select * into officer from public.officers where id=p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into inst from public.institutions where id=officer.institution_id for share;
  if inst.status <> 'active' or inst.chain_operation is not null or inst.created_by <> p_actor or
    not exists(select 1 from public.profiles where id=p_actor and role='issuer_admin') then raise exception 'FORBIDDEN'; end if;
  if lower(p_credential->>'issuerAddress') <> lower(inst.wallet_address) or
    lower(p_credential->>'officerAddress') <> lower(officer.wallet_address) or
    (p_credential->>'expiresAt')::timestamptz <= now() then raise exception 'INVALID_CREDENTIAL'; end if;
  select role into applicant_role from public.profiles where id=officer.user_id for update;
  if applicant_role not in ('citizen','officer') then raise exception 'FORBIDDEN'; end if;
  update public.officers set credential=p_credential, name=p_credential->>'officerName', role_title=p_credential->>'roleTitle',
    expires_at=(p_credential->>'expiresAt')::timestamptz, status='active' where id=p_id returning * into officer;
  update public.profiles set role='officer' where id=officer.user_id;
  return to_jsonb(officer);
end $$;
revoke all on function public.complete_institution_action(uuid,text,text,uuid), public.issue_officer_credential(uuid,jsonb,uuid) from public, anon, authenticated;
grant execute on function public.complete_institution_action(uuid,text,text,uuid), public.issue_officer_credential(uuid,jsonb,uuid) to service_role;
commit;
