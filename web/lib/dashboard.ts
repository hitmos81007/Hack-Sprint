import {z} from "zod";
const counts=z.record(z.string(),z.number().int().nonnegative());
export const dashboardSchema=z.object({scope:z.enum(["personal","global"]),verifications:counts,medianVerificationMs:z.number().nonnegative().nullable(),analyses:counts,reports:counts,anchoredTransactions:z.number().int().nonnegative(),generatedAt:z.string()}).strict();
export type DashboardMetrics=z.infer<typeof dashboardSchema>;
export const lossAssumptionSchema=z.object({amountPerIncident:z.number().finite().min(0).max(10000000),preventionPercent:z.number().finite().min(0).max(100)}).strict();
export function estimatePreventedLoss(metrics:DashboardMetrics,assumption:z.infer<typeof lossAssumptionSchema>){
 const a=lossAssumptionSchema.parse(assumption);
 // Count HIGH analyses only; adding verification/report counts would double-count incidents.
 const incidents=metrics.analyses.HIGH??0;
 return {incidents,estimate:Math.round(incidents*a.amountPerIncident*a.preventionPercent/100)};
}
