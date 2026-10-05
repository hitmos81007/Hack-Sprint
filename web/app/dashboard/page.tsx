import { allRoles } from "../../lib/auth-policy";
import { requirePageRole } from "../../lib/auth";
import { DashboardPanel } from "../components/dashboard-panel";
export const dynamic = "force-dynamic";
export default async function Dashboard() {
  const { role } = await requirePageRole(allRoles);
  return <DashboardPanel role={role} />;
}

