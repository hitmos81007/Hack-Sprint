import { emptyQuery, failure } from "../../../lib/api";
import { getHealth } from "../../../lib/health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request:Request) {
  try { emptyQuery(request); return Response.json(await getHealth(), { headers: { "Cache-Control": "no-store" } }); } catch(error) { return failure(error); }
}

