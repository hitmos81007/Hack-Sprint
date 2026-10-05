begin;
-- Record rejected envelopes without retaining tokens, transcripts, or request identifiers.
create function public.audit_rejected_verification(p_reason text)
returns uuid language plpgsql security invoker set search_path = '' as $$
declare event_id uuid;
begin
  if p_reason not in ('INVALID_INPUT','JSON_REQUIRED','INPUT_TOO_LARGE','RATE_LIMITED','RECEIPT_CONFIG','SERVICE_UNAVAILABLE','RATE_LIMIT_CONFIG','DATABASE_UNAVAILABLE') then raise exception 'INVALID_INPUT'; end if;
  insert into public.verification_events(result,reason,duration_ms,completed_at)
    values('NOT_VERIFIED',p_reason,0,clock_timestamp()) returning id into event_id;
  return event_id;
end $$;
revoke all on function public.audit_rejected_verification(text) from public,anon,authenticated;
grant execute on function public.audit_rejected_verification(text) to service_role;
commit;
