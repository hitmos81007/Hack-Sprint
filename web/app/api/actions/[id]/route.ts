import {requireRole} from "../../../../lib/auth";
import {createAdminClient} from "../../../../lib/supabase/admin";
import {actionReview} from "../../../../lib/intent-schema";
import {body,dbError,failure,json,uuid} from "../../../../lib/api";
export async function PATCH(request:Request,context:{params:Promise<{id:string}>}){try{const{id:actor}=await requireRole("issuer_admin");const id=uuid((await context.params).id);const{operation}=await body(request,actionReview);const admin=createAdminClient();const result=await admin.rpc("review_official_action",{p_actor:actor,p_id:id,p_operation:operation});dbError(result.error);return json({action:result.data});}catch(e){return failure(e);}}
