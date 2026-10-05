import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readIdentity } from "./session";
const id = "00000000-0000-4000-8000-000000000001";
function client(profile: unknown, error: unknown = null) {
  const single = vi.fn().mockResolvedValue({ data: profile, error });
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  return {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id, user_metadata: { role: "root_authority" } } }, error: null }) },
    from: vi.fn(() => ({ select })), eq,
  };
}
it("reads role from profiles, ignoring client-writable metadata", async () => {
  const mock = client({ id, role: "citizen" });
  expect(await readIdentity(mock as unknown as SupabaseClient)).toEqual({ id, role: "citizen" });
  expect(mock.eq).toHaveBeenCalledWith("id", id);
});
it("fails closed when the profile is missing or has an unknown role", async () => {
  await expect(readIdentity(client(null, {}) as unknown as SupabaseClient)).rejects.toThrow("AUTH_UNAVAILABLE");
  await expect(readIdentity(client({ id, role: "invented" }) as unknown as SupabaseClient)).rejects.toThrow("FORBIDDEN");
});
