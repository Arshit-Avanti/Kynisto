"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { signOutSupabaseBrowser } from "@/lib/supabase-browser";
import {
  Home,
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

  const pathname = usePathname() || "/";

  return (
    <>
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
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 text-sm font-semibold text-slate-700 mx-2" aria-label="Main Navigation">
          <Link
            href="/"
            className="px-3 py-1.5 rounded-full hover:bg-orange-500/10 hover:text-orange-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          >
            Homepage
          </Link>
          <Link
            href="/services"
            className="px-3 py-1.5 rounded-full hover:bg-orange-500/10 hover:text-orange-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          >
            Services
          </Link>
          <Link
            href="/healthcare"
            className="px-3 py-1.5 rounded-full hover:bg-emerald-500/10 hover:text-emerald-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Healthcare</span>
          </Link>
          <Link
            href={dashboardHref}
            className="px-3 py-1.5 rounded-full hover:bg-orange-500/10 hover:text-orange-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          >
            Dashboard
          </Link>
          <Link
            href="/wallet"
            className="px-3 py-1.5 rounded-full hover:bg-orange-500/10 hover:text-orange-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          >
            Wallet
          </Link>
          <Link
            href="/pricing"
            className="px-3 py-1.5 rounded-full hover:bg-orange-500/10 hover:text-orange-600 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap"
          >
            Pricing
          </Link>
        </nav>

        {/* Right CTA / User Greeting Pill & Mobile 3-Dash Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <Link
              href={dashboardHref}
              className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/90 border border-slate-200 hover:border-slate-300 text-xs font-semibold text-slate-800 shrink-0 whitespace-nowrap transition-all hover:shadow-sm"
              title={`Open Dashboard (${user.role || 'User'})`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Welcome, {firstName}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap"
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
            
            {/* 0. Homepage */}
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.08] text-white font-semibold text-xs transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">Homepage</div>
                  <div className="text-[9px] text-slate-400">Discover everything around you</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

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

    {/* FLOATING CURVED MOBILE BOTTOM NAVIGATION DOCK (Mobile Users Only) */}
    <nav
      className="md:hidden fixed bottom-3.5 left-0 right-0 z-50 px-3 pointer-events-none"
      aria-label="Mobile Bottom Navigation Bar"
    >
      <div className="mobileBottomDock pointer-events-auto max-w-sm mx-auto rounded-full bg-slate-950/90 backdrop-blur-2xl border border-white/20 px-2 py-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.85),0_0_25px_rgba(249,115,22,0.25)] flex items-center justify-around transition-all">
        {/* 1. Home */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className={`mobileDockItem relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 ${
            pathname === "/"
              ? "bg-gradient-to-tr from-orange-500/25 to-amber-500/25 border border-orange-500/40 text-orange-400 shadow-md shadow-orange-500/20 scale-105"
              : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
          }`}
          aria-label="Home"
        >
          <Home className={`w-5 h-5 transition-transform duration-200 ${pathname === "/" ? "text-orange-400 scale-110" : "text-slate-300"}`} />
          <span className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap ${pathname === "/" ? "text-white drop-shadow-sm font-extrabold" : "text-slate-400 font-medium"}`}>
            Home
          </span>
        </Link>

        {/* 2. Healthcare (with live pulse) */}
        <Link
          href="/healthcare"
          onClick={() => setMobileMenuOpen(false)}
          className={`mobileDockItem relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 ${
            pathname.startsWith("/healthcare") || pathname.startsWith("/queue")
              ? "bg-gradient-to-tr from-emerald-500/25 to-teal-500/25 border border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/20 scale-105"
              : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
          }`}
          aria-label="Healthcare OPD"
        >
          <div className="relative">
            <Stethoscope className={`w-5 h-5 transition-transform duration-200 ${pathname.startsWith("/healthcare") || pathname.startsWith("/queue") ? "text-emerald-400 scale-110" : "text-slate-300"}`} />
            <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
          <span className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap ${pathname.startsWith("/healthcare") || pathname.startsWith("/queue") ? "text-white drop-shadow-sm font-extrabold" : "text-slate-400 font-medium"}`}>
            Health
          </span>
        </Link>

        {/* 3. Services */}
        <Link
          href="/services"
          onClick={() => setMobileMenuOpen(false)}
          className={`mobileDockItem relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 ${
            pathname.startsWith("/services")
              ? "bg-gradient-to-tr from-sky-500/25 to-blue-500/25 border border-sky-500/40 text-sky-400 shadow-md shadow-sky-500/20 scale-105"
              : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
          }`}
          aria-label="Home Services"
        >
          <Briefcase className={`w-5 h-5 transition-transform duration-200 ${pathname.startsWith("/services") ? "text-sky-400 scale-110" : "text-slate-300"}`} />
          <span className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap ${pathname.startsWith("/services") ? "text-white drop-shadow-sm font-extrabold" : "text-slate-400 font-medium"}`}>
            Services
          </span>
        </Link>

        {/* 4. Wallet */}
        <Link
          href="/wallet"
          onClick={() => setMobileMenuOpen(false)}
          className={`mobileDockItem relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 ${
            pathname.startsWith("/wallet")
              ? "bg-gradient-to-tr from-amber-500/25 to-yellow-500/25 border border-amber-500/40 text-amber-400 shadow-md shadow-amber-500/20 scale-105"
              : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
          }`}
          aria-label="My Wallet"
        >
          <Wallet className={`w-5 h-5 transition-transform duration-200 ${pathname.startsWith("/wallet") ? "text-amber-400 scale-110" : "text-slate-300"}`} />
          <span className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap ${pathname.startsWith("/wallet") ? "text-white drop-shadow-sm font-extrabold" : "text-slate-400 font-medium"}`}>
            Wallet
          </span>
        </Link>

        {/* 5. Account / Dashboard */}
        <Link
          href={dashboardHref}
          onClick={() => setMobileMenuOpen(false)}
          className={`mobileDockItem relative flex flex-col items-center justify-center py-1.5 px-3 rounded-full transition-all duration-200 ${
            pathname.startsWith("/dashboard") || pathname.startsWith("/account") || pathname.startsWith("/owner") || pathname.startsWith("/admin") || pathname.startsWith("/login")
              ? "bg-gradient-to-tr from-purple-500/25 to-indigo-500/25 border border-purple-500/40 text-purple-400 shadow-md shadow-purple-500/20 scale-105"
              : "text-slate-300 hover:text-white hover:bg-white/[0.08]"
          }`}
          aria-label="Account / Dashboard"
        >
          {user ? (
            <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 ${pathname.startsWith("/dashboard") || pathname.startsWith("/account") || pathname.startsWith("/owner") || pathname.startsWith("/admin") ? "text-purple-400 scale-110" : "text-slate-300"}`} />
          ) : (
            <User className={`w-5 h-5 transition-transform duration-200 ${pathname.startsWith("/login") ? "text-purple-400 scale-110" : "text-slate-300"}`} />
          )}
          <span className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap ${pathname.startsWith("/dashboard") || pathname.startsWith("/account") || pathname.startsWith("/owner") || pathname.startsWith("/admin") || pathname.startsWith("/login") ? "text-white drop-shadow-sm font-extrabold" : "text-slate-400 font-medium"}`}>
            {user ? "Dashboard" : "Account"}
          </span>
        </Link>
      </div>
    </nav>
    </>
  );
}
