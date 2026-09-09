"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/client-api";
import { turboTouch } from "@/lib/turbotouch";
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
  ownerType?: "shop" | "healthcare";
}

export function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname() || "/";
  const [user, setUser] = useState<MobileNavUser | null>(null);

  useEffect(() => {
    let active = true;
    // Proactively pre-warm top-level tab routes into client router cache
    try {
      router.prefetch("/healthcare");
      router.prefetch("/services");
      router.prefetch("/wallet");
    } catch {}

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
  }, [router]);

  const dashboardHref =
    user?.role === "admin"
      ? "/admin"
      : user?.role === "store_owner"
      ? user.ownerType === "healthcare"
        ? "/healthcare/dashboard"
        : "/owner"
      : user
      ? "/account"
      : "/login?returnTo=/account";

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "/",
      icon: Home,
      isActive: pathname === "/",
      ariaLabel: "Home Tab",
    },
    {
      id: "healthcare",
      label: "Healthcare",
      href: "/healthcare",
      icon: Stethoscope,
      isActive: pathname === "/healthcare" || pathname.startsWith("/healthcare?") || pathname.startsWith("/queue"),
      ariaLabel: "Healthcare Tab",
    },
    {
      id: "services",
      label: "Services",
      href: "/services",
      icon: Briefcase,
      isActive: pathname.startsWith("/services"),
      ariaLabel: "Services Tab",
    },
    {
      id: "wallet",
      label: "Wallet",
      href: "/wallet",
      icon: Wallet,
      isActive: pathname.startsWith("/wallet"),
      ariaLabel: "Wallet Tab",
    },
    {
      id: "account",
      label: "Account",
      href: dashboardHref,
      icon: user ? LayoutDashboard : User,
      isActive:
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/account") ||
        pathname.startsWith("/owner") ||
        pathname.startsWith("/healthcare/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login"),
      ariaLabel: "Account Tab",
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-3 left-0 right-0 z-[999999] px-4 pointer-events-none transition-all duration-300 pb-[env(safe-area-inset-bottom,0.25rem)]"
      aria-label="Floating Mobile Bottom Navigation"
    >
      <div className="relative max-w-[360px] mx-auto pointer-events-auto select-none">
        {/* Luxury Glassmorphism Dock */}
        <div className="bg-slate-950/90 backdrop-blur-2xl border border-white/20 rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_20px_rgba(249,115,22,0.15)] px-2 py-1.5 flex items-center justify-between gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive;

            return (
              <Link
                key={item.id}
                href={item.href}
                prefetch={true}
                onTouchStart={() => {
                  try { router.prefetch(item.href); } catch {}
                }}
                onPointerDown={() => {
                  turboTouch.haptic(8);
                  try { router.prefetch(item.href); } catch {}
                }}
                onMouseEnter={() => {
                  try { router.prefetch(item.href); } catch {}
                }}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-150 group focus:outline-none ${
                  isActive
                    ? "bg-gradient-to-tr from-orange-500/30 to-amber-500/20 border border-orange-500/50 text-orange-400 shadow-sm shadow-orange-500/10 scale-105"
                    : "text-slate-200 hover:text-white active:scale-95"
                }`}
                aria-label={item.ariaLabel}
              >
                <div className="relative flex items-center justify-center">
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 ${
                      isActive ? "text-orange-400 stroke-[2.5]" : "text-slate-200 group-hover:text-white stroke-[2]"
                    }`}
                  />
                  {item.id === "healthcare" && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-slate-950" />
                  )}
                </div>

                <span
                  style={{ color: isActive ? "#FFFFFF" : "#F1F5F9" }}
                  className={`mobileDockLabel text-[10px] sm:text-[10.5px] tracking-tight mt-0.5 select-none transition-colors duration-200 leading-none ${
                    isActive ? "font-black text-white drop-shadow-xs" : "font-bold text-slate-100"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
