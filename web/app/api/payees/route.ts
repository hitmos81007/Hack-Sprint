import { emptyQuery } from "../../../lib/api";
import {requireRole} from "../../../lib/auth";
import {createAdminClient} from "../../../lib/supabase/admin";
import {payeeInput} from "../../../lib/intent-schema";
import {ApiError,body,dbError,failure,json} from "../../../lib/api";
export async function GET(request:Request){try{emptyQuery(request);const{client}=await requireRole(["officer","issuer_admin","root_authority"]);const result=await client.from("institution_payees").select("*").order("label");dbError(result.error);return json({payees:result.data});}catch(e){return failure(e);}}
export async function POST(request:Request){try{const{id}=await requireRole("issuer_admin");const data=await body(request,payeeInput);const admin=createAdminClient();const inst=await admin.from("institutions").select("created_by,status,chain_operation").eq("id",data.institutionId).single();dbError(inst.error);
 if(!inst.data||inst.data.created_by!==id||inst.data.status!=="active"||inst.data.chain_operation)throw new ApiError(403,"FORBIDDEN");
 const result=await admin.from("institution_payees").upsert({institution_id:data.institutionId,payee:data.payee,label:data.label,is_institutional:true,active:data.active,created_by:id},{onConflict:"institution_id,payee"}).select().single();dbError(result.error);return json({payee:result.data});}catch(e){return failure(e);}}
