"use client";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { Wallet, HDNodeWallet } from "ethers";
import { createKeyVault } from "../../lib/crypto";
import { onboardingMessages } from "../../lib/i18n";
import { useLanguage } from "./language";
export type BrowserWallet = Wallet | HDNodeWallet;
export function downloadJson(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const fieldClass = "min-h-12 w-full rounded-lg border border-slate-500 bg-white p-3 text-lg";
export const buttonClass = "min-h-12 rounded-lg bg-teal-900 px-5 py-3 text-lg font-bold text-white disabled:opacity-50";
export function KeyPanel({ scope, expectedAddress, onWallet }: { scope: string; expectedAddress?: string; onWallet: (wallet: BrowserWallet | null) => void }) {
  const { locale } = useLanguage(); const t = onboardingMessages[locale];
  const vault = useMemo(() => createKeyVault(scope), [scope]);
  const address = useSyncExternalStore(vault.subscribe, vault.address, () => null);
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState(false);
  useEffect(() => () => vault.lock(), [vault]);
  async function operate(generate: boolean) {
    setBusy(true); setError(false); onWallet(null);
    try {
      if (generate) { vault.generateKey(); await vault.encryptAndStore(passphrase); }
      const wallet = await vault.unlock(passphrase);
      if (expectedAddress && wallet.address.toLowerCase() !== expectedAddress.toLowerCase()) throw new Error("ADDRESS_MISMATCH");
      onWallet(wallet);
    } catch { vault.lock(); setError(true); }
    finally { setPassphrase(""); setBusy(false); }
  }
  return <section className="space-y-4 rounded-xl border border-slate-400 bg-slate-50 p-5">
    <h2 className="text-2xl font-bold">{t.key}</h2><p>{t.keyHint}</p><p>{t.backupHint}</p>
    {address && <p className="break-all"><strong>{t.address}: </strong>{address}</p>}
    <label className="block">{t.passphrase}<input type="password" autoComplete="off" minLength={12} maxLength={256} value={passphrase} onChange={e => setPassphrase(e.target.value)} className={fieldClass} /></label>
    <div className="flex flex-wrap gap-3">
      {!address && !expectedAddress && <button type="button" disabled={busy || passphrase.length < 12} onClick={() => operate(true)} className={buttonClass}>{t.generate}</button>}
      {address && <button type="button" disabled={busy || passphrase.length < 12} onClick={() => operate(false)} className={buttonClass}>{t.unlock}</button>}
      <button type="button" className={buttonClass} disabled={busy} onClick={() => { vault.lock(); onWallet(null); setPassphrase(""); }}>{t.lock}</button>
      {address && <button type="button" className={buttonClass} disabled={busy} onClick={() => { try { downloadJson("satyacall-encrypted-key.json", vault.exportBackup()); } catch { setError(true); } }}>{t.backup}</button>}
    </div>
    <label className="block">{t.importBackup}<input type="file" accept="application/json,.json" disabled={busy} className={fieldClass} onChange={async e => {
      const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
      setBusy(true); onWallet(null); setError(false);
      try { if (file.size > 4096) throw new Error("INVALID_BACKUP"); vault.importBackup(await file.text(), expectedAddress); }
      catch { setError(true); } finally { setBusy(false); }
    }} /></label>
    {busy && <p role="status">{t.working}</p>}{error && <p role="alert">{t.error}</p>}
  </section>;
}
