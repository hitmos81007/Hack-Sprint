import "server-only";
import { createClient } from "./supabase/server";
import { readIdentity } from "./session";
// No account is needed for challenge/verify. Only validate an auth session if supplied.
export async function optionalIdentity(request: Request) {
  if (!/(?:^|;\s*)sb-[^=;]*auth-token(?:\.\d+)?=/.test(request.headers.get("cookie") ?? "")) return null;
  return readIdentity(await createClient());
}
