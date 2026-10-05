begin;
-- Report writes must pass server auth, validation, rate limiting and anchoring.
revoke all on public.scam_reports from anon, authenticated;
revoke insert(reporter_id,id_hash,id_type,category), update(id_hash,id_type,category) on public.scam_reports from authenticated;
grant select on public.scam_reports to authenticated;
drop policy if exists reports_own on public.scam_reports;
create policy reports_read_own on public.scam_reports for select to authenticated
 using (reporter_id=(select auth.uid()));
alter table public.scam_reports add column anchor_key text unique check(anchor_key ~ '^0x[0-9a-f]{64}$');
alter table public.scam_reports add column anchor_status text not null default 'pending' check(anchor_status in ('pending','anchoring','anchored'));
alter table public.scam_reports add column pending_tx text check(pending_tx ~ '^0x[0-9a-fA-F]{64}$');
alter table public.scam_reports add column anchor_lease_until timestamptz;
alter table public.scam_reports add column chain_id bigint;
alter table public.scam_reports add column registry_address text;
update public.scam_reports set anchor_status='anchored' where anchored_tx is not null;
create index scam_reports_recent_anchors on public.scam_reports(created_at desc) where anchor_status='anchored';
-- Atomic per-row claim; durable lease protects concurrent retries across instances.
create function public.claim_report_anchor(p_actor uuid,p_report uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r public.scam_reports;
begin
 select * into r from public.scam_reports where id=p_report and reporter_id=p_actor for update;
 if not found then raise exception 'REPORT_NOT_FOUND'; end if;
 if r.anchor_status='anchored' then return to_jsonb(r); end if;
 if r.anchor_lease_until>clock_timestamp() then raise exception 'ANCHOR_BUSY'; end if;
 update public.scam_reports set anchor_status='anchoring',anchor_lease_until=clock_timestamp()+interval '60 seconds' where id=r.id returning * into r;
 return to_jsonb(r);
end $$;
create function public.registry_counts(p_hash text,p_min_age_seconds integer) returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object(
 'count',count(*),'distinctReporterCount',count(distinct r.reporter_id),
 'eligibleReporterCount',count(distinct r.reporter_id) filter(where p.created_at<=clock_timestamp()-make_interval(secs=>greatest(0,p_min_age_seconds))),
 'anchoredCount',count(*) filter(where r.anchor_status='anchored'))
 from public.scam_reports r join public.profiles p on p.id=r.reporter_id where r.id_hash=p_hash;
$$;
revoke all on function public.claim_report_anchor(uuid,uuid),public.registry_counts(text,integer) from public,anon,authenticated;
grant execute on function public.claim_report_anchor(uuid,uuid),public.registry_counts(text,integer) to service_role;
commit;
