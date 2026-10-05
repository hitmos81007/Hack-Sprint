import {requirePageRole} from "../../lib/auth";import {allRoles} from "../../lib/auth-policy";import {EvidenceVault} from "../components/evidence-vault";
export const dynamic="force-dynamic";export default async function Page(){await requirePageRole(allRoles);return <EvidenceVault/>;}
