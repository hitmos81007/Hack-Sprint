"use client";
import Link from "next/link";import {recoveryMessages} from "../lib/i18n";import {useLanguage} from "./components/language";
export default function PageError({reset}:{error:Error&{digest?:string};reset:()=>void}){const{locale}=useLanguage();const t=recoveryMessages[locale];return <main className="mx-auto max-w-3xl space-y-6 px-5 py-10 text-xl"><h1 className="text-3xl font-bold">{t.error}</h1><button className="min-h-12 rounded bg-teal-900 px-5 py-3 font-bold text-white" onClick={reset}>{t.retry}</button><Link href="/" className="block underline">{t.back}</Link></main>;}
