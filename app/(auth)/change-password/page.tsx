import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { dashboardForRole, requirePageRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const user = await requirePageRole(["admin"], "/change-password");
  if (!user.mustChangePassword) redirect(dashboardForRole(user.role));
  return <div className="authCard"><span className="authKicker">Required security step</span><h2>Create a private password</h2><p>Complete this once to activate the protected workspace.</p><ChangePasswordForm /></div>;
}
