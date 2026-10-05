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
  return <header className="border-b border-slate-300 bg-white px-6 py-5 text-lg">
    <nav aria-label={messages[locale].brand} className="mx-auto flex max-w-6xl flex-wrap items-center gap-5">
      <Link href="/" className="text-2xl font-extrabold text-teal-900">{messages[locale].brand}</Link>
      <Link href="/">{t.home}</Link>
      <Link href="/demo">{commonMessages[locale].demo}</Link><Link href="/analyze">{assistMessages[locale].analyze}</Link><Link href="/live-assist">{assistMessages[locale].live}</Link><Link href="/upi-guard">{assistMessages[locale].upi}</Link>
      <Link href="/vault">{vaultMessages[locale].heading}</Link><Link href="/evidence/verify">{vaultMessages[locale].verify}</Link>
      {identity && <Link href="/guardian">{guardianMessages[locale].title}</Link>}
      {identity && <Link href="/dashboard">{t.dashboard}</Link>}
      {identity && ["citizen", "issuer_admin"].includes(identity.role) && <Link href="/issuer">{onboardingMessages[locale].issuer}</Link>}
      {identity && ["citizen", "officer"].includes(identity.role) && <Link href="/officer">{onboardingMessages[locale].officer}</Link>}
      {identity?.role === "root_authority" && <Link href="/root">{onboardingMessages[locale].root}</Link>}
      <span className="font-bold" aria-live="polite">{loading ? t.loading : `${t.role}: ${t.roles[identity?.role ?? "anonymous"]}`}</span>
      {identity ? <button onClick={logout} className="min-h-12 underline">{t.logout}</button> : <Link href="/login" className="underline">{t.login}</Link>}
      <div className="flex flex-wrap gap-2" aria-label={messages[locale].language}>
        {locales.map((value) => <button key={value} lang={value} aria-pressed={locale === value} onClick={() => setLocale(value)}
          className={`min-h-12 rounded-lg border px-3 ${locale === value ? "bg-teal-900 text-white" : "bg-white text-slate-900"}`}>{languageNames[value]}</button>)}
      </div>
      {failed && <p role="alert">{t.error}</p>}
    </nav>
  </header>;
}

