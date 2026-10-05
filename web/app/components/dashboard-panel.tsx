"use client";
import {useEffect,useState} from "react";
import {dashboardSchema,estimatePreventedLoss,type DashboardMetrics} from "../../lib/dashboard";
import {dashboardMessages,authMessages,verificationMessages,assistMessages,registryMessages,type Locale} from "../../lib/i18n";
import type {Role} from "../../lib/auth-policy";
import {useLanguage} from "./language";
import {buttonClass,fieldClass} from "./key-panel";
export function metricLabel(kind:"verifications"|"analyses"|"reports",key:string,locale:Locale){
 if(kind==="verifications")return (verificationMessages[locale].results as Record<string,string>)[key]??dashboardMessages[locale].unknown;
 if(kind==="analyses")return (assistMessages[locale].risks as Record<string,string>)[key]??dashboardMessages[locale].unknown;
 return (registryMessages[locale].types as Record<string,string>)[key]??dashboardMessages[locale].unknown;
}
export function DashboardPanel({role}:{role:Role}){
 const{locale}=useLanguage(),t=dashboardMessages[locale];
 const[data,setData]=useState<DashboardMetrics|null>(null),[error,setError]=useState(false),[busy,setBusy]=useState(true);
 const[amount,setAmount]=useState(10000),[percent,setPercent]=useState(25);
 async function read(signal?:AbortSignal){const r=await fetch("/api/dashboard",{cache:"no-store",signal});if(!r.ok)throw new Error();return dashboardSchema.parse(await r.json());}
 useEffect(()=>{const c=new AbortController();void read(c.signal).then(d=>{if(!c.signal.aborted)setData(d);}).catch(()=>{if(!c.signal.aborted)setError(true);}).finally(()=>{if(!c.signal.aborted)setBusy(false);});return()=>c.abort();},[]);
 async function refresh(){setBusy(true);setError(false);try{setData(await read());}catch{setError(true);}finally{setBusy(false);}}
 const format=new Intl.NumberFormat(locale==="en"?"en-IN":locale==="hi"?"hi-IN":"ta-IN");
 const estimated=data?estimatePreventedLoss(data,{amountPerIncident:amount,preventionPercent:percent}):null;
 return <main className="mx-auto max-w-5xl space-y-7 px-5 py-10 text-xl"><h1 className="text-4xl font-extrabold">{t.title}</h1><p>{authMessages[locale].role}: {authMessages[locale].roles[role]}</p><button className={buttonClass} disabled={busy} onClick={()=>void refresh()}>{t.refresh}</button>{busy&&<p role="status">{authMessages[locale].pending}</p>}{error&&<p role="alert">{authMessages[locale].error}</p>}
 {data&&<><p className="text-2xl font-bold">{data.scope==="global"?t.global:t.personal}</p><div className="grid gap-5 md:grid-cols-2">{(["verifications","analyses","reports"] as const).map(kind=><section key={kind} className="rounded-xl border-2 border-slate-700 bg-white p-5"><h2 className="text-2xl font-bold">{t[kind]}</h2>{Object.keys(data[kind]).length?<dl>{Object.entries(data[kind]).sort(([a],[b])=>a.localeCompare(b)).map(([key,n])=><div key={key} className="flex justify-between gap-5 border-b py-3"><dt>{metricLabel(kind,key,locale)}</dt><dd className="text-3xl font-bold">{format.format(n)}</dd></div>)}</dl>:<p>{t.empty}</p>}</section>)}
 <section className="rounded-xl border-2 border-slate-700 bg-white p-5"><h2 className="text-2xl font-bold">{t.median}</h2><p className="my-4 text-4xl font-bold">{data.medianVerificationMs===null?t.noDuration:format.format(data.medianVerificationMs)+" "+t.units}</p><p>{t.timeNote}</p></section></div>
 <section className="rounded-xl border-2 p-5"><h2 className="text-2xl font-bold">{t.anchored}</h2><p className="text-4xl font-bold">{format.format(data.anchoredTransactions)}</p><p>{t.anchorNote}</p></section>
 <section className="space-y-4 rounded-xl border-4 border-amber-800 bg-amber-50 p-5"><h2 className="text-2xl font-bold">{t.estimate}</h2><label className="block">{t.assumption}<input className={fieldClass} type="number" min={0} max={10000000} value={amount} onChange={e=>setAmount(Math.min(10000000,Math.max(0,Number(e.target.value)||0)))}/></label><label className="block">{t.probability}<input className={fieldClass} type="number" min={0} max={100} value={percent} onChange={e=>setPercent(Math.min(100,Math.max(0,Number(e.target.value)||0)))}/></label><p className="text-4xl font-extrabold">{new Intl.NumberFormat(locale+"-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(estimated?.estimate??0)}</p><p>{t.formula}: {format.format(estimated?.incidents??0)}</p><p>{t.estimateNote}</p></section><p>{t.generated}: {new Date(data.generatedAt).toLocaleString(locale+"-IN")}</p></>}
 </main>;
}

