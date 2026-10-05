begin;
-- Aggregate-only API: the caller cannot choose another user or request global scope.
-- The definer reads all rows, but returns only counts selected by the DB profile role.
create function public.dashboard_metrics() returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor uuid:=auth.uid(); global_scope boolean; output jsonb;
begin
 if actor is null or not exists(select 1 from public.profiles where id=actor) then
   raise exception 'UNAUTHENTICATED' using errcode='42501';
 end if;
 select role in ('issuer_admin','root_authority') into global_scope from public.profiles where id=actor;
 with events as (
   select e.result,e.duration_ms from public.verification_events e
   left join public.challenges c on c.id=e.challenge_id
   left join public.officers o on o.id=e.officer_id
   where e.completed_at is not null and (global_scope or c.citizen_id=actor or o.user_id=actor)
 ), analyses as (
   select a.verdict from public.analyses a where global_scope or a.user_id=actor
 ), reports as (
   select r.id_type,r.anchored_tx,r.anchor_status from public.scam_reports r where global_scope or r.reporter_id=actor
 ), transactions as (
   select anchored_tx as tx from reports where anchor_status='anchored' and anchored_tx is not null
   union select onchain_tx from public.evidence_cases where status='anchored' and onchain_tx is not null and (global_scope or user_id=actor)
   union select onchain_tx from public.institutions where chain_operation is null and onchain_tx is not null and (global_scope or created_by=actor)
 )
 select jsonb_build_object(
   'scope',case when global_scope then 'global' else 'personal' end,
   'verifications',coalesce((select jsonb_object_agg(result,n) from (select result,count(*) n from events group by result) x),'{}'::jsonb),
   'medianVerificationMs',(select percentile_cont(0.5) within group(order by duration_ms) from events),
   'analyses',coalesce((select jsonb_object_agg(verdict,n) from (select verdict,count(*) n from analyses group by verdict) x),'{}'::jsonb),
   'reports',coalesce((select jsonb_object_agg(id_type,n) from (select id_type,count(*) n from reports group by id_type) x),'{}'::jsonb),
   'anchoredTransactions',(select count(*) from transactions),
   'generatedAt',now()
 ) into output;
 return output;
end $$;
revoke all on function public.dashboard_metrics() from public,anon;
grant execute on function public.dashboard_metrics() to authenticated;
commit;
