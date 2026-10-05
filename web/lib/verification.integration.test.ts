import {PGlite} from "@electric-sql/pglite";
import {readFile,readdir} from "node:fs/promises";
import {resolve} from "node:path";
import {Wallet} from "ethers";
import {beforeAll,beforeEach,afterAll,describe,it,expect,vi} from "vitest";
import {verifyVerdictReceipt} from "./verdict-receipt";
import {POST as actionRoute} from "../app/api/actions/route";
import {PATCH as reviewRoute} from "../app/api/actions/[id]/route";
import {POST as reportRoute} from "../app/api/officer-reports/route";
import {createCredential} from "./crypto";
import {assertRole,type Identity} from "./auth-policy";
import {createVerificationToken,signedChallengeMessage,decodeVerificationToken,verifyOfficerProof,type Challenge} from "./verification-schema";
vi.mock("server-only",()=>({}));
const mocks=vi.hoisted(()=>({active:vi.fn(),optional:vi.fn(),require:vi.fn(),admin:vi.fn()}));
vi.mock("./chain",async original=>({...await original<typeof import("./chain")>(),isActive:mocks.active}));
vi.mock("./optional-auth",()=>({optionalIdentity:mocks.optional}));
vi.mock("./auth",async original=>({...await original<typeof import("./auth")>(),requireRole:mocks.require}));
vi.mock("./supabase/admin",()=>({createAdminClient:mocks.admin}));
import {POST as challengeRoute} from "../app/api/challenge/route";
import {POST as verifyRoute} from "../app/api/verify/route";
import {POST as resolveRoute} from "../app/api/challenge/resolve/route";
let db:PGlite;
const issuerUser="00000000-0000-4000-8000-000000000301";
const officerUser="00000000-0000-4000-8000-000000000302";
const citizen="00000000-0000-4000-8000-000000000303";
const institutionId="10000000-0000-4000-8000-000000000301";
const officerId="20000000-0000-4000-8000-000000000301";
const actionId="40000000-0000-4000-8000-000000000301";const receiptKey=Wallet.createRandom();
const issuer=Wallet.createRandom(),officer=Wallet.createRandom();
let identity:Identity|null={id:officerUser,role:"officer"};
function req(data:unknown){return new Request("http://localhost/api/test",{method:"POST",headers:{"content-type":"application/json","x-forwarded-for":"192.0.2.7"},body:JSON.stringify(data)});}
class Query{
 private cols="*";private values:unknown[]=[];private filters:string[]=[];private payload:Record<string,unknown>|null=null;private singleRow=false;private updating=false;
 constructor(private table:string){}
 select(columns="*"){this.cols=columns;return this;}
 insert(value:Record<string,unknown>){this.payload=value;return this;}
 update(value:Record<string,unknown>){this.payload=value;this.updating=true;return this;}
 eq(field:string,value:unknown){this.values.push(value);this.filters.push(`${field}=$${this.values.length}`);return this;}
 ilike(field:string,value:string){this.values.push(value);this.filters.push(`${field} ilike $${this.values.length}`);return this;}
 single(){this.singleRow=true;return this;}
 maybeSingle(){this.singleRow=true;return this;}
 async then(done:(result:unknown)=>unknown,fail?:(error:unknown)=>unknown){try{
  let statement=`select ${this.cols} from public.${this.table}${this.filters.length?` where ${this.filters.join(" and ")}`:""}`;
  if(this.payload){const fields=Object.keys(this.payload);const params=fields.map(field=>{const v=this.payload![field];this.values.push(v!==null&&typeof v==="object"?JSON.stringify(v):v);return `$${this.values.length}`;});statement=this.updating?`update public.${this.table} set ${fields.map((f,i)=>`${f}=${params[i]}`).join(",")}${this.filters.length?` where ${this.filters.join(" and ")}`:""} returning ${this.cols}`:`insert into public.${this.table}(${fields.join(",")}) values(${params.join(",")}) returning ${this.cols}`;}
  try{const result=await db.query(statement,this.values);return done({data:this.singleRow?result.rows[0]??null:result.rows,error:null});}
  catch(error){return done({data:null,error:{code:(error as {code:string}).code}});}
 }catch(error){if(fail)return fail(error);throw error;}}
}
const client={from:(table:string)=>new Query(table),rpc:async(name:string,args:Record<string,unknown>)=>{
 try{const values=Object.values(args).map(v=>v!==null&&typeof v==="object"?JSON.stringify(v):v);const rows=await db.query<{data:unknown}>(`select public.${name}(${values.map((_,i)=>`$${i+1}`).join(",")}) as data`,values);return {data:rows.rows[0].data,error:null};}
 catch(error){return {data:null,error:{code:(error as {code:string}).code}};}
}};
async function make(category="bank",intent:Record<string,string>={}):Promise<Challenge>{const response=await challengeRoute(req({claimedEntity:"Synthetic Bank Desk",claimedCategory:category,...intent}));expect(response.status).toBe(201);return(await response.json()).challenge;}
async function submit(challenge:Challenge,token?:string){return verifyRoute(req({challengeId:challenge.id,token:token??await createVerificationToken(officer,challenge,actionId)}));}
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role anon nologin;create role authenticated nologin;create role service_role nologin bypassrls;
 create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth,public to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;`);
 const directory=resolve(process.cwd(),"../supabase/migrations");for(const file of(await readdir(directory)).filter(f=>f.endsWith(".sql")).sort())await db.exec(await readFile(resolve(directory,file),"utf8"));
 for(const id of[issuerUser,officerUser,citizen])await db.query("insert into auth.users(id) values($1)",[id]);
 await db.query("update public.profiles set role='issuer_admin' where id=$1",[issuerUser]);await db.query("update public.profiles set role='officer' where id=$1",[officerUser]);
 await db.query("insert into public.institutions(id,name,category,wallet_address,status,created_by) values($1,'Synthetic Bank','bank',$2,'active',$3)",[institutionId,issuer.address,issuerUser]);
 const credential=await createCredential(issuer,{officerName:"Synthetic Officer",roleTitle:"Demo Inspector",officerAddress:officer.address,expiresAt:new Date(Date.now()+86400000).toISOString()});
 await db.query("insert into public.officers(id,user_id,institution_id,name,role_title,wallet_address,credential,status,expires_at) values($1,$2,$3,'Synthetic Officer','Demo Inspector',$4,$5,'active',$6)",[officerId,officerUser,institutionId,officer.address,JSON.stringify(credential),credential.expiresAt]);
 await db.exec("set role service_role");mocks.admin.mockReturnValue(client);
 mocks.require.mockImplementation(async roles=>({...assertRole(identity,roles),client}));
},60000);
beforeEach(async()=>{
 await db.exec("delete from public.officer_reports;delete from public.verification_events;delete from public.official_actions;delete from public.challenges;delete from public.rate_limits;update public.officers set suspended_at=null,flagged_at=null,status='active',expires_at=now()+interval '1 day';update public.institutions set status='active',chain_operation=null;");
 await db.query("insert into public.official_actions(id,officer_id,institution_id,purpose,case_ref,valid_until,status,approved_by) values($1,$2,$3,'information','SYNTHETIC-CASE',now()+interval '1 hour','approved',$4)",[actionId,officerId,institutionId,officerUser]);
 vi.stubEnv("VERDICT_SIGNING_KEY",receiptKey.privateKey);vi.stubEnv("NEXT_PUBLIC_VERDICT_SIGNER_ADDRESS",receiptKey.address);
 vi.stubEnv("RATE_LIMIT_PEPPER","synthetic-test-pepper-12345");mocks.active.mockReset().mockResolvedValue(true);mocks.optional.mockReset().mockResolvedValue(null);identity={id:officerUser,role:"officer"};
});
afterAll(async()=>{await db?.close();vi.unstubAllEnvs();vi.restoreAllMocks();});
describe("challenge-response routes with actual atomic PostgreSQL functions",()=>{
 it("creates an anonymous six-digit challenge with a database-controlled two-minute expiry",async()=>{
  const c=await make();expect(c.code).toMatch(/^\d{6}$/);const row=(await db.query<{citizen_id:string|null;ttl:number}>("select citizen_id,extract(epoch from expires_at-now())::float as ttl from public.challenges where id=$1",[c.id])).rows[0];
  expect(row.citizen_id).toBeNull();expect(row.ttl).toBeGreaterThan(115);expect(row.ttl).toBeLessThanOrEqual(120);
  mocks.optional.mockResolvedValueOnce({id:citizen,role:"citizen"});const owned=await make();expect((await db.query<{citizen_id:string}>("select citizen_id from public.challenges where id=$1",[owned.id])).rows[0].citizen_id).toBe(citizen);
 });
 it("signs the exact intent-bound message and consumes a valid challenge only once",async()=>{
  const c=await make();expect(signedChallengeMessage(c,actionId)).toBe(`${c.id}|${c.code}|${actionId}`);
  const token=await createVerificationToken(officer,c,actionId);expect(token).not.toContain(officer.privateKey);expect(verifyOfficerProof(decodeVerificationToken(token),c)).toBe(true);
  const first=await(await submit(c,token)).json();expect(first).toMatchObject({result:"VERIFIED_AUTHORIZED",reason:"ACTION_AUTHORIZED",officer:{name:"Synthetic Officer"}});
  const replay=await(await submit(c,token)).json();expect(replay).toMatchObject({result:"NOT_VERIFIED",reason:"CHALLENGE_USED"});
  const events=(await db.query<{reason:string}>("select reason from public.verification_events order by created_at")).rows;expect(events.map(e=>e.reason)).toEqual(["ACTION_AUTHORIZED","CHALLENGE_USED"]);
 });
 it("rejects an expired challenge with an audit event",async()=>{
  const c=await make();await db.query("update public.challenges set expires_at=now()-interval '1 second' where id=$1",[c.id]);
  expect(await(await submit(c)).json()).toMatchObject({result:"NOT_VERIFIED",reason:"CHALLENGE_EXPIRED"});expect((await db.query("select * from public.verification_events")).rows).toHaveLength(1);
 });
 it("rejects a token for a different challenge",async()=>{
  const c=await make(),other=await make();const token=await createVerificationToken(officer,other,actionId);
  expect(await(await submit(c,token)).json()).toMatchObject({result:"NOT_VERIFIED",reason:"WRONG_CHALLENGE"});
 });
 it("counts malformed attempts and blocks the sixth without incrementing past five",async()=>{
  const c=await make();for(let n=0;n<5;n++)expect(await(await submit(c,"malformed")).json()).toMatchObject({reason:"INVALID_TOKEN"});
  expect(await(await submit(c)).json()).toMatchObject({result:"NOT_VERIFIED",reason:"ATTEMPTS_EXHAUSTED"});
  expect((await db.query<{attempts:number}>("select attempts from public.challenges where id=$1",[c.id])).rows[0].attempts).toBe(5);
  expect((await db.query("select * from public.verification_events")).rows).toHaveLength(6);
 });
 it("rejects an on-chain revoked issuer even when database status is active",async()=>{
  const c=await make();mocks.active.mockResolvedValueOnce(false);expect(await(await submit(c)).json()).toMatchObject({reason:"ISSUER_REVOKED",result:"NOT_VERIFIED"});expect(mocks.active).toHaveBeenCalledWith(issuer.address);
 });
 it("rejects a revoked credential and does not consume the challenge",async()=>{
  const c=await make();await db.query("update public.officers set status='revoked' where id=$1",[officerId]);expect(await(await submit(c)).json()).toMatchObject({reason:"CREDENTIAL_REVOKED_OR_EXPIRED"});expect(mocks.active).not.toHaveBeenCalled();
  expect((await db.query<{used_at:string|null}>("select used_at from public.challenges where id=$1",[c.id])).rows[0].used_at).toBeNull();
 });
 it("returns a category mismatch warning and consumes the signed challenge",async()=>{
  const c=await make("police");expect(await(await submit(c)).json()).toMatchObject({result:"IDENTITY_VERIFIED_NOT_AUTHORIZED",reason:"CATEGORY_MISMATCH"});expect(await(await submit(c)).json()).toMatchObject({reason:"CHALLENGE_USED"});
 });
 it("allows exactly one success for concurrent submissions",async()=>{
  const c=await make();const token=await createVerificationToken(officer,c,actionId);const responses=await Promise.all([submit(c,token),submit(c,token)]);const values=await Promise.all(responses.map(r=>r.json()));
  expect(values.map(v=>v.result).sort()).toEqual(["NOT_VERIFIED","VERIFIED_AUTHORIZED"]);expect((await db.query("select * from public.verification_events")).rows).toHaveLength(2);
 });
 it("rechecks credential revocation and expiry at completion after a chain check",async()=>{
  const c=await make();mocks.active.mockImplementationOnce(async()=>{await db.query("update public.officers set status='revoked' where id=$1",[officerId]);return true;});
  expect(await(await submit(c)).json()).toMatchObject({result:"NOT_VERIFIED",reason:"CREDENTIAL_REVOKED_OR_EXPIRED"});
  await db.query("update public.officers set status='active' where id=$1",[officerId]);const other=await make();mocks.active.mockImplementationOnce(async()=>{await db.query("update public.challenges set expires_at=now()-interval '1 second' where id=$1",[other.id]);return true;});
  expect(await(await submit(other)).json()).toMatchObject({result:"NOT_VERIFIED",reason:"CHALLENGE_EXPIRED"});
 });
 it("fails closed and finalizes the audit when the chain RPC is unavailable",async()=>{
  const c=await make();mocks.active.mockRejectedValueOnce(new Error("secret-provider-url"));const response=await submit(c);expect(response.status).toBe(503);const result=await response.json();expect(result.reason).toBe("VERIFICATION_UNAVAILABLE");expect(JSON.stringify(result)).not.toContain("secret-provider");
  expect((await db.query<{completed_at:string}>("select completed_at from public.verification_events")).rows[0].completed_at).not.toBeNull();
 });
 it("rate limits challenge creation and verification using hashed database buckets",async()=>{
  for(let n=0;n<5;n++)await make();expect((await challengeRoute(req({claimedEntity:"Synthetic Bank",claimedCategory:"bank"}))).status).toBe(429);
  const c=(await db.query<{id:string;code:string;expires_at:string}>("select id,code,expires_at from public.challenges limit 1")).rows[0];
  for(let n=0;n<20;n++)await verifyRoute(req({challengeId:c.id,token:"malformed"}));const response=await verifyRoute(req({challengeId:c.id,token:"malformed"}));expect(response.status).toBe(429);expect(await response.json()).toMatchObject({reason:"RATE_LIMITED"});
  expect((await db.query("select * from public.verification_events")).rows).toHaveLength(21);expect(JSON.stringify((await db.query("select key from public.rate_limits")).rows)).not.toContain("192.0.2.7");
 });
 it("loads a challenge only for an officer who knows its id and code; returns the claimed entity",async()=>{
  const c=await make();const loaded=await resolveRoute(req({challengeId:c.id,code:c.code}));expect(loaded.status).toBe(200);expect((await loaded.json()).challenge.claimedEntity).toBe(c.claimedEntity);
  const wrong=await resolveRoute(req({challengeId:c.id,code:c.code==="000000"?"111111":"000000"}));expect(wrong.status).toBe(404);
  identity={id:citizen,role:"citizen"};expect((await resolveRoute(req({challengeId:c.id,code:c.code}))).status).toBe(403);
 });
 it("logs unknown challenge ids without violating the audit foreign key",async()=>{
  const id="30000000-0000-4000-8000-000000000999";expect(await(await verifyRoute(req({challengeId:id,token:"invalid"}))).json()).toMatchObject({reason:"CHALLENGE_NOT_FOUND"});
  const row=(await db.query<{challenge_id:string|null;requested_challenge_id:string}>("select challenge_id,requested_challenge_id from public.verification_events")).rows[0];expect(row).toEqual({challenge_id:null,requested_challenge_id:id});
 });

 it("compares payment caps and active institutional payees",async()=>{
  await db.query("insert into public.institution_payees(institution_id,payee,label,is_institutional,created_by) values($1,'synthetic@bank','Synthetic institutional account',true,$2) on conflict(institution_id,payee) do update set active=true",[institutionId,issuerUser]);
  await db.query("update public.official_actions set purpose='payment',payment_allowed=true,payee='synthetic@bank',amount_cap=100,approved_by=$1 where id=$2",[issuerUser,actionId]);
  const tooMuch=await make('bank',{purpose:'payment',amount:'100.01',payee:'synthetic@bank'});
  expect(await(await submit(tooMuch)).json()).toMatchObject({result:'IDENTITY_VERIFIED_NOT_AUTHORIZED',reason:'AMOUNT_EXCEEDED'});
  const wrongPayee=await make('bank',{purpose:'payment',amount:'10',payee:'outsider@bank'});
  expect(await(await submit(wrongPayee)).json()).toMatchObject({result:'IDENTITY_VERIFIED_NOT_AUTHORIZED',reason:'PAYEE_NOT_ALLOWLISTED'});
  const good=await make('bank',{purpose:'payment',amount:'100',payee:'synthetic@bank'});
  expect(await(await submit(good)).json()).toMatchObject({result:'VERIFIED_AUTHORIZED'});
  await db.query("update public.institution_payees set active=false where institution_id=$1",[institutionId]);
  const removed=await make('bank',{purpose:'payment',amount:'10',payee:'synthetic@bank'});
  expect(await(await submit(removed)).json()).toMatchObject({reason:'PAYEE_NOT_ALLOWLISTED'});
 });
 it("rejects expired actions and sensitive actions without independent approval",async()=>{
  await db.query("update public.official_actions set created_at=now()-interval '2 hours',valid_until=now()-interval '1 hour' where id=$1",[actionId]);
  expect(await(await submit(await make())).json()).toMatchObject({result:'IDENTITY_VERIFIED_NOT_AUTHORIZED',reason:'ACTION_EXPIRED'});
  await db.query("update public.official_actions set created_at=now(),valid_until=now()+interval '1 hour',purpose='document_request',status='pending',approved_by=null where id=$1",[actionId]);
  expect(await(await submit(await make('bank',{purpose:'document_request'}))).json()).toMatchObject({reason:'ACTION_NOT_APPROVED'});
  await db.query("update public.official_actions set status='approved',approved_by=$1 where id=$2",[officerUser,actionId]);
  expect(await(await submit(await make('bank',{purpose:'document_request'}))).json()).toMatchObject({reason:'ACTION_NOT_APPROVED'});
 });
 it("enforces maker-checker ownership, sensitive approval, and 24-hour validity",async()=>{
  const input={purpose:'document_request',caseRef:'SYNTHETIC-DOC',paymentAllowed:false,payee:'',amountCap:'0',validUntil:new Date(Date.now()+3600000).toISOString()};
  const created=await actionRoute(req(input));expect(created.status).toBe(201);const action=(await created.json()).action;expect(action.status).toBe('pending');
  const context={params:Promise.resolve({id:action.id})};
  expect((await reviewRoute(req({operation:'approve'}),context)).status).toBe(403);
  identity={id:issuerUser,role:'issuer_admin'};expect((await reviewRoute(req({operation:'approve'}),context)).status).toBe(200);
  identity={id:citizen,role:'issuer_admin'};expect((await reviewRoute(req({operation:'revoke'}),context)).status).toBe(409);
  identity={id:officerUser,role:'officer'};expect((await actionRoute(req({...input,validUntil:new Date(Date.now()+25*3600000).toISOString()}))).status).toBe(400);
 });
 it("signs receipts with a pinned server key and detects tampered facts",async()=>{
  const value=await(await submit(await make())).json();expect(verifyVerdictReceipt(value.receipt,receiptKey.address)).toBe(true);
  expect(verifyVerdictReceipt({...value.receipt,facts:{...value.receipt.facts,amount:'999'}},receiptKey.address)).toBe(false);
  expect(verifyVerdictReceipt(value.receipt,Wallet.createRandom().address)).toBe(false);
  const stored=(await db.query<{receipt:unknown}>("select receipt from public.verification_events where id=$1",[value.eventId])).rows[0].receipt;expect(stored).toEqual(value.receipt);
 });
 it("auto-flags verified officers and suspends after distinct reporters only",async()=>{
  const value=await(await submit(await make())).json();const input={eventId:value.eventId,receipt:value.receipt,reason:'Synthetic report for review'};
  identity={id:citizen,role:'citizen'};let report=await reportRoute(req(input));expect(report.status).toBe(201);expect(await report.json()).toMatchObject({flagged:true,suspended:false,distinctReporters:1});
  expect((await reportRoute(req(input))).status).toBe(409);
  for(let n=1;n<=2;n++){const id='00000000-0000-4000-8000-00000000040'+n;await db.exec('reset role');await db.query('insert into auth.users(id) values($1) on conflict do nothing',[id]);await db.exec('set role service_role');identity={id,role:'citizen'};report=await reportRoute(req(input));expect(report.status).toBe(201);}
  expect(await report.json()).toMatchObject({flagged:true,suspended:true,distinctReporters:3});
  expect(await(await submit(await make())).json()).toMatchObject({result:'NOT_VERIFIED',reason:'OFFICER_SUSPENDED'});
 });
 it("denies direct action/payee/report writes and isolates officer action reads",async()=>{
  for(const table of ['official_actions','institution_payees','officer_reports']){await db.exec('begin;set local role authenticated');try{await expect(db.query('update public.'+table+' set id=id')).rejects.toMatchObject({code:'42501'});}finally{await db.exec('rollback');}}
  await db.exec('begin;set local role authenticated');try{await db.query("select set_config('request.jwt.claim.sub',$1,true)",[citizen]);expect((await db.query('select * from public.official_actions')).rows).toHaveLength(0);}finally{await db.exec('rollback');}
 });
 it("denies direct authenticated audit/attempt mutations and RPC execution",async()=>{
  await db.exec("begin;set local role authenticated;");try{await expect(db.query("select public.begin_verification($1,null)",["30000000-0000-4000-8000-000000000999"])).rejects.toMatchObject({code:"42501"});}finally{await db.exec("rollback");}
 });
});
it("audits malformed request envelopes and missing receipt configuration before beginning an attempt",async()=>{
 const before=(await db.query<{n:number}>("select count(*)::int as n from public.verification_events")).rows[0].n;
 const response=await verifyRoute(req({challengeId:"not-a-uuid",token:""}));expect(response.status).toBe(400);expect(await response.json()).toEqual({error:{code:"INVALID_INPUT"}});
 expect((await db.query<{n:number}>("select count(*)::int as n from public.verification_events")).rows[0].n).toBe(before+1);
 const challenge=await make();const saved=process.env.VERDICT_SIGNING_KEY;delete process.env.VERDICT_SIGNING_KEY;
 try{expect((await submit(challenge)).status).toBe(503);expect((await db.query("select reason from public.verification_events order by created_at desc limit 1")).rows[0]).toEqual({reason:"RECEIPT_CONFIG"});}finally{process.env.VERDICT_SIGNING_KEY=saved;}
});
