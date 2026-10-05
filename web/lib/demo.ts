import {createCredential,verifyCredential,type Credential} from "./crypto";
import {createVerificationToken,decodeVerificationToken,verifyOfficerProof,type Challenge} from "./verification-schema";
import {demoIds} from "./demo-schema";
export function rehearsalChallenge():Challenge{return {id:crypto.randomUUID(),code:"123456",claimedEntity:"SatyaCall Synthetic Public Service (not CBI)",claimedCategory:"police",purpose:"information",amount:"0.00",payee:"",expiresAt:new Date(Date.now()+120000).toISOString()};}
export async function rehearsalProof(wallet:Parameters<typeof createVerificationToken>[0],credential:Credential,challenge:Challenge){
 const token=await createVerificationToken(wallet,challenge,demoIds.action);
 const proof=decodeVerificationToken(token);
 const valid=verifyOfficerProof(proof,challenge)&&verifyCredential(credential,{officerAddress:proof.officerAddress})&&Date.parse(challenge.expiresAt)>Date.now();
 return {token,result:valid?"VERIFIED_AUTHORIZED" as const:"NOT_VERIFIED" as const};
}
export {createCredential};

import {verificationMessages,guardianMessages,demoMessages,type Locale} from "./i18n";
export type DemoOutcome="NOT_VERIFIED"|"VERIFIED_AUTHORIZED"|"SIMULATION"|"ALERT_SENT"|"ANCHORED";
export function demoOutcomeText(outcome:DemoOutcome,locale:Locale){return outcome==="SIMULATION"?demoMessages[locale].simulation:outcome==="ANCHORED"?demoMessages[locale].anchored:outcome==="ALERT_SENT"?guardianMessages[locale].sent:verificationMessages[locale].results[outcome];}
