import {z} from "zod";import {moneySchema} from "./intent-schema";
export const guardReasons=["AMOUNT","REGISTRY","ANALYZER"] as const;
export const guardInput=z.object({payee:z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{2,80}@[a-z0-9.-]{2,40}$/),amount:moneySchema.refine(v=>v!=="0.00"),latestRisk:z.enum(["LOW","MEDIUM","HIGH"])}).strict();
export const choiceInput=z.object({sessionId:z.string().uuid(),token:z.string().regex(/^[0-9a-f]{64}$/),choice:z.enum(["cancel","continue"])}).strict();
function cents(value:string){const[whole,fraction=""]=value.split(".");return BigInt(whole)*BigInt(100)+BigInt(fraction.padEnd(2,"0"));}
export function guardDecision(amount:string,threshold:string,reported:boolean,risk:"LOW"|"MEDIUM"|"HIGH"){const reasons:typeof guardReasons[number][]=[];if(cents(moneySchema.parse(amount))>=cents(moneySchema.parse(threshold)))reasons.push("AMOUNT");if(reported)reasons.push("REGISTRY");if(risk==="HIGH")reasons.push("ANALYZER");return {cooling:reasons.length>0,reasons};}
export function secondsRemaining(until:string,now=Date.now()){return Math.max(0,Math.ceil((Date.parse(until)-now)/1000));}
