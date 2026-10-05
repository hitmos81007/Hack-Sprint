import "server-only";
import {createHash} from "node:crypto";
import type {SupabaseClient} from "@supabase/supabase-js";
import {normalizeText,runHeuristics,needsLanguageHelp,riskForScore,resultSchema,type AnalysisResult} from "./heuristics";
import {redact} from "./redact";
import {llmResponseSchema,callLlm,type LlmResult} from "./llm";
export function analysisHash(text:string){return createHash("sha256").update(normalizeText(text)).digest("hex");}
export async function analyzeHybrid(text:string,invoke:(redacted:string)=>Promise<LlmResult>=callLlm,options:{simulateHybrid?:boolean}={}):Promise<AnalysisResult>{
 const start=performance.now();const rules=runHeuristics(text);
 const eligible=(rules.score>=20&&rules.score<=80)||needsLanguageHelp(text);
 if(!eligible||((process.env.LLM_PROVIDER??"mock")==="mock"&&!options.simulateHybrid))return rules;
 try{const llm=llmResponseSchema.parse(await invoke(redact(text)));const score=Math.max(rules.score,Math.round(rules.score*.4+llm.score*.6),rules.hardFlag?90:0);return {...rules,score,risk:riskForScore(score),tactics:[...new Set([...rules.tactics,...llm.tactics])],provider:"hybrid",latencyMs:Math.max(0,Math.round(performance.now()-start))};}
 catch{return {...rules,provider:"heuristics-fallback",latencyMs:Math.max(0,Math.round(performance.now()-start))};}
}
// Persist only aggregate results and input hashes, never transcripts. Cache is shared, not a profile history.
export async function analyzeCached(text:string,admin:SupabaseClient):Promise<{result:AnalysisResult;cached:boolean}>{
 const start=performance.now();const rules=runHeuristics(text);const hash=analysisHash(text);
 const cached=await admin.from("analyses").select("*").eq("input_hash",hash).is("user_id",null).gte("created_at",new Date(Date.now()-3600000).toISOString()).order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(cached.error)throw new Error("ANALYSIS_CACHE_UNAVAILABLE");
 if(cached.data){const c=cached.data;const parsed=resultSchema.safeParse({score:c.risk_score,risk:c.verdict,hardFlag:rules.hardFlag,tactics:c.tactics,provider:c.provider,highlights:rules.highlights,latencyMs:Math.round(performance.now()-start)});
  const eligible=(rules.score>=20&&rules.score<=80)||needsLanguageHelp(text);const expectsHybrid=(process.env.LLM_PROVIDER??"mock")!=="mock"&&eligible;
  if(parsed.success&&parsed.data.score>=rules.score&&parsed.data.risk===riskForScore(parsed.data.score)&&rules.tactics.every(t=>parsed.data.tactics.includes(t))&&(!rules.hardFlag||parsed.data.score>=90)&&((expectsHybrid&&parsed.data.provider==="hybrid")||(!expectsHybrid&&parsed.data.provider==="heuristics")))return {result:parsed.data,cached:true};
 }
 const result=await analyzeHybrid(text);const saved=await admin.from("analyses").insert({user_id:null,input_hash:hash,risk_score:result.score,verdict:result.risk,tactics:result.tactics,provider:result.provider,latency_ms:result.latencyMs,input_text:null});if(saved.error)throw new Error("ANALYSIS_CACHE_UNAVAILABLE");return {result,cached:false};
}
