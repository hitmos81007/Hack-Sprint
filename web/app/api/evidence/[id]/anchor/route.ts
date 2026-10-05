import {requireRole} from "../../../../../lib/auth";
import {allRoles} from "../../../../../lib/auth-policy";
import {createAdminClient} from "../../../../../lib/supabase/admin";
import {manifestHash} from "../../../../../lib/evidence";
import {anchorEvidence,evidenceAnchor,transactionStatus,ChainError} from "../../../../../lib/chain";
import {ApiError,body,dbError,failure,json,uuid} from "../../../../../lib/api";
import {z} from "zod";
import {checkRateLimit} from "../../../../../lib/ratelimit";
export const maxDuration=60;
export async function POST(request:Request,context:{params:Promise<{id:string}>}){try{
 const{id:actor}=await requireRole(allRoles);await body(request,z.object({}).strict());const id=uuid((await context.params).id);const admin=createAdminClient();
 if(!await checkRateLimit(admin,request,"evidence",actor))throw new ApiError(429,"RATE_LIMITED");
 const frozen=await admin.rpc("freeze_evidence",{p_actor:actor,p_case:id});dbError(frozen.error);const c=frozen.data;
 const hash=await manifestHash(c.manifest);
 const save=async(value:Record<string,unknown>)=>{const updated=await admin.from("evidence_cases").update(value).eq("id",id).eq("user_id",actor);dbError(updated.error);};
 await save({manifest_hash:hash});
 let anchor=await evidenceAnchor(hash);
 if(!anchor&&c.onchain_tx){const status=await transactionStatus(c.onchain_tx);if(status==="pending")throw new ApiError(409,"ANCHOR_PENDING");if(status==="confirmed")throw new ApiError(503,"ANCHOR_UNCONFIRMED");}
 if(!anchor){try{await anchorEvidence(hash);}catch(e){if(e instanceof ChainError&&e.transactionHash)await save({onchain_tx:e.transactionHash});const reconciled=await evidenceAnchor(hash);if(!reconciled)throw e;}anchor=await evidenceAnchor(hash);}
 if(!anchor)throw new ApiError(503,"ANCHOR_UNCONFIRMED");
 await save({status:"anchored",onchain_tx:anchor.transactionHash,anchored_at:anchor.timestamp,block_number:anchor.blockNumber,chain_id:anchor.chainId,registry_address:anchor.registryAddress});
 return json({manifest:c.manifest,manifestHash:hash,anchor});
 }catch(e){return failure(e);}}
