import type { Metadata } from "next";
import { messages } from "../lib/i18n";
import "./globals.css";
import { LanguageProvider } from "./components/language";
import { Navbar } from "./components/navbar";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: messages.en.brand,
  description: messages.en.subtitle,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className="antialiased"><LanguageProvider><div className="app-shell"><Navbar />{children}</div></LanguageProvider></body></html>;
}
