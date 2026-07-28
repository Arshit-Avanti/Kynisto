import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { AuthVideoBackground } from "@/components/auth/AuthVideoBackground";
import { AudioPermissionModal } from "@/components/ui/AudioPermissionModal";
import "./auth.css";
import "./auth-roles.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="authPage">
      <section className="authStory">
        <AuthVideoBackground />
        <Link className="authBrand" href="/"><KynistoLogo showTagline /></Link>
        <div className="authStoryCopy">
          <h1>Kynisto is<br />for<br /><em className="goldAccent">everyone</em></h1>
        </div>
      </section>
      <section className="authPanel">{children}</section>
      <AudioPermissionModal />
    </main>
  );
}
