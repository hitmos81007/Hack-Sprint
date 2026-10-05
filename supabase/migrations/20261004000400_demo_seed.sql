begin;
-- Root demo roles are assigned by this privileged SQL seed function, never an application route.
create function public.seed_demo_profile(p_id uuid,p_role public.app_role,p_name text) returns boolean
language plpgsql security invoker set search_path='' as $$
begin
 if length(p_name)>120 or p_name not like 'Synthetic demo %' then raise exception 'INVALID_INPUT';end if;
 update public.profiles set role=p_role,is_demo=true,display_name=p_name where id=p_id;
 return found;
end $$;
revoke all on function public.seed_demo_profile(uuid,public.app_role,text) from public,anon,authenticated;
grant execute on function public.seed_demo_profile(uuid,public.app_role,text) to service_role;
commit;
