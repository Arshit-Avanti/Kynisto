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
  Activity,
  Search,
  BookOpen,
  HelpCircle
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
      const isPast = window.scrollY > 15;
      setScrolled((prev) => (prev !== isPast ? isPast : prev));
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
    <header className="fixed top-0 left-0 right-0 z-50 pt-[calc(env(safe-area-inset-top,0px)+12px)] sm:pt-4 px-3 sm:px-6 pointer-events-none">
      <div
        className={`max-w-6xl mx-auto rounded-full transition-all duration-300 pointer-events-auto border flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2.5 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-slate-300/80 shadow-lg shadow-slate-200/50"
            : "bg-transparent border-transparent shadow-none"
        }`}
      >
        {/* Brand Logo - Responsive for Mobile & Desktop */}
        <Link href="/" className="inline-flex items-center gap-1.5 shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <div className="block sm:hidden">
            <KynistoLogo showTagline={false} variant={scrolled ? "dark" : "light"} size="sm" />
          </div>
          <div className="hidden sm:block">
            <KynistoLogo showTagline variant={scrolled ? "dark" : "light"} size="sm" />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className={`hidden md:flex items-center gap-1.5 lg:gap-3 text-sm font-semibold mx-2 ${
            scrolled ? "text-slate-700" : "text-white"
          }`}
          aria-label="Main Navigation"
        >
          <Link
            href="/services"
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap ${
              scrolled
                ? "hover:bg-orange-500/10 hover:text-orange-600"
                : "text-white hover:bg-white/20 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] font-bold"
            }`}
          >
            Services
          </Link>
          <Link
            href="/healthcare"
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 whitespace-nowrap ${
              scrolled
                ? "hover:bg-emerald-500/10 hover:text-emerald-600"
                : "text-white hover:bg-white/20 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] font-bold"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Healthcare</span>
          </Link>
          <Link
            href="/blog"
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap ${
              scrolled
                ? "hover:bg-orange-500/10 hover:text-orange-600"
                : "text-white hover:bg-white/20 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] font-bold"
            }`}
          >
            Guides &amp; Blog
          </Link>
          <Link
            href={dashboardHref}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap ${
              scrolled
                ? "hover:bg-orange-500/10 hover:text-orange-600"
                : "text-white hover:bg-white/20 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] font-bold"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/wallet"
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap ${
              scrolled
                ? "hover:bg-orange-500/10 hover:text-orange-600"
                : "text-white hover:bg-white/20 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] font-bold"
            }`}
          >
            Wallet
          </Link>
          <Link
            href="/pricing"
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap ${
              scrolled
                ? "hover:bg-orange-500/10 hover:text-orange-600"
                : "text-white hover:bg-white/20 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] font-bold"
            }`}
          >
            Pricing
          </Link>
        </nav>

        {/* Right CTA / User Greeting Pill & Mobile 3-Dash Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap transition-all hover:shadow-sm ${
                scrolled
                  ? "bg-slate-100 border border-slate-200 hover:border-slate-300 text-slate-800"
                  : "bg-black/35 backdrop-blur-md border border-white/25 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Welcome, {firstName}</span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="text-slate-400 hover:text-rose-400 ml-1 transition-colors text-xs font-bold cursor-pointer"
                title="Sign out"
              >
                {isLoggingOut ? "..." : "✕"}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className={`hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap ${
                scrolled
                  ? "bg-slate-950 hover:bg-slate-900 text-white"
                  : "bg-white hover:bg-slate-100 text-slate-900 font-extrabold"
              }`}
            >
              Sign In
            </Link>
          )}

          {/* User Quick Icon on Mobile if Logged In */}
          {user && (
            <Link
              href={dashboardHref}
              className={`sm:hidden p-1.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                scrolled
                  ? "bg-orange-100 text-orange-700 border border-orange-200"
                  : "bg-black/40 text-white border border-white/20"
              }`}
              title={`Account: ${user.name}`}
            >
              <User className="w-4 h-4" />
            </Link>
          )}

          {/* Mobile 3-Dash Hamburger Menu Button */}
          <div className="md:hidden shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center shadow-md active:scale-90 focus:outline-none focus:ring-2 focus:ring-orange-500/40 ${
                mobileMenuOpen
                  ? "bg-orange-500 text-white shadow-orange-500/30"
                  : scrolled
                  ? "bg-slate-900 text-white hover:bg-slate-800"
                  : "bg-black/40 backdrop-blur-md border border-white/20 text-white hover:bg-black/60"
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
        <div className="md:hidden pointer-events-auto max-w-lg mx-auto mt-2 p-3 sm:p-4 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-2xl text-white space-y-2.5 max-h-[85vh] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* User Greeting & Status Header */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.06] border border-white/10 shadow-inner">
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
            
            {/* 0. Search & Explore */}
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">Search &amp; Discover</div>
                  <div className="text-[10px] text-slate-400">Stores, clinics, doctors &amp; services</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 1. Healthcare */}
            <Link
              href="/healthcare"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Healthcare &amp; OPD</div>
                  <div className="text-[10px] text-slate-400">Live doctor queues &amp; tokens</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            </Link>

            {/* 2. Services */}
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">Home Services</div>
                  <div className="text-[10px] text-slate-400">AC, electrician &amp; plumbing</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 3. Wallet & Passes */}
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">Wallet &amp; Digital Passes</div>
                  <div className="text-[10px] text-slate-400">Loyalty points &amp; cashback</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 4. Dashboard */}
            <Link
              href={dashboardHref}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">Dashboard</div>
                  <div className="text-[10px] text-slate-400">Manage bookings &amp; activity</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 5. Stores & Places */}
            <Link
              href="/#places"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">Local Stores &amp; Places</div>
                  <div className="text-[10px] text-slate-400">Groceries, pharmacies &amp; cafes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 6. Pricing & Plans */}
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">Memberships &amp; Plans</div>
                  <div className="text-[10px] text-slate-400">Unlock VIP pass privileges</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 7. Knowledge Hub & Blog */}
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center shrink-0 shadow-sm">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">Guides &amp; Blog</div>
                  <div className="text-[10px] text-slate-400">Healthcare, locality &amp; business guides</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
            </Link>

            {/* 8. FAQ & Help */}
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] text-white font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 shadow-sm">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">FAQ &amp; Help Center</div>
                  <div className="text-[10px] text-slate-400">Common questions &amp; answers</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
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
                <span>Sign In</span>
              </Link>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
