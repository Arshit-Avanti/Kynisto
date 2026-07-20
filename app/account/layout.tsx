import { PortalShell } from "@/components/dashboard/PortalShell";
import { requirePageRole } from "@/lib/auth";
import "../portal.css";
import "../portal-nav.css";
import "../portal-extensions.css";
import "../portal-commerce.css";
import "../portal-reviews.css";
import "../portal-chat.css";
import "../portal-media.css";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["customer"], "/account");
  return <PortalShell user={user} workspaceRole="customer">{children}</PortalShell>;
}
