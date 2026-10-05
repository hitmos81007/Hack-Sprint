import { requirePageRole } from "../../lib/auth";
import { Onboarding } from "../components/onboarding";
export const dynamic = "force-dynamic";
export default async function Root() {
  const { id } = await requirePageRole("root_authority");
  return <Onboarding mode="root" userId={id} />;
}
