import { expect, it, vi, afterEach } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ exchange: vi.fn() }));
vi.mock("../../../lib/supabase/server", () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: mocks.exchange } }) }));
import { GET } from "./route";
afterEach(() => vi.clearAllMocks());
it("exchanges the PKCE code and redirects only to the local dashboard", async () => {
  mocks.exchange.mockResolvedValue({ error: null });
  const response = await GET(new NextRequest("http://localhost:3000/auth/callback?code=synthetic&next=https://untrusted.example"));
  expect(mocks.exchange).toHaveBeenCalledWith("synthetic");
  expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("handles absent or invalid codes without leaking auth errors", async () => {
  const absent = await GET(new NextRequest("http://localhost:3000/auth/callback"));
  expect(mocks.exchange).not.toHaveBeenCalled();
  expect(absent.headers.get("location")).toBe("http://localhost:3000/login?error=callback");
  mocks.exchange.mockResolvedValue({ error: { message: "private provider detail" } });
  const failed = await GET(new NextRequest("http://localhost:3000/auth/callback?code=invalid"));
  expect(failed.headers.get("location")).toBe("http://localhost:3000/login?error=callback");
});
