import { z } from "zod";

export function publicSupabaseConfig() {
  const result = z.object({ url: z.string().url(), key: z.string().min(1) }).safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return result.success ? result.data : null;
}
