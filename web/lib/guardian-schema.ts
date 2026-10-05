import {z} from "zod";
import {guardianSummaryMessages,type Locale} from "./i18n";
import {tacticNames} from "./heuristics";
export const guardianInput=z.object({name:z.string().trim().min(1).max(80),channel:z.enum(["webhook","telegram"]),target:z.string().trim().min(1).max(2048),secret:z.string().min(16).max(256).optional(),consent:z.literal(true)}).strict().superRefine((v,ctx)=>{if(v.channel==="telegram"&&(!/^-?[1-9]\d{0,18}$/.test(v.target)||v.secret))ctx.addIssue({code:"custom",message:"INVALID_CONTACT"});if(v.channel==="webhook"){try{const url=new URL(v.target);if(url.protocol!=="https:"||url.username||url.password||url.hash||(url.port&&url.port!=="443"))throw new Error();}catch{ctx.addIssue({code:"custom",message:"INVALID_CONTACT"});}}});
export const guardianPublicSchema=z.object({id:z.string().uuid(),name:z.string(),channel:z.enum(["webhook","telegram"]),target:z.string(),active:z.boolean(),created_at:z.string()});
export type GuardianContact=z.infer<typeof guardianPublicSchema>;
export const highRiskInput=z.object({eventKey:z.string().uuid(),riskScore:z.number().int().min(70).max(100),tactics:z.array(z.enum(tacticNames)).max(tacticNames.length).refine(v=>new Set(v).size===v.length),simulate:z.boolean().default(false),language:z.enum(["en","hi","ta"]).default("en")}).strict();
export const guardianPayloadSchema=z.object({riskScore:z.number().int().min(70).max(100),tactics:z.array(z.enum(tacticNames)),summary:z.string().max(1000),time:z.iso.datetime()}).strict();
export type GuardianPayload=z.infer<typeof guardianPayloadSchema>;
export function guardianPayload(score:number,tactics:readonly typeof tacticNames[number][],simulate=false,time=new Date().toISOString(),language:Locale="en"):GuardianPayload{return guardianPayloadSchema.parse({riskScore:score,tactics:[...tactics],summary:(simulate?"SIMULATION — ":"")+guardianSummaryMessages[language],time});}
