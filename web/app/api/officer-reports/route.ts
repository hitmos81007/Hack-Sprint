import {requireRole} from "../../../lib/auth";
import {allRoles} from "../../../lib/auth-policy";
import {createAdminClient} from "../../../lib/supabase/admin";
import {reportInput,verifyVerdictReceipt} from "../../../lib/verdict-receipt";
import {ApiError,body,dbError,failure,json} from "../../../lib/api";
import {z} from "zod";
export async function POST(request:Request){try{const{id}=await requireRole(allRoles);const data=await body(request,reportInput);const admin=createAdminClient();
 const found=await admin.from("verification_events").select("receipt").eq("id",data.eventId).single();dbError(found.error);const stored=found.data?.receipt;
 if(!stored||data.receipt.facts.eventId!==data.eventId||data.receipt.signature!==stored.signature||!verifyVerdictReceipt(data.receipt,stored.signer))throw new ApiError(400,"INVALID_RECEIPT");
 const threshold=z.coerce.number().int().min(2).max(100).parse(process.env.OFFICER_REPORT_THRESHOLD??3);
 const result=await admin.rpc("report_verified_officer",{p_actor:id,p_event:data.eventId,p_reason:data.reason,p_threshold:threshold});dbError(result.error);return json(result.data,201);
 }catch(e){return failure(e);}}
