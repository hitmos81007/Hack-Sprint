import type { SupabaseClient } from "@supabase/supabase-js";
import { AuthError, identitySchema, type Identity } from "./auth-policy";

export async function readIdentity(client: SupabaseClient): Promise<Identity | null> {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return null;
  const profile = await client.from("profiles").select("id, role").eq("id", data.user.id).single();
  if (profile.error) throw new AuthError(503, "AUTH_UNAVAILABLE");
  const identity = identitySchema.safeParse(profile.data);
  if (!identity.success || identity.data.id !== data.user.id) throw new AuthError(403, "FORBIDDEN");
  return identity.data;
}
