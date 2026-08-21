"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { User, Activity, Sparkles, Wallet, LayoutDashboard, Stethoscope, ShoppingBag } from "lucide-react";

interface NavbarUser {
  id: string;
  name?: string;
  role?: "admin" | "store_owner" | "customer";
  avatarUrl?: string | null;
}

interface Navbar3DProps {
  user?: NavbarUser | null;
}

export function Navbar3D({ user: initialUser }: Navbar3DProps) {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<NavbarUser | null>(initialUser ?? null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const res = await apiFetch<{ user: NavbarUser | null }>("/api/auth/me");
        if (active && res?.user) {
          setUser(res.user);
        }
      } catch {
        // Guest mode fallback
      }
    };

    if (!user) {
      void fetchUser();
    }

    return () => {
      active = false;
    };
  }, [user]);

  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "store_owner"
      ? "/owner"
      : user
      ? "/account"
      : "/login?returnTo=/account";

  const firstName = user?.name ? user.name.trim().split(" ")[0] : "User";

  return (
    <header className={`nav3d ${scrolled ? "nav3dScrolled" : ""}`}>
      <Link href="/" className="inline-flex items-center gap-3">
        <KynistoLogo showTagline variant="dark" />
      </Link>

      <nav className="navLinks" aria-label="Main Navigation">
        <Link href="/services" className="navLink flex items-center gap-1.5">
          <span>Services</span>
        </Link>
        <Link href="/healthcare" className="navLink flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse" />
          <span>Healthcare</span>
        </Link>
        <Link href={dashboardHref} className="navLink flex items-center gap-1.5">
          <span>Dashboard</span>
        </Link>
        <Link href="/wallet" className="navLink flex items-center gap-1.5">
          <span>Wallet</span>
        </Link>
      </nav>

      <div className="flex items-center gap-3">
        {user ? (
          <Link
            href={dashboardHref}
            className="btnSecondary3d text-[13px] py-1.5 px-4 flex items-center gap-2"
            title={`Logged in as ${user.name || "User"}`}
          >
            <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-600 flex items-center justify-center font-bold text-xs">
              <User className="w-3.5 h-3.5" />
            </div>
            <span>Welcome, <b>{firstName}</b></span>
          </Link>
        ) : (
          <Link href="/login" className="btnSecondary3d text-[13px] py-2 px-5">
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
