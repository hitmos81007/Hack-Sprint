import { it,expect,vi } from "vitest";
vi.mock("server-only",()=>({}));
import { LLM_ATTEMPT_TIMEOUT_MS,LLM_MAX_ATTEMPTS,LLM_TOTAL_TIMEOUT_MS } from "./llm";
import { maxDuration,runtime } from "../app/api/analyze/route";
it("keeps the provider retry budget below the explicit Node route duration",()=>{
 expect(runtime).toBe("nodejs");expect(maxDuration).toBe(60);
 expect(LLM_ATTEMPT_TIMEOUT_MS).toBe(8000);expect(LLM_MAX_ATTEMPTS).toBe(2);
 expect(LLM_TOTAL_TIMEOUT_MS).toBe(16000);expect(LLM_TOTAL_TIMEOUT_MS).toBeLessThan(maxDuration*1000);
});
