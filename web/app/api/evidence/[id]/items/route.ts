import {requireRole} from "../../../../../lib/auth";
import {allRoles} from "../../../../../lib/auth-policy";
import {createAdminClient} from "../../../../../lib/supabase/admin";
import {itemsInput} from "../../../../../lib/evidence";
import {body,dbError,failure,json,uuid} from "../../../../../lib/api";
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{const{id:actor}=await requireRole(allRoles);const id=uuid((await context.params).id);const data=await body(request,itemsInput);const result=await createAdminClient().rpc("add_evidence_items",{p_actor:actor,p_case:id,p_items:data.items});dbError(result.error);return json({saved:true},201);}catch(e){return failure(e);}}
