import { Suspense } from "react";
import { CustomerDashboard } from "@/components/dashboard/CustomerDashboard";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await requirePageRole(["customer", "store_owner", "admin"], "/account");
  return (
    <Suspense fallback={<div className="portalSkeleton"><span /><span /><span /><span /></div>}>
      <CustomerDashboard user={user} />
    </Suspense>
  );
}
