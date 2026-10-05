import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import {createClient} from "@supabase/supabase-js";
import {z} from "zod";
import {demoFixtureSchema,demoIds,demoInstitutionName,demoNumber} from "../lib/demo-schema";
import {runHeuristics} from "../lib/heuristics";
import {demoMessages} from "../lib/i18n";
import {idHash,reportKey} from "../lib/identifier-hash";
import {isActive,registerIssuer} from "../lib/chain";
import {anchorReportRow} from "../lib/report-anchor";
export const demoAccounts=[{key:"citizen",role:"citizen"},{key:"officer",role:"officer"},{key:"issuer",role:"issuer_admin"},{key:"root",role:"root_authority"}] as const;
export function seedConfiguration(env:Record<string,string|undefined>){
 if(env.DEMO_SEED_ALLOWED!=="1")throw new Error("Use DEMO_SEED_ALLOWED=1 only on an isolated synthetic test project.");
 const schema=z.object({url:z.url(),serviceKey:z.string().min(1),password:z.string().min(12).max(128),chainId:z.coerce.number().refine(n=>n===31337||n===80002)});
 return schema.parse({url:env.NEXT_PUBLIC_SUPABASE_URL,serviceKey:env.SUPABASE_SERVICE_ROLE_KEY,password:env.DEMO_PASSWORD||"SatyaCall-Demo-Only-2026!",chainId:env.CHAIN_ID??31337});
}
export async function main(){
 const cfg=seedConfiguration(process.env);
 const db=createClient(cfg.url,cfg.serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
 const fixtureFile=process.argv.find(a=>a.startsWith("--fixture="))?.slice(10);
 let fixture:ReturnType<typeof demoFixtureSchema.parse>|null=null;
 if(fixtureFile){const raw=await readFile(resolve(fixtureFile),"utf8");if(raw.length>8192)throw new Error("Public fixture too large");fixture=demoFixtureSchema.parse(JSON.parse(raw));}
 const listed=[];for(let page=1;page<=100;page++){const r=await db.auth.admin.listUsers({page,perPage:100});if(r.error)throw new Error("Cannot list demo accounts");listed.push(...r.data.users);if(r.data.users.length<100)break;if(page===100)throw new Error("Use an isolated project with fewer than 10000 users");}
 const ids:Record<string,string>={};
 for(const a of demoAccounts){const email=`${a.key}@demo.satyacall.invalid`;let user=listed.find(u=>u.email===email);if(user&&!user.app_metadata.satyacall_demo)throw new Error("Existing non-demo account collision; no account modified");if(!user){const r=await db.auth.admin.createUser({email,password:cfg.password,email_confirm:true,app_metadata:{satyacall_demo:true},user_metadata:{display_name:`Synthetic demo ${a.key}`}});if(r.error||!r.data.user)throw new Error("Demo account creation failed");user=r.data.user;}ids[a.key]=user.id;const r=await db.rpc("seed_demo_profile",{p_id:user.id,p_role:a.role,p_name:`Synthetic demo ${a.key}`});if(r.error||!r.data)throw new Error("Apply all migrations before seeding");console.log(email+" — "+a.role);}
 const old=await db.from("analyses").select("user_id").eq("id",demoIds.analysis).maybeSingle();if(old.error||old.data&&old.data.user_id!==ids.citizen)throw new Error("Demo analysis collision");
 const a=runHeuristics(demoMessages.en.transcript);
 const {createHash}=await import("node:crypto");
 const analysis=await db.from("analyses").upsert({id:demoIds.analysis,user_id:ids.citizen,input_hash:createHash("sha256").update(demoMessages.en.transcript.toLowerCase()).digest("hex"),risk_score:a.score,verdict:a.risk,tactics:a.tactics,provider:"heuristics",latency_ms:0,input_text:null});if(analysis.error)throw new Error("Demo analysis seed failed");
 if(fixture){
 const c=fixture.credential;const prior=await db.from("institutions").select("created_by,wallet_address,onchain_tx").eq("id",demoIds.institution).maybeSingle();if(prior.error||prior.data&&(prior.data.created_by!==ids.issuer||prior.data.wallet_address!==c.issuerAddress))throw new Error("Demo institution collision; keep the original browser fixture");
 let tx=prior.data?.onchain_tx??null;
 // Only the testnet relayer key exists on this machine. Issuer/officer keys came from the browser as PUBLIC credentials.
 if(!await isActive(c.issuerAddress))tx=(await registerIssuer(c.issuerAddress,demoInstitutionName,"police")).transactionHash;
 const i=await db.from("institutions").upsert({id:demoIds.institution,name:demoInstitutionName,category:"police",wallet_address:c.issuerAddress,status:"active",created_by:ids.issuer,onchain_tx:tx,chain_operation:null,operation_tx:null});if(i.error)throw new Error("Institution seed failed");
 const existing=await db.from("officers").select("user_id,wallet_address").eq("id",demoIds.officer).maybeSingle();if(existing.error||existing.data&&(existing.data.user_id!==ids.officer||existing.data.wallet_address!==c.officerAddress))throw new Error("Demo officer collision");
 const o=await db.from("officers").upsert({id:demoIds.officer,user_id:ids.officer,institution_id:demoIds.institution,name:c.officerName,role_title:c.roleTitle,wallet_address:c.officerAddress,credential:c,status:"active",expires_at:c.expiresAt,flagged_at:null,suspended_at:null});if(o.error)throw new Error("Officer seed failed");
 const now=new Date();const action=await db.from("official_actions").upsert({id:demoIds.action,officer_id:demoIds.officer,institution_id:demoIds.institution,purpose:"information",case_ref:"SYNTHETIC-DEMO-ONLY",payment_allowed:false,payee:null,amount_cap:0,created_at:now.toISOString(),valid_until:new Date(now.getTime()+23*3600000).toISOString(),status:"approved",approved_by:ids.issuer});if(action.error)throw new Error("Action seed failed");
 }
 const hash=idHash(demoNumber,"phone");const oldReport=await db.from("scam_reports").select("reporter_id,id_hash").eq("id",demoIds.report).maybeSingle();if(oldReport.error||oldReport.data&&(oldReport.data.reporter_id!==ids.citizen||oldReport.data.id_hash!==hash))throw new Error("Demo report collision / changed pepper");
 if(!oldReport.data){const r=await db.from("scam_reports").insert({id:demoIds.report,reporter_id:ids.citizen,id_hash:hash,id_type:"phone",category:"impersonation",anchor_key:reportKey(demoIds.report)});if(r.error)throw new Error("Demo report seed failed");}
 if(fixture){try{const r=await anchorReportRow(db,ids.citizen,demoIds.report);console.log("Synthetic report: "+r.anchorStatus+" "+r.anchoredTx);}catch{console.log("Synthetic report saved; anchor pending. Retry from the connected demo.");}}
 console.log(fixture?"Public fixture ready. Official action expires in 23h; rerun to refresh. Use the same browser and passphrase.":"Accounts, HIGH analysis and pending synthetic report seeded. Export browser keys from /demo and rerun with --fixture=<public.json> for connected verification.");
 console.log("Demo passwords are deliberately public. Never seed these accounts in production. Existing passwords were preserved.");
}


