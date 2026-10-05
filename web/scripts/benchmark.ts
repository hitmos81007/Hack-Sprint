import {z} from "zod";
import samples from "../data/scam-samples.json";
import {runHeuristics} from "../lib/heuristics";
import {analyzeHybrid} from "../lib/analyzer";
import {analysisPrompt,generateJSON,llmResponseSchema} from "../lib/llm";
export const sampleSchema=z.object({id:z.string(),label:z.enum(["scam","legit"]),language:z.enum(["en","hi","ta","hinglish","tanglish"]),text:z.string().min(1)}).strict();
export function metrics(labels:boolean[],predictions:boolean[]){
 if(!labels.length||labels.length!==predictions.length)throw new Error("Invalid benchmark inputs");
 let tp=0,tn=0,fp=0,fn=0;labels.forEach((label,i)=>{if(label&&predictions[i])tp++;else if(!label&&!predictions[i])tn++;else if(!label&&predictions[i])fp++;else fn++;});
 const divide=(a:number,b:number)=>b?a/b:0;
 return {accuracy:divide(tp+tn,labels.length),precision:divide(tp,tp+fp),recall:divide(tp,tp+fn),falsePositiveRate:divide(fp,fp+tn),tp,tn,fp,fn};
}
export async function benchmark(){
 const data=z.array(sampleSchema).length(60).parse(samples);const labels=data.map(x=>x.label==="scam");
 const configured=process.env.LLM_PROVIDER;const real=configured&&configured!=="mock"&&!!process.env.LLM_API_KEY&&!!process.env.LLM_MODEL;
 const invoke=real?undefined:(text:string)=>generateJSON(analysisPrompt(text),llmResponseSchema,{provider:"mock"});
 const rules=data.map(x=>runHeuristics(x.text).score>=70);const hybrid:boolean[]=[];const modes:Record<string,number>={};
 for(const sample of data){const result=await analyzeHybrid(sample.text,invoke,{simulateHybrid:!real});hybrid.push(result.score>=70);modes[result.provider]=(modes[result.provider]??0)+1;}
 return {rules:metrics(labels,rules),hybrid:metrics(labels,hybrid),mode:real?configured:"mock simulation",modes};
}
export async function main(){const results=await benchmark();console.info("60 synthetic samples (40 scam, 20 legit); positive = HIGH / score >= 70. Hybrid: "+results.mode+". Mock reuses deterministic rules; this is not real-world LLM accuracy.");
 const row=(name:string,m:ReturnType<typeof metrics>)=>({mode:name,accuracy:(100*m.accuracy).toFixed(1)+"%",precision:(100*m.precision).toFixed(1)+"%",recall:(100*m.recall).toFixed(1)+"%","false-positive rate":(100*m.falsePositiveRate).toFixed(1)+"%",TP:m.tp,TN:m.tn,FP:m.fp,FN:m.fn});
 console.table([row("heuristics-only",results.rules),row("hybrid ("+results.mode+")",results.hybrid)]);console.info("Hybrid routing:",results.modes);return results;}
