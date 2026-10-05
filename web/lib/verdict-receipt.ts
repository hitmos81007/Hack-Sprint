import {z} from "zod";
import {keccak256,toUtf8Bytes,verifyMessage,getAddress} from "ethers";
export const verdictNames=["VERIFIED_AUTHORIZED","IDENTITY_VERIFIED_NOT_AUTHORIZED","NOT_VERIFIED"] as const;
export const receiptFactsSchema=z.object({challengeId:z.string().uuid(),eventId:z.string().uuid(),actionId:z.string().uuid().nullable(),officerId:z.string().uuid().nullable(),purpose:z.string(),amount:z.string(),payee:z.string(),result:z.enum(verdictNames),reason:z.string(),issuedAt:z.iso.datetime(),authorizedUntil:z.iso.datetime().optional()}).strict();
export const receiptSchema=z.object({version:z.literal(1),facts:receiptFactsSchema,factsHash:z.string().regex(/^0x[0-9a-f]{64}$/),signer:z.string(),signature:z.string().regex(/^0x[0-9a-fA-F]{130}$/)}).strict();
export type VerdictReceipt=z.infer<typeof receiptSchema>;
export function factsHash(facts:z.infer<typeof receiptFactsSchema>){const f=receiptFactsSchema.parse(facts);return keccak256(toUtf8Bytes(JSON.stringify([f.challengeId,f.eventId,f.actionId,f.officerId,f.purpose,f.amount,f.payee,f.result,f.reason,f.issuedAt,...(f.authorizedUntil?[f.authorizedUntil]:[])])));}
export function receiptMessage(hash:string){return `SatyaCall|verdict-receipt|v1|${hash}`;}
// A receipt's self-declared signer is not a trust anchor; pin the known public address.
export function verifyVerdictReceipt(value:unknown,expectedSigner:string){try{const r=receiptSchema.parse(value);return factsHash(r.facts)===r.factsHash&&getAddress(r.signer)===getAddress(expectedSigner)&&getAddress(verifyMessage(receiptMessage(r.factsHash),r.signature))===getAddress(expectedSigner);}catch{return false;}}
export const reportInput=z.object({eventId:z.string().uuid(),receipt:receiptSchema,reason:z.string().trim().min(1).max(1000)}).strict();
