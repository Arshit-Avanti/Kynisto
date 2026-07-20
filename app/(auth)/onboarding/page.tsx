import { GoogleRoleOnboarding } from "@/components/auth/GoogleRoleOnboarding";
import { redirectAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  await redirectAuthenticatedUser();
  return (
    <div className="authCard onboardingCard">
      <GoogleRoleOnboarding />
    </div>
  );
}
