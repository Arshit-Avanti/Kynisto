"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
      isActive: pathname.startsWith("/healthcare") || pathname.startsWith("/queue"),
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
        pathname.startsWith("/admin") ||
        pathname.startsWith("/login"),
      ariaLabel: "Account Tab",
    },
  ];

  // Determine active item index (0 to 4)
  const currentActiveIndex = navItems.findIndex((item) => item.isActive);
  const [activeIndex, setActiveIndex] = useState(
    currentActiveIndex !== -1 ? currentActiveIndex : 0
  );

  useEffect(() => {
    const idx = navItems.findIndex((item) => item.isActive);
    if (idx !== -1) {
      setActiveIndex(idx);
    }
  }, [pathname]);

  const ActiveIcon = navItems[activeIndex]?.icon || Home;

  return (
    <nav
      className="md:hidden fixed bottom-3 sm:bottom-5 left-0 right-0 z-[999999] px-3 pointer-events-none transition-all duration-300 pb-[env(safe-area-inset-bottom,0.25rem)]"
      aria-label="Floating Curved Mobile Bottom Navigation"
    >
      <div className="mobileCurvedNavWrapper relative max-w-[360px] sm:max-w-[380px] mx-auto pointer-events-auto select-none">
        
        {/* 1. ELEVATED FLOATING CIRCULAR BUBBLE INDICATOR */}
        <div
          className="absolute -top-5 z-30 pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            left: `${activeIndex * 20}%`,
            width: "20%",
          }}
        >
          <div className="mx-auto w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#0A101D] border-2 border-orange-500/80 shadow-[0_8px_24px_rgba(0,0,0,0.8),0_0_16px_rgba(249,115,22,0.35)] flex items-center justify-center transform transition-transform duration-300">
            <ActiveIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 stroke-[2.2] animate-[bubblePop_0.35s_ease-out]" />
          </div>
        </div>

        {/* 2. MAIN NAVBAR BODY WITH SCOOPED CURVED NOTCH */}
        <div className="relative bg-[#0A101D] border border-white/15 rounded-[28px] shadow-[0_16px_40px_rgba(0,0,0,0.85),0_0_24px_rgba(249,115,22,0.12)] px-1 pt-2.5 pb-2">
          
          {/* Smooth Scooped Wave Notch Overlay */}
          <div
            className="absolute -top-[13px] pointer-events-none transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20"
            style={{
              left: `${activeIndex * 20}%`,
              width: "20%",
            }}
          >
            <div className="w-[68px] h-[22px] mx-auto relative flex items-center justify-center">
              <svg
                viewBox="0 0 68 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-[#0A101D]"
              >
                <path
                  d="M0 0 C12 0 16 18 34 18 C52 18 56 0 68 0 V22 H0 Z"
                  fill="#0A101D"
                />
              </svg>
            </div>
          </div>

          {/* 3. FIVE NAVIGATION ITEMS */}
          <div className="relative z-20 flex items-center justify-between">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeIndex === index;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setActiveIndex(index)}
                  className="flex-1 flex flex-col items-center justify-center py-1 relative group focus:outline-none"
                  aria-label={item.ariaLabel}
                >
                  {/* Icon Slot (Hidden or lowered when active because elevated bubble takes over) */}
                  <div
                    className={`w-6 h-6 flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? "opacity-0 -translate-y-2 pointer-events-none scale-75"
                        : "opacity-100 translate-y-0 text-slate-400 group-hover:text-white"
                    }`}
                  >
                    <Icon className="w-5 h-5 stroke-[1.8]" />
                  </div>

                  {/* Label */}
                  <span
                    className={`text-[10px] sm:text-[11px] tracking-tight mt-1 select-none transition-all duration-300 ${
                      isActive
                        ? "text-white font-extrabold translate-y-0.5 scale-105"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

        </div>

      </div>
    </nav>
  );
}
