import { emptyQuery } from "../../../lib/api";
import {requireRole} from "../../../lib/auth";
import {allRoles} from "../../../lib/auth-policy";
import {createAdminClient} from "../../../lib/supabase/admin";
import {caseInput} from "../../../lib/evidence";
import {body,dbError,failure,json} from "../../../lib/api";
export async function GET(request?:Request){try{emptyQuery(request);const{client}=await requireRole(allRoles);const c=await client.from("evidence_cases").select("*").order("created_at",{ascending:false});dbError(c.error);const i=await client.from("evidence_items").select("*");dbError(i.error);return json({cases:c.data,items:i.data});}catch(e){return failure(e);}}
export async function POST(request:Request){try{const{id}=await requireRole(allRoles);const data=await body(request,caseInput);const saved=await createAdminClient().from("evidence_cases").insert({user_id:id,title:data.title}).select("*").single();dbError(saved.error);return json({case:saved.data},201);}catch(e){return failure(e);}}

