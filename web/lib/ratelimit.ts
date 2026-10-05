import "server-only";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { isIP } from "node:net";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError, dbError } from "./api";
export async function checkRateLimit(client: SupabaseClient, request: Request, scope: "challenge" | "verify" | "resolve" | "evidence" | "analyze" | "lookup" | "upi" | "report" | "guardian", userId?: string) {
  const pepper = process.env.RATE_LIMIT_PEPPER;
  if (!pepper || pepper.length < 16) throw new ApiError(503, "RATE_LIMIT_CONFIG");
  // The deployment proxy must overwrite this header. Missing IPs share one bucket.
  const trustedProxy = process.env.VERCEL === "1" || process.env.RATE_LIMIT_TRUST_PROXY === "1";
  const ip = trustedProxy ? request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "" : "";
  const identity = userId ? `user:${userId}` : `ip:${isIP(ip) ? ip : "unknown"}`;
  const key = `${scope}:${createHmac("sha256",pepper).update(identity).digest("hex")}`;
  const windowStart = new Date(Math.floor(Date.now()/60000)*60000).toISOString();
  const counter = await client.rpc("increment_rate_limit", { p_key: key, p_window_start: windowStart });
  dbError(counter.error);
  const limit = scope === "challenge" ? 5 : scope === "resolve" ? 10 : 20;
  const count = z.number().int().positive().safeParse(counter.data);
  if (!count.success) throw new ApiError(503, "DATABASE_UNAVAILABLE");
  return count.data <= limit;
}

