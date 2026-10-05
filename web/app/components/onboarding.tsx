"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { applicationMessage, createCredential, credentialSchema, verifyCredential, type Credential } from "../../lib/crypto";
import { categories, type Institution, type Officer } from "../../lib/onboarding-schema";
import { onboardingMessages } from "../../lib/i18n";
import { useLanguage } from "./language";
import { KeyPanel, buttonClass, fieldClass, downloadJson, type BrowserWallet } from "./key-panel";

import { IntentPanel } from "./intent-panel";
import { intentMessages } from "../../lib/i18n";
import { OfficerSigning } from "./officer-signing";
type Mode = "issuer" | "root" | "officer";
async function api(path: string, method = "GET", payload?: unknown) {
  const response = await fetch(path, { method, cache: "no-store", ...(payload ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.code ?? "SERVICE_UNAVAILABLE");
  return data;
}
export function Onboarding({ mode, userId }: { mode: Mode; userId: string }) {
  const { locale } = useLanguage(); const t = onboardingMessages[locale]; const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [active, setActive] = useState<Institution[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<"success" | "error" | "reconcile" | "locked" | null>(null);
  const [imported, setImported] = useState<Credential | null>(null);
  const load = useCallback(async () => {
    const [inst, officer] = await Promise.all([api("/api/institutions"), api("/api/officers")]);
    return { institutions: inst.institutions as Institution[], active: inst.active as Institution[], officers: officer.officers as Officer[] };
  }, []);
  useEffect(() => {
    let mounted = true;
    load().then(data => { if (mounted) { setInstitutions(data.institutions); setActive(data.active); setOfficers(data.officers); } }).catch(() => { if (mounted) setNotice("error"); });
    return () => { mounted = false; };
  }, [load]);
  async function refresh() {
    const data = await load();
    setInstitutions(data.institutions); setActive(data.active); setOfficers(data.officers);
  }
  async function run(action: () => Promise<unknown>) {
    setBusy(true); setNotice(null);
    try { await action(); await refresh(); setNotice("success"); window.dispatchEvent(new Event("satyacall:identity-refresh")); router.refresh(); }
    catch (error) {
      const code = error instanceof Error ? error.message : "";
      setNotice(["OPERATION_PENDING", "CHAIN_DB_SYNC_REQUIRED", "TRANSACTION_PENDING"].includes(code) ? "reconcile" : code === "KEY_LOCKED" ? "locked" : "error");
      await refresh().catch(() => {});
    } finally { setBusy(false); }
  }
  function key(expected?: string) {
    if (!wallet || (expected && wallet.address.toLowerCase() !== expected.toLowerCase())) throw new Error("KEY_LOCKED");
    return wallet;
  }
  const ownOfficer = officers.find(o => o.user_id === userId);
  const expected = mode === "issuer" ? institutions[0]?.wallet_address : ownOfficer?.wallet_address;
  const credential = imported ?? ownOfficer?.credential;
  const validCredential = credential && ownOfficer?.credential && verifyCredential(credential, {
    officerAddress: ownOfficer.wallet_address, issuerAddress: ownOfficer.credential.issuerAddress,
  });
  return <main className="mx-auto max-w-4xl space-y-8 px-5 py-10 text-lg">
    <h1 className="text-4xl font-bold">{t[mode]}</h1>
    {mode !== "root" && <div className="flex flex-wrap gap-4"><Link className="underline" href="/issuer">{t.issuer}</Link><Link className="underline" href="/officer">{t.officer}</Link></div>}
    <p className="break-all">{t.account}: {userId}</p>
    <button className={buttonClass} disabled={busy} onClick={() => run(async () => {})}>{busy ? t.working : t.refresh}</button>
    {notice && <p role={notice === "success" ? "status" : "alert"} className="rounded-lg border border-slate-500 p-4">{t[notice]}</p>}
    {mode !== "root" && <KeyPanel scope={`${mode}:${userId}`} expectedAddress={expected} onWallet={setWallet} />}
    {mode === "issuer" && institutions.length === 0 && <form className="space-y-4" onSubmit={e => {
      e.preventDefault(); const form = new FormData(e.currentTarget);
      run(async () => {
        const signer = key();
        await api("/api/institutions", "POST", { name: form.get("name"), category: form.get("category"), walletAddress: signer.address,
          signature: await signer.signMessage(applicationMessage("institution", userId, signer.address)) });
      });
    }}>
      <label className="block">{t.name}<input name="name" required maxLength={200} className={fieldClass} /></label>
      <label className="block">{t.category}<select name="category" className={fieldClass}>{categories.map(c => <option key={c} value={c}>{t.categories[c]}</option>)}</select></label>
      <button className={buttonClass} disabled={busy || !wallet}>{t.apply}</button>
    </form>}
    {mode !== "officer" && <section className="space-y-5">
      {!institutions.length && <p>{t.empty}</p>}
      {institutions.map(inst => <article key={inst.id} className="space-y-3 rounded-xl border border-slate-400 p-5">
        <h2 className="text-2xl font-bold">{inst.name}</h2><p>{t[inst.status]}</p><p>{t.categories[inst.category as typeof categories[number]] ?? inst.category}</p>
        <p className="break-all">{t.address}: {inst.wallet_address}</p>
        {inst.onchain_tx && <p className="break-all">{t.transaction}: {inst.onchain_tx}</p>}
        {inst.chain_operation && <><p>{t.reconcile}</p>{inst.operation_tx && <p className="break-all">{t.transaction}: {inst.operation_tx}</p>}</>}
        {mode === "root" && inst.status !== "revoked" && <button disabled={busy} className={buttonClass} onClick={() => run(() => api(`/api/institutions/${inst.id}`, "PATCH", { action: inst.status === "pending" ? "approve" : "revoke" }))}>{inst.status === "pending" ? t.approve : t.revoke}</button>}
      </article>)}
    </section>}
    {mode === "officer" && !ownOfficer && <form className="space-y-4" onSubmit={e => {
      e.preventDefault(); const form = new FormData(e.currentTarget);
      run(async () => {
        const signer = key(); const institutionId = String(form.get("institutionId"));
        await api("/api/officers", "POST", { institutionId, name: form.get("name"), roleTitle: form.get("roleTitle"), walletAddress: signer.address,
          signature: await signer.signMessage(applicationMessage("officer", userId, signer.address, institutionId)) });
      });
    }}>
      <p>{t.publicOnly}</p>
      <label className="block">{t.institution}<select name="institutionId" required className={fieldClass}><option value="">{t.institution}</option>{active.map(inst => <option key={inst.id} value={inst.id}>{inst.name}</option>)}</select></label>
      <label className="block">{t.name}<input name="name" required maxLength={200} className={fieldClass} /></label>
      <label className="block">{t.title}<input name="roleTitle" required maxLength={200} className={fieldClass} /></label>
      <button className={buttonClass} disabled={busy || !wallet || !active.length}>{t.apply}</button>
    </form>}
    {mode === "issuer" && officers.map(officer => {
      const inst = institutions.find(i => i.id === officer.institution_id && i.status === "active" && !i.chain_operation);
      if (!inst) return null;
      return <article key={officer.id} className="space-y-3 rounded-xl border border-slate-400 p-5">
        <h2 className="text-2xl font-bold">{officer.name}</h2><p>{t[officer.status]}</p>{officer.flagged_at && <p role="alert">{intentMessages[locale].flagged}</p>}{officer.suspended_at && <p role="alert">{intentMessages[locale].suspended}</p>}<p className="break-all">{t.address}: {officer.wallet_address}</p>
        <form className="space-y-3" onSubmit={e => {
          e.preventDefault(); const form = new FormData(e.currentTarget);
          run(async () => {
            const credential = await createCredential(key(inst.wallet_address), { officerName: String(form.get("name")), roleTitle: String(form.get("roleTitle")), officerAddress: officer.wallet_address, expiresAt: new Date(String(form.get("expiresAt"))).toISOString() });
            await api(`/api/officers/${officer.id}`, "PATCH", { action: "issue", credential });
          });
        }}>
          <label className="block">{t.name}<input name="name" required maxLength={200} defaultValue={officer.name} className={fieldClass} /></label>
          <label className="block">{t.title}<input name="roleTitle" required maxLength={200} defaultValue={officer.role_title} className={fieldClass} /></label>
          <label className="block">{t.expires}<input type="datetime-local" name="expiresAt" required className={fieldClass} /></label>
          <button className={buttonClass} disabled={busy || !wallet || wallet.address.toLowerCase() !== inst.wallet_address.toLowerCase()}>{t.issue}</button>
        </form>
        {officer.status !== "revoked" && <button className={buttonClass} disabled={busy} onClick={() => run(() => api(`/api/officers/${officer.id}`, "PATCH", { action: "revoke" }))}>{t.revoke}</button>}
      </article>;
    })}
    {mode === "officer" && ownOfficer && <section className="space-y-4 rounded-xl border border-slate-400 p-5">
      <h2 className="text-2xl font-bold">{ownOfficer.name}</h2><p>{t[ownOfficer.status]}</p><p>{ownOfficer.role_title}</p>
      <p className="break-all">{t.address}: {ownOfficer.wallet_address}</p>
      {ownOfficer.credential && <>
        <p>{t.expires}: {ownOfficer.credential.expiresAt}</p>
        <button className={buttonClass} onClick={() => downloadJson("satyacall-credential.json", JSON.stringify(ownOfficer.credential, null, 2))}>{t.downloadCredential}</button>
        <label className="block">{t.importCredential}<input type="file" accept="application/json,.json" className={fieldClass} onChange={async e => {
          const file = e.target.files?.[0]; e.target.value = ""; if (!file) return;
          setImported(null); setNotice(null);
          try {
            if (file.size > 8192) throw new Error("INVALID_CREDENTIAL");
            const c = credentialSchema.parse(JSON.parse(await file.text()));
            if (!verifyCredential(c, { officerAddress: ownOfficer.wallet_address, issuerAddress: ownOfficer.credential!.issuerAddress }) || c.signature !== ownOfficer.credential!.signature) throw new Error("INVALID_CREDENTIAL");
            setImported(c);
          } catch { setNotice("error"); }
        }} /></label>
        {validCredential && <p role="status">{t.credentialValid}</p>}<p>{t.credentialHint}</p>
      </>}
    </section>}
    {mode === "issuer" && institutions.filter(i=>i.status==="active"&&!i.chain_operation).map(i=><IntentPanel key={i.id} mode="issuer" institutionId={i.id}/>)}
    {mode === "officer" && ownOfficer?.suspended_at && <p role="alert">{intentMessages[locale].suspended}</p>}
    {mode === "officer" && ownOfficer?.status === "active" && !ownOfficer.suspended_at && <IntentPanel mode="officer" institutionId={ownOfficer.institution_id}/>}
    {mode === "officer" && ownOfficer?.status === "active" && !ownOfficer.suspended_at && <OfficerSigning wallet={wallet} officer={ownOfficer} />}
  </main>;
}
