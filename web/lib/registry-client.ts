import {z} from "zod";import {identifierTypes} from "./normalize";
export const lookupResultSchema=z.object({count:z.number().int().nonnegative(),distinctReporterCount:z.number().int().nonnegative(),eligibleReporterCount:z.number().int().nonnegative(),anchoredCount:z.number().int().nonnegative(),pendingCount:z.number().int().nonnegative(),risk:z.enum(["unreported","reported","high"]),minAccountAgeSeconds:z.number().int().nonnegative(),chainCount:z.string().regex(/^\d+$/).nullable(),countsMatch:z.boolean().nullable()}).strict();
export type LookupResult=z.infer<typeof lookupResultSchema>;
export const publicReportSchema=z.object({id:z.string().uuid(),id_type:z.enum(identifierTypes),category:z.string().max(100),anchor_status:z.enum(["pending","anchoring","anchored"]),anchored_tx:z.string().regex(/^0x[0-9a-fA-F]{64}$/).nullable(),chain_id:z.coerce.number().nullable(),registry_address:z.string().nullable(),created_at:z.string()});
export type PublicReport=z.infer<typeof publicReportSchema>;
export function txExplorerUrl(tx:string,chainId:number|null){if(!/^0x[0-9a-fA-F]{64}$/.test(tx)||chainId!==80002)return null;return "https://amoy.polygonscan.com/tx/"+tx;}
