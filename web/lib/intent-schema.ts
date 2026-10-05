import {z} from "zod";
export const purposes=["information","appointment","document_request","payment"] as const;
export const purposeSchema=z.enum(purposes);
export const moneySchema=z.string().regex(/^\d{1,12}(\.\d{1,2})?$/).transform(v=>{const [whole,fraction=""]=v.split(".");return `${BigInt(whole)}.${fraction.padEnd(2,"0")}`;});
export const payeeSchema=z.string().trim().toLowerCase().max(140).refine(v=>v===""||/^[a-z0-9._-]{2,80}@[a-z0-9.-]{2,40}$/.test(v)||/^account:[a-z]{4}0[a-z0-9]{6}:\d{6,20}$/.test(v));
export const actionInput=z.object({purpose:purposeSchema,caseRef:z.string().trim().min(1).max(100),paymentAllowed:z.boolean(),payee:payeeSchema,amountCap:moneySchema,validUntil:z.iso.datetime()}).strict().refine(v=>v.paymentAllowed?v.purpose==="payment"&&v.payee!==""&&v.amountCap!=="0.00":v.payee===""&&v.amountCap==="0.00");
export const actionReview=z.object({operation:z.enum(["approve","revoke"])}).strict();
export const payeeInput=z.object({institutionId:z.string().uuid(),payee:payeeSchema.refine(v=>v!==""),label:z.string().trim().min(1).max(100),isInstitutional:z.literal(true),active:z.boolean()}).strict();
export type OfficialAction={id:string;officer_id:string;institution_id:string;purpose:typeof purposes[number];case_ref:string;payment_allowed:boolean;payee:string|null;amount_cap:string|number;valid_until:string;status:"pending"|"approved"|"revoked";approved_by:string|null};
