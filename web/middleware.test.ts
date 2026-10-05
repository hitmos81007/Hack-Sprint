import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ identity: vi.fn(), getUser: vi.fn() }));
vi.mock("./lib/session", () => ({ readIdentity: mocks.identity }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (values: { name: string; value: string; options: object }[], headers: Record<string,string>) => void } }) => {
    options.cookies.setAll([{ name: "synthetic-refresh", value: "refreshed", options: { path: "/", httpOnly: true } }], { "Cache-Control": "private, no-store" });
    return { auth: { getUser: mocks.getUser } };
  },
}));
import { middleware } from "./middleware";
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "synthetic");
  mocks.identity.mockResolvedValue(null);
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
it("redirects anonymous users and preserves refreshed cookies", async () => {
  const response = await middleware(new NextRequest("http://localhost:3000/dashboard"));
  expect(response.headers.get("location")).toBe("http://localhost:3000/login");
  expect(response.cookies.get("synthetic-refresh")?.value).toBe("refreshed");
  expect(response.headers.get("cache-control")).toContain("no-store");
});
it("rejects a citizen from root pages", async () => {
  mocks.identity.mockResolvedValue({ id: "synthetic", role: "citizen" });
  const response = await middleware(new NextRequest("http://localhost:3000/root"));
  expect(response.headers.get("location")).toBe("http://localhost:3000/login?error=forbidden");
});
it("allows the exact role and refreshes public-page sessions", async () => {
  mocks.identity.mockResolvedValue({ id: "synthetic", role: "officer" });
  expect((await middleware(new NextRequest("http://localhost:3000/officer"))).status).toBe(200);
  await middleware(new NextRequest("http://localhost:3000/verify"));
  expect(mocks.getUser).toHaveBeenCalled();
});
