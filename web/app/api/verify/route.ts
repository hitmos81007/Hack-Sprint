import { createAdminClient } from "../../../lib/supabase/admin";
import { optionalIdentity } from "../../../lib/optional-auth";
import { verifyInput,decodeVerificationToken,verifyOfficerProof,challengeSchema } from "../../../lib/verification-schema";
import { verifyCredential,credentialSchema } from "../../../lib/crypto";
import { checkRateLimit } from "../../../lib/ratelimit";
import { isActive } from "../../../lib/chain";
import { verdictSigner,signVerdictReceipt } from "../../../lib/verdict-signing";
import { ApiError,body,dbError,failure,json } from "../../../lib/api";
export async function POST(request: Request) {
  let auditStarted=false;
  let admin:ReturnType<typeof createAdminClient>|undefined;
  try {
    const client=createAdminClient();
    admin=client;
    const identity=await optionalIdentity(request);
    const allowed=await checkRateLimit(client,request,"verify",identity?.id);
    const input=await body(request,verifyInput);
    const signer=verdictSigner();
    const begun=await admin.rpc("begin_verification",{p_id:input.challengeId,p_block_reason:allowed?null:"RATE_LIMITED"}); dbError(begun.error);
    auditStarted=true;
    const attempt=begun.data;
    async function respond(value:Record<string,unknown>,status:number){
      const facts=(value.facts??{}) as Record<string,unknown>;
      let authorizedUntil:string|undefined;
      if(value.result==="VERIFIED_AUTHORIZED"){const action=await client.from("official_actions").select("valid_until").eq("id",facts.actionId).maybeSingle();dbError(action.error);if(!action.data)throw new ApiError(503,"VERIFICATION_UNAVAILABLE");authorizedUntil=new Date(action.data.valid_until).toISOString();}
      const receipt=await signVerdictReceipt({challengeId:input.challengeId,eventId:String(value.eventId),actionId:(facts.actionId??null) as string|null,officerId:(facts.officerId??null) as string|null,
        purpose:String(facts.purpose??"unknown"),amount:String(facts.amount??"0.00"),payee:String(facts.payee??""),result:value.result as "VERIFIED_AUTHORIZED"|"IDENTITY_VERIFIED_NOT_AUTHORIZED"|"NOT_VERIFIED",reason:String(value.reason),
        issuedAt:new Date((value.completedAt as string)??Date.now()).toISOString(),...(authorizedUntil?{authorizedUntil}:{})},signer);
      const saved=await client.from("verification_events").update({receipt}).eq("id",value.eventId);dbError(saved.error);
      return json({...value,receipt},status);
    }
    if(attempt.blocked) return respond({result:"NOT_VERIFIED",reason:attempt.blocked,eventId:attempt.eventId},allowed?200:429);
    const start=Date.now(); let actionId:string|null=null; let officerId:string|null=null; let credentialSignature:string|null=null; let reason="INVALID_TOKEN"; let result="NOT_VERIFIED"; let status=200;
    try {
      const c=attempt.challenge;
      const challenge=challengeSchema.parse({id:c.id,code:c.code,claimedEntity:c.claimed_entity,claimedCategory:c.claimed_category,expiresAt:new Date(c.expires_at).toISOString(),purpose:c.purpose,amount:String(c.amount),payee:c.payee});
      let proof:ReturnType<typeof decodeVerificationToken>|null=null;
      try{proof=decodeVerificationToken(input.token);}catch{/* Count/audit malformed tokens rather than bypassing the attempt guard. */}
      if(proof){actionId=proof.actionId;
        if(proof.challengeId!==challenge.id) reason="WRONG_CHALLENGE";
        else if(!verifyOfficerProof(proof,challenge)) reason="INVALID_SIGNATURE";
        else {
          const found=await client.from("officers").select("*").ilike("wallet_address",proof.officerAddress).maybeSingle(); dbError(found.error);
          const o=found.data;
          if(!o) reason="OFFICER_NOT_FOUND";
          else {
            officerId=o.id;
            if(o.suspended_at) reason="OFFICER_SUSPENDED";
            else if(o.status!=="active" || Date.parse(o.expires_at)<=Date.now()) reason="CREDENTIAL_REVOKED_OR_EXPIRED";
            else {
              const institution=await client.from("institutions").select("*").eq("id",o.institution_id).maybeSingle(); dbError(institution.error);
              const i=institution.data;
              if(!i || i.status!=="active" || i.chain_operation) reason="ISSUER_REVOKED";
              else if(!verifyCredential(o.credential,{issuerAddress:i.wallet_address,officerAddress:o.wallet_address})) reason="INVALID_CREDENTIAL";
              else if(!await isActive(i.wallet_address)) reason="ISSUER_REVOKED";
              else {
                credentialSignature=credentialSchema.parse(o.credential).signature;
                result="IDENTITY_VERIFIED_NOT_AUTHORIZED";
                reason="AUTHORIZATION_PENDING";
              }
            }
          }
        }
      }
    }catch{result="NOT_VERIFIED";reason="VERIFICATION_UNAVAILABLE";status=503;}
    // Commit fresh expiry/revocation checks, one-time consumption and the audit row together.
    const completed=await admin.rpc("complete_verification",{p_event:attempt.eventId,p_result:result,p_reason:reason,p_officer:officerId,
      p_credential_signature:credentialSignature,p_duration:Math.max(0,Date.now()-start),p_action:actionId}); dbError(completed.error);
    return respond(completed.data,status);
  }catch(error){
    if(!auditStarted&&admin){
      try{const code=error instanceof ApiError?error.code:"SERVICE_UNAVAILABLE";const saved=await admin.rpc("audit_rejected_verification",{p_reason:code});dbError(saved.error);}catch{return failure(new ApiError(503,"DATABASE_UNAVAILABLE"));}
    }
    return failure(error);
  }
}


