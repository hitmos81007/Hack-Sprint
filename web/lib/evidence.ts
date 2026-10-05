import {z} from "zod";
export const evidenceKinds=["screenshot","transcript","call_metadata","verdict_receipt","analyzer_result"] as const;
export const digestSchema=z.string().regex(/^0x[0-9a-f]{64}$/).refine(v=>!/^0x0{64}$/.test(v));
export const evidenceItemSchema=z.object({id:z.string().uuid(),kind:z.enum(evidenceKinds),sha256:digestSchema,size:z.number().int().min(0).max(25*1024*1024),mime:z.string().max(100).regex(/^[a-zA-Z0-9.+\-/]*$/)}).strict();
export const manifestSchema=z.object({version:z.literal(1),caseId:z.string().uuid(),items:z.array(evidenceItemSchema).min(1).max(100)}).strict().refine(m=>new Set(m.items.map(x=>x.id)).size===m.items.length);
export type EvidenceItem=z.infer<typeof evidenceItemSchema>;
export type EvidenceManifest=z.infer<typeof manifestSchema>;
export const caseInput=z.object({title:z.string().trim().min(1).max(120)}).strict();
export const itemsInput=z.object({items:z.array(evidenceItemSchema).min(1).max(20)}).strict();
export function canonicalManifest(value:unknown){const m=manifestSchema.parse(value);return JSON.stringify({version:1,caseId:m.caseId,items:[...m.items].sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0).map(x=>({id:x.id,kind:x.kind,sha256:x.sha256,size:x.size,mime:x.mime}))});}
export async function sha256(bytes:Uint8Array){const result=await globalThis.crypto.subtle.digest("SHA-256",new Uint8Array(bytes));return "0x"+Array.from(new Uint8Array(result),v=>v.toString(16).padStart(2,"0")).join("");}
export async function hashFile(file:Blob){if(file.size>25*1024*1024)throw new Error("FILE_TOO_LARGE");return sha256(new Uint8Array(await file.arrayBuffer()));}
export async function manifestHash(manifest:unknown){return sha256(new TextEncoder().encode(canonicalManifest(manifest)));}
export async function fileMatches(file:Blob,manifest:unknown){const m=manifestSchema.parse(manifest);const hash=await hashFile(file);return m.items.some(x=>x.sha256===hash&&x.size===file.size);}
