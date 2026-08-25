"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { signOutSupabaseBrowser } from "@/lib/supabase-browser";
import {
  User,
  Menu,
  X,
  Stethoscope,
  LayoutDashboard,
  Wallet,
  Briefcase,
  Store,
  Crown,
  LogOut,
  LogIn,
  ChevronRight,
  Shield,
  Activity
} from "lucide-react";

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
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<NavbarUser | null>(initialUser ?? null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await apiFetch("/api/auth/logout", { method: "POST", json: {} });
    } finally {
      await signOutSupabaseBrowser().catch(() => undefined);
      setUser(null);
      setMobileMenuOpen(false);
      setIsLoggingOut(false);
      router.push("/");
      router.refresh();
    }
  };

  return (
    <header className="fixed top-2.5 sm:top-3 left-0 right-0 z-50 px-2 sm:px-6 pointer-events-none">
      <div
        className={`max-w-6xl mx-auto rounded-full transition-all duration-300 pointer-events-auto border flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2.5 shadow-lg ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-slate-300/80 shadow-slate-200/50"
            : "bg-white/90 backdrop-blur-md border-slate-200/80 shadow-slate-100/50"
        }`}
      >
        {/* Brand Logo - Responsive for Mobile & Desktop */}
        <Link href="/" className="inline-flex items-center gap-1.5 shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <div className="block sm:hidden">
            <KynistoLogo showTagline={false} variant="dark" size="sm" />
          </div>
          <div className="hidden sm:block">
            <KynistoLogo showTagline variant="dark" size="sm" />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-7 text-sm font-semibold text-slate-700 mx-3" aria-label="Main Navigation">
          <Link href="/services" className="hover:text-orange-500 transition-colors whitespace-nowrap">
            Services
          </Link>
          <Link href="/healthcare" className="hover:text-orange-500 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Healthcare</span>
          </Link>
          <Link href={dashboardHref} className="hover:text-orange-500 transition-colors whitespace-nowrap">
            Dashboard
          </Link>
          <Link href="/wallet" className="hover:text-orange-500 transition-colors whitespace-nowrap">
            Wallet
          </Link>
          <Link href="/pricing" className="hover:text-orange-500 transition-colors whitespace-nowrap">
            Pricing
          </Link>
        </nav>

        {/* Right CTA / User Greeting Pill & Mobile 3-Dash Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <Link
              href={dashboardHref}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-800 text-xs sm:text-sm font-bold hover:bg-orange-100 transition-all shadow-sm shrink-0"
              title={`Logged in as ${user.name || "User"}`}
            >
              <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="whitespace-nowrap font-bold">Welcome, {firstName}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-block px-4 sm:px-5 py-1.5 rounded-full bg-slate-900 text-white text-xs sm:text-sm font-bold hover:bg-slate-800 transition-all shadow-sm shrink-0 whitespace-nowrap"
            >
              Sign In
            </Link>
          )}

          {/* User Quick Icon on Mobile if Logged In */}
          {user && (
            <Link
              href={dashboardHref}
              className="sm:hidden p-1.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center justify-center text-xs font-bold shrink-0"
              title={`Account: ${user.name}`}
            >
              <User className="w-4 h-4" />
            </Link>
          )}

          {/* Mobile 3-Dash Hamburger Menu Button (Three Dash ☰) */}
          <div className="md:hidden shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2 rounded-full transition-all flex items-center justify-center shadow-md ${
                mobileMenuOpen
                  ? "bg-orange-500 text-white shadow-orange-500/30"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
              aria-label="Open Kynisto navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile 3-Dash Floating Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden pointer-events-auto max-w-lg mx-auto mt-2 p-3 sm:p-4 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-white/20 shadow-2xl text-white space-y-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* User Greeting & Status Header */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.06] border border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-md">
                {user?.name ? user.name.charAt(0).toUpperCase() : "K"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {user?.name || "Welcome to Kynisto"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.role === "admin"
                    ? "Administrator"
                    : user?.role === "store_owner"
                    ? "Store Owner"
                    : user
                    ? "Verified Member"
                    : "Discover, Book & Track"}
                </div>
              </div>
            </div>

            {user?.role && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[9px] font-bold uppercase shrink-0">
                {user.role}
              </span>
            )}
          </div>

          {/* Navigation Links List */}
          <div className="flex flex-col gap-1">
            
            {/* 1. Healthcare */}
            <Link
              href="/healthcare"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-white font-semibold text-xs transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Healthcare &amp; OPD</div>
                  <div className="text-[9px] text-slate-400">Live doctor queues &amp; tokens</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            </Link>

            {/* 2. Services */}
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-white font-semibold text-xs transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">Home Services</div>
                  <div className="text-[9px] text-slate-400">AC, electrician &amp; plumbing</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 3. Wallet & Passes */}
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-white font-semibold text-xs transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Wallet &amp; Digital Passes</div>
                  <div className="text-[9px] text-slate-400">Loyalty points &amp; cashback</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 4. Dashboard */}
            <Link
              href={dashboardHref}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-white font-semibold text-xs transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">Dashboard</div>
                  <div className="text-[9px] text-slate-400">Manage bookings &amp; activity</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 5. Stores & Places */}
            <Link
              href="/#places"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-white font-semibold text-xs transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Local Stores &amp; Places</div>
                  <div className="text-[9px] text-slate-400">Groceries, pharmacies &amp; cafes</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 6. Pricing & Plans */}
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-white font-semibold text-xs transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Memberships &amp; Plans</div>
                  <div className="text-[9px] text-slate-400">Unlock VIP pass privileges</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>
          </div>

          {/* Footer Auth Actions (Sign Out / Sign In) */}
          <div className="pt-2 border-t border-white/10">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-lg transition-all text-center"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Google</span>
              </Link>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
