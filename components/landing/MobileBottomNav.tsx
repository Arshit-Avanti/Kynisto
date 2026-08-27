"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/client-api";
import {
  Home,
  Stethoscope,
  Briefcase,
  Wallet,
  User,
  LayoutDashboard,
} from "lucide-react";

interface MobileNavUser {
  id: string;
  name?: string;
  role?: "admin" | "store_owner" | "customer";
}

export function MobileBottomNav() {
  const pathname = usePathname() || "/";
  const [user, setUser] = useState<MobileNavUser | null>(null);

  useEffect(() => {
    let active = true;
    const checkUser = async () => {
      try {
        const res = await apiFetch<{ user: MobileNavUser | null }>("/api/auth/me");
        if (active && res?.user) {
          setUser(res.user);
        }
      } catch {
        // Guest mode fallback
      }
    };
    void checkUser();
    return () => {
      active = false;
    };
  }, []);

  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "store_owner"
      ? "/owner"
      : user
      ? "/account"
      : "/login?returnTo=/account";

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
      ariaLabel: "Kynisto Home",
    },
    {
      label: "Health",
      href: "/healthcare",
      icon: Stethoscope,
      isActive: pathname.startsWith("/healthcare") || pathname.startsWith("/queue"),
      hasLiveBadge: true,
      ariaLabel: "Healthcare OPD Queues",
    },
    {
      label: "Services",
      href: "/services",
      icon: Briefcase,
      isActive: pathname.startsWith("/services"),
      ariaLabel: "Home Services",
    },
    {
      label: "Wallet",
      href: "/wallet",
      icon: Wallet,
      isActive: pathname.startsWith("/wallet"),
      ariaLabel: "My Wallet",
    },
    {
      label: user ? "Dashboard" : "Account",
      href: dashboardHref,
      icon: user ? LayoutDashboard : User,
      isActive:
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/owner") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login"),
      ariaLabel: "Account Dashboard",
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-4 sm:bottom-6 left-0 right-0 z-[999999] px-3 pointer-events-none transition-all duration-300 pb-[env(safe-area-inset-bottom,0.25rem)]"
      aria-label="Floating Mobile Bottom Navigation"
    >
      <div className="mobileBottomDock pointer-events-auto max-w-[360px] sm:max-w-[380px] mx-auto rounded-full bg-slate-950/95 backdrop-blur-2xl border border-white/15 px-2 py-1.5 shadow-[0_16px_45px_rgba(0,0,0,0.9),0_0_25px_rgba(249,115,22,0.25)] flex items-center justify-around transition-all">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`mobileDockItem relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-200 ${
                active
                  ? "bg-gradient-to-tr from-orange-500/25 to-amber-500/25 border border-orange-500/60 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.35)] scale-105"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.08] active:scale-95"
              }`}
              aria-label={item.ariaLabel}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    active ? "text-orange-400 scale-110" : "text-slate-300"
                  }`}
                />

                {/* Live Pulse Dot for Healthcare */}
                {item.hasLiveBadge && (
                  <span className="absolute -top-0.5 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] font-bold tracking-tight mt-0.5 whitespace-nowrap leading-none transition-colors select-none ${
                  active ? "text-white drop-shadow font-extrabold" : "text-slate-400 font-medium"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
