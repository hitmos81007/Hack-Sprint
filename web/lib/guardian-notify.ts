import "server-only";
import type {SupabaseClient} from "@supabase/supabase-js";
import {z} from "zod";
import {dbError} from "./api";
import {guardianPayload,type GuardianPayload} from "./guardian-schema";
import {deliverGuardian} from "./guardian-delivery";
import type {Locale} from "./i18n";
import type {Tactic} from "./heuristics";
const contactSchema=z.object({id:z.string().uuid(),channel:z.enum(["webhook","telegram"]),target:z.string(),webhook_secret:z.string().nullable()});
export async function notifyGuardians(client:SupabaseClient,userId:string,eventKey:string,score:number,tactics:Tactic[],source:"browser"|"server"|"simulation",language:Locale="en"){
 const rows=await client.from("guardians").select("id,channel,target,webhook_secret").eq("user_id",userId).eq("active",true).limit(3);dbError(rows.error);const contacts=z.array(contactSchema).max(3).parse(rows.data??[]);const payload:GuardianPayload=guardianPayload(score,tactics,source==="simulation",undefined,language);
 const deliveries=await Promise.all(contacts.map(async contact=>{const claim=await client.rpc("create_guardian_alert",{p_actor:userId,p_guardian:contact.id,p_event:eventKey,p_payload:payload,p_source:source});dbError(claim.error);const alert=z.object({id:z.string().uuid(),status:z.enum(["pending","sent","failed"]),claimed:z.boolean(),mode:z.enum(["webhook","telegram"])}).parse(claim.data);if(!alert.claimed)return {id:alert.id,status:alert.status,mode:alert.mode};const sent=await deliverGuardian(contact,payload,alert.id);const status=sent?"sent":"failed";const saved=await client.from("alerts").update({status,sent_at:sent?new Date().toISOString():null}).eq("id",alert.id).eq("user_id",userId);dbError(saved.error);return {id:alert.id,status,mode:alert.mode};}));return {alerts:deliveries};
}
