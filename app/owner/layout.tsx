import { PortalShell } from "@/components/dashboard/PortalShell";
import { requirePageRole } from "@/lib/auth";
import "../portal.css";
import "../portal-nav.css";
import "../portal-extensions.css";
import "../portal-commerce.css";
import "../portal-chat.css";
import "../portal-media.css";
import "../portal-healthcare.css";
import "../portal-healthcare-responsive.css";

export const dynamic = "force-dynamic";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["store_owner"], "/owner");
  return <PortalShell user={user} workspaceRole="store_owner">{children}</PortalShell>;
}
