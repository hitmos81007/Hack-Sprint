import {PGlite} from "@electric-sql/pglite";
import {readFile,readdir} from "node:fs/promises";
import {resolve} from "node:path";
import {beforeAll,afterAll,it,expect,vi} from "vitest";
import {assertRole,type Identity} from "./auth-policy";
import {dashboardSchema,estimatePreventedLoss} from "./dashboard";
vi.mock("server-only",()=>({}));
const mock=vi.hoisted(()=>({role:vi.fn()}));vi.mock("./auth",()=>({requireRole:mock.role,authErrorResponse:(e:{status:number;code:string})=>Response.json({error:{code:e.code}},{status:e.status})}));
import {GET} from "../app/api/dashboard/route";
let db:PGlite;
const citizen="00000000-0000-4000-8000-00000000c001",other="00000000-0000-4000-8000-00000000c002",issuer="00000000-0000-4000-8000-00000000c003",root="00000000-0000-4000-8000-00000000c004",officer="00000000-0000-4000-8000-00000000c005";
let identity:Identity|null={id:citizen,role:"citizen"};
async function metrics(actor:string,role="authenticated"){
 await db.exec("begin;set local role "+role);
 try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[actor]);return (await db.query<{data:unknown}>("select public.dashboard_metrics() as data")).rows[0].data;}finally{await db.exec("rollback");}
}
const inst="10000000-0000-4000-8000-00000000c001",oid="10000000-0000-4000-8000-00000000c002",challenge="20000000-0000-4000-8000-00000000c001",foreignChallenge="20000000-0000-4000-8000-00000000c002",tx="0x"+"a".repeat(64),hash="0x"+"b".repeat(64);
beforeAll(async()=>{
 db=new PGlite();await db.exec("create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;");const dir=resolve(process.cwd(),"../supabase/migrations");for(const f of(await readdir(dir)).filter(x=>x.endsWith(".sql")).sort())await db.exec(await readFile(resolve(dir,f),"utf8"));
 for(const id of[citizen,other,issuer,root,officer])await db.query("insert into auth.users(id) values($1)",[id]);for(const[id,role]of[[issuer,"issuer_admin"],[root,"root_authority"],[officer,"officer"]])await db.query("update public.profiles set role=$2::public.app_role where id=$1",[id,role]);
 await db.query("insert into public.institutions(id,name,category,wallet_address,created_by,status,onchain_tx) values($1,'Synthetic Demo','police',$2,$3,'active',$4)",[inst,"0x"+"1".repeat(40),issuer,tx]);
 await db.query("insert into public.officers(id,user_id,institution_id,name,role_title,wallet_address,status,expires_at) values($1,$2,$3,'Synthetic Officer','Title',$4,'active',now()+interval '1 day')",[oid,officer,inst,"0x"+"2".repeat(40)]);
 for(const[c,id]of[[challenge,citizen],[foreignChallenge,other]])await db.query("insert into public.challenges(id,citizen_id,code,claimed_entity,claimed_category) values($1,$2,'123456','Synthetic','police')",[c,id]);
 for(const[result,time]of[["VERIFIED_AUTHORIZED",100],["NOT_VERIFIED",400]])await db.query("insert into public.verification_events(challenge_id,officer_id,result,reason,duration_ms,completed_at) values($1,$2,$3,'Synthetic',$4,now())",[challenge,oid,result,time]);
 await db.query("insert into public.verification_events(challenge_id,result,reason,duration_ms,completed_at) values($1,'NOT_VERIFIED','Synthetic',900,now())",[foreignChallenge]);
 await db.query("insert into public.verification_events(challenge_id,result,reason,duration_ms) values($1,'NOT_VERIFIED','VERIFICATION_PENDING',0)",[challenge]);
 for(const[id,verdict]of[[citizen,"HIGH"],[citizen,"LOW"],[other,"HIGH"],[null,"MEDIUM"]])await db.query("insert into public.analyses(user_id,input_hash,risk_score,verdict,provider,latency_ms) values($1,$2,80,$3,'heuristics',5)",[id,"c".repeat(64),verdict]);
 await db.query("insert into public.scam_reports(reporter_id,id_hash,id_type,category,anchor_status,anchored_tx) values($1,$2,'phone','impersonation','anchored',$3),($1,$4,'upi','other','pending',null)",[citizen,hash,tx,"0x"+"c".repeat(64)]);
 await db.query("insert into public.scam_reports(reporter_id,id_hash,id_type,category,anchor_status,anchored_tx) values($1,$2,'wallet','other','anchored',$3)",[other,hash,"0x"+"d".repeat(64)]);
 await db.query("insert into public.evidence_cases(user_id,title,status,onchain_tx) values($1,'Synthetic','anchored',$2),($1,'Pending','anchoring',$3)",[citizen,tx,"0x"+"e".repeat(64)]);
 mock.role.mockImplementation(async roles=>({...assertRole(identity,roles),client:{rpc:async()=>({data:await metrics(identity!.id),error:null})}}));
},60000);
afterAll(async()=>{await db.close();});
it("aggregates own counts and exact even median, excluding pending work and duplicate transaction hashes",async()=>{expect(dashboardSchema.parse(await metrics(citizen))).toMatchObject({scope:"personal",verifications:{VERIFIED_AUTHORIZED:1,NOT_VERIFIED:1},medianVerificationMs:250,analyses:{HIGH:1,LOW:1},reports:{phone:1,upi:1},anchoredTransactions:1});});
it("shows officer-owned attempts without exposing other citizen counts",async()=>{expect(await metrics(officer)).toMatchObject({scope:"personal",verifications:{VERIFIED_AUTHORIZED:1,NOT_VERIFIED:1},analyses:{},reports:{}});});
it("both administrator roles receive global counts including anonymous saved analyses",async()=>{for(const id of[issuer,root])expect(await metrics(id)).toMatchObject({scope:"global",medianVerificationMs:400,verifications:{NOT_VERIFIED:2,VERIFIED_AUTHORIZED:1},analyses:{HIGH:2,LOW:1,MEDIUM:1},reports:{phone:1,upi:1,wallet:1},anchoredTransactions:2});});
it("empty timing data is null, not a fabricated zero",async()=>{const id="00000000-0000-4000-8000-00000000c006";await db.query("insert into auth.users(id) values($1)",[id]);expect(await metrics(id)).toMatchObject({scope:"personal",medianVerificationMs:null,verifications:{},anchoredTransactions:0});});
it("denies anonymous SQL access and prevents authenticated role/scope escalation",async()=>{await expect(metrics("","anon")).rejects.toMatchObject({code:"42501"});await expect(metrics("" )).rejects.toMatchObject({code:"42501"});await db.exec("begin;set local role authenticated");try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[citizen]);await expect(db.query("update public.profiles set role='root_authority',is_demo=true where id=$1",[citizen])).rejects.toMatchObject({code:"42501"});}finally{await db.exec("rollback");}});
it("API requires a logged-in DB role and rejects client-chosen global/user filters",async()=>{identity=null;expect((await GET(new Request("http://localhost/api/dashboard"))).status).toBe(401);identity={id:citizen,role:"citizen"};expect(await(await GET(new Request("http://localhost/api/dashboard"))).json()).toMatchObject({scope:"personal"});expect((await GET(new Request("http://localhost/api/dashboard?scope=global"))).status).toBe(400);});
it("estimated losses use only HIGH records and bounded editable assumptions",async()=>{const m=dashboardSchema.parse(await metrics(citizen));expect(estimatePreventedLoss(m,{amountPerIncident:10000,preventionPercent:25})).toEqual({incidents:1,estimate:2500});expect(estimatePreventedLoss(m,{amountPerIncident:900,preventionPercent:0}).estimate).toBe(0);expect(()=>estimatePreventedLoss(m,{amountPerIncident:-1,preventionPercent:100})).toThrow();expect(()=>estimatePreventedLoss(m,{amountPerIncident:1,preventionPercent:101})).toThrow();});

it("demo role seeding is SQL-only and unavailable to authenticated clients",async()=>{await db.exec("begin;set local role authenticated");try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[citizen]);await expect(db.query("select public.seed_demo_profile($1,'root_authority','Synthetic demo root')",[citizen])).rejects.toMatchObject({code:"42501"});}finally{await db.exec("rollback");}await db.exec("begin;set local role service_role");try{expect((await db.query<{ok:boolean}>("select public.seed_demo_profile($1,'citizen','Synthetic demo citizen') as ok",[citizen])).rows[0].ok).toBe(true);}finally{await db.exec("rollback");}});
