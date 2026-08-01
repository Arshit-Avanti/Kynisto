import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { GoogleSignIn } from "@/components/auth/GoogleSignIn";
import { redirectAuthenticatedUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  await redirectAuthenticatedUser();
  const { returnTo } = await searchParams;
  return (
    <div className="authCard">
      <GoogleSignIn returnTo={returnTo} />
      <div className="authDivider"><span>or</span></div>
      <AdminLoginForm returnTo={returnTo} />
      <section className="androidDownload" aria-labelledby="android-download-title">
        <span className="androidDownloadIcon" aria-hidden="true">K</span>
        <div>
          <strong id="android-download-title">Get Kynisto 2.0 for Android</strong>
          <small>Install the official mobile app for the latest local discovery experience & instant updates.</small>
        </div>
        <a href="/downloads/Kynisto-2.0.0-release.apk" download="Kynisto-2.0.0-release.apk">
          Download APK
        </a>
      </section>
    </div>
  );
}
