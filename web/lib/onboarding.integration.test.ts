import { PGlite } from "@electric-sql/pglite";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Wallet, ContractFactory, JsonRpcProvider, parseEther, id as hash } from "ethers";
import { applicationMessage, createCredential } from "./crypto";
import { assertRole, type Role } from "./auth-policy";
vi.mock("server-only", () => ({}));
const chain = vi.hoisted(() => ({ registerIssuer: vi.fn(), revokeIssuer: vi.fn(), isActive: vi.fn(), transactionStatus: vi.fn() }));
vi.mock("./chain", async original => ({ ...await original<typeof import("./chain")>(), ...chain }));
vi.mock("./auth", async original => ({ ...await original<typeof import("./auth")>(), requireRole: vi.fn() }));
vi.mock("./supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { requireRole } from "./auth";
import { createAdminClient } from "./supabase/admin";
import { ChainError } from "./chain";
import { GET as institutions, POST as applyInstitution } from "../app/api/institutions/route";
import { PATCH as rootAction } from "../app/api/institutions/[id]/route";
import { GET as officers, POST as applyOfficer } from "../app/api/officers/route";
import { PATCH as officerAction } from "../app/api/officers/[id]/route";
let db: PGlite;
let localProvider: JsonRpcProvider | undefined;
let account: string;
const root = "00000000-0000-4000-8000-000000000101";
const issuer = "00000000-0000-4000-8000-000000000102";
const officer = "00000000-0000-4000-8000-000000000103";
const stranger = "00000000-0000-4000-8000-000000000104";
const institutionWallet = Wallet.createRandom(); const officerWallet = Wallet.createRandom();
let institutionId: string; let officerId: string;
const live = new Set<string>();
function request(payload: unknown) { return new Request("http://localhost/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); }
function context(id: string) { return { params: Promise.resolve({ id }) }; }
async function sql(role: string, userId: string, statement: string, values: unknown[] = []) {
  await db.exec(`begin; set local role ${role};`);
  try {
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [userId]);
    const result = await db.query(statement, values);
    await db.exec("commit"); return { data: result.rows, error: null };
  } catch (error) {
    await db.exec("rollback"); return { data: null, error: { code: (error as { code: string }).code } };
  }
}
// Minimal Supabase query adapter backed by actual Postgres DDL, grants and RLS.
// This exercises route handlers without a live Auth project or remote transactions.
class Query {
  private operation = "select"; private columns = "*"; private payload: Record<string, unknown> = {};
  private conditions: string[] = []; private values: unknown[] = []; private sorting = ""; private singleRow = false;
  constructor(private table: string, private role: string, private userId: string) {}
  select(columns = "*") { this.columns = columns; return this; }
  insert(payload: Record<string, unknown>) { this.operation = "insert"; this.payload = payload; return this; }
  update(payload: Record<string, unknown>) { this.operation = "update"; this.payload = payload; return this; }
  eq(field: string, value: unknown) { this.values.push(value); this.conditions.push(`${field}=$${this.values.length}`); return this; }
  is(field: string, value: null) { if (value !== null) throw new Error("Unsupported filter"); this.conditions.push(`${field} is null`); return this; }
  order(field: string, options?: { ascending: boolean }) { this.sorting = ` order by ${field} ${options?.ascending === false ? "desc" : "asc"}`; return this; }
  single() { this.singleRow = true; return this; }
  maybeSingle() { this.singleRow = true; return this; }
  async then(onFulfilled: (value: unknown) => unknown, onRejected?: (error: unknown) => unknown) {
    try {
      const where = this.conditions.length ? ` where ${this.conditions.join(" and ")}` : "";
      let statement = `select ${this.columns} from public.${this.table}${where}${this.sorting}`;
      if (this.operation !== "select") {
        const fields = Object.keys(this.payload); const placeholders = fields.map(field => { this.values.push(this.payload[field]); return `$${this.values.length}`; });
        statement = this.operation === "insert" ? `insert into public.${this.table}(${fields.join(",")}) values(${placeholders.join(",")}) returning ${this.columns}` :
          `update public.${this.table} set ${fields.map((field, i) => `${field}=${placeholders[i]}`).join(",")}${where} returning ${this.columns}`;
      }
      const result = await sql(this.role, this.userId, statement, this.values);
      return onFulfilled({ ...result, data: this.singleRow ? result.data?.[0] ?? null : result.data });
    } catch (error) { if (onRejected) return onRejected(error); throw error; }
  }
}
function client(role: string, userId = "") {
  return { from: (table: string) => new Query(table, role, userId), rpc: async (name: string, args: Record<string, unknown>) => {
    const values = Object.values(args).map(v => typeof v === "object" ? JSON.stringify(v) : v);
    const result = await sql(role, userId, `select public.${name}(${values.map((_, i) => `$${i + 1}`).join(",")}) as result`, values);
    return { ...result, data: (result.data?.[0] as { result?: unknown })?.result };
  } };
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth; create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`);
  const directory = resolve(process.cwd(), "../supabase/migrations");
  for (const file of (await readdir(directory)).filter(f => f.endsWith(".sql")).sort()) await db.exec(await readFile(resolve(directory, file), "utf8"));
  for (const user of [root, issuer, officer, stranger]) await db.query("insert into auth.users(id) values($1)", [user]);
  await db.query("update public.profiles set role='root_authority' where id=$1", [root]);
  vi.mocked(createAdminClient).mockImplementation(() => client("service_role") as unknown as ReturnType<typeof createAdminClient>);
  vi.mocked(requireRole).mockImplementation(async allowed => {
    const { rows } = await db.query<{ role: Role }>("select role from public.profiles where id=$1", [account]);
    const identity = assertRole(rows[0] ? { id: account, role: rows[0].role } : null, allowed);
    return { ...identity, client: client("authenticated", account) as unknown as Awaited<ReturnType<typeof requireRole>>["client"] };
  });
  chain.registerIssuer.mockImplementation(async address => { live.add(address); return { transactionHash: hash(`synthetic-register:${address}`), blockNumber: 1 }; });
  chain.revokeIssuer.mockImplementation(async address => { live.delete(address); return { transactionHash: hash(`synthetic-revoke:${address}`), blockNumber: 2 }; });
  chain.isActive.mockImplementation(async address => live.has(address));
  chain.transactionStatus.mockResolvedValue("confirmed");
  if (process.env.RUN_CHAIN_INTEGRATION === "1") {
    // An optional real-RPC run uses an isolated contract and ephemeral test relayer.
    localProvider = new JsonRpcProvider("http://127.0.0.1:8545", undefined, { cacheTimeout: -1 });
    expect((await localProvider.getNetwork()).chainId).toBe(BigInt(31337));
    const relay = Wallet.createRandom().connect(localProvider);
    const funder = await localProvider.getSigner(0);
    await (await funder.sendTransaction({ to: relay.address, value: parseEther("1") })).wait();
    const artifact = JSON.parse(await readFile(resolve(process.cwd(), "../contracts/artifacts/contracts/TrustRegistry.sol/TrustRegistry.json"), "utf8"));
    const registry = await new ContractFactory(artifact.abi, artifact.bytecode, relay).deploy();
    await registry.waitForDeployment();
    vi.stubEnv("RPC_URL", "http://127.0.0.1:8545"); vi.stubEnv("CHAIN_ID", "31337");
    vi.stubEnv("REGISTRY_ADDRESS", await registry.getAddress()); vi.stubEnv("RELAYER_PRIVATE_KEY", relay.privateKey);
    const real = await vi.importActual<typeof import("./chain")>("./chain");
    chain.registerIssuer.mockImplementation(real.registerIssuer); chain.revokeIssuer.mockImplementation(real.revokeIssuer);
    chain.isActive.mockImplementation(real.isActive); chain.transactionStatus.mockImplementation(real.transactionStatus);
  }
}, 60000);
afterAll(async () => { await db?.close(); localProvider?.destroy(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("onboarding routes across three accounts with actual RLS and atomic functions", () => {
  it("accepts a public-key institution application and rejects secrets/forged proofs", async () => {
    account = issuer;
    const payload = { name: "Synthetic Bank", category: "bank", walletAddress: institutionWallet.address,
      signature: await institutionWallet.signMessage(applicationMessage("institution", issuer, institutionWallet.address)) };
    expect((await applyInstitution(request({ ...payload, privateKey: institutionWallet.privateKey }))).status).toBe(400);
    expect((await applyInstitution(request({ ...payload, signature: await officerWallet.signMessage("forged") }))).status).toBe(400);
    const response = await applyInstitution(request(payload)); expect(response.status).toBe(201);
    const data = await response.json(); institutionId = data.institution.id;
    expect(data.institution.status).toBe("pending"); expect(data.institution).not.toHaveProperty("privateKey");
    expect((await applyInstitution(request(payload))).status).toBe(409);
    expect((await (await institutions()).json()).institutions).toHaveLength(1);
    account = stranger; expect((await (await institutions()).json()).institutions).toHaveLength(0);
  });
  it("allows only root approval and atomically promotes the applicant", async () => {
    account = issuer; expect((await rootAction(request({ action: "approve" }), context(institutionId))).status).toBe(403);
    expect(chain.registerIssuer).not.toHaveBeenCalled();
    account = root;
    expect((await (await institutions()).json()).institutions[0].status).toBe("pending");
    const response = await rootAction(request({ action: "approve" }), context(institutionId)); expect(response.status).toBe(200);
    expect((await response.json()).institution.onchain_tx).toMatch(/^0x[0-9a-f]{64}$/);
    expect((await db.query<{ role: string }>("select role from public.profiles where id=$1", [issuer])).rows[0].role).toBe("issuer_admin");
    expect(chain.registerIssuer).toHaveBeenCalledWith(institutionWallet.address, "Synthetic Bank", "bank");
  });
  it("accepts an officer's self-application but blocks direct credential/role writes", async () => {
    account = officer;
    const signature = await officerWallet.signMessage(applicationMessage("officer", officer, officerWallet.address, institutionId));
    const response = await applyOfficer(request({ institutionId, name: "Synthetic Officer", roleTitle: "Demo Inspector", walletAddress: officerWallet.address, signature }));
    expect(response.status).toBe(201); officerId = (await response.json()).officer.id;
    expect((await (await officers()).json()).officers[0].credential).toBeNull();
    expect((await sql("authenticated", issuer, "update public.officers set status='active'")).error?.code).toBe("42501");
    expect((await sql("authenticated", officer, "update public.profiles set role='officer'")).error?.code).toBe("42501");
    expect((await sql("authenticated", issuer, "select public.issue_officer_credential($1,$2,$3)", [officerId, "{}", issuer])).error?.code).toBe("42501");
  });
  it("checks ownership, signature, expiry, address and on-chain activation before issuance", async () => {
    const credential = await createCredential(institutionWallet, { officerName: "Synthetic Officer", roleTitle: "Demo Inspector", officerAddress: officerWallet.address, expiresAt: "2030-01-01T00:00:00.000Z" });
    account = officer; expect((await officerAction(request({ action: "issue", credential }), context(officerId))).status).toBe(403);
    await db.query("update public.profiles set role='issuer_admin' where id=$1", [stranger]);
    account = stranger; expect((await officerAction(request({ action: "issue", credential }), context(officerId))).status).toBe(403);
    account = issuer;
    for (const patch of [{ officerName: "Tampered" }, { expiresAt: "2000-01-01T00:00:00.000Z" }, { officerAddress: institutionWallet.address }]) {
      expect((await officerAction(request({ action: "issue", credential: { ...credential, ...patch } }), context(officerId))).status).toBe(400);
    }
    chain.isActive.mockResolvedValueOnce(false);
    expect((await officerAction(request({ action: "issue", credential }), context(officerId))).status).toBe(409);
    live.add(institutionWallet.address);
    const response = await officerAction(request({ action: "issue", credential }), context(officerId)); expect(response.status).toBe(200);
    expect((await db.query<{ role: string }>("select role from public.profiles where id=$1", [officer])).rows[0].role).toBe("officer");
    account = officer; expect((await (await officers()).json()).officers[0].credential).toEqual(credential);
    account = stranger; expect((await (await officers()).json()).officers).toHaveLength(0);
  });
  it("revokes credentials and institutions without exposing other accounts' credentials", async () => {
    account = issuer; const response = await officerAction(request({ action: "revoke" }), context(officerId)); expect(response.status).toBe(200);
    account = officer; expect((await (await officers()).json()).officers[0].status).toBe("revoked");
    account = root; expect((await rootAction(request({ action: "revoke" }), context(institutionId))).status).toBe(200);
    expect(await chain.isActive(institutionWallet.address)).toBe(false);
    expect((await (await institutions()).json()).institutions[0].status).toBe("revoked");
  });
  it("reconciles uncertain chain writes without sending another transaction", async () => {
    account = stranger; const wallet = Wallet.createRandom();
    const response = await applyInstitution(request({ name: "Synthetic Pending RPC", category: "police", walletAddress: wallet.address,
      signature: await wallet.signMessage(applicationMessage("institution", stranger, wallet.address)) }));
    const id = (await response.json()).institution.id;
    account = root;
    const transactionHash = hash("synthetic-uncertain-transaction");
    chain.registerIssuer.mockRejectedValueOnce(new ChainError("TRANSACTION_PENDING", transactionHash));
    expect((await rootAction(request({ action: "approve" }), context(id))).status).toBe(503);
    const sends = chain.registerIssuer.mock.calls.length;
    chain.transactionStatus.mockResolvedValueOnce("pending").mockResolvedValueOnce("confirmed");
    expect((await rootAction(request({ action: "approve" }), context(id))).status).toBe(409);
    expect(chain.registerIssuer.mock.calls.length).toBe(sends);
    expect((await rootAction(request({ action: "approve" }), context(id))).status).toBe(200);
    expect(chain.registerIssuer.mock.calls.length).toBe(sends);
  });
});
