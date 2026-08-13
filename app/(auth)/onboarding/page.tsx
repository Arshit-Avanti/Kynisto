import { GoogleRoleOnboarding } from "@/components/auth/GoogleRoleOnboarding";
import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await getSessionUser();
  if (session?.user?.role === "store_owner") {
    redirect("/owner");
  }
  return (
    <div className="authCard onboardingCard">
      <GoogleRoleOnboarding />
    </div>
  );
}
