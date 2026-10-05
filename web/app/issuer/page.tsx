import { requirePageRole } from "../../lib/auth";
import { Onboarding } from "../components/onboarding";
export const dynamic = "force-dynamic";
export default async function Issuer() {
  const { id } = await requirePageRole(["citizen", "issuer_admin"]);
  return <Onboarding mode="issuer" userId={id} />;
}
