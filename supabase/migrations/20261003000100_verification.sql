begin;
alter table public.verification_events alter column challenge_id drop not null;
alter table public.verification_events add column requested_challenge_id uuid,
  add column attempt_number integer, add column completed_at timestamptz;

create function public.begin_verification(p_id uuid, p_block_reason text default null)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare c public.challenges; event_id uuid; reason_code text;
begin
  select * into c from public.challenges where id=p_id for update;
  if not found then reason_code := 'CHALLENGE_NOT_FOUND';
  elsif p_block_reason is not null then reason_code := p_block_reason;
  elsif c.used_at is not null then reason_code := 'CHALLENGE_USED';
  elsif c.expires_at <= clock_timestamp() then reason_code := 'CHALLENGE_EXPIRED';
  elsif c.attempts >= 5 then reason_code := 'ATTEMPTS_EXHAUSTED';
  else
    update public.challenges set attempts=attempts+1 where id=p_id returning * into c;
  end if;
  insert into public.verification_events(challenge_id,requested_challenge_id,attempt_number,result,reason,duration_ms,completed_at)
    values(c.id,p_id,c.attempts,'NOT_VERIFIED',coalesce(reason_code,'VERIFICATION_PENDING'),0,
      case when reason_code is not null then clock_timestamp() else null end) returning id into event_id;
  return jsonb_build_object('eventId',event_id,'blocked',reason_code,'challenge',case when reason_code is null then to_jsonb(c) else null end);
end $$;

create function public.complete_verification(p_event uuid, p_result text, p_reason text, p_officer uuid,
  p_credential_signature text, p_duration integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare ev public.verification_events; c public.challenges; o public.officers; i public.institutions;
  verdict text := p_result; reason_code text := p_reason;
begin
  if p_result is null or p_result not in ('VERIFIED','MISMATCH','NOT_VERIFIED') or p_duration < 0 then raise exception 'INVALID_INPUT'; end if;
  select * into ev from public.verification_events where id=p_event for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if ev.completed_at is not null then return jsonb_build_object('result',ev.result,'reason',ev.reason,'eventId',ev.id); end if;
  select * into c from public.challenges where id=ev.challenge_id for update;
  if c.used_at is not null then verdict := 'NOT_VERIFIED'; reason_code := 'CHALLENGE_USED';
  elsif c.expires_at <= clock_timestamp() then verdict := 'NOT_VERIFIED'; reason_code := 'CHALLENGE_EXPIRED';
  elsif p_result in ('VERIFIED','MISMATCH') then
    select * into o from public.officers where id=p_officer for share;
    if not found or o.status <> 'active' or o.expires_at <= clock_timestamp() or
      o.credential is null or o.credential->>'signature' is distinct from p_credential_signature then
      verdict := 'NOT_VERIFIED'; reason_code := 'CREDENTIAL_REVOKED_OR_EXPIRED';
    else
      select * into i from public.institutions where id=o.institution_id for share;
      if not found or i.status <> 'active' or i.chain_operation is not null or
        lower(o.credential->>'issuerAddress') is distinct from lower(i.wallet_address) or
        lower(o.credential->>'officerAddress') is distinct from lower(o.wallet_address) then
        verdict := 'NOT_VERIFIED'; reason_code := 'ISSUER_REVOKED';
      else
        if c.claimed_category <> i.category then verdict := 'MISMATCH'; reason_code := 'CATEGORY_MISMATCH';
        else verdict := 'VERIFIED'; reason_code := 'IDENTITY_VERIFIED'; end if;
        update public.challenges set used_at=clock_timestamp() where id=c.id;
      end if;
    end if;
  end if;
  update public.verification_events set result=verdict,reason=reason_code,
    officer_id=case when exists(select 1 from public.officers where id=p_officer) then p_officer else null end,
    duration_ms=p_duration,completed_at=clock_timestamp() where id=p_event;
  return jsonb_build_object('result',verdict,'reason',reason_code,'eventId',p_event,'attempts',c.attempts,
    'officer',case when verdict in ('VERIFIED','MISMATCH') then jsonb_build_object('name',o.name,'title',o.role_title,'institution',i.name,'category',i.category) else null end);
end $$;
revoke all on function public.begin_verification(uuid,text), public.complete_verification(uuid,text,text,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.begin_verification(uuid,text), public.complete_verification(uuid,text,text,uuid,text,integer) to service_role;
commit;
