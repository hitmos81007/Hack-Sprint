"use client";
import { authMessages } from "../../lib/i18n";
import type { Role } from "../../lib/auth-policy";
import { useLanguage } from "./language";
export function Account({ role }: { role: Role }) {
  const { locale } = useLanguage();
  const t = authMessages[locale];
  return <main className="mx-auto max-w-4xl px-6 py-12"><h1 className="text-4xl font-bold">{t.welcome}</h1><p className="mt-6 text-2xl">{t.role}: {t.roles[role]}</p></main>;
}
