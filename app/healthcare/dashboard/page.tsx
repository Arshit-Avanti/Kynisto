import { redirect } from "next/navigation";
import { Suspense } from "react";
import { HealthcareOwnerDashboard } from "@/components/dashboard/HealthcareOwnerDashboard";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HealthcareDashboardPage() {
  const user = await requirePageRole(["store_owner", "admin"], "/healthcare/dashboard");
  if (user.ownerType !== "healthcare" && user.role !== "admin") {
    redirect("/owner");
  }
  return (
    <Suspense fallback={<div className="portalSkeleton"><span /><span /><span /><span /></div>}>
      <HealthcareOwnerDashboard user={user} />
    </Suspense>
  );
}
