import "server-only";
import {z} from "zod";
import type {SupabaseClient} from "@supabase/supabase-js";
import {reportKey} from "./identifier-hash";
import {ApiError,dbError} from "./api";
import {ChainError,registryContext,reportAnchor,reportScam,transactionStatus} from "./chain";
const recordSchema=z.object({id:z.string().uuid(),id_hash:z.string().regex(/^0x[0-9a-f]{64}$/),anchor_key:z.string().regex(/^0x[0-9a-f]{64}$/).nullable(),anchor_status:z.enum(["pending","anchoring","anchored"]),anchored_tx:z.string().nullable(),pending_tx:z.string().nullable(),chain_id:z.coerce.number().nullable(),registry_address:z.string().nullable()});
export async function anchorReportRow(admin:SupabaseClient,actor:string,id:string){
 const claim=await admin.rpc("claim_report_anchor",{p_actor:actor,p_report:id});if(claim.error){if(claim.error.code==="P0001")throw new ApiError(409,"ANCHOR_BUSY_OR_MISSING");dbError(claim.error);}const row=recordSchema.parse(claim.data);
 if(row.anchor_status==="anchored")return {id:row.id,anchorStatus:"anchored",anchoredTx:row.anchored_tx};
 const save=async(data:Record<string,unknown>)=>{const result=await admin.from("scam_reports").update(data).eq("id",id).eq("reporter_id",actor);dbError(result.error);};
 try{
  const key=row.anchor_key??reportKey(row.id);if(!row.anchor_key)await save({anchor_key:key});
  const context=await registryContext();if(row.chain_id!==null&&(row.chain_id!==context.chainId||row.registry_address?.toLowerCase()!==context.registryAddress.toLowerCase()))throw new ApiError(409,"ANCHOR_NETWORK_CHANGED");
  await save({chain_id:context.chainId,registry_address:context.registryAddress});
  let anchor=await reportAnchor(key);
  if(!anchor&&row.pending_tx){const status=await transactionStatus(row.pending_tx);if(status==="pending")throw new ApiError(409,"ANCHOR_PENDING");if(status==="confirmed")throw new ApiError(503,"ANCHOR_UNCONFIRMED");}
  if(!anchor){try{await reportScam(row.id_hash,key);}catch(e){if(e instanceof ChainError&&e.transactionHash)await save({pending_tx:e.transactionHash});const reconciled=await reportAnchor(key);if(!reconciled)throw e;anchor=reconciled;}if(!anchor)anchor=await reportAnchor(key);}
  if(!anchor||anchor.idHash.toLowerCase()!==row.id_hash)throw new ApiError(503,"ANCHOR_UNCONFIRMED");
  await save({anchor_status:"anchored",anchored_tx:anchor.transactionHash,pending_tx:null,anchor_lease_until:null});return {id:row.id,anchorStatus:"anchored",anchoredTx:anchor.transactionHash,...context};
 }catch(e){await save({anchor_status:"pending",anchor_lease_until:null});throw e;}
}
