import { describe, expect, it, vi } from "vitest";
import { getHealth, HEALTH_TIMEOUT_MS } from "./health";

const env = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "synthetic-anon-key",
  RPC_URL: "https://rpc.example.com", CHAIN_ID: "80002", LLM_PROVIDER: "mock",
};
const json = (body: unknown, status = 200) => Response.json(body, { status });
const rpc = { jsonrpc: "2.0", id: 1, result: "0x13882" };

describe("health probes", () => {
  it("works without configuration or any network calls", async () => {
    const request = vi.fn<typeof fetch>();
    expect(await getHealth({}, request)).toEqual({ ok: true, db: false, chain: false, llm: "mock" });
    expect(request).not.toHaveBeenCalled();
  });
  it("checks database execution and the expected chain with no caching", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(json(true)).mockResolvedValueOnce(json(rpc));
    expect(await getHealth(env, request)).toEqual({ ok: true, db: true, chain: true, llm: "mock" });
    expect(request.mock.calls[0][0].toString()).toBe("https://example.supabase.co/rest/v1/rpc/health_check");
    for (const [, init] of request.mock.calls) {
      expect(init?.cache).toBe("no-store");
      expect(init?.signal).toBeInstanceOf(AbortSignal);
    }
    expect(request.mock.calls[1][1]?.body).toContain("eth_chainId");
  });
  it.each(["openai", "anthropic", "gemini"])("reports configured %s without an LLM request", async (provider) => {
    const request = vi.fn<typeof fetch>();
    expect((await getHealth({ LLM_PROVIDER: provider }, request)).llm).toBe(provider);
    expect(request).not.toHaveBeenCalled();
  });
  it("falls back safely for invalid environment values", async () => {
    const request = vi.fn<typeof fetch>();
    expect(await getHealth({ RPC_URL: "file:///secret", CHAIN_ID: "abc", LLM_PROVIDER: "invalid" }, request))
      .toEqual({ ok: true, db: false, chain: false, llm: "mock" });
    expect(request).not.toHaveBeenCalled();
  });
  it.each([
    [false, { ...rpc, result: "0x1" }],
    [{ ok: true }, { ...rpc, error: { code: -1 } }],
    [null, { ...rpc, result: "not-hex" }],
  ])("rejects misleading or malformed successful responses", async (db, chain) => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(json(db)).mockResolvedValueOnce(json(chain));
    expect(await getHealth(env, request)).toMatchObject({ db: false, chain: false });
  });
  it("keeps API liveness on upstream HTTP failures", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(json(true, 503)).mockResolvedValueOnce(json(rpc, 401));
    expect(await getHealth(env, request)).toMatchObject({ ok: true, db: false, chain: false });
  });
  it("handles malformed JSON and network errors independently", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response("not json")).mockRejectedValueOnce(new Error("private upstream details"));
    expect(await getHealth(env, request)).toEqual({ ok: true, db: false, chain: false, llm: "mock" });
  });
  it("preserves the healthy service if the other is down", async () => {
    const request = vi.fn<typeof fetch>().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(json(rpc));
    expect(await getHealth(env, request)).toMatchObject({ db: false, chain: true });
  });
  it("aborts both stalled probes within the timeout", async () => {
    const request = vi.fn<typeof fetch>().mockImplementation((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new Error("timeout")), { once: true });
    }));
    const started = Date.now();
    expect(await getHealth(env, request)).toMatchObject({ ok: true, db: false, chain: false });
    expect(Date.now() - started).toBeLessThan(HEALTH_TIMEOUT_MS + 2000);
  }, 6000);
});
