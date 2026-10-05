import { emptyQuery } from "../../../lib/api";
import { requireRole } from "../../../lib/auth";
import { allRoles } from "../../../lib/auth-policy";
import { createAdminClient } from "../../../lib/supabase/admin";
import { institutionInput } from "../../../lib/onboarding-schema";
import { verifyApplication } from "../../../lib/crypto";
import { ApiError, body, dbError, failure, json } from "../../../lib/api";

export async function GET(request?:Request) {
  try {emptyQuery(request);
    const { id, role, client } = await requireRole(allRoles);
    // RLS restricts base rows to the owner/root; no private applicant data in public view.
    const query = client.from("institutions").select("*").order("created_at", { ascending: false });
    const owned = await (role === "root_authority" ? query : query.eq("created_by", id));
    dbError(owned.error);
    const active = await client.from("public_institutions").select("*").order("name");
    dbError(active.error);
    return json({ institutions: owned.data, active: active.data });
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    const { id } = await requireRole(["citizen", "issuer_admin"]);
    const data = await body(request, institutionInput);
    if (!verifyApplication("institution", id, data.walletAddress, data.signature)) throw new ApiError(400, "INVALID_SIGNATURE");
    const admin = createAdminClient();
    const result = await admin.from("institutions").insert({ name: data.name, category: data.category,
      wallet_address: data.walletAddress, created_by: id, status: "pending" }).select().single();
    dbError(result.error);
    return json({ institution: result.data }, 201);
  } catch (error) { return failure(error); }
}

