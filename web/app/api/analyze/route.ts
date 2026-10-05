import {randomUUID} from "node:crypto";import {z} from "zod";
import {body,failure,json,ApiError} from "../../../lib/api";import {createAdminClient} from "../../../lib/supabase/admin";import {checkRateLimit} from "../../../lib/ratelimit";import {analyzeCached} from "../../../lib/analyzer";import {optionalIdentity} from "../../../lib/optional-auth";import {notifyGuardians} from "../../../lib/guardian-notify";
const input=z.object({text:z.string().min(1).max(10000).refine(value=>value.trim().length>0),consent:z.literal(true),language:z.enum(["en","hi","ta"]).optional(),notifyGuardian:z.boolean().default(true),eventKey:z.string().uuid().optional()}).strict();
// Pro + Fluid Compute: cap this request at 60s; LLM retries consume at most 16s.
export const runtime="nodejs";
export const maxDuration=60;
export async function POST(request:Request){try{const identity=await optionalIdentity(request);const admin=createAdminClient();if(!await checkRateLimit(admin,request,"analyze",identity?.id))throw new ApiError(429,"RATE_LIMITED");const data=await body(request,input,64000);let analysis;try{analysis=await analyzeCached(data.text,admin);}catch{throw new ApiError(503,"SERVICE_UNAVAILABLE");}let guardian:unknown=null;if(data.notifyGuardian&&identity&&analysis.result.risk==="HIGH"){try{guardian=await notifyGuardians(admin,identity.id,data.eventKey??randomUUID(),analysis.result.score,analysis.result.tactics,"server",data.language);}catch{guardian={error:"ALERT_UNAVAILABLE"};}}return json({...analysis,guardian});}catch(e){return failure(e);}}


