import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { publicSupabaseConfig } from "./config";
import { AuthError } from "../auth-policy";

// Middleware refreshes cookies for read-only Server Components.
// Route handlers that establish a session must opt into cookie writes.
export async function createClient(writable = false) {
  const config = publicSupabaseConfig();
  if (!config) throw new AuthError(503, "AUTH_UNAVAILABLE");
  const store = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() { return store.getAll(); },
      setAll(values) {
        if (writable) values.forEach(({ name, value, options }) => store.set(name, value, options));
      },
    },
  });
}
