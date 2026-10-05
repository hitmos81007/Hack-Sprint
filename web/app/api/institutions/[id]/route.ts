import { requireRole } from "../../../../lib/auth";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { institutionAction, type Institution } from "../../../../lib/onboarding-schema";
import { registerIssuer, revokeIssuer, transactionStatus, ChainError } from "../../../../lib/chain";
import { ApiError, body, dbError, failure, json, uuid } from "../../../../lib/api";

type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    const { id: actor } = await requireRole("root_authority");
    const id = uuid((await context.params).id);
    const { action } = await body(request, institutionAction);
    const admin = createAdminClient();
    const loaded = await admin.from("institutions").select("*").eq("id", id).maybeSingle();
    dbError(loaded.error);
    const inst = loaded.data as Institution | null;
    if (!inst) throw new ApiError(404, "NOT_FOUND");
    if (inst.status !== (action === "approve" ? "pending" : "active")) throw new ApiError(409, "CONFLICT");
    if (action === "approve") {
      const profile = await admin.from("profiles").select("role").eq("id", inst.created_by).single();
      dbError(profile.error);
      if (!["citizen", "issuer_admin"].includes(profile.data?.role)) throw new ApiError(409, "CONFLICT");
    }
    let transactionHash: string;
    if (inst.chain_operation) {
      if (inst.chain_operation !== action || !inst.operation_tx) throw new ApiError(409, "OPERATION_PENDING", inst.operation_tx ?? undefined);
      const status = await transactionStatus(inst.operation_tx);
      if (status === "pending") throw new ApiError(409, "OPERATION_PENDING", inst.operation_tx);
      if (status === "reverted") {
        const cleared = await admin.from("institutions").update({ chain_operation: null, operation_tx: null }).eq("id", id).eq("operation_tx", inst.operation_tx);
        dbError(cleared.error);
        throw new ApiError(409, "TRANSACTION_FAILED", inst.operation_tx);
      }
      transactionHash = inst.operation_tx;
    } else {
      // Persist a compare-and-set lock: concurrent serverless invocations cannot send twice.
      const claimed = await admin.from("institutions").update({ chain_operation: action }).eq("id", id).eq("status", inst.status).is("chain_operation", null).select("id");
      dbError(claimed.error);
      if (claimed.data?.length !== 1) throw new ApiError(409, "OPERATION_PENDING");
      try {
        const result = action === "approve" ? await registerIssuer(inst.wallet_address, inst.name, inst.category) : await revokeIssuer(inst.wallet_address);
        transactionHash = result.transactionHash;
      } catch (error) {
        const hash = error instanceof ChainError && error.code === "TRANSACTION_PENDING" ? error.transactionHash : undefined;
        // A broadcast with an uncertain outcome is retained for later reconciliation.
        const saved = await admin.from("institutions").update(hash ? { operation_tx: hash } : { chain_operation: null, operation_tx: null })
          .eq("id", id).eq("chain_operation", action);
        dbError(saved.error);
        throw error;
      }
      const saved = await admin.from("institutions").update({ operation_tx: transactionHash }).eq("id", id).eq("chain_operation", action);
      if (saved.error) throw new ApiError(503, "CHAIN_DB_SYNC_REQUIRED", transactionHash);
    }
    const completed = await admin.rpc("complete_institution_action", { p_id: id, p_action: action, p_tx: transactionHash, p_actor: actor });
    if (completed.error) throw new ApiError(503, "CHAIN_DB_SYNC_REQUIRED", transactionHash);
    return json({ institution: completed.data });
  } catch (error) { return failure(error); }
}
