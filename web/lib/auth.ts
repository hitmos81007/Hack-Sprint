import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { readIdentity } from "./session";
import { assertRole, AuthError, type Role } from "./auth-policy";

// Both route handlers and Server Components may use this. Handlers should catch
// AuthError and return authErrorResponse; pages can use requirePageRole below.
export async function requireRole(role: Role | readonly Role[]) {
  const client = await createClient();
  const identity = assertRole(await readIdentity(client), role);
  return { ...identity, client };
}

export function authErrorResponse(error: unknown) {
  const failure = error instanceof AuthError ? error : new AuthError(503, "AUTH_UNAVAILABLE");
  return Response.json({ error: { code: failure.code } }, { status: failure.status, headers: { "Cache-Control": "private, no-store" } });
}

export async function requirePageRole(role: Role | readonly Role[]) {
  try { return await requireRole(role); }
  catch (error) {
    if (error instanceof AuthError && error.status === 401) redirect("/login");
    redirect(error instanceof AuthError && error.status === 403 ? "/login?error=forbidden" : "/login?error=unavailable");
  }
}
