import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { it, expect } from "vitest";
it("bundle audit rejects names and encoded secret values without printing secrets", async () => {
    const temp = await mkdtemp(resolve(tmpdir(), "satyacall-audit-"));
    try {
        const root = resolve(temp, ".next/static"); await mkdir(root, { recursive: true }); const file = resolve(root, "test.js"); const script = resolve(process.cwd(), "scripts/audit-client-bundle.cjs"), secret = "synthetic-private-audit-value";
        const run = () => spawnSync(process.execPath, [script], { cwd: temp, encoding: "utf8", env: { ...process.env, SUPABASE_SERVICE_ROLE_KEY: secret } });
        await writeFile(file, "console.log('public');"); expect(run().status).toBe(0);
        for (const value of ["RELAYER_PRIVATE_KEY", secret, Buffer.from(secret).toString("base64")]) { await writeFile(file, value); const result = run(); expect(result.status).toBe(1); expect(result.stderr).not.toContain(secret); }
    } finally { await rm(temp, { recursive: true, force: true }); }
}, 30000);
