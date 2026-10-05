"use client";
import {useEffect,useState} from "react";
import {challengeSchema,createVerificationToken,type Challenge} from "../../lib/verification-schema";
import {verifyCredential} from "../../lib/crypto";
import type {Officer} from "../../lib/onboarding-schema";
import {commonMessages,verificationMessages,onboardingMessages,intentMessages} from "../../lib/i18n";
import {useLanguage} from "./language";
import {buttonClass,fieldClass,type BrowserWallet} from "./key-panel";
import {QrCode} from "./qr";
export function OfficerSigning({wallet,officer}:{wallet:BrowserWallet|null;officer:Officer}){
 const {locale}=useLanguage();const t=verificationMessages[locale];const [challenge,setChallenge]=useState<Challenge|null>(null);const [token,setToken]=useState("");
 const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const [copied,setCopied]=useState(false);const [now,setNow]=useState(()=>Date.now());
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
 const a=intentMessages[locale];const [actionId,setActionId]=useState("");const [actions,setActions]=useState<import("../../lib/intent-schema").OfficialAction[]>([]);
 useEffect(()=>{async function load(){try{const r=await fetch("/api/actions");const d=await r.json();if(r.ok)setActions(d.actions);else setError("SERVICE_UNAVAILABLE");}catch{setError("SERVICE_UNAVAILABLE");}}void load();window.addEventListener("satyacall:actions-refresh",load);return()=>window.removeEventListener("satyacall:actions-refresh",load);},[]);
 const remaining=challenge?Math.max(0,Math.ceil((Date.parse(challenge.expiresAt)-now)/1000)):0;
 async function load(form:FormData){setBusy(true);setError(null);setChallenge(null);setToken("");try{
  const response=await fetch("/api/challenge/resolve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({challengeId:form.get("id"),code:form.get("code")})});
  const data=await response.json();if(!response.ok)throw new Error(data.error?.code);setChallenge(challengeSchema.parse(data.challenge));
 }catch(e){setError(e instanceof Error&&e.message?e.message:"SERVICE_UNAVAILABLE");}finally{setBusy(false);}}
 async function sign(){if(!challenge||!wallet)return;setBusy(true);setError(null);setToken("");setCopied(false);try{
  if(wallet.address.toLowerCase()!==officer.wallet_address.toLowerCase()||!verifyCredential(officer.credential,{officerAddress:wallet.address})||officer.status!=="active")throw new Error("CREDENTIAL_REVOKED_OR_EXPIRED");
  if(Date.parse(challenge.expiresAt)<=Date.now())throw new Error("CHALLENGE_EXPIRED");
  setToken(await createVerificationToken(wallet,challenge,actionId));
 }catch(e){setError(e instanceof Error&&e.message?e.message:"SERVICE_UNAVAILABLE");}finally{setBusy(false);}}
 return <section className="space-y-4 rounded-xl border-2 border-teal-900 p-5"><h2 className="text-3xl font-bold">{t.load}</h2><p>{t.warning}</p>
 {!wallet&&<p>{onboardingMessages[locale].locked}</p>}
 <form className="space-y-4" onChange={()=>{setChallenge(null);setToken("");}} onSubmit={e=>{e.preventDefault();void load(new FormData(e.currentTarget));}}>
 <label className="block">{t.challengeId}<input name="id" required disabled={busy} className={fieldClass}/></label>
 <label className="block">{t.code}<input name="code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} className={fieldClass}/></label>
 <button className={buttonClass} disabled={busy}>{t.load}</button></form>
 {error&&<p role="alert">{t.reasons[error]??t.error}</p>}{busy&&<p role="status">{t.pending}</p>}
 {challenge&&<div className="space-y-3"><h3 className="text-2xl font-bold">{t.review}</h3><p className="rounded-lg bg-amber-50 p-4 text-2xl font-bold">{challenge.claimedEntity}</p>
 <p>{a.purpose}: {a.purposes[challenge.purpose]} · {a.amount}: {challenge.amount} · {a.payee}: {challenge.payee||"—"}</p><label>{a.actions}<select className={fieldClass} value={actionId} onChange={e=>{setActionId(e.target.value);setToken("");}}><option value="">—</option>{actions.filter(x=>x.officer_id===officer.id&&x.status==="approved"&&Date.parse(x.valid_until)>now).map(x=><option key={x.id} value={x.id}>{a.purposes[x.purpose]} · {x.case_ref} · {x.amount_cap} · {x.payee||"—"}</option>)}</select></label><p>{t.category}: {onboardingMessages[locale].categories[challenge.claimedCategory]}</p><p>{t.expires}: {remaining} {commonMessages[locale].seconds}</p>
 <button className={buttonClass} disabled={busy||!wallet||!actionId||remaining===0} onClick={sign}>{t.sign}</button></div>}
 {token&&<div className="space-y-3"><label className="block">{t.token}<textarea readOnly value={token} rows={5} className={fieldClass}/></label>
 <button className={buttonClass} onClick={async()=>{try{await navigator.clipboard.writeText(token);setCopied(true);}catch{setError("SERVICE_UNAVAILABLE");}}}>{copied?t.copied:t.copy}</button><QrCode value={token}/></div>}
 </section>;
}

