"use client";

import Link from "next/link";
import { messages, modules, commonMessages, pressureMessages, type Module } from "../../lib/i18n";
import { useLanguage } from "./language";

export function Portal({ module }: { module?: Module }) {
  const { locale } = useLanguage();
  const t = messages[locale];

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 sm:px-10 sm:py-12">
      <section className="py-12 sm:py-16">
        <p className="mb-4 text-lg font-bold text-teal-800">{module ? t.comingSoon : t.eyebrow}</p>
        <h1 className="max-w-4xl text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl">{module ? t.cards[module].title : t.title}</h1>
        <p className="mt-6 max-w-3xl text-xl leading-relaxed text-slate-700">{module ? t.cards[module].description : t.subtitle}</p>
      {!module&&<Link href="/pressure" className="mt-7 inline-flex min-h-16 items-center rounded-xl bg-red-900 px-7 py-4 text-2xl font-extrabold text-white">{pressureMessages[locale].primary}</Link>}
      </section>
      {module ? (
        <Link href="/" className="inline-flex min-h-14 items-center rounded-xl bg-teal-900 px-6 text-xl font-bold text-white">{t.back}</Link>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {modules.map((item, index) => (
            <Link key={item} href={`/${item}`} className="group min-h-56 rounded-2xl border-2 border-slate-300 bg-white p-7 shadow-sm transition-colors hover:border-teal-800 hover:bg-teal-50">
              <span aria-hidden="true" className="mb-6 flex justify-between text-lg font-bold text-teal-800"><span>0{index + 1}</span><span>↗</span></span>
              <h2 className="text-2xl font-bold sm:text-3xl">{t.cards[item].title}</h2>
              <p className="mt-3 text-xl leading-relaxed text-slate-700">{t.cards[item].description}</p>
            </Link>
          ))}
        </div>
      )}
      <footer className="mt-10 border-t border-slate-300 pt-6 text-lg leading-relaxed text-slate-700">
        <p>{t.scaffold}</p><Link href="/demo" className="block py-4 font-bold underline">{commonMessages[locale].demo}</Link>
        <a href="/api/health" className="mt-4 inline-flex min-h-12 items-center font-bold text-teal-900 underline">{t.health}</a>
      </footer>
    </main>
  );
}

