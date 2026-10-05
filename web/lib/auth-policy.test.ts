import { describe, expect, it } from "vitest";
import { assertRole, rolesForPath, loginSchema, signupSchema, emailSchema } from "./auth-policy";
const citizen = { id: "00000000-0000-4000-8000-000000000001", role: "citizen" as const };
describe("authorization", () => {
  it("rejects anonymous and wrong-role identities", () => {
    expect(() => assertRole(null, "citizen")).toThrow("UNAUTHENTICATED");
    expect(() => assertRole(citizen, "root_authority")).toThrow("FORBIDDEN");
    expect(assertRole(citizen, ["citizen", "officer"])).toEqual(citizen);
  });
  it("guards nested role pages while keeping citizen tools public", () => {
    expect(rolesForPath("/issuer/officers")).toEqual(["citizen", "issuer_admin"]);
    expect(rolesForPath("/root")).toEqual(["root_authority"]);
    expect(rolesForPath("/officer")).toEqual(["citizen", "officer"]);
    for (const path of ["/verify", "/analyze", "/registry", "/login", "/officer-example"]) expect(rolesForPath(path)).toBeNull();
  });
  it("validates passwords and emails while allowing passwordless links", () => {
    expect(loginSchema.safeParse({ email: "invalid", password: "abc" }).success).toBe(false);
    expect(signupSchema.safeParse({ email: "synthetic@example.test", password: "short" }).success).toBe(false);
    expect(emailSchema.safeParse({ email: "synthetic@example.test" }).success).toBe(true);
  });
});
