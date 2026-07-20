import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import "./auth.css";
import "./auth-roles.css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="authPage">
      <section className="authStory">
        <Link className="authBrand" href="/"><KynistoLogo showTagline /></Link>
        <div className="authStoryCopy">
          <span className="authEyebrow">Everything Around You, Smarter.</span>
          <h1>Local discovery,<br /><em>made intelligent.</em></h1>
          <p>Kynisto connects customers, trusted businesses, and healthcare providers through one polished local platform.</p>
          <div className="authMapCard" aria-hidden="true"><i /><i /><i /><b>DLF Ankur Vihar</b><small>100 local businesses ready to discover</small></div>
        </div>
        <p className="authLocation">⌖ DLF Ankur Vihar · Loni · Ghaziabad</p>
      </section>
      <section className="authPanel">{children}</section>
    </main>
  );
}
