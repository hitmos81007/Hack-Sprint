begin;
create table public.evidence_cases(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),title text not null check(length(title) between 1 and 120),
 created_at timestamptz not null default now(),status text not null default 'draft' check(status in ('draft','anchoring','anchored')),
 manifest_hash text check(manifest_hash ~ '^0x[0-9a-f]{64}$'),manifest jsonb,
 onchain_tx text check(onchain_tx ~ '^0x[0-9a-fA-F]{64}$'),anchored_at timestamptz,
 block_number bigint check(block_number>=0),chain_id bigint,registry_address text,unique(id,user_id)
);
create table public.evidence_items(
 id uuid primary key,case_id uuid not null,user_id uuid not null references public.profiles(id),
 kind text not null check(kind in ('screenshot','transcript','call_metadata','verdict_receipt','analyzer_result')),
 sha256 text not null check(sha256 ~ '^0x[0-9a-f]{64}$'),size bigint not null check(size between 0 and 26214400),
 mime text not null check(length(mime)<=100),created_at timestamptz not null default now(),
 foreign key(case_id,user_id) references public.evidence_cases(id,user_id)
);
alter table public.evidence_cases enable row level security;alter table public.evidence_items enable row level security;
revoke all on public.evidence_cases,public.evidence_items from anon,authenticated;
grant select on public.evidence_cases,public.evidence_items to authenticated;
grant all on public.evidence_cases,public.evidence_items to service_role;
create policy cases_own on public.evidence_cases for select to authenticated using(user_id=(select auth.uid()));
create policy items_own on public.evidence_items for select to authenticated using(user_id=(select auth.uid()));
create policy cases_service on public.evidence_cases for all to service_role using(true) with check(true);
create policy items_service on public.evidence_items for all to service_role using(true) with check(true);
create index evidence_cases_owner_idx on public.evidence_cases(user_id,created_at);
create index evidence_items_case_idx on public.evidence_items(case_id);
create function public.add_evidence_items(p_actor uuid,p_case uuid,p_items jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare c public.evidence_cases;begin
 select * into c from public.evidence_cases where id=p_case and user_id=p_actor for update;
 if not found or c.status<>'draft' then raise exception 'CONFLICT';end if;
 if jsonb_array_length(p_items)<1 or jsonb_array_length(p_items)>20 or (select count(*) from public.evidence_items where case_id=p_case)+jsonb_array_length(p_items)>100 then raise exception 'INVALID_INPUT';end if;
 insert into public.evidence_items(id,case_id,user_id,kind,sha256,size,mime)
 select (x->>'id')::uuid,p_case,p_actor,x->>'kind',x->>'sha256',(x->>'size')::bigint,x->>'mime' from jsonb_array_elements(p_items) x;
 end $$;
create function public.freeze_evidence(p_actor uuid,p_case uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.evidence_cases;items jsonb;begin
 select * into c from public.evidence_cases where id=p_case and user_id=p_actor for update;
 if not found then raise exception 'FORBIDDEN';end if;
 if c.status='draft' then
 select jsonb_agg(jsonb_build_object('id',id,'kind',kind,'sha256',sha256,'size',size,'mime',mime) order by id) into items from public.evidence_items where case_id=p_case;
 if items is null then raise exception 'EMPTY_CASE';end if;
 update public.evidence_cases set status='anchoring',manifest=jsonb_build_object('version',1,'caseId',p_case,'items',items) where id=p_case returning * into c;
 end if;return to_jsonb(c);end $$;
revoke all on function public.add_evidence_items(uuid,uuid,jsonb),public.freeze_evidence(uuid,uuid) from public,anon,authenticated;
grant execute on function public.add_evidence_items(uuid,uuid,jsonb),public.freeze_evidence(uuid,uuid) to service_role;
commit;
