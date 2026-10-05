"use client";

import Link from "next/link";
import { messages, modules, commonMessages, pressureMessages, type Module } from "../../lib/i18n";
import { useLanguage } from "./language";

export function Portal({ module }: { module?: Module }) {
  const { locale } = useLanguage();
  const t = messages[locale];

  return (
    <main className="page-shell mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-teal-100 bg-white px-6 py-11 shadow-[0_24px_55px_rgba(20,70,94,0.10)] sm:px-12 sm:py-15">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-teal-100/80 blur-2xl" aria-hidden="true" />
        <div className="relative max-w-4xl">
          <p className="safety-pill mb-5 inline-flex rounded-full px-4 py-2 text-sm font-extrabold tracking-wide uppercase">{module ? t.comingSoon : t.eyebrow}</p>
          <h1 className="max-w-4xl text-4xl leading-[1.08] font-extrabold tracking-tight text-slate-950 sm:text-6xl">{module ? t.cards[module].title : t.title}</h1>
          <p className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-700 sm:text-2xl">{module ? t.cards[module].description : t.subtitle}</p>
          {!module&&<div className="mt-8 flex flex-wrap gap-4"><Link href="/pressure" className="inline-flex min-h-15 items-center rounded-xl bg-red-800 px-6 py-3 text-xl font-extrabold text-white shadow-[0_8px_20px_rgba(153,27,27,.22)] transition hover:-translate-y-0.5 hover:bg-red-900">{pressureMessages[locale].primary}</Link><Link href="/verify" className="inline-flex min-h-15 items-center rounded-xl border border-teal-200 bg-teal-50 px-6 py-3 text-xl font-extrabold text-teal-950 transition hover:bg-teal-100">{t.cards.verify.title}</Link></div>}
        </div>
      </section>
      {module ? (
        <Link href="/" className="mt-7 inline-flex min-h-14 items-center rounded-xl bg-teal-800 px-6 text-xl font-bold text-white shadow-sm transition hover:bg-teal-900">{t.back}</Link>
      ) : (
        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {modules.map((item, index) => (
            <Link key={item} href={`/${item}`} className="portal-card group min-h-56 rounded-2xl bg-white p-7 transition duration-200 hover:border-teal-500 hover:bg-teal-50/60">
              <span aria-hidden="true" className="mb-6 flex items-center justify-between text-lg font-extrabold text-teal-800"><span className="rounded-lg bg-teal-100 px-3 py-1">0{index + 1}</span><span className="text-2xl transition group-hover:translate-x-1">↗</span></span>
              <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">{t.cards[item].title}</h2>
              <p className="mt-3 text-xl leading-relaxed text-slate-700">{t.cards[item].description}</p>
            </Link>
          ))}
        </div>
      )}
      <footer className="mt-8 rounded-2xl border border-slate-200 bg-white/75 p-6 text-lg leading-relaxed text-slate-700 shadow-sm">
        <p>{t.scaffold}</p><Link href="/demo" className="mt-3 inline-flex font-extrabold text-teal-900 underline">{commonMessages[locale].demo} <span aria-hidden="true">&nbsp;→</span></Link>
        <a href="/api/health" className="mt-4 inline-flex min-h-12 items-center font-bold text-teal-900 underline">{t.health}</a>
      </footer>
    </main>
  );
}
