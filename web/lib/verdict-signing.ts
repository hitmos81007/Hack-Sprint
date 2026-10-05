import "server-only";
import {Wallet} from "ethers";
import {z} from "zod";
import {ApiError} from "./api";
import {factsHash,receiptMessage,receiptSchema,type receiptFactsSchema} from "./verdict-receipt";
export function verdictSigner(){try{const key=z.string().regex(/^0x[0-9a-fA-F]{64}$/).parse(process.env.VERDICT_SIGNING_KEY);const signer=new Wallet(key);if(process.env.NEXT_PUBLIC_VERDICT_SIGNER_ADDRESS&&signer.address.toLowerCase()!==process.env.NEXT_PUBLIC_VERDICT_SIGNER_ADDRESS.toLowerCase())throw new Error();return signer;}catch{throw new ApiError(503,"RECEIPT_CONFIG");}}
export async function signVerdictReceipt(facts:z.infer<typeof receiptFactsSchema>,signer:Wallet){const hash=factsHash(facts);return receiptSchema.parse({version:1,facts,factsHash:hash,signer:signer.address,signature:await signer.signMessage(receiptMessage(hash))});}
