"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
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
    if (initialUser !== undefined) {
      setUser(initialUser ?? null);
    }
  }, [initialUser]);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const isPast = window.scrollY > 15;
          setScrolled((prev) => (prev !== isPast ? isPast : prev));
          ticking = false;
        });
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // If initialUser was explicitly provided (including null for guests), do not fetch /api/auth/me
    if (initialUser !== undefined) return;

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
  }, [user, initialUser]);

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
      try {
        const { signOutSupabaseBrowser } = await import("@/lib/supabase-browser");
        await signOutSupabaseBrowser().catch(() => undefined);
      } catch {}
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
        data-scroll-idle="bg-transparent border-transparent shadow-none"
        className={`max-w-6xl mx-auto rounded-full transition-all duration-300 pointer-events-auto border flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2.5 ${
          scrolled
            ? "bg-white/95 backdrop-blur-xl border-slate-200/90 shadow-[0_12px_36px_rgba(0,0,0,0.08)]"
            : "bg-white/90 backdrop-blur-lg border-slate-200/80 shadow-sm"
        }`}
      >
        {/* Brand Logo - Responsive for Mobile & Desktop */}
        <Link href="/" className="inline-flex items-center gap-1.5 shrink-0" onClick={() => setMobileMenuOpen(false)}>
          <div className="block sm:hidden">
            <KynistoLogo showTagline={false} variant="light" size="sm" />
          </div>
          <div className="hidden sm:block">
            <KynistoLogo showTagline variant="light" size="sm" />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-1.5 lg:gap-2.5 text-sm font-semibold mx-2 text-slate-800"
          aria-label="Main Navigation"
        >
          <Link
            href="/services"
            prefetch={true}
            onTouchStart={() => { try { router.prefetch("/services"); } catch {} }}
            onMouseEnter={() => { try { router.prefetch("/services"); } catch {} }}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap font-bold ${
              pathname.startsWith("/services")
                ? "bg-orange-50 text-orange-600 font-extrabold shadow-2xs"
                : "text-slate-700 hover:text-orange-600 hover:bg-slate-100/80"
            }`}
          >
            Services
          </Link>
          <Link
            href="/healthcare"
            prefetch={true}
            onTouchStart={() => { try { router.prefetch("/healthcare"); } catch {} }}
            onMouseEnter={() => { try { router.prefetch("/healthcare"); } catch {} }}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center gap-1.5 whitespace-nowrap font-bold ${
              pathname.startsWith("/healthcare")
                ? "bg-emerald-50 text-emerald-700 font-extrabold shadow-2xs"
                : "text-slate-700 hover:text-emerald-600 hover:bg-slate-100/80"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Healthcare</span>
          </Link>
          <Link
            href="/blog"
            prefetch={true}
            onTouchStart={() => { try { router.prefetch("/blog"); } catch {} }}
            onMouseEnter={() => { try { router.prefetch("/blog"); } catch {} }}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap font-bold ${
              pathname.startsWith("/blog")
                ? "bg-orange-50 text-orange-600 font-extrabold shadow-2xs"
                : "text-slate-700 hover:text-orange-600 hover:bg-slate-100/80"
            }`}
          >
            Guides &amp; Blog
          </Link>
          <Link
            href={dashboardHref}
            prefetch={true}
            onTouchStart={() => { try { router.prefetch(dashboardHref); } catch {} }}
            onMouseEnter={() => { try { router.prefetch(dashboardHref); } catch {} }}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap font-bold ${
              pathname.startsWith("/admin") || pathname.startsWith("/owner") || pathname.startsWith("/account")
                ? "bg-orange-50 text-orange-600 font-extrabold shadow-2xs"
                : "text-slate-700 hover:text-orange-600 hover:bg-slate-100/80"
            }`}
          >
            Dashboard
          </Link>
          <Link
            href="/wallet"
            prefetch={true}
            onTouchStart={() => { try { router.prefetch("/wallet"); } catch {} }}
            onMouseEnter={() => { try { router.prefetch("/wallet"); } catch {} }}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap font-bold ${
              pathname.startsWith("/wallet")
                ? "bg-amber-50 text-amber-700 font-extrabold shadow-2xs"
                : "text-slate-700 hover:text-amber-600 hover:bg-slate-100/80"
            }`}
          >
            Wallet
          </Link>
          <Link
            href="/pricing"
            prefetch={true}
            onTouchStart={() => { try { router.prefetch("/pricing"); } catch {} }}
            onMouseEnter={() => { try { router.prefetch("/pricing"); } catch {} }}
            className={`px-3 py-1.5 rounded-full transition-all duration-200 hover:-translate-y-0.5 active:scale-95 whitespace-nowrap font-bold ${
              pathname.startsWith("/pricing")
                ? "bg-orange-500 text-white font-extrabold shadow-sm"
                : "text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            }`}
          >
            Pricing
          </Link>
        </nav>

        {/* Right CTA / User Greeting Pill & Mobile 3-Dash Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user ? (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold shrink-0 whitespace-nowrap transition-all hover:shadow-xs bg-slate-100/90 border border-slate-200 text-slate-800"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Welcome, {firstName}</span>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={isLoggingOut}
                className="text-slate-400 hover:text-rose-500 ml-1 transition-colors text-xs font-bold cursor-pointer"
                title="Sign out"
              >
                {isLoggingOut ? "..." : "✕"}
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all whitespace-nowrap bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold"
            >
              Sign In
            </Link>
          )}

          {/* User Quick Icon on Mobile if Logged In */}
          {user && (
            <Link
              href={dashboardHref}
              className="sm:hidden p-1.5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs"
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
              className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center shadow-xs active:scale-90 focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer ${
                mobileMenuOpen
                  ? "bg-orange-500 text-white shadow-orange-500/30"
                  : "bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 hover:bg-slate-100"
              }`}
              aria-label="Open Kynisto navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-white" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile 3-Dash Floating Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden pointer-events-auto max-w-lg mx-auto mt-2 p-3 sm:p-4 rounded-3xl bg-white/98 backdrop-blur-2xl border border-slate-200 shadow-2xl text-slate-900 space-y-2.5 max-h-[85vh] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* User Greeting & Status Header */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : "K"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">
                  {user?.name || "Welcome to Kynisto"}
                </div>
                <div className="text-[10px] text-slate-500 truncate">
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
              <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 text-[9px] font-bold uppercase shrink-0">
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
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Search &amp; Discover</div>
                  <div className="text-[10px] text-slate-500">Stores, clinics, doctors &amp; services</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            {/* 1. Healthcare */}
            <Link
              href="/healthcare"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Healthcare &amp; OPD</div>
                  <div className="text-[10px] text-slate-500">Live doctor queues &amp; tokens</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live
              </span>
            </Link>

            {/* 2. Services */}
            <Link
              href="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">Home Services</div>
                  <div className="text-[10px] text-slate-500">AC, electrician &amp; plumbing</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            {/* 3. Wallet & Passes */}
            <Link
              href="/wallet"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">Wallet &amp; Digital Passes</div>
                  <div className="text-[10px] text-slate-500">Loyalty points &amp; cashback</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            {/* 4. Dashboard */}
            <Link
              href={dashboardHref}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Dashboard</div>
                  <div className="text-[10px] text-slate-500">Manage bookings &amp; activity</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            {/* 5. Stores & Places */}
            <Link
              href="/#places"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition-colors">Local Stores &amp; Places</div>
                  <div className="text-[10px] text-slate-500">Groceries, pharmacies &amp; cafes</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            {/* 6. Pricing & Plans */}
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Memberships &amp; Plans</div>
                  <div className="text-[10px] text-slate-500">Unlock VIP pass privileges</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            {/* 7. Knowledge Hub & Blog */}
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Guides &amp; Blog</div>
                  <div className="text-[10px] text-slate-500">Healthcare, locality &amp; business guides</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>

            {/* 8. FAQ & Help */}
            <Link
              href="/faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-2.5 px-3 rounded-2xl hover:bg-slate-100 active:bg-slate-200/80 text-slate-800 font-semibold text-xs transition-all duration-150 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-sky-700 transition-colors">FAQ &amp; Help Center</div>
                  <div className="text-[10px] text-slate-500">Common questions &amp; answers</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
            </Link>
          </div>

          {/* Footer Auth Actions (Sign Out / Sign In) */}
          <div className="pt-2 border-t border-slate-200">
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold text-xs transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isLoggingOut ? "Signing Out..." : "Sign Out"}</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all text-center"
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
