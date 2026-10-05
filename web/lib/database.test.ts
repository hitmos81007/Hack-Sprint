import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let db: PGlite;
const alice = "00000000-0000-4000-8000-000000000001";
const bob = "00000000-0000-4000-8000-000000000002";
const issuer = "00000000-0000-4000-8000-000000000003";
const root = "00000000-0000-4000-8000-000000000004";
const institution = "10000000-0000-4000-8000-000000000001";
const challenge = "20000000-0000-4000-8000-000000000001";

beforeAll(async () => {
  db = new PGlite();
  // Only the Supabase-managed auth schema/roles are emulated. All application
  // DDL, grants, triggers and policies below are the actual migration files.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
  `);
  const dir = resolve(process.cwd(), "../supabase/migrations");
  for (const file of (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.exec(await readFile(resolve(dir, file), "utf8"));
  }
  await db.exec(`
    insert into auth.users(id, raw_user_meta_data) values
      ('${alice}', '{"role":"root_authority"}'), ('${bob}','{}'), ('${issuer}','{}'), ('${root}','{}');
    update public.profiles set role = 'issuer_admin' where id = '${issuer}';
    update public.profiles set role = 'root_authority' where id = '${root}';
    insert into public.institutions(id,name,category,wallet_address,status,created_by) values
      ('${institution}','Synthetic Active Bank','bank','0x1111111111111111111111111111111111111111','active','${issuer}'),
      ('10000000-0000-4000-8000-000000000002','Synthetic Pending Bank','bank','0x2222222222222222222222222222222222222222','pending','${issuer}');
    insert into public.officers(user_id,institution_id,name,role_title,wallet_address,credential,status,expires_at) values
      ('${bob}','${institution}','Synthetic Officer','Demo','0x3333333333333333333333333333333333333333','{"synthetic":"private credential"}','active',now()+interval '1 day');
    insert into public.analyses(user_id,input_hash,risk_score,verdict,provider,latency_ms) values
      ('${alice}',repeat('a',64),90,'HIGH_RISK','heuristics',1),
      ('${bob}',repeat('b',64),10,'LOW_RISK','heuristics',1),
      (null,repeat('c',64),10,'LOW_RISK','heuristics',1);
    insert into public.challenges(id,citizen_id,code,claimed_entity,claimed_category)
      values ('${challenge}','${alice}','123456','Synthetic Bank','bank');
  `);
}, 60000);
afterAll(async () => { await db?.close(); });

async function asUser<T>(id: string, action: () => Promise<T>, role = "authenticated"): Promise<T> {
  await db.exec(`begin; set local role ${role};`);
  await db.query("select set_config('request.jwt.claim.sub', $1, true)", [id]);
  try { return await action(); }
  finally { await db.exec("rollback"); }
}

describe("real PostgreSQL RLS", () => {
  it("creates a citizen profile on signup even when metadata requests root", async () => {
    const result = await db.query<{ role: string }>("select role from public.profiles where id=$1", [alice]);
    expect(result.rows).toEqual([{ role: "citizen" }]);
  });
  it("citizen cannot read another user's analyses or anonymous cached rows", async () => {
    await asUser(alice, async () => {
      expect((await db.query("select user_id from public.analyses")).rows).toEqual([{ user_id: alice }]);
      expect((await db.query("select * from public.analyses where user_id=$1", [bob])).rows).toEqual([]);
    });
  });
  it("citizen cannot update their own role", async () => {
    await expect(asUser(alice, () => db.exec("update public.profiles set role='root_authority'")))
      .rejects.toMatchObject({ code: "42501" });
  });
  it("citizen can edit only their own allowed profile fields", async () => {
    await asUser(alice, async () => {
      const result = await db.query("update public.profiles set display_name='Synthetic Citizen', preferred_lang='hi' returning id");
      expect(result.rows).toEqual([{ id: alice }]);
    });
  });
  it("citizen cannot insert institutions", async () => {
    await expect(asUser(alice, () => db.query(`insert into public.institutions(name,category,wallet_address,created_by)
      values ('Synthetic Attack','bank','0x4444444444444444444444444444444444444444',$1)`, [alice])))
      .rejects.toMatchObject({ code: "42501" });
  });
  it("citizen cannot update or delete institutions", async () => {
    await asUser(alice, async () => {
      await expect(db.query("update public.institutions set name='Tampered' returning id")).rejects.toMatchObject({ code: "42501" });
      // Separate transaction below: PostgreSQL aborts a transaction after denial.
    });
  });
  it("citizen cannot transfer an analysis to another user", async () => {
    await expect(asUser(alice, () => db.query("update public.analyses set user_id=$1", [bob])))
      .rejects.toMatchObject({ code: "42501" });
  });
  it("root app role still cannot change roles directly", async () => {
    await expect(asUser(root, () => db.exec("update public.profiles set role='root_authority'")))
      .rejects.toMatchObject({ code: "42501" });
  });
  it("service role can promote an account", async () => {
    await asUser("", async () => {
      expect((await db.query("update public.profiles set role='officer' where id=$1 returning role", [alice])).rows).toEqual([{ role: "officer" }]);
    }, "service_role");
  });
  it("anonymous readers see active public identities without credentials or user ids", async () => {
    await asUser("", async () => {
      const institutions = await db.query<Record<string, unknown>>("select * from public.public_institutions");
      expect(institutions.rows).toHaveLength(1);
      expect(Object.keys(institutions.rows[0]).sort()).toEqual(["category","id","name","wallet_address"]);
      const officers = await db.query("select * from public.public_officers");
      expect(officers.rows).toHaveLength(1);
      expect(officers.rows[0]).not.toHaveProperty("credential");
      expect(officers.rows[0]).not.toHaveProperty("user_id");
    }, "anon");
  });
  it("anonymous callers cannot query private base tables", async () => {
    await expect(asUser("", () => db.query("select * from public.officers"), "anon")).rejects.toMatchObject({ code: "42501" });
  });
  it("audit insertion requires service role and citizens cannot reset challenge counters", async () => {
    await expect(asUser(alice, () => db.query("insert into public.verification_events(challenge_id,result,reason,duration_ms) values ($1,'NOT_VERIFIED','Synthetic',1)", [challenge])))
      .rejects.toMatchObject({ code: "42501" });
    await expect(asUser(alice, () => db.exec("update public.challenges set attempts=0"))).rejects.toMatchObject({ code: "42501" });
    await asUser("", () => db.query("insert into public.verification_events(challenge_id,result,reason,duration_ms) values ($1,'NOT_VERIFIED','Synthetic',1)", [challenge]), "service_role");
  });
  it("chain status is writable only through the service workflow", async () => {
    await expect(asUser(issuer, () => db.exec("update public.institutions set status='active' where status='pending'")))
      .rejects.toMatchObject({ code: "42501" });
    await expect(asUser(root, () => db.exec("update public.institutions set status='active' where status='pending'"))).rejects.toMatchObject({ code: "42501" });
  });
  it("rate-limit increment is atomic and service-only", async () => {
    await expect(asUser(alice, () => db.query("select public.increment_rate_limit('synthetic',now())"))).rejects.toMatchObject({ code: "42501" });
    await asUser("", async () => {
      expect((await db.query("select public.increment_rate_limit('synthetic','2026-10-01T00:00:00Z') as count")).rows).toEqual([{ count: 1 }]);
      expect((await db.query("select public.increment_rate_limit('synthetic','2026-10-01T00:00:00Z') as count")).rows).toEqual([{ count: 2 }]);
    }, "service_role");
  });
  it("enables RLS on every core table", async () => {
    const result = await db.query<{ relname: string; relrowsecurity: boolean }>("select relname,relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'");
    expect(result.rows).toHaveLength(17);
    expect(result.rows.every((row) => row.relrowsecurity)).toBe(true);
  });
});
