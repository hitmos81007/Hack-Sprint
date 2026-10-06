import { emptyQuery, failure } from "../../../../lib/api";
import { allRoles } from "../../../../lib/auth-policy";
import { requireRole } from "../../../../lib/auth";

export async function GET(request:Request) {
  try {emptyQuery(request);
    const { id, role } = await requireRole(allRoles);
    return Response.json({ id, role }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return failure(error); }
}

