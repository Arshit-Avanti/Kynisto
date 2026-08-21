"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Compass, Sparkles, ArrowRight, Shield } from "lucide-react";

export function Navbar3D() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`nav3d ${scrolled ? "nav3dScrolled" : ""}`}>
      <Link href="/" className="inline-flex items-center gap-3">
        <KynistoLogo showTagline />
      </Link>

      <nav className="navLinks" aria-label="Main Navigation">
        <a href="#features" className="navLink">Ecosystem</a>
        <a href="#how-it-works" className="navLink">How It Works</a>
        <a href="#interactive-showcase" className="navLink">3D Engine</a>
        <Link href="/healthcare" className="navLink flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff] animate-pulse" />
          Healthcare Queues
        </Link>
        <Link href="/pricing" className="navLink">Pricing</Link>
      </nav>

      <div className="flex items-center gap-3">
        <Link href="/login" className="btnSecondary3d text-[13px] py-2 px-4">
          Sign In
        </Link>
        <Link href="/login" className="btnPrimary3d text-[13px] py-2 px-5 hidden sm:inline-flex">
          <span>Get Started</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}
