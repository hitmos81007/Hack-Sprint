import { emptyQuery } from "../../../lib/api";
import { requireRole } from "../../../lib/auth";
import { allRoles } from "../../../lib/auth-policy";
import { createAdminClient } from "../../../lib/supabase/admin";
import { officerInput } from "../../../lib/onboarding-schema";
import { verifyApplication } from "../../../lib/crypto";
import { ApiError, body, dbError, failure, json } from "../../../lib/api";
import { isActive } from "../../../lib/chain";
export async function GET(request?:Request) {
  try {emptyQuery(request);
    const { id, role, client } = await requireRole(allRoles);
    const query = client.from("officers").select("*").order("name");
    // RLS admits own rows and officers of the issuer's active institution.
    const result = await (role === "issuer_admin" || role === "root_authority" ? query : query.eq("user_id", id));
    dbError(result.error);
    return json({ officers: result.data });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const { id } = await requireRole(["citizen", "officer"]);
    const data = await body(request, officerInput);
    if (!verifyApplication("officer", id, data.walletAddress, data.signature, data.institutionId)) throw new ApiError(400, "INVALID_SIGNATURE");
    const admin = createAdminClient();
    const institution = await admin.from("institutions").select("wallet_address,status,chain_operation").eq("id", data.institutionId).maybeSingle();
    dbError(institution.error);
    if (!institution.data || institution.data.status !== "active" || institution.data.chain_operation || !await isActive(institution.data.wallet_address)) throw new ApiError(409, "INSTITUTION_INACTIVE");
    const result = await admin.from("officers").insert({ user_id: id, institution_id: data.institutionId,
      name: data.name, role_title: data.roleTitle, wallet_address: data.walletAddress,
      status: "pending", expires_at: new Date().toISOString() }).select().single();
    dbError(result.error);
    return json({ officer: result.data }, 201);
  } catch (error) { return failure(error); }
}

