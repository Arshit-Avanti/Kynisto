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
      <GoogleSignIn />
      <div className="authDivider"><span>or</span></div>
      <AdminLoginForm returnTo={returnTo} />
      <section className="androidDownload" aria-labelledby="android-download-title">
        <span className="androidDownloadIcon" aria-hidden="true">K</span>
        <div>
          <strong id="android-download-title">Get Kynisto for Android</strong>
          <small>Install the lightweight app and always access the latest Kynisto experience.</small>
        </div>
        <a href="/downloads/Kynisto-1.0.2-release.apk" download>
          Download APK
        </a>
      </section>
    </div>
  );
}
