import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Wallet } from "ethers";
import { webcrypto } from "node:crypto";
import { createCredential, verifyCredential, createKeyVault, applicationMessage, verifyApplication } from "./crypto";
const issuer = Wallet.createRandom(); const officer = Wallet.createRandom();
const fields = { officerName: "Synthetic Officer", roleTitle: "Synthetic Inspector", officerAddress: officer.address, expiresAt: "2030-01-01T00:00:00.000Z" };
let storage: Map<string, string>;
beforeEach(() => {
  storage = new Map();
  vi.stubGlobal("window", { crypto: webcrypto, localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
});
afterEach(() => vi.unstubAllGlobals());
describe("signed credentials", () => {
  it("recovers the issuer and rejects tampering of every signed field", async () => {
    const credential = await createCredential(issuer, fields);
    expect(verifyCredential(credential, { issuerAddress: issuer.address, officerAddress: officer.address })).toBe(true);
    for (const patch of [{ officerName: "Tampered" }, { roleTitle: "Tampered" }, { officerAddress: issuer.address }, { issuerAddress: officer.address }, { expiresAt: "2031-01-01T00:00:00.000Z" }, { version: 2 }, { signature: "0x00" }]) {
      expect(verifyCredential({ ...credential, ...patch })).toBe(false);
    }
    expect(verifyCredential({ ...credential, privateKey: "never allowed" })).toBe(false);
    expect(verifyCredential(credential, { issuerAddress: officer.address })).toBe(false);
  });
  it("rejects expired credentials at the exact boundary and refuses issuing in the past", async () => {
    const credential = await createCredential(issuer, fields);
    expect(verifyCredential(credential, { now: Date.parse(fields.expiresAt) - 1 })).toBe(true);
    expect(verifyCredential(credential, { now: Date.parse(fields.expiresAt) })).toBe(false);
    await expect(createCredential(issuer, { ...fields, expiresAt: "2000-01-01T00:00:00.000Z" })).rejects.toThrow("EXPIRED_CREDENTIAL");
  });
  it("binds wallet ownership proofs to application type, account and institution", async () => {
    const signature = await officer.signMessage(applicationMessage("officer", "synthetic-user", officer.address, "synthetic-institution"));
    expect(verifyApplication("officer", "synthetic-user", officer.address, signature, "synthetic-institution")).toBe(true);
    expect(verifyApplication("officer", "other-user", officer.address, signature, "synthetic-institution")).toBe(false);
    expect(verifyApplication("officer", "synthetic-user", officer.address, signature, "other-institution")).toBe(false);
    expect(verifyApplication("institution", "synthetic-user", officer.address, signature)).toBe(false);
  });
});
describe("browser key custody", () => {
  it("persists only ciphertext and restores the same key after export/import", async () => {
    const vault = createKeyVault("synthetic-account:issuer");
    const wallet = vault.generateKey();
    await vault.encryptAndStore("synthetic passphrase 123");
    const backup = vault.exportBackup();
    expect(backup).not.toContain(wallet.privateKey);
    expect(backup).not.toContain("synthetic passphrase");
    expect(Object.keys(JSON.parse(backup)).sort()).toEqual(["address", "ciphertext", "iv", "salt", "version"]);
    vault.lock();
    await expect(vault.unlock("incorrect passphrase 123")).rejects.toThrow("UNLOCK_FAILED");
    expect((await vault.unlock("synthetic passphrase 123")).address).toBe(wallet.address);
    const restored = createKeyVault("synthetic-account:officer");
    restored.importBackup(backup, wallet.address);
    expect((await restored.unlock("synthetic passphrase 123")).privateKey).toBe(wallet.privateKey);
    await expect(vault.encryptAndStore("synthetic passphrase 123")).rejects.toThrow("BACKUP_EXISTS");
    expect(() => restored.importBackup(backup, Wallet.createRandom().address)).toThrow("ADDRESS_MISMATCH");
  });
  it("detects encrypted backup tampering and rejects weak passwords or server use", async () => {
    const vault = createKeyVault("synthetic"); vault.generateKey();
    await expect(vault.encryptAndStore("short")).rejects.toThrow();
    await vault.encryptAndStore("synthetic passphrase 123");
    const backup = JSON.parse(vault.exportBackup());
    backup.ciphertext = (backup.ciphertext[0] === "0" ? "1" : "0") + backup.ciphertext.slice(1);
    vault.importBackup(JSON.stringify(backup));
    await expect(vault.unlock("synthetic passphrase 123")).rejects.toThrow("UNLOCK_FAILED");
    vi.stubGlobal("window", undefined);
    expect(() => vault.generateKey()).toThrow("BROWSER_CRYPTO_REQUIRED");
  });
});
