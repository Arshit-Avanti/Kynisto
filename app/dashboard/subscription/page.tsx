import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { SubscriptionManagementView } from "@/components/subscription/SubscriptionManagementView";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "My Subscription & Store Passes | Kynisto",
  description: "Manage your active Kynisto subscription, auto-renew, features, store VIP passes, and download payment receipts.",
};

export default async function UserSubscriptionPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login?returnTo=/dashboard/subscription");
  }

  const user = session.user;

  return (
    <main className="site min-h-screen bg-slate-50 text-slate-900 overflow-x-clip pt-28 pb-16 px-4 sm:px-6">
      <Navbar3D user={user} />

      <SubscriptionManagementView user={user} />

      <footer className="mt-20 py-10 px-4 border-t border-slate-200 text-center bg-white">
        <a className="brand footerBrand inline-block mb-3" href="/">
          <KynistoLogo showTagline />
        </a>
        <p className="text-xs text-slate-500">
          Everything Around You, Smarter. · © 2026 Kynisto Subscriptions &amp; Store Memberships
        </p>
      </footer>
    </main>
  );
}
