"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { User, Menu, X, Stethoscope, ShoppingBag, LayoutDashboard, Wallet, Briefcase } from "lucide-react";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<NavbarUser | null>(initialUser ?? null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 15);
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
    <header className="fixed top-3 left-0 right-0 z-50 px-4 sm:px-6 pointer-events-none">
      <div
        className={`max-w-6xl mx-auto rounded-full transition-all duration-300 pointer-events-auto border flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 shadow-md ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-slate-300/80 shadow-slate-200/50"
            : "bg-white/90 backdrop-blur-md border-slate-200 shadow-slate-100/50"
        }`}
      >
        {/* Brand Logo */}
        <Link href="/" className="inline-flex items-center gap-2 shrink-0">
          <KynistoLogo showTagline variant="dark" size="sm" />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700" aria-label="Main Navigation">
          <Link href="/services" className="hover:text-sky-600 transition-colors">
            Services
          </Link>
          <Link href="/healthcare" className="hover:text-sky-600 transition-colors flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>Healthcare</span>
          </Link>
          <Link href={dashboardHref} className="hover:text-sky-600 transition-colors">
            Dashboard
          </Link>
          <Link href="/wallet" className="hover:text-sky-600 transition-colors">
            Wallet
          </Link>
        </nav>

        {/* Right CTA / User Greeting */}
        <div className="flex items-center gap-2">
          {user ? (
            <Link
              href={dashboardHref}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs sm:text-sm font-bold hover:bg-sky-100 transition-all shadow-sm"
              title={`Logged in as ${user.name || "User"}`}
            >
              <div className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-xs">
                <User className="w-3 h-3" />
              </div>
              <span className="truncate max-w-[120px] sm:max-w-none">Welcome, {firstName}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all shadow-sm"
            >
              Sign In
            </Link>
          )}

          {/* Mobile Menu Trigger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-full md:hidden text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden pointer-events-auto max-w-6xl mx-auto mt-2 p-4 rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200 shadow-xl space-y-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Link
            href="/services"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
          >
            <Briefcase className="w-4 h-4 text-sky-600" />
            <span>Services</span>
          </Link>
          <Link
            href="/healthcare"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
          >
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <div className="flex items-center gap-2">
              <span>Healthcare Queues</span>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 text-[10px] font-bold">Live</span>
            </div>
          </Link>
          <Link
            href={dashboardHref}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-sky-600" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/wallet"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 text-slate-800 font-semibold text-sm transition-colors"
          >
            <Wallet className="w-4 h-4 text-sky-600" />
            <span>Wallet &amp; Rewards</span>
          </Link>
        </div>
      )}
    </header>
  );
}
