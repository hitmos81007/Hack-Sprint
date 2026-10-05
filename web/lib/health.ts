import { z } from "zod";

export const providerSchema = z.enum(["mock", "openai", "anthropic", "gemini"]);
export const healthSchema = z.object({
  ok: z.literal(true), db: z.boolean(), chain: z.boolean(), llm: providerSchema,
});
export type Health = z.infer<typeof healthSchema>;
type HealthEnvironment = Record<string, string | undefined>;

const httpUrl = z.string().url().refine((value) => /^https?:\/\//i.test(value));
const dbConfig = z.object({
  NEXT_PUBLIC_SUPABASE_URL: httpUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
});
const chainConfig = z.object({
  RPC_URL: httpUrl,
  CHAIN_ID: z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER),
});
const rpcResponse = z.object({
  jsonrpc: z.literal("2.0"), id: z.literal(1),
  result: z.string().regex(/^0x[0-9a-fA-F]+$/),
  error: z.never().optional(),
});

export const HEALTH_TIMEOUT_MS = 3000;

async function probeDb(env: HealthEnvironment, request: typeof fetch): Promise<boolean> {
  const config = dbConfig.safeParse(env);
  if (!config.success) return false;
  try {
    const response = await request(new URL("/rest/v1/rpc/health_check", config.data.NEXT_PUBLIC_SUPABASE_URL), {
      method: "POST",
      headers: { apikey: config.data.NEXT_PUBLIC_SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: "{}", cache: "no-store", signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    return response.ok && z.literal(true).safeParse(await response.json()).success;
  } catch { return false; }
}

async function probeChain(env: HealthEnvironment, request: typeof fetch): Promise<boolean> {
  const config = chainConfig.safeParse(env);
  if (!config.success) return false;
  try {
    const response = await request(config.data.RPC_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
      cache: "no-store", signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const payload = rpcResponse.safeParse(await response.json());
    return payload.success && BigInt(payload.data.result) === BigInt(config.data.CHAIN_ID);
  } catch { return false; }
}

// Request-scoped probes only: no persistence, credentials in output or paid LLM call.
export async function getHealth(env: HealthEnvironment = process.env, request: typeof fetch = fetch): Promise<Health> {
  const [db, chain] = await Promise.all([probeDb(env, request), probeChain(env, request)]);
  const provider = providerSchema.safeParse(env.LLM_PROVIDER);
  return healthSchema.parse({ ok: true, db, chain, llm: provider.success ? provider.data : "mock" });
}
