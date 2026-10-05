begin;
create table public.upi_guard_sessions(
 id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id) on delete set null,
 token_hash text not null check(token_hash ~ '^[0-9a-f]{64}$'),payee_hash text not null check(payee_hash ~ '^0x[0-9a-f]{64}$'),
 amount numeric(14,2) not null check(amount>0),threshold numeric(14,2) not null check(threshold>0),
 latest_risk text not null check(latest_risk in ('LOW','MEDIUM','HIGH')),reasons text[] not null,
 created_at timestamptz not null default clock_timestamp(),cooling_until timestamptz not null,
 expires_at timestamptz not null default (clock_timestamp()+interval '15 minutes'),
 choice text check(choice in ('cancel','continue')),chosen_at timestamptz,alert_id uuid
);
create table public.upi_guard_choices(
 id uuid primary key default gen_random_uuid(),session_id uuid not null unique references public.upi_guard_sessions(id) on delete cascade,
 user_id uuid references public.profiles(id) on delete set null,choice text not null check(choice in ('cancel','continue')),created_at timestamptz not null default clock_timestamp()
);
alter table public.alerts alter column analysis_id drop not null,alter column user_id drop not null;
alter table public.alerts add column guard_session_id uuid unique references public.upi_guard_sessions(id) on delete cascade,add column delivery_mode text check(delivery_mode in ('in_app','webhook'));
alter table public.upi_guard_sessions add foreign key(alert_id) references public.alerts(id) on delete set null;
revoke insert,update,delete on public.alerts from authenticated;
do $$declare t text;begin foreach t in array array['upi_guard_sessions','upi_guard_choices'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 execute format('grant all on public.%I to service_role',t);
 execute format('create policy own_read on public.%I for select to authenticated using(user_id=(select auth.uid()))',t);
 execute format('create policy service_access on public.%I for all to service_role using(true) with check(true)',t);
 end loop;end $$;
create index upi_guard_sessions_owner_idx on public.upi_guard_sessions(user_id,created_at);
create function public.start_upi_guard(p_actor uuid,p_token_hash text,p_payee_hash text,p_amount numeric,p_threshold numeric,p_reported boolean,p_risk text) returns jsonb
 language plpgsql security invoker set search_path='' as $$
declare s public.upi_guard_sessions;why text[]:=array[]::text[];alert uuid;begin
 if p_amount>=p_threshold then why:=array_append(why,'AMOUNT');end if;
 if p_reported then why:=array_append(why,'REGISTRY');end if;
 if p_risk='HIGH' then why:=array_append(why,'ANALYZER');end if;
 insert into public.upi_guard_sessions(user_id,token_hash,payee_hash,amount,threshold,latest_risk,reasons,cooling_until)
 values(p_actor,p_token_hash,p_payee_hash,p_amount,p_threshold,p_risk,why,clock_timestamp()+case when cardinality(why)>0 then interval '60 seconds' else interval '0 seconds' end) returning * into s;
 if cardinality(why)>0 then insert into public.alerts(user_id,analysis_id,guard_session_id,status,delivery_mode) values(p_actor,null,s.id,'pending','in_app') returning id into alert;update public.upi_guard_sessions set alert_id=alert where id=s.id;end if;
 return jsonb_build_object('id',s.id,'coolingUntil',s.cooling_until,'serverNow',clock_timestamp(),'expiresAt',s.expires_at,'threshold',s.threshold::text,'amount',s.amount::text,'reasons',why,'alertId',alert);
 end $$;
create function public.choose_upi_guard(p_actor uuid,p_id uuid,p_token_hash text,p_choice text) returns jsonb
 language plpgsql security invoker set search_path='' as $$
declare s public.upi_guard_sessions;begin
 select * into s from public.upi_guard_sessions where id=p_id for update;
 if not found or s.token_hash is distinct from p_token_hash or (s.user_id is not null and s.user_id is distinct from p_actor) then raise exception 'FORBIDDEN';end if;
 if s.expires_at<=clock_timestamp() then raise exception 'EXPIRED';end if;
 if p_choice not in ('cancel','continue') or p_choice is null then raise exception 'INVALID_INPUT';end if;
 if s.choice is not null then
 if s.choice=p_choice then return jsonb_build_object('choice',s.choice,'chosenAt',s.chosen_at,'demo',true);end if;raise exception 'ALREADY_CHOSEN';end if;
 if p_choice='continue' and s.cooling_until>clock_timestamp() then raise exception 'COOLING_OFF';end if;
 insert into public.upi_guard_choices(session_id,user_id,choice) values(s.id,s.user_id,p_choice);
 update public.upi_guard_sessions set choice=p_choice,chosen_at=clock_timestamp() where id=s.id returning * into s;
 return jsonb_build_object('choice',s.choice,'chosenAt',s.chosen_at,'demo',true);
 end $$;
revoke all on function public.start_upi_guard(uuid,text,text,numeric,numeric,boolean,text),public.choose_upi_guard(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.start_upi_guard(uuid,text,text,numeric,numeric,boolean,text),public.choose_upi_guard(uuid,uuid,text,text) to service_role;
commit;
