vi.mock("server-only",()=>({}));
import { afterEach, expect, it, vi } from "vitest";
import { GET, dynamic, runtime } from "./route";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("serves the exact public liveness contract without credentials or caching", async () => {
  for (const name of ["RPC_URL", "CHAIN_ID", "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "LLM_PROVIDER"]) {
    vi.stubEnv(name, "");
  }
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-private-secret");
  const request = vi.fn();
  vi.stubGlobal("fetch", request);
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.json()).toEqual({ ok: true, db: false, chain: false, llm: "mock" });
  expect(request).not.toHaveBeenCalled();
  expect(dynamic).toBe("force-dynamic");
  expect(runtime).toBe("nodejs");
});


it("rejects unknown health query parameters without exposing errors",async()=>{
 const response=await GET(new Request("http://localhost/api/health?debug=1"));expect(response.status).toBe(400);expect(await response.json()).toEqual({error:{code:"INVALID_INPUT"}});
});
