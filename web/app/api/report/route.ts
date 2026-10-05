import {z} from "zod";
import {randomUUID} from "node:crypto";
import {requireRole} from "../../../lib/auth";
import {allRoles} from "../../../lib/auth-policy";
import {createAdminClient} from "../../../lib/supabase/admin";
import {ApiError,body,dbError,failure,json} from "../../../lib/api";
import {checkRateLimit} from "../../../lib/ratelimit";
import {reportInput,normalizeIdentifier} from "../../../lib/normalize";
import {idHash,reportKey} from "../../../lib/identifier-hash";
import {anchorReportRow} from "../../../lib/report-anchor";
import {recentReports} from "../../../lib/registry";
export const maxDuration=60;
export async function POST(request:Request){try{const actor=await requireRole(allRoles);const admin=createAdminClient();if(!await checkRateLimit(admin,request,"report",actor.id))throw new ApiError(429,"RATE_LIMITED");const data=await body(request,reportInput);const hash=idHash(data.value,data.type);const identifier=normalizeIdentifier(data.value,data.type);const id=randomUUID();const inserted=await admin.from("scam_reports").insert({id,reporter_id:actor.id,id_hash:hash,id_type:identifier.type,category:data.category,anchor_key:reportKey(id)});if(inserted.error?.code==="23505")throw new ApiError(409,"DUPLICATE_REPORT");dbError(inserted.error);
 try{return json({report:await anchorReportRow(admin,actor.id,id)},201);}catch{return json({report:{id,anchorStatus:"pending",anchoredTx:null},warning:"ANCHOR_PENDING"},202);}
 }catch(e){return failure(e);}}
export async function GET(request:Request){try{const query=z.object({mine:z.literal("true").optional()}).strict().safeParse(Object.fromEntries(new URL(request.url).searchParams));if(!query.success)throw new ApiError(400,"INVALID_INPUT");const actor=query.data.mine?(await requireRole(allRoles)).id:undefined;const admin=createAdminClient();if(!await checkRateLimit(admin,request,"lookup",actor))throw new ApiError(429,"RATE_LIMITED");return json({reports:await recentReports(admin,actor)});}catch(e){return failure(e);}}

