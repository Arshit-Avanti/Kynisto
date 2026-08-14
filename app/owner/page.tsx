import { Suspense } from "react";
import { OwnerDashboard } from "@/components/dashboard/OwnerDashboard";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OwnerPage() {
  const user = await requirePageRole(["store_owner", "admin", "customer"], "/owner");
  return (
    <Suspense fallback={<div className="portalSkeleton"><span /><span /><span /><span /></div>}>
      <OwnerDashboard user={user} />
    </Suspense>
  );
}
