begin;
alter table public.guardians add column active boolean not null default true,add column webhook_secret text;
revoke all on public.guardians from anon,authenticated;
grant select(id,user_id,name,channel,target,active,created_at) on public.guardians to authenticated;
create function public.limit_guardians() returns trigger language plpgsql security definer set search_path='' as $$begin
 perform 1 from public.profiles where id=new.user_id for update;
 if (select count(*) from public.guardians where user_id=new.user_id)>=3 then raise exception 'GUARDIAN_LIMIT';end if;return new;
end$$;
create trigger limit_guardians before insert on public.guardians for each row execute function public.limit_guardians();
revoke all on function public.limit_guardians() from public,anon,authenticated;
alter table public.alerts drop constraint alerts_delivery_mode_check;
alter table public.alerts add constraint alerts_delivery_mode_check check(delivery_mode in ('in_app','webhook','telegram'));
alter table public.alerts add column guardian_id uuid references public.guardians(id) on delete set null,
 add column event_key uuid,add column payload jsonb,add column created_at timestamptz not null default clock_timestamp(),
 add column event_source text not null default 'upi_demo' check(event_source in ('upi_demo','browser','server','simulation')),
 add unique(user_id,event_key,guardian_id);
create function public.create_guardian_alert(p_actor uuid,p_guardian uuid,p_event uuid,p_payload jsonb,p_source text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare g public.guardians;a public.alerts;inserted boolean:=false;
begin
 select * into g from public.guardians where id=p_guardian and user_id=p_actor and active;
 if not found then raise exception 'GUARDIAN_NOT_FOUND';end if;
 insert into public.alerts(user_id,guardian_id,event_key,payload,event_source,status,delivery_mode)
 values(p_actor,g.id,p_event,p_payload,p_source,'pending',g.channel)
 on conflict(user_id,event_key,guardian_id) do nothing returning * into a;
 if found then inserted:=true;else select * into a from public.alerts where user_id=p_actor and event_key=p_event and guardian_id=g.id;end if;
 return jsonb_build_object('id',a.id,'status',a.status,'claimed',inserted,'mode',g.channel);
end$$;
revoke all on function public.create_guardian_alert(uuid,uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.create_guardian_alert(uuid,uuid,uuid,jsonb,text) to service_role;
commit;
