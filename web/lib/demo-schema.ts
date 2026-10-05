import {z} from "zod";
import {credentialSchema,verifyCredential} from "./crypto";
export const demoIds={institution:"00000000-0000-4000-8000-00000000d001",officer:"00000000-0000-4000-8000-00000000d002",action:"00000000-0000-4000-8000-00000000d003",analysis:"00000000-0000-4000-8000-00000000d004",report:"00000000-0000-4000-8000-00000000d005"} as const;
export const demoNumber="0000000000";
export const demoInstitutionName="SatyaCall Synthetic Public Service (not CBI)";
export const demoFixtureSchema=z.object({version:z.literal(1),credential:credentialSchema}).strict().refine(f=>verifyCredential(f.credential)&&f.credential.officerName==="Synthetic Demo Officer"&&f.credential.roleTitle==="Information Officer",{message:"INVALID_DEMO_FIXTURE"});
export const demoConfigSchema=z.object({institution:z.object({id:z.string().uuid(),name:z.literal(demoInstitutionName),wallet_address:z.string(),category:z.literal("police")}),officer:z.object({id:z.string().uuid(),wallet_address:z.string(),credential:credentialSchema}),action:z.object({id:z.string().uuid(),valid_until:z.string(),purpose:z.literal("information")})}).strict();
export type DemoConfig=z.infer<typeof demoConfigSchema>;
