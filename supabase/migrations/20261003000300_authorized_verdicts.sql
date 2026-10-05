begin;
drop function public.complete_verification(uuid,text,text,uuid,text,integer);
create function public.complete_verification(p_event uuid,p_result text,p_reason text,p_officer uuid,p_credential_signature text,p_duration integer,p_action uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare ev public.verification_events;c public.challenges;o public.officers;i public.institutions;a public.official_actions;
 verdict text:=p_result;reason_code text:=p_reason;finished timestamptz;action_found boolean;payee_allowed boolean;begin
 if p_result is null or p_result not in ('VERIFIED_AUTHORIZED','IDENTITY_VERIFIED_NOT_AUTHORIZED','NOT_VERIFIED') or p_duration<0 then raise exception 'INVALID_INPUT';end if;
 select * into ev from public.verification_events where id=p_event for update;if not found then raise exception 'NOT_FOUND';end if;
 if ev.completed_at is not null then return jsonb_build_object('result',ev.result,'reason',ev.reason,'eventId',ev.id,'completedAt',ev.completed_at);end if;
 select * into c from public.challenges where id=ev.challenge_id for update;
 if c.used_at is not null then verdict:='NOT_VERIFIED';reason_code:='CHALLENGE_USED';
 elsif c.expires_at<=clock_timestamp() then verdict:='NOT_VERIFIED';reason_code:='CHALLENGE_EXPIRED';
 elsif p_result<>'NOT_VERIFIED' then
 select * into o from public.officers where id=p_officer for share;
 if not found or o.status<>'active' or o.expires_at<=clock_timestamp() or o.credential->>'signature' is distinct from p_credential_signature then verdict:='NOT_VERIFIED';reason_code:='CREDENTIAL_REVOKED_OR_EXPIRED';
 elsif o.suspended_at is not null then verdict:='NOT_VERIFIED';reason_code:='OFFICER_SUSPENDED';
 else
 select * into i from public.institutions where id=o.institution_id for share;
 if not found or i.status<>'active' or i.chain_operation is not null or lower(o.credential->>'issuerAddress') is distinct from lower(i.wallet_address) or lower(o.credential->>'officerAddress') is distinct from lower(o.wallet_address) then verdict:='NOT_VERIFIED';reason_code:='ISSUER_REVOKED';
 else
 verdict:='IDENTITY_VERIFIED_NOT_AUTHORIZED';
 select * into a from public.official_actions where id=p_action for share;
 action_found:=found;payee_allowed:=false;
 if c.payee<>'' then perform 1 from public.institution_payees where institution_id=i.id and payee=c.payee and active and is_institutional for share;payee_allowed:=found;end if;
 if not action_found then reason_code:='ACTION_NOT_FOUND';
 elsif a.officer_id<>o.id or a.institution_id<>i.id then reason_code:='ACTION_OFFICER_MISMATCH';
 elsif a.valid_until<=clock_timestamp() then reason_code:='ACTION_EXPIRED';
 elsif a.status<>'approved' or (a.purpose in ('payment','document_request') and (a.approved_by is null or a.approved_by=o.user_id)) then reason_code:='ACTION_NOT_APPROVED';
 elsif c.claimed_category<>i.category then reason_code:='CATEGORY_MISMATCH';
 elsif c.payee<>'' and not payee_allowed then reason_code:='PAYEE_NOT_ALLOWLISTED';
 elsif c.purpose<>a.purpose then reason_code:='PURPOSE_MISMATCH';
 elsif (c.amount>0 or c.payee<>'') and not a.payment_allowed then reason_code:='PAYMENT_NOT_ALLOWED';
 elsif a.payment_allowed and c.payee is distinct from a.payee then reason_code:='PAYEE_MISMATCH';
 elsif c.amount>a.amount_cap then reason_code:='AMOUNT_EXCEEDED';
 else verdict:='VERIFIED_AUTHORIZED';reason_code:='ACTION_AUTHORIZED';end if;
 update public.challenges set used_at=clock_timestamp() where id=c.id;
 end if;end if;end if;
 finished:=clock_timestamp();
 update public.verification_events set result=verdict,reason=reason_code,officer_id=case when exists(select 1 from public.officers where id=p_officer) then p_officer else null end,
 action_id=case when exists(select 1 from public.official_actions where id=p_action) then p_action else null end,duration_ms=p_duration,completed_at=finished where id=p_event;
 return jsonb_build_object('result',verdict,'reason',reason_code,'eventId',p_event,'completedAt',finished,'attempts',c.attempts,
 'officer',case when verdict<>'NOT_VERIFIED' then jsonb_build_object('name',o.name,'title',o.role_title,'institution',i.name,'category',i.category) else null end,
 'facts',jsonb_build_object('challengeId',c.id,'actionId',p_action,'officerId',case when verdict<>'NOT_VERIFIED' then o.id else null end,'purpose',c.purpose,'amount',c.amount::text,'payee',c.payee));
 end $$;
revoke all on function public.complete_verification(uuid,text,text,uuid,text,integer,uuid) from public,anon,authenticated;
grant execute on function public.complete_verification(uuid,text,text,uuid,text,integer,uuid) to service_role;
commit;
