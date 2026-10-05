import { emptyQuery } from "../../../lib/api";
import {requireRole} from "../../../lib/auth";
import {allRoles} from "../../../lib/auth-policy";
import {dbError,failure,json} from "../../../lib/api";
import {dashboardSchema} from "../../../lib/dashboard";
export async function GET(request:Request){try{
 emptyQuery(request);
 const actor=await requireRole(allRoles);
 // Use the authenticated JWT: the SQL function checks DB roles, not supplied scope/user IDs.
 const result=await actor.client.rpc("dashboard_metrics");dbError(result.error);
 return json(dashboardSchema.parse(result.data));
}catch(error){return failure(error);}}


