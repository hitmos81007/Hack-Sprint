"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { Locale } from "../../lib/i18n";

const Language = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({ locale: "en", setLocale: () => {} });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  return <Language.Provider value={{ locale, setLocale }}>{children}</Language.Provider>;
}
export const useLanguage = () => useContext(Language);
