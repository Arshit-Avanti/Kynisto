import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { UserSubscriptionDashboard } from "@/components/subscription/UserSubscriptionDashboard";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "My Subscription | Kynisto",
  description: "Manage your active Kynisto subscription, auto-renew, features, transactions, and download payment receipts.",
};

export default async function UserSubscriptionPage() {
  const session = await getSessionUser();
  if (!session) {
    redirect("/login?returnTo=/dashboard/subscription");
  }

  return (
    <main className="site mode-dark theme-royal" style={{ minHeight: "100vh", padding: "100px 20px 60px" }}>
      <Navbar3D />

      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 900, marginBottom: "8px" }}>
          Subscription & Billing
        </h1>
        <p style={{ color: "var(--muted, #94A3B8)", fontSize: "15px", marginBottom: "32px" }}>
          Manage your plan, features, auto-renewal settings, payment history, and receipts.
        </p>

        <UserSubscriptionDashboard />
      </div>
    </main>
  );
}
