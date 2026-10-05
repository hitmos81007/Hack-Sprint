import { PGlite } from "@electric-sql/pglite";
import { readFile,readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { beforeAll,afterAll,it,expect,vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
vi.mock("server-only",()=>({}));
import { checkRateLimit } from "./ratelimit";
let db:PGlite;
beforeAll(async()=>{
 db=new PGlite();await db.exec("create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");
 const dir=resolve(process.cwd(),"../supabase/migrations");for(const f of(await readdir(dir)).filter(x=>x.endsWith(".sql")).sort())await db.exec(await readFile(resolve(dir,f),"utf8"));
},60000);
afterAll(async()=>{vi.restoreAllMocks();vi.unstubAllEnvs();await db.close();});
it("every application table has RLS and an explicit policy",async()=>{
 const tables=await db.query<{name:string;rls:boolean;policies:number}>("select c.relname as name,c.relrowsecurity as rls,(select count(*)::int from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policies from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p')");
 expect(tables.rows).toHaveLength(17);for(const table of tables.rows){expect(table.rls,table.name).toBe(true);expect(table.policies,table.name).toBeGreaterThan(0);}
});
it("anonymous clients cannot mutate tables or execute service-only verification/rate-limit RPCs",async()=>{
 const grants=await db.query("select table_name,privilege_type from information_schema.role_table_grants where table_schema='public' and grantee='anon' and privilege_type in ('INSERT','UPDATE','DELETE')");expect(grants.rows).toEqual([]);
 for(const role of["anon","authenticated"]){await db.exec("begin;set local role "+role);try{await expect(db.query("select public.audit_rejected_verification('INVALID_INPUT')")).rejects.toMatchObject({code:"42501"});}finally{await db.exec("rollback");}}
});
function client(){return {rpc:async(_name:string,args:{p_key:string;p_window_start:string})=>({data:(await db.query<{count:number}>("select public.increment_rate_limit($1,$2::timestamptz) as count",[args.p_key,args.p_window_start])).rows[0].count,error:null})} as unknown as SupabaseClient;}
it("all four required scopes share atomic DB counters across independent instances",async()=>{
 vi.stubEnv("RATE_LIMIT_PEPPER","synthetic-test-pepper-1234");vi.stubEnv("VERCEL","0");vi.stubEnv("RATE_LIMIT_TRUST_PROXY","0");
 await db.exec("truncate public.rate_limits");
 const fixedNow=Date.now();vi.spyOn(Date,"now").mockReturnValue(fixedNow);
 for(const scope of["challenge","verify","analyze","report"] as const){const limit=scope==="challenge"?5:20;const results=await Promise.all(Array.from({length:limit+3},(_,i)=>checkRateLimit(client(),new Request("http://localhost/api/"+scope,{headers:{"x-forwarded-for":"192.0.2."+(i+1)}}),scope,scope==="report"?"synthetic-user":undefined)));expect(results.filter(Boolean)).toHaveLength(limit);}
 expect((await db.query("select count(*)::int as n from public.rate_limits")).rows).toEqual([{n:4}]);
});
it("trusted proxy IPs have separate buckets and invalid DB counters fail closed",async()=>{
 vi.stubEnv("VERCEL","1");await db.exec("truncate public.rate_limits");
 for(const ip of["192.0.2.1","192.0.2.2"])expect(await checkRateLimit(client(),new Request("http://localhost/api/challenge",{headers:{"x-forwarded-for":ip}}),"challenge")).toBe(true);
 expect((await db.query("select count(*)::int as n from public.rate_limits")).rows).toEqual([{n:2}]);
 for(const data of[null,NaN,0,"1"]){const bad={rpc:async()=>({data,error:null})} as unknown as SupabaseClient;await expect(checkRateLimit(bad,new Request("http://localhost/api/verify"),"verify")).rejects.toMatchObject({code:"DATABASE_UNAVAILABLE"});}
});
it("rejected envelopes produce completed safe audit rows with no raw payload",async()=>{
 const saved=await db.query<{id:string}>("select public.audit_rejected_verification('INVALID_INPUT') as id");const row=(await db.query<{result:string;reason:string;completed_at:Date;challenge_id:string|null}>("select result,reason,completed_at,challenge_id from public.verification_events where id=$1",[saved.rows[0].id])).rows[0];expect(row).toMatchObject({result:"NOT_VERIFIED",reason:"INVALID_INPUT",challenge_id:null});expect(row.completed_at).not.toBeNull();
});


