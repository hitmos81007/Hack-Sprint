"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { commonMessages, guardianMessages, assistMessages, vaultMessages, onboardingMessages, authMessages, languageNames, locales, messages } from "../../lib/i18n";
import { identitySchema, type Identity } from "../../lib/auth-policy";
import { createClient } from "../../lib/supabase/client";
import { useLanguage } from "./language";

export function Navbar() {
  const { locale, setLocale } = useLanguage();
  const t = authMessages[locale];
  const path = usePathname();
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const refreshIdentity = () => fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? identitySchema.safeParse(await response.json()) : null)
      .then((result) => { if (!controller.signal.aborted) setIdentity(result?.success ? result.data : null); })
      .catch(() => { if (!controller.signal.aborted) setIdentity(null); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    refreshIdentity();
    window.addEventListener("satyacall:identity-refresh", refreshIdentity);
    return () => { controller.abort(); window.removeEventListener("satyacall:identity-refresh", refreshIdentity); };
  }, [path]);
  async function logout() {
    try {
      const { error } = await createClient().auth.signOut();
      if (error) { setFailed(true); return; }
      setIdentity(null);
      router.replace("/");
      router.refresh();
    } catch { setFailed(true); }
  }
  return <header className="glass-nav sticky top-0 z-50 border-b border-slate-200 px-4 py-3 text-base sm:px-6">
    <nav aria-label={messages[locale].brand} className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-3">
      <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-teal-950"><span className="brand-dot" aria-hidden="true">✓</span>{messages[locale].brand}</Link>
      <div className="order-3 flex w-full items-center gap-4 overflow-x-auto pb-1 text-sm font-bold text-slate-700 sm:order-none sm:w-auto sm:flex-1 sm:pb-0">
        <Link className="whitespace-nowrap hover:text-teal-800" href="/">{t.home}</Link>
        <Link className="whitespace-nowrap hover:text-teal-800" href="/demo">{commonMessages[locale].demo}</Link>
        <Link className="whitespace-nowrap hover:text-teal-800" href="/analyze">{assistMessages[locale].analyze}</Link>
        <Link className="whitespace-nowrap hover:text-teal-800" href="/verify">{messages[locale].cards.verify.title}</Link>
        <details className="relative shrink-0"><summary className="cursor-pointer whitespace-nowrap rounded-lg px-2 py-1 hover:bg-teal-50">•••</summary><div className="absolute left-0 top-9 z-50 w-72 space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><Link className="block rounded-lg px-3 py-2 hover:bg-teal-50" href="/live-assist">{assistMessages[locale].live}</Link><Link className="block rounded-lg px-3 py-2 hover:bg-teal-50" href="/upi-guard">{assistMessages[locale].upi}</Link><Link className="block rounded-lg px-3 py-2 hover:bg-teal-50" href="/vault">{vaultMessages[locale].heading}</Link><Link className="block rounded-lg px-3 py-2 hover:bg-teal-50" href="/evidence/verify">{vaultMessages[locale].verify}</Link></div></details>
      </div>
      {identity && <Link href="/guardian">{guardianMessages[locale].title}</Link>}
      {identity && <Link href="/dashboard">{t.dashboard}</Link>}
      {identity && ["citizen", "issuer_admin"].includes(identity.role) && <Link href="/issuer">{onboardingMessages[locale].issuer}</Link>}
      {identity && ["citizen", "officer"].includes(identity.role) && <Link href="/officer">{onboardingMessages[locale].officer}</Link>}
      {identity?.role === "root_authority" && <Link href="/root">{onboardingMessages[locale].root}</Link>}
      <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 lg:inline" aria-live="polite">{loading ? t.loading : `${t.role}: ${t.roles[identity?.role ?? "anonymous"]}`}</span>
      {identity ? <button onClick={logout} className="min-h-10 font-bold text-teal-900 underline">{t.logout}</button> : <Link href="/login" className="rounded-xl bg-teal-800 px-4 py-2 font-extrabold text-white shadow-sm transition hover:bg-teal-900">{t.login}</Link>}
      <div className="flex gap-1" aria-label={messages[locale].language}>
        {locales.map((value) => <button key={value} lang={value} aria-pressed={locale === value} onClick={() => setLocale(value)}
          className={`min-h-10 rounded-lg border px-2 text-sm font-bold transition ${locale === value ? "border-teal-800 bg-teal-800 text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-teal-50"}`}>{languageNames[value]}</button>)}
      </div>
      {failed && <p role="alert">{t.error}</p>}
    </nav>
  </header>;
}
