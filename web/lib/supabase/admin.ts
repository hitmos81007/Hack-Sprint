import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// Route handlers only: call requireRole(...) before constructing this client.
// Never expose this client, key, or its results without an authorization check.
export function createAdminClient() {
  const config = z.object({ url: z.string().url(), key: z.string().min(1) }).parse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
