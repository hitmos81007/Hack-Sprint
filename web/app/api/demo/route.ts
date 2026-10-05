import { emptyQuery } from "../../../lib/api";
import {requireRole} from "../../../lib/auth";
import {createAdminClient} from "../../../lib/supabase/admin";
import {ApiError,dbError,failure,json} from "../../../lib/api";
import {demoIds,demoConfigSchema} from "../../../lib/demo-schema";
export async function GET(request:Request){try{
 emptyQuery(request);
 const actor=await requireRole("citizen");
 const profile=await actor.client.from("profiles").select("is_demo").eq("id",actor.id).single();dbError(profile.error);
 if(!profile.data?.is_demo)throw new ApiError(403,"FORBIDDEN");
 const admin=createAdminClient();
 const [i,o,a]=await Promise.all([admin.from("institutions").select("id,name,category,wallet_address,status,chain_operation").eq("id",demoIds.institution).single(),admin.from("officers").select("id,wallet_address,credential,status,suspended_at,expires_at").eq("id",demoIds.officer).single(),admin.from("official_actions").select("id,purpose,valid_until,status").eq("id",demoIds.action).single()]);
 for(const r of[i,o,a])dbError(r.error);
 if(i.data?.status!=="active"||i.data.chain_operation||o.data?.status!=="active"||o.data.suspended_at||Date.parse(o.data.expires_at)<=Date.now()||a.data?.status!=="approved"||Date.parse(a.data.valid_until)<=Date.now())throw new ApiError(409,"DEMO_NOT_READY");
 return json(demoConfigSchema.parse({institution:{id:i.data.id,name:i.data.name,category:i.data.category,wallet_address:i.data.wallet_address},officer:{id:o.data.id,wallet_address:o.data.wallet_address,credential:o.data.credential},action:{id:a.data.id,purpose:a.data.purpose,valid_until:a.data.valid_until}}));
}catch(error){return failure(error);}}


