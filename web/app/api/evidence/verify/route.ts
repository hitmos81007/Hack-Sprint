import {createAdminClient} from "../../../../lib/supabase/admin";
import {manifestHash,manifestSchema} from "../../../../lib/evidence";
import {evidenceAnchor} from "../../../../lib/chain";
import {checkRateLimit} from "../../../../lib/ratelimit";
import {ApiError,body,failure,json} from "../../../../lib/api";
export async function POST(request:Request){try{const manifest=await body(request,manifestSchema,64000);if(!await checkRateLimit(createAdminClient(),request,"evidence"))throw new ApiError(429,"RATE_LIMITED");const hash=await manifestHash(manifest);const anchor=await evidenceAnchor(hash);return json({manifestHash:hash,anchor});}catch(e){return failure(e);}}
