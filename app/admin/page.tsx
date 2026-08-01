import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { requirePageRole } from "@/lib/auth";

export default async function AdminPage() {
  const user = await requirePageRole(["admin"], "/admin");
  return <AdminDashboard user={user} />;
}
