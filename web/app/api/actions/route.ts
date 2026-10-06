import { emptyQuery } from "../../../lib/api";
import {requireRole} from "../../../lib/auth";
import {createAdminClient} from "../../../lib/supabase/admin";
import {actionInput} from "../../../lib/intent-schema";
import {ApiError,body,dbError,failure,json} from "../../../lib/api";
import {verifyCredential} from "../../../lib/crypto";
import {isActive} from "../../../lib/chain";
export async function GET(request:Request){try{emptyQuery(request);const{client}=await requireRole(["officer","issuer_admin","root_authority"]);const data=await client.from("official_actions").select("*").order("created_at",{ascending:false});dbError(data.error);return json({actions:data.data});}catch(e){return failure(e);}}
export async function POST(request:Request){try{const{id}=await requireRole("officer");const data=await body(request,actionInput);const ttl=Date.parse(data.validUntil)-Date.now();if(ttl<=0||ttl>86400000)throw new ApiError(400,"INVALID_INPUT");const admin=createAdminClient();
 const own=await admin.from("officers").select("*").eq("user_id",id).maybeSingle();dbError(own.error);const o=own.data;
 if(!o||o.status!=="active"||o.suspended_at||Date.parse(o.expires_at)<=Date.now()||!verifyCredential(o.credential,{officerAddress:o.wallet_address}))throw new ApiError(403,"OFFICER_INACTIVE");
 const inst=await admin.from("institutions").select("*").eq("id",o.institution_id).single();dbError(inst.error);
 if(!inst.data||inst.data.status!=="active"||inst.data.chain_operation||!verifyCredential(o.credential,{issuerAddress:inst.data.wallet_address,officerAddress:o.wallet_address})||!await isActive(inst.data.wallet_address))throw new ApiError(409,"INSTITUTION_INACTIVE");
 const created=await admin.rpc("create_official_action",{p_actor:id,p_data:data});dbError(created.error);return json({action:created.data},201);
 }catch(e){return failure(e);}}
