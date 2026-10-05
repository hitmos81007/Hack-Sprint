"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authMessages } from "../../lib/i18n";
import { emailSchema, loginSchema, signupSchema } from "../../lib/auth-policy";
import { createClient } from "../../lib/supabase/client";
import { publicSupabaseConfig } from "../../lib/supabase/config";
import { useLanguage } from "../components/language";

export function LoginForm({ error }: { error?: string }) {
  const { locale } = useLanguage();
  const router = useRouter();
  const t = authMessages[locale];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<"sent" | "error" | "invalid" | null>(null);
  const configured = Boolean(publicSupabaseConfig());
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const mode = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") ?? "password";
    const input = { email: form.get("email"), password: form.get("password") };
    const schema = mode === "magic" ? emailSchema : mode === "signup" ? signupSchema : loginSchema;
    const parsed = schema.safeParse(input);
    if (!parsed.success) { setMessage("invalid"); return; }
    setBusy(true); setMessage(null);
    try {
      const client = createClient();
      const redirect = `${window.location.origin}/auth/callback`;
      if (mode === "magic") {
        const { error } = await client.auth.signInWithOtp({ email: parsed.data.email, options: { emailRedirectTo: redirect } });
        setMessage(error ? "error" : "sent");
      } else {
        const credentials = { email: parsed.data.email, password: String(input.password) };
        const result = mode === "signup"
          ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: redirect } })
          : await client.auth.signInWithPassword(credentials);
        if (result.error) setMessage("error");
        else if (result.data.session) { router.replace("/dashboard"); router.refresh(); }
        else setMessage("sent");
      }
    } catch { setMessage("error"); }
    finally { setBusy(false); }
  }
  const reason = error === "forbidden" ? t.forbidden : error === "unavailable" ? t.unavailable : error ? t.callback : null;
  return <main className="mx-auto max-w-xl px-6 py-12 text-xl">
    <h1 className="mb-8 text-4xl font-bold">{t.login}</h1>
    {!configured && <p role="status" className="mb-6">{t.unavailable}</p>}
    {reason && <p role="alert" className="mb-6">{reason}</p>}
    <form onSubmit={submit} className="grid gap-5">
      <label className="grid gap-2">{t.email}<input name="email" type="email" required autoComplete="email" maxLength={254} className="min-h-14 rounded-lg border border-slate-500 bg-white p-3" /></label>
      <label className="grid gap-2">{t.password}<input name="password" type="password" autoComplete="current-password" maxLength={128} className="min-h-14 rounded-lg border border-slate-500 bg-white p-3" /></label>
      <fieldset disabled={busy || !configured} className="grid gap-3 disabled:opacity-60">
        <button type="submit" value="password" className="min-h-14 rounded-lg bg-teal-900 p-3 font-bold text-white">{busy ? t.pending : t.login}</button>
        <button type="submit" value="signup" className="min-h-14 rounded-lg border-2 border-teal-900 p-3 font-bold">{t.signup}</button>
        <button type="submit" value="magic" className="min-h-14 rounded-lg border-2 border-teal-900 p-3 font-bold">{t.magic}</button>
      </fieldset>
      {message && <p role={message === "sent" ? "status" : "alert"}>{t[message]}</p>}
    </form>
  </main>;
}
