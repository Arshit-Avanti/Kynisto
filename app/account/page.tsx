import { CustomerDashboard } from "@/components/dashboard/CustomerDashboard";
import { requirePageRole } from "@/lib/auth";

export default async function AccountPage() {
  const user = await requirePageRole(["customer"], "/account");
  return <CustomerDashboard user={user} />;
}
