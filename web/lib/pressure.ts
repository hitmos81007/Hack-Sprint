import type {AnalysisResult} from "./heuristics";
import type {LookupResult} from "./registry-client";
import type {Challenge,Verdict} from "./verification-schema";
import {moneySchema} from "./intent-schema";
import {verifyVerdictReceipt} from "./verdict-receipt";
export type PressureDecision={action:"HANG_UP"|"DO_NOT_PAY"|"VERIFIED_SAFE";reason:"strongSignals"|"reported"|"unverified"|"notAuthorized"|"authorized"|"unknown"|"uncertainSignals"};
export function pressureDecision(input:{lookup:LookupResult|null;analysis:AnalysisResult|null;official:boolean;challenge:Challenge|null;verdict:Verdict|null;expectedSigner:string;now?:number}):PressureDecision{
 if(input.analysis?.hardFlag||input.analysis?.risk==="HIGH"||input.lookup?.risk==="high")return {action:"HANG_UP",reason:"strongSignals"};
 if(input.analysis?.risk==="MEDIUM")return {action:"DO_NOT_PAY",reason:"uncertainSignals"};
 if((input.lookup?.count??0)>0)return {action:"DO_NOT_PAY",reason:"reported"};
 if(!input.analysis||!input.lookup)return {action:"DO_NOT_PAY",reason:"unknown"};
 if(!input.official)return {action:"DO_NOT_PAY",reason:"unverified"};
 const v=input.verdict,c=input.challenge;
 if(v?.result==="IDENTITY_VERIFIED_NOT_AUTHORIZED")return {action:"DO_NOT_PAY",reason:"notAuthorized"};
 if(v?.result!=="VERIFIED_AUTHORIZED"||!c)return {action:"HANG_UP",reason:"unverified"};
 const f=v.receipt.facts,now=input.now??Date.now();let amountsMatch=false;try{amountsMatch=moneySchema.parse(f.amount)===moneySchema.parse(c.amount);}catch{/* fail closed */}
 if(!verifyVerdictReceipt(v.receipt,input.expectedSigner)||f.challengeId!==c.id||f.eventId!==v.eventId||f.result!==v.result||f.reason!==v.reason||f.purpose!==c.purpose||!amountsMatch||f.payee!==c.payee||!f.actionId||!f.officerId||!f.authorizedUntil||Date.parse(f.authorizedUntil)<=now||Date.parse(f.issuedAt)>now+5000||now-Date.parse(f.issuedAt)>120000)return {action:"HANG_UP",reason:"unverified"};
 return {action:"VERIFIED_SAFE",reason:"authorized"};
}
