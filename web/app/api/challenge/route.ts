import { randomInt } from "node:crypto";
import { createAdminClient } from "../../../lib/supabase/admin";
import { optionalIdentity } from "../../../lib/optional-auth";
import { challengeInput, challengeSchema } from "../../../lib/verification-schema";
import { checkRateLimit } from "../../../lib/ratelimit";
import { ApiError, body, dbError, failure, json } from "../../../lib/api";
export async function POST(request: Request) {
  try {
const identity = await optionalIdentity(request);
    const admin = createAdminClient();
    if (!await checkRateLimit(admin,request,"challenge",identity?.id)) throw new ApiError(429,"RATE_LIMITED");
    const input = await body(request, challengeInput);
    const result = await admin.from("challenges").insert({ citizen_id: identity?.id ?? null,
      code: String(randomInt(1000000)).padStart(6,"0"), claimed_entity: input.claimedEntity, claimed_category: input.claimedCategory,purpose:input.purpose,amount:input.amount,payee:input.payee })
      .select("id,code,claimed_entity,claimed_category,expires_at,purpose,amount,payee").single();
    dbError(result.error);
    const c = result.data;
    if (!c) throw new ApiError(503,"DATABASE_UNAVAILABLE");
    return json({ challenge: challengeSchema.parse({ id:c.id,code:c.code,claimedEntity:c.claimed_entity,claimedCategory:c.claimed_category,expiresAt:new Date(c.expires_at).toISOString(),purpose:c.purpose,amount:String(c.amount),payee:c.payee }) },201);
  } catch(error){ return failure(error); }
}



