import { requirePageRole } from "../../lib/auth";
import { Onboarding } from "../components/onboarding";
export const dynamic = "force-dynamic";
export default async function Officer() {
  const { id } = await requirePageRole(["citizen", "officer"]);
  return <Onboarding mode="officer" userId={id} />;
}
