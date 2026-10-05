import { z } from "zod";

export const roleSchema = z.enum(["citizen", "officer", "issuer_admin", "root_authority"]);
export type Role = z.infer<typeof roleSchema>;
export const allRoles = roleSchema.options;
export const identitySchema = z.object({ id: z.string().uuid(), role: roleSchema });
export type Identity = z.infer<typeof identitySchema>;

export class AuthError extends Error {
  constructor(public readonly status: 401 | 403 | 503, public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "AUTH_UNAVAILABLE") {
    super(code);
  }
}

// Roles are exact permissions, not an implicit privilege hierarchy.
export function assertRole(identity: Identity | null, allowed: Role | readonly Role[]): Identity {
  if (!identity) throw new AuthError(401, "UNAUTHENTICATED");
  if (!(Array.isArray(allowed) ? allowed : [allowed]).includes(identity.role)) {
    throw new AuthError(403, "FORBIDDEN");
  }
  return identity;
}

export function rolesForPath(path: string): readonly Role[] | null {
  const rules: Record<string, readonly Role[]> = {
    "/officer": ["citizen", "officer"], "/issuer": ["citizen", "issuer_admin"], "/root": ["root_authority"],
    "/dashboard": allRoles, "/vault": allRoles, "/guardian": allRoles,
  };
  for (const [prefix, roles] of Object.entries(rules)) {
    if (path === prefix || path.startsWith(`${prefix}/`)) return roles;
  }
  return null;
}

export const loginSchema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(128) });
export const signupSchema = loginSchema.extend({ password: z.string().min(8).max(128) });
export const emailSchema = loginSchema.pick({ email: true });
