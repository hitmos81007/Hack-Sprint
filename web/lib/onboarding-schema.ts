import { z } from "zod";
import { credentialSchema, publicAddressSchema } from "./crypto";
import { toUtf8Bytes } from "ethers";
export const institutionInput = z.object({ name: z.string().trim().min(1).max(200).refine(v => toUtf8Bytes(v).length <= 256),
  category: z.enum(["bank", "police", "government", "courier", "other"]),
  walletAddress: publicAddressSchema, signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/),
}).strict();
export const officerInput = z.object({ institutionId: z.string().uuid(), name: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().min(1).max(200), walletAddress: publicAddressSchema,
  signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/),
}).strict();
export const officerAction = z.discriminatedUnion("action", [
  z.object({ action: z.literal("issue"), credential: credentialSchema }).strict(),
  z.object({ action: z.literal("revoke") }).strict(),
]);
export const institutionAction = z.object({ action: z.enum(["approve", "revoke"]) }).strict();
export const categories = institutionInput.shape.category.options;
export type Institution = { id: string; name: string; category: string; wallet_address: string; status: "pending" | "active" | "revoked"; onchain_tx: string | null; created_by: string; chain_operation: "approve" | "revoke" | null; operation_tx: string | null };
export type Officer = { flagged_at?:string|null; suspended_at?:string|null; id: string; user_id: string; institution_id: string; name: string; role_title: string; wallet_address: string; status: "pending" | "active" | "revoked"; expires_at: string; credential: z.infer<typeof credentialSchema> | null };
