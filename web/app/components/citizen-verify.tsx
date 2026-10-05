"use client";
import {useEffect,useState} from "react";
import {challengeSchema,verdictSchema,type Challenge,type Verdict} from "../../lib/verification-schema";
import {categories} from "../../lib/onboarding-schema";
import {onboardingMessages,commonMessages,verificationMessages,intentMessages} from "../../lib/i18n";
import {useLanguage} from "./language";
import {buttonClass,fieldClass} from "./key-panel";
import {QrScanner} from "./qr";
export function CitizenVerify({embedded=false,defaultPayee="",onChallenge,onVerdict,onReset}:{embedded?:boolean;defaultPayee?:string;onChallenge?:(challenge:Challenge)=>void;onVerdict?:(verdict:Verdict)=>void;onReset?:()=>void}={}){
 const Container=embedded?"div":"main";const Heading=embedded?"h3":"h1";
 const {locale}=useLanguage();const t=verificationMessages[locale];const [challenge,setChallenge]=useState<Challenge|null>(null);const [token,setToken]=useState("");
 const [verdict,setVerdict]=useState<Verdict|null>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState<string|null>(null);const [now,setNow]=useState(()=>Date.now());const [copied,setCopied]=useState(false);
 useEffect(()=>{const interval=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(interval);},[]);
 const a=intentMessages[locale];const [reported,setReported]=useState(false);
 const remaining=challenge?Math.max(0,Math.ceil((Date.parse(challenge.expiresAt)-now)/1000)):0;
 async function create(form:FormData){onReset?.();setBusy(true);setError(null);try{
  const response=await fetch("/api/challenge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({claimedEntity:form.get("entity"),claimedCategory:form.get("category"),purpose:form.get("purpose"),amount:form.get("amount"),payee:form.get("payee")})});
  const data=await response.json();if(!response.ok)throw new Error(data.error?.code);
  const created=challengeSchema.parse(data.challenge);setChallenge(created);onChallenge?.(created);setToken("");setVerdict(null);setCopied(false);setReported(false);
 }catch(e){setError(e instanceof Error&&e.message?e.message:"SERVICE_UNAVAILABLE");}finally{setBusy(false);}}
 async function verify(){if(!challenge)return;setBusy(true);setError(null);setVerdict(null);try{
  const response=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({challengeId:challenge.id,token:token.trim()})});const data=await response.json();
  const parsed=verdictSchema.safeParse(data);if(parsed.success){setVerdict(parsed.data);onVerdict?.(parsed.data);}else throw new Error(data.error?.code);
 }catch(e){setError(e instanceof Error&&e.message?e.message:"SERVICE_UNAVAILABLE");}finally{setBusy(false);}}
 return <Container className={`mx-auto max-w-3xl space-y-7 text-xl ${embedded?"":"page-shell px-5 py-10"}`}><header className={embedded?"":"rounded-[1.75rem] border border-teal-100 bg-white p-7 shadow-[0_18px_42px_rgba(26,64,83,.10)]"}><Heading className="text-4xl font-extrabold tracking-tight text-slate-950">{t.heading}</Heading>{!embedded&&<p className="mt-3 text-slate-700">{t.warning}</p>}</header>
 <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 font-bold text-amber-950">{t.warning}</p>
 <form className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={e=>{e.preventDefault();void create(new FormData(e.currentTarget));}}>
 <label className="block">{t.entity}<input name="entity" maxLength={200} required className={fieldClass}/></label>
 <label className="block">{t.category}<select name="category" className={fieldClass}>{categories.map(c=><option key={c} value={c}>{onboardingMessages[locale].categories[c]}</option>)}</select></label>
 <label className="block">{a.purpose}<select name="purpose" className={fieldClass}>{Object.entries(a.purposes).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><label className="block">{a.amount}<input name="amount" defaultValue="0.00" inputMode="decimal" required className={fieldClass}/></label><label className="block">{a.payee}<input name="payee" defaultValue={defaultPayee} maxLength={140} className={fieldClass}/></label><p>{a.payeeHint}</p><button className={buttonClass} disabled={busy}>{t.create}</button></form>
 {error&&<p className="rounded-xl bg-red-50 p-4 text-red-900" role="alert">{t.reasons[error]??t.error}</p>}{busy&&<p className="rounded-xl bg-slate-100 p-4 font-bold" role="status">{t.pending}</p>}
 {challenge&&<section className="space-y-4 rounded-2xl border-2 border-teal-700 bg-teal-50 p-6 shadow-sm"><h2 className="text-2xl font-extrabold text-teal-950">{t.code}</h2>
 <p className="rounded-xl bg-white py-4 text-center font-mono text-5xl font-extrabold tracking-wider text-teal-950 shadow-sm sm:text-6xl">{challenge.code}</p><p className="break-all text-base text-slate-700">{t.challengeId}: <code>{challenge.id}</code></p>
 <button className={buttonClass} onClick={async()=>{try{await navigator.clipboard.writeText(`${challenge.id}\n${challenge.code}`);setCopied(true);}catch{setError("SERVICE_UNAVAILABLE");}}}>{copied?t.copied:t.copy}</button>
 <p role="timer">{remaining>0?`${t.expires}: ${remaining} ${commonMessages[locale].seconds}`:t.expired}</p>
 <label className="block">{t.token}<textarea value={token} onChange={e=>setToken(e.target.value)} maxLength={4096} rows={5} className={fieldClass}/></label>
 <QrScanner onScan={setToken}/><button className={buttonClass} disabled={busy||!token.trim()||remaining===0} onClick={verify}>{t.check}</button></section>}
 {!embedded&&verdict&&<section role="status" className={`space-y-4 rounded-2xl border-4 p-7 shadow-[0_18px_42px_rgba(26,64,83,.12)] ${verdict.result==="VERIFIED_AUTHORIZED"?"border-teal-700 bg-teal-50":verdict.result==="IDENTITY_VERIFIED_NOT_AUTHORIZED"?"border-amber-600 bg-amber-50":"border-red-700 bg-red-50"}`}>
 <h2 className="text-4xl font-extrabold">{t.results[verdict.result]}</h2><p className="text-xl font-bold">{t.reasons[verdict.reason]??t.error}</p>
 {verdict.officer&&<p>{verdict.officer.name} · {verdict.officer.title} · {verdict.officer.institution}</p>}<p className="font-bold">{t.warning}</p><button className={buttonClass} onClick={()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(verdict.receipt,null,2)],{type:"application/json"}));const link=document.createElement("a");link.href=url;link.download="satyacall-verdict-"+verdict.eventId+".json";link.click();URL.revokeObjectURL(url);}}>{a.receipt}</button>{verdict.receipt.facts.officerId&&<form onSubmit={async e=>{e.preventDefault();const reason=new FormData(e.currentTarget).get("reason");setBusy(true);try{const r=await fetch("/api/officer-reports",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({eventId:verdict.eventId,receipt:verdict.receipt,reason})});const d=await r.json();if(!r.ok)throw new Error(d.error?.code);setReported(true);}catch(e){setError(e instanceof Error?e.message:"SERVICE_UNAVAILABLE");}finally{setBusy(false);}}}><p>{a.reportLogin}</p><label>{a.reportReason}<textarea name="reason" required maxLength={1000} className={fieldClass}/></label><button className={buttonClass} disabled={busy||reported}>{reported?a.reported:a.report}</button></form>}</section>}
 </Container>;
}
