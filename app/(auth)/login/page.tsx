import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { redirectAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ returnTo?: string; autoJoin?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { returnTo } = (await searchParams) || {};
  const destination = returnTo || "/";
  await redirectAuthenticatedUser(destination);

  return (
    <div className="authCard">
      <GoogleSignIn returnTo={destination} />
      <div className="authDivider"><span>or</span></div>
      <AdminLoginForm returnTo={destination} />
      <section className="androidDownload" aria-labelledby="android-download-title">
        <span className="androidDownloadIcon" aria-hidden="true">K</span>
        <div>
          <strong id="android-download-title">Get Kynisto 2.1 for Android</strong>
          <small>Install the official mobile app for the latest local discovery experience &amp; instant updates.</small>
        </div>
        <a href="/downloads/Kynisto-2.1.0-release.apk" download="Kynisto-2.1.0-release.apk">
          Download APK
        </a>
      </section>
    </div>
  );
}
