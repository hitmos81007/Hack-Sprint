import { requireRole } from "../../../../lib/auth";
import { createAdminClient } from "../../../../lib/supabase/admin";
import { officerAction } from "../../../../lib/onboarding-schema";
import { verifyCredential } from "../../../../lib/crypto";
import { isActive } from "../../../../lib/chain";
import { ApiError, body, dbError, failure, json, uuid } from "../../../../lib/api";
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) {
  try {
    const { id: actor } = await requireRole("issuer_admin");
    const id = uuid((await context.params).id);
    const data = await body(request, officerAction);
    const admin = createAdminClient();
    const found = await admin.from("officers").select("*").eq("id", id).maybeSingle();
    dbError(found.error);
    if (!found.data) throw new ApiError(404, "NOT_FOUND");
    const inst = await admin.from("institutions").select("*").eq("id", found.data.institution_id).maybeSingle();
    dbError(inst.error);
    if (!inst.data || inst.data.created_by !== actor || inst.data.status !== "active" || inst.data.chain_operation) throw new ApiError(403, "FORBIDDEN");
    if (data.action === "revoke") {
      const result = await admin.from("officers").update({ status: "revoked" }).eq("id", id).eq("institution_id", inst.data.id).select().single();
      dbError(result.error);
      return json({ officer: result.data });
    }
    if (!verifyCredential(data.credential, { issuerAddress: inst.data.wallet_address, officerAddress: found.data.wallet_address })) throw new ApiError(400, "INVALID_CREDENTIAL");
    if (!await isActive(inst.data.wallet_address)) throw new ApiError(409, "INSTITUTION_INACTIVE");
    const result = await admin.rpc("issue_officer_credential", { p_id: id, p_credential: data.credential, p_actor: actor });
    dbError(result.error);
    return json({ officer: result.data });
  } catch (error) { return failure(error); }
}
