import { z } from "zod";
import { decodeBase64, encodeBase64, toUtf8Bytes, toUtf8String, verifyMessage, getAddress } from "ethers";
import { publicAddressSchema } from "./crypto";
import { purposeSchema,moneySchema,payeeSchema } from "./intent-schema";
import { receiptSchema,verdictNames } from "./verdict-receipt";
import { categories } from "./onboarding-schema";
export const challengeInput = z.object({ claimedEntity: z.string().trim().min(1).max(200).refine(v => !v.includes("|")), claimedCategory: z.enum(categories), purpose:purposeSchema.default("information"),amount:moneySchema.default("0.00"),payee:payeeSchema.default("") }).strict();
export const resolveInput = z.object({ challengeId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).strict();
export const challengeSchema = z.object({ id: z.string().uuid(), code: z.string().regex(/^\d{6}$/), claimedEntity: challengeInput.shape.claimedEntity,
  claimedCategory: challengeInput.shape.claimedCategory, expiresAt: z.iso.datetime(),purpose:purposeSchema.default("information"),amount:moneySchema.default("0.00"),payee:payeeSchema.default("") }).strict();
export type Challenge = z.infer<typeof challengeSchema>;
const proofSchema = z.object({ version: z.literal(2), actionId:z.string().uuid(), challengeId: z.string().uuid(), officerAddress: publicAddressSchema,
  signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/) }).strict();
export const verifyInput = z.object({ challengeId: z.string().uuid(), token: z.string().min(1).max(4096) }).strict();
export const verdictSchema = z.object({ result: z.enum(verdictNames), reason: z.string(), eventId: z.string().uuid(),
  attempts: z.number().int().optional(), officer: z.object({ name: z.string(), title: z.string(), institution: z.string(), category: z.string() }).nullable().optional(), receipt:receiptSchema });
export type Verdict = z.infer<typeof verdictSchema>;
export function signedChallengeMessage(challenge: Challenge,actionId:string) {
  const c = challengeSchema.parse(challenge);
  return `${c.id}|${c.code}|${z.string().uuid().parse(actionId)}`;
}
export async function createVerificationToken(wallet: { getAddress(): Promise<string>; signMessage(message: string): Promise<string> }, challenge: Challenge,actionId:string) {
  const proof = proofSchema.parse({ version: 2, actionId,challengeId: challenge.id, officerAddress: await wallet.getAddress(), signature: await wallet.signMessage(signedChallengeMessage(challenge,actionId)) });
  return `v2.${encodeBase64(toUtf8Bytes(JSON.stringify(proof))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}`;
}
export function decodeVerificationToken(token: string) {
  if (!/^v2\.[A-Za-z0-9_-]+$/.test(token) || token.length > 4096) throw new Error("INVALID_TOKEN");
  const raw = token.slice(3).replace(/-/g,"+").replace(/_/g,"/");
  return proofSchema.parse(JSON.parse(toUtf8String(decodeBase64(raw + "=".repeat((4 - raw.length % 4) % 4)))));
}
export function verifyOfficerProof(token: ReturnType<typeof decodeVerificationToken>, challenge: Challenge) {
  try { return token.challengeId === challenge.id && getAddress(verifyMessage(signedChallengeMessage(challenge,token.actionId), token.signature)) === token.officerAddress; }
  catch { return false; }
}
