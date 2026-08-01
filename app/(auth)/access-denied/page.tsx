import Link from "next/link";
import { dashboardForRole, getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccessDeniedPage() {
  const session = await getSessionUser();
  const destination = session ? dashboardForRole(session.user.role) : "/login";
  return <div className="authCard deniedCard"><span className="deniedCode">403</span><span className="authKicker">Access Denied</span><h2>This workspace is not assigned to you.</h2><p>Kynisto protects every role and business boundary on the server. Continue to your authorised workspace.</p><Link className="authSubmit authLinkButton" href={destination}>{session ? "Open my workspace" : "Log in"}</Link></div>;
}
