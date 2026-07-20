import { redirect } from "next/navigation";
import { dashboardForRole, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardRouter() {
  const session = await getSessionUser();
  if (!session) redirect("/login?returnTo=%2Fdashboard");
  redirect(dashboardForRole(session.user.role));
}
