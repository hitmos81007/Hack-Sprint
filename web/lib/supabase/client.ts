"use client";

import { createBrowserClient } from "@supabase/ssr";
import { publicSupabaseConfig } from "./config";

export function createClient() {
  const config = publicSupabaseConfig();
  if (!config) throw new Error("AUTH_UNAVAILABLE");
  return createBrowserClient(config.url, config.key);
}
