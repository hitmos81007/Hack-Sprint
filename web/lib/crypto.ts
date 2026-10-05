import { Wallet, getAddress, isAddress, verifyMessage, type HDNodeWallet } from "ethers";
import { z } from "zod";

export const publicAddressSchema = z.string().refine(v => isAddress(v) && !/^0x0{40}$/i.test(v)).transform(getAddress);
const label = z.string().trim().min(1).max(200);
export const credentialSchema = z.object({
  version: z.literal(1), issuerAddress: publicAddressSchema,
  officerName: label, roleTitle: label, officerAddress: publicAddressSchema,
  expiresAt: z.iso.datetime(), signature: z.string().regex(/^0x[0-9a-fA-F]{130}$/),
}).strict();
export type Credential = z.infer<typeof credentialSchema>;
export const credentialFieldsSchema = credentialSchema.omit({ version: true, issuerAddress: true, signature: true });
function credentialMessage(c: Omit<Credential, "signature">) {
  return `SatyaCall|credential|v1|${JSON.stringify([c.issuerAddress, c.officerName, c.roleTitle, c.officerAddress, c.expiresAt])}`;
}
export async function createCredential(issuerWallet: { getAddress(): Promise<string>; signMessage(message: string): Promise<string> }, fields: z.infer<typeof credentialFieldsSchema>): Promise<Credential> {
  const parsed = credentialFieldsSchema.parse(fields);
  if (Date.parse(parsed.expiresAt) <= Date.now()) throw new Error("EXPIRED_CREDENTIAL");
  const payload = { version: 1 as const, issuerAddress: publicAddressSchema.parse(await issuerWallet.getAddress()), ...parsed };
  return credentialSchema.parse({ ...payload, signature: await issuerWallet.signMessage(credentialMessage(payload)) });
}
// Signature/expiry only. Trust also requires on-chain issuer status and DB revocation checks.
export function verifyCredential(value: unknown, options: { issuerAddress?: string; officerAddress?: string; now?: number } = {}): boolean {
  try {
    const c = credentialSchema.parse(value);
    if (Date.parse(c.expiresAt) <= (options.now ?? Date.now())) return false;
    if (options.issuerAddress && c.issuerAddress !== getAddress(options.issuerAddress)) return false;
    if (options.officerAddress && c.officerAddress !== getAddress(options.officerAddress)) return false;
    return getAddress(verifyMessage(credentialMessage(c), c.signature)) === c.issuerAddress;
  } catch { return false; }
}
export function applicationMessage(kind: "institution" | "officer", userId: string, address: string, institutionId = "") {
  return `SatyaCall|${kind}-application|v1|${JSON.stringify([userId, getAddress(address), institutionId])}`;
}
export function verifyApplication(kind: "institution" | "officer", userId: string, address: string, signature: string, institutionId = "") {
  try { return getAddress(verifyMessage(applicationMessage(kind, userId, address, institutionId), signature)) === getAddress(address); }
  catch { return false; }
}

const ITERATIONS = 310000;
const backupSchema = z.object({ version: z.literal(1), address: publicAddressSchema,
  salt: z.string().regex(/^[0-9a-f]{32}$/), iv: z.string().regex(/^[0-9a-f]{24}$/),
  ciphertext: z.string().regex(/^[0-9a-f]{96}$/),
}).strict();
function hex(bytes: Uint8Array) { return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join(""); }
function bytes(value: string) { return Uint8Array.from(value.match(/../g)!, b => parseInt(b, 16)); }
function browser() {
  if (typeof window === "undefined" || !window.crypto?.subtle) throw new Error("BROWSER_CRYPTO_REQUIRED");
  return window;
}
async function encryptionKey(passphrase: string, salt: Uint8Array<ArrayBuffer>) {
  z.string().min(12).max(256).parse(passphrase);
  const crypto = browser().crypto;
  const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, material,
    { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}
// Each account/purpose gets an isolated vault. Unlocked keys exist only in browser memory.
export function createKeyVault(scope: string) {
  const storageKey = `satyacall:key:v1:${scope}`;
  let wallet: Wallet | HDNodeWallet | null = null;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach(listener => listener());
  return {
    generateKey() { browser(); wallet = Wallet.createRandom(); return wallet; },
    async encryptAndStore(passphrase: string) {
      const win = browser();
      if (!wallet) throw new Error("KEY_LOCKED");
      if (win.localStorage.getItem(storageKey)) throw new Error("BACKUP_EXISTS");
      const salt = win.crypto.getRandomValues(new Uint8Array(16));
      const iv = win.crypto.getRandomValues(new Uint8Array(12));
      const key = await encryptionKey(passphrase, salt);
      const ciphertext = await win.crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(wallet.address) }, key, bytes(wallet.privateKey.slice(2)));
      const backup = { version: 1, address: wallet.address, salt: hex(salt), iv: hex(iv), ciphertext: hex(new Uint8Array(ciphertext)) };
      win.localStorage.setItem(storageKey, JSON.stringify(backup));
      emit();
      return wallet.address;
    },
    async unlock(passphrase: string) {
      wallet = null;
      try {
        const backup = backupSchema.parse(JSON.parse(browser().localStorage.getItem(storageKey) ?? "null"));
        const key = await encryptionKey(passphrase, bytes(backup.salt));
        const plaintext = await browser().crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes(backup.iv), additionalData: new TextEncoder().encode(backup.address) }, key, bytes(backup.ciphertext));
        const restored = new Wallet(`0x${hex(new Uint8Array(plaintext))}`);
        new Uint8Array(plaintext).fill(0);
        if (restored.address !== backup.address) throw new Error("ADDRESS_MISMATCH");
        wallet = restored;
        return restored;
      } catch { throw new Error("UNLOCK_FAILED"); }
    },
    exportBackup() {
      const backup = backupSchema.parse(JSON.parse(browser().localStorage.getItem(storageKey) ?? "null"));
      return JSON.stringify(backup, null, 2);
    },
    importBackup(raw: string, expectedAddress?: string) {
      if (raw.length > 4096) throw new Error("INVALID_BACKUP");
      const backup = backupSchema.parse(JSON.parse(raw));
      if (expectedAddress && backup.address !== getAddress(expectedAddress)) throw new Error("ADDRESS_MISMATCH");
      const existing = browser().localStorage.getItem(storageKey);
      if (existing && backupSchema.parse(JSON.parse(existing)).address !== backup.address) throw new Error("BACKUP_EXISTS");
      browser().localStorage.setItem(storageKey, JSON.stringify(backup));
      wallet = null;
      emit();
      return backup.address;
    },
    address() {
      const raw = browser().localStorage.getItem(storageKey);
      try { return raw ? backupSchema.parse(JSON.parse(raw)).address : null; } catch { return null; }
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      const changed = (event: StorageEvent) => { if (event.key === storageKey) { wallet = null; listener(); } };
      browser().addEventListener("storage", changed);
      return () => { listeners.delete(listener); browser().removeEventListener("storage", changed); };
    },
    lock() { wallet = null; },
  };
}
const defaultVault = createKeyVault("default");
export const generateKey = defaultVault.generateKey;
export const encryptAndStore = defaultVault.encryptAndStore;
export const unlock = defaultVault.unlock;
export const exportBackup = defaultVault.exportBackup;
