import {z} from "zod";import type {AnalysisResult} from "./heuristics";
const stateSchema=z.object({risk:z.enum(["LOW","MEDIUM","HIGH"]),at:z.number()}).strict();
export function rememberAnalysis(result:AnalysisResult){try{sessionStorage.setItem("satyacall:latest-risk",JSON.stringify({risk:result.risk,at:Date.now()}));window.dispatchEvent(new Event("satyacall:analysis"));}catch{/* Analysis still works when browser storage is disabled. */}}
export function latestRisk(now=Date.now()):AnalysisResult["risk"]{try{const value=stateSchema.parse(JSON.parse(sessionStorage.getItem("satyacall:latest-risk")??"null"));return now>=value.at&&now-value.at<=1800000?value.risk:"LOW";}catch{return "LOW";}}
