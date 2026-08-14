import { Suspense } from "react";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requirePageRole(["admin"], "/admin");
  return (
    <Suspense fallback={<div className="portalSkeleton"><span /><span /><span /><span /></div>}>
      <AdminDashboard user={user} />
    </Suspense>
  );
}
