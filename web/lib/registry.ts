import "server-only";
import {z} from "zod";
import type {SupabaseClient} from "@supabase/supabase-js";
import {ApiError,dbError} from "./api";
import {idHash} from "./identifier-hash";
import {upiSchema,reportCategories,type IdentifierType} from "./normalize";
import {relayedReportCount} from "./chain";
export const upiPayee=upiSchema;
export function payeeHash(value:string){return idHash(value,"upi");}
export async function registryLookup(client:SupabaseClient,payee:string){const hash=payeeHash(payee);const result=await client.from("scam_reports").select("id",{count:"exact",head:true}).eq("id_hash",hash).eq("id_type","upi");dbError(result.error);return {hash,count:result.count??0};}
export function minimumReporterAge(){const age=z.coerce.number().int().min(0).max(31536000).safeParse(process.env.REGISTRY_MIN_ACCOUNT_AGE_SECONDS??"86400");if(!age.success)throw new ApiError(503,"REGISTRY_CONFIG");return age.data;}
const countsSchema=z.object({count:z.number().int().nonnegative(),distinctReporterCount:z.number().int().nonnegative(),eligibleReporterCount:z.number().int().nonnegative(),anchoredCount:z.number().int().nonnegative()}).strict();
export async function lookupIdentifier(client:SupabaseClient,value:string,type?:IdentifierType){const hash=idHash(value,type);const minAccountAgeSeconds=minimumReporterAge();const result=await client.rpc("registry_counts",{p_hash:hash,p_min_age_seconds:minAccountAgeSeconds});dbError(result.error);const counts=countsSchema.parse(result.data);let chainCount:string|null=null;try{chainCount=await relayedReportCount(hash);}catch{/* DB allegations remain readable if chain RPC is offline. */}return {...counts,pendingCount:counts.count-counts.anchoredCount,risk:counts.eligibleReporterCount>=3?"high":counts.count>0?"reported":"unreported",minAccountAgeSeconds,chainCount,countsMatch:chainCount===null?null:BigInt(chainCount)===BigInt(counts.anchoredCount)};}
export async function recentReports(client:SupabaseClient,actor?:string){let query=client.from("scam_reports").select("id,id_type,category,anchor_status,anchored_tx,chain_id,registry_address,created_at");query=actor?query.eq("reporter_id",actor):query.eq("anchor_status","anchored");const result=await query.order("created_at",{ascending:false}).limit(20);dbError(result.error);return (result.data??[]).map(row=>({...row,category:reportCategories.includes(row.category)?row.category:"other"}));}
