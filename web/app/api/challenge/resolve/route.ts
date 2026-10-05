import { requireRole } from "../../../../lib/auth";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { checkRateLimit } from "../../../../lib/ratelimit";
import { resolveInput,challengeSchema } from "../../../../lib/verification-schema";
import { verifyCredential } from "../../../../lib/crypto";
import { ApiError,body,dbError,failure,json } from "../../../../lib/api";
export async function POST(request: Request) {
  try {
    const {id}=await requireRole("officer");
    const input=await body(request,resolveInput);
    const admin=createAdminClient();
    if(!await checkRateLimit(admin,request,"resolve",id)) throw new ApiError(429,"RATE_LIMITED");
    const officer=await admin.from("officers").select("*").eq("user_id",id).maybeSingle(); dbError(officer.error);
    if(!officer.data || officer.data.status!=="active" || officer.data.suspended_at || Date.parse(officer.data.expires_at)<=Date.now() || !verifyCredential(officer.data.credential,{officerAddress:officer.data.wallet_address})) throw new ApiError(403,"CREDENTIAL_REVOKED_OR_EXPIRED");
    const found=await admin.from("challenges").select("*").eq("id",input.challengeId).eq("code",input.code).maybeSingle(); dbError(found.error);
    const c=found.data;
    if(!c) throw new ApiError(404,"CHALLENGE_NOT_FOUND");
    if(c.used_at) throw new ApiError(409,"CHALLENGE_USED");
    if(Date.parse(c.expires_at)<=Date.now()) throw new ApiError(410,"CHALLENGE_EXPIRED");
    if(c.attempts>=5) throw new ApiError(409,"ATTEMPTS_EXHAUSTED");
    return json({challenge:challengeSchema.parse({id:c.id,code:c.code,claimedEntity:c.claimed_entity,claimedCategory:c.claimed_category,expiresAt:new Date(c.expires_at).toISOString(),purpose:c.purpose,amount:String(c.amount),payee:c.payee})});
  }catch(error){return failure(error);}
}
