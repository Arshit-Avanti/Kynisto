import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { requirePageRole } from "@/lib/auth";

export default async function OwnerPage() {
  const user = await requirePageRole(["store_owner"], "/owner");
  return <OwnerDashboard user={user} />;
}
