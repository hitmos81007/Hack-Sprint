begin;
alter table public.challenges add column purpose text not null default 'information', add column amount numeric(14,2) not null default 0 check(amount>=0), add column payee text not null default '';
alter table public.officers add column flagged_at timestamptz, add column suspended_at timestamptz;
create table public.institution_payees (
 id uuid primary key default gen_random_uuid(),institution_id uuid not null references public.institutions(id),payee text not null,
 label text not null, is_institutional boolean not null check(is_institutional),active boolean not null default true,
 created_by uuid not null references public.profiles(id),unique(institution_id,payee)
);
create table public.official_actions (
 id uuid primary key default gen_random_uuid(),officer_id uuid not null references public.officers(id),institution_id uuid not null references public.institutions(id),
 purpose text not null check(purpose in ('information','appointment','document_request','payment')),case_ref text not null,
 payment_allowed boolean not null default false,payee text,amount_cap numeric(14,2) not null default 0 check(amount_cap>=0),
 created_at timestamptz not null default now(),valid_until timestamptz not null,
 status text not null check(status in ('pending','approved','revoked')),approved_by uuid references public.profiles(id),
 check(valid_until>created_at and valid_until<=created_at+interval '24 hours'),
 check((not payment_allowed and payee is null and amount_cap=0) or (payment_allowed and purpose='payment' and payee is not null and amount_cap>0)),
 foreign key(institution_id,payee) references public.institution_payees(institution_id,payee)
);
alter table public.verification_events add column action_id uuid references public.official_actions(id),add column receipt jsonb;
create table public.officer_reports (
 id uuid primary key default gen_random_uuid(),officer_id uuid not null references public.officers(id),reporter_id uuid not null references public.profiles(id),
 verification_event_id uuid not null references public.verification_events(id),reason text not null,created_at timestamptz not null default now(),unique(officer_id,reporter_id)
);
do $$declare t text;begin foreach t in array array['official_actions','institution_payees','officer_reports'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy service_access on public.%I for all to service_role using(true) with check(true)',t);
 end loop;end $$;
create policy actions_read on public.official_actions for select to authenticated using (
 (select public.current_app_role())='root_authority' or exists(select 1 from public.officers o where o.id=officer_id and o.user_id=(select auth.uid())) or
 exists(select 1 from public.institutions i where i.id=institution_id and i.created_by=(select auth.uid())));
create policy payees_read on public.institution_payees for select to authenticated using (
 exists(select 1 from public.institutions i where i.id=institution_id and (i.created_by=(select auth.uid()) or i.status='active')) or (select public.current_app_role())='root_authority');
create policy officer_reports_read on public.officer_reports for select to authenticated using (
 reporter_id=(select auth.uid()) or (select public.current_app_role())='root_authority' or
 exists(select 1 from public.officers o join public.institutions i on i.id=o.institution_id where o.id=officer_id and i.created_by=(select auth.uid())));

create function public.create_official_action(p_actor uuid,p_data jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare o public.officers;i public.institutions;a public.official_actions;begin
 select * into o from public.officers where user_id=p_actor for update;
 if not found or o.status<>'active' or o.suspended_at is not null or o.expires_at<=clock_timestamp() or not exists(select 1 from public.profiles where id=p_actor and role='officer') then raise exception 'FORBIDDEN';end if;
 select * into i from public.institutions where id=o.institution_id for share;
 if i.status<>'active' or i.chain_operation is not null then raise exception 'FORBIDDEN';end if;
 if (p_data->>'paymentAllowed')::boolean and not exists(select 1 from public.institution_payees where institution_id=i.id and payee=p_data->>'payee' and active and is_institutional) then raise exception 'PAYEE_NOT_ALLOWLISTED';end if;
 insert into public.official_actions(officer_id,institution_id,purpose,case_ref,payment_allowed,payee,amount_cap,valid_until,status,approved_by)
 values(o.id,i.id,p_data->>'purpose',p_data->>'caseRef',(p_data->>'paymentAllowed')::boolean,nullif(p_data->>'payee',''),(p_data->>'amountCap')::numeric,(p_data->>'validUntil')::timestamptz,
 case when p_data->>'purpose' in ('payment','document_request') then 'pending' else 'approved' end,
 case when p_data->>'purpose' in ('payment','document_request') then null else p_actor end) returning * into a;return to_jsonb(a);end $$;
create function public.review_official_action(p_actor uuid,p_id uuid,p_operation text) returns jsonb language plpgsql security invoker set search_path='' as $$
declare a public.official_actions; maker uuid;begin
 select * into a from public.official_actions where id=p_id for update;if not found then raise exception 'NOT_FOUND';end if;
 select user_id into maker from public.officers where id=a.officer_id;
 if not exists(select 1 from public.institutions i join public.profiles p on p.id=i.created_by where i.id=a.institution_id and i.status='active' and i.chain_operation is null and i.created_by=p_actor and p.role='issuer_admin') or maker=p_actor then raise exception 'FORBIDDEN';end if;
 if p_operation='approve' then
 if a.status<>'pending' or a.valid_until<=clock_timestamp() then raise exception 'CONFLICT';end if;
 if a.payment_allowed and not exists(select 1 from public.institution_payees where institution_id=a.institution_id and payee=a.payee and active and is_institutional) then raise exception 'PAYEE_NOT_ALLOWLISTED';end if;
 update public.official_actions set status='approved',approved_by=p_actor where id=p_id returning * into a;
 elsif p_operation='revoke' then update public.official_actions set status='revoked' where id=p_id returning * into a;
 else raise exception 'INVALID_INPUT';end if;return to_jsonb(a);end $$;
create function public.report_verified_officer(p_actor uuid,p_event uuid,p_reason text,p_threshold integer) returns jsonb language plpgsql security invoker set search_path='' as $$
declare ev public.verification_events;o public.officers;reporters integer;begin
 if p_threshold<2 or p_threshold>100 or not exists(select 1 from public.profiles where id=p_actor) then raise exception 'INVALID_INPUT';end if;
 select * into ev from public.verification_events where id=p_event;
 if not found or ev.result not in ('VERIFIED_AUTHORIZED','IDENTITY_VERIFIED_NOT_AUTHORIZED') or ev.receipt is null or ev.officer_id is null then raise exception 'NOT_VERIFIED';end if;
 if exists(select 1 from public.challenges where id=ev.challenge_id and citizen_id is not null and citizen_id<>p_actor) then raise exception 'FORBIDDEN';end if;
 select * into o from public.officers where id=ev.officer_id for update;
 if o.user_id=p_actor then raise exception 'FORBIDDEN';end if;
 insert into public.officer_reports(officer_id,reporter_id,verification_event_id,reason) values(o.id,p_actor,p_event,p_reason);
 select count(distinct reporter_id) into reporters from public.officer_reports where officer_id=o.id;
 update public.officers set flagged_at=coalesce(flagged_at,clock_timestamp()),suspended_at=case when reporters>=p_threshold then coalesce(suspended_at,clock_timestamp()) else suspended_at end where id=o.id returning * into o;
 return jsonb_build_object('flagged',true,'suspended',o.suspended_at is not null,'distinctReporters',reporters);
 end $$;
revoke all on function public.create_official_action(uuid,jsonb),public.review_official_action(uuid,uuid,text),public.report_verified_officer(uuid,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.create_official_action(uuid,jsonb),public.review_official_action(uuid,uuid,text),public.report_verified_officer(uuid,uuid,text,integer) to service_role;
create index official_actions_officer_idx on public.official_actions(officer_id,valid_until);
create index official_actions_institution_idx on public.official_actions(institution_id,status);
create index officer_reports_event_idx on public.officer_reports(verification_event_id);
create or replace view public.public_officers with (security_barrier=true) as
 select o.id,o.institution_id,o.name,o.role_title,o.wallet_address,i.category
 from public.officers o join public.institutions i on i.id=o.institution_id
 where o.status='active' and o.suspended_at is null and o.expires_at>now() and i.status='active';
commit;
