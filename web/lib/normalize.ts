import {getAddress,isAddress} from "ethers";
import {z} from "zod";
export const identifierTypes=["phone","upi","wallet"] as const;
export type IdentifierType=typeof identifierTypes[number];
export function normalizePhone(value:string):string{
 const source=z.string().trim().min(1).max(80).regex(/^\+?[0-9 ()-]+$/).parse(value);
 let digits=source.replace(/[ ()-]/g,"");
 if(digits.startsWith("+91"))digits=digits.slice(3);
 else if(digits.startsWith("+"))throw new Error("INVALID_IDENTIFIER");
 else if(digits.length===12&&digits.startsWith("91"))digits=digits.slice(2);
 else if(digits.length===11&&digits.startsWith("0"))digits=digits.slice(1);
 if(!/^\d{10}$/.test(digits))throw new Error("INVALID_IDENTIFIER");
 // Syntactic normalization only; does not prove allocation, mobile type or ownership.
 return "+91"+digits;
}
export const upiSchema=z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{2,80}@[a-z0-9.-]{2,40}$/);
export function normalizeUPI(value:string){return upiSchema.parse(value);}
export function normalizeWallet(value:string){const address=z.string().trim().refine(isAddress).parse(value);return getAddress(address);}
export function normalizeIdentifier(value:string,type?:IdentifierType){
 const input=z.string().trim().min(1).max(128).parse(value);
 const kind=type??(input.startsWith("0x")?"wallet":input.includes("@")?"upi":"phone");
 z.enum(identifierTypes).parse(kind);
 return {type:kind,normalized:kind==="phone"?normalizePhone(input):kind==="upi"?normalizeUPI(input):normalizeWallet(input)};
}
export const reportCategories=["impersonation","payment_demand","credential_theft","suspicious_contact","other"] as const;
export const reportInput=z.object({value:z.string().trim().min(1).max(128),type:z.enum(identifierTypes).optional(),category:z.enum(reportCategories),acknowledge:z.literal(true)}).strict();
