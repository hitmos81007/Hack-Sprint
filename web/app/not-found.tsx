"use client";
import Link from "next/link";import {recoveryMessages} from "../lib/i18n";import {useLanguage} from "./components/language";
export default function NotFound(){const{locale}=useLanguage();const t=recoveryMessages[locale];return <main className="mx-auto max-w-3xl space-y-6 px-5 py-10 text-xl"><h1 className="text-4xl font-bold">{t.notFound}</h1><Link href="/" className="underline">{t.back}</Link></main>;}
