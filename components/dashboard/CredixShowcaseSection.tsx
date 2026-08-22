"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CobeGlobe } from "@/components/blocks/cobe-globe";

interface DashboardActivity {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  time: string;
  status: string;
  badgeColor: string;
  badgeBg: string;
}

const recentActivities: DashboardActivity[] = [
  {
    id: "act-1",
    icon: "🏥",
    title: "Apex Clinic & Multi-Specialty",
    subtitle: "Dr. Sarah Rao • Token #14 Serving",
    time: "Just now",
    status: "Wait ~3m",
    badgeColor: "#00E5FF",
    badgeBg: "rgba(0, 229, 255, 0.15)",
  },
  {
    id: "act-2",
    icon: "💳",
    title: "Artisan Coffee Roasters",
    subtitle: "Kynisto Loyalty Pass Cashback",
    time: "2m ago",
    status: "₹150 Saved",
    badgeColor: "#10B981",
    badgeBg: "rgba(16, 185, 129, 0.15)",
  },
  {
    id: "act-3",
    icon: "🏪",
    title: "Urban Tech & Electronics",
    subtitle: "Fast Track Express Pickup Ready",
    time: "15m ago",
    status: "Token #29",
    badgeColor: "#F59E0B",
    badgeBg: "rgba(245, 158, 11, 0.15)",
  },
  {
    id: "act-4",
    icon: "💊",
    title: "MedPlus 24/7 Super Pharmacy",
    subtitle: "Prescription QR Order Verified",
    time: "1h ago",
    status: "Ready for Pickup",
    badgeColor: "#3B82F6",
    badgeBg: "rgba(59, 130, 246, 0.15)",
  },
];

export function CredixShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("Overview");

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      // Calculate progress starting from top of hero (0 = top, 1 = scrolled through showcase)
      // When at top of page, progress is 0 (dashboard centered in hero)
      // When scrolled down, progress moves to 1 (dashboard shifts right and tilts)
      const topOffset = rect.top;
      const scrollDistance = windowHeight * 0.7;
      const rawProgress = (windowHeight * 0.35 - topOffset) / scrollDistance;
      const progress = Math.max(0, Math.min(1, rawProgress));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Continuous Scroll 3D Dynamics:
  // At scrollProgress = 0 (in hero): Centered, gentle preview angle (rotateY: 0deg, rotateX: 6deg, rotateZ: 0deg)
  // At scrollProgress = 1 (scrolled down): Shifts right, tilts with left side sinking deep into screen and right side lifting up!
  const rotY = 0 - scrollProgress * 16;      // 0deg -> -16deg (left side tilts inward)
  const rotX = 6 + scrollProgress * 4.5;    // 6deg -> +10.5deg (top tilts back)
  const rotZ = 0 - scrollProgress * 3.5;    // 0deg -> -3.5deg (right side lifts up)
  const scale = 0.96 + scrollProgress * 0.04;

  // Left Content emergence (fades in and slides in as you scroll down)
  const leftTranslateX = Math.max(0, (1 - scrollProgress) * -45);
  const leftOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.05) * 1.3));

  const handleDashboardClick = () => {
    // Navigate to /dashboard (which automatically opens account if logged in, or redirects to /login?returnTo=/dashboard if not)
    router.push("/dashboard");
  };

  return (
    <section
      ref={sectionRef}
      className="w-full max-w-7xl mx-auto px-4 pt-4 pb-20 lg:pb-28 relative overflow-hidden -mt-6 sm:-mt-10"
      style={{ perspective: "1400px" }}
      aria-label="Kynisto Live System Showcase"
    >
      {/* Ambient background aura backlight */}
      <div
        className="absolute -right-10 top-1/4 w-[520px] h-[520px] rounded-full pointer-events-none transition-opacity duration-700"
        style={{
          background: "radial-gradient(circle, rgba(255, 87, 34, 0.15) 0%, rgba(0, 229, 255, 0.08) 45%, transparent 70%)",
          filter: "blur(95px)",
          opacity: 0.4 + scrollProgress * 0.6,
          zIndex: 0,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
        
        {/* LEFT COLUMN: Clean Credix-Style Typography & Capabilities (Slides in as user scrolls) */}
        <div
          className="lg:col-span-5 flex flex-col items-start text-left transition-all duration-700 ease-out"
          style={{
            transform: `translateX(-${leftTranslateX}px)`,
            opacity: leftOpacity,
            pointerEvents: leftOpacity > 0.3 ? "auto" : "none",
          }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/12 text-xs font-bold text-orange-400 mb-5 tracking-wider uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
            <span>UNIFIED SYSTEM • 2026</span>
          </div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-5">
            Banking, Queues & Loyalty, Wherever You Are
          </h2>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Manage your hospital tokens, local store cashbacks, and universal payments on the go with a seamless intelligent experience. Everything is connected in one unified canvas.
          </p>

          {/* Key Quick Badges / CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link
              href="/wallet"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
            >
              Open Loyalty Wallet
            </Link>
            <Link
              href="/healthcare"
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-slate-200 hover:text-white hover:bg-white/[0.1] font-semibold text-sm transition-all"
            >
              Live OPD Queues →
            </Link>
          </div>

          {/* Mini 3D Earth Globe Card */}
          <div className="w-full p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex items-center gap-4 shadow-xl">
            <div className="w-20 h-20 rounded-xl overflow-hidden relative flex-shrink-0 bg-black/40 border border-white/10 flex items-center justify-center">
              <CobeGlobe />
            </div>
            <div>
              <div className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-0.5">
                🌍 Global & Local Sync
              </div>
              <div className="text-sm font-bold text-white">Live Node Telemetry</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Real-time token sync across clinics & stores worldwide.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Starts in Hero & Moves into Right-Tilted Showcase on Scroll */}
        <div
          className={`w-full flex justify-center transition-all duration-700 ease-out cursor-pointer group ${
            scrollProgress > 0.3 ? "lg:col-span-7 lg:justify-end" : "lg:col-span-12 lg:justify-center"
          }`}
          onClick={handleDashboardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") handleDashboardClick();
          }}
          aria-label="Click to open full Kynisto Account Dashboard"
          style={{
            transformStyle: "preserve-3d",
          }}
        >
          {/* Main 3D Dashboard Window Container */}
          <div
            className="w-full max-w-3xl rounded-3xl border border-white/15 bg-[#0b1220]/95 backdrop-blur-2xl text-slate-100 overflow-hidden shadow-2xl shadow-black/90 transition-all duration-500 ease-out group-hover:border-orange-500/50 group-hover:shadow-orange-500/10 relative"
            style={{
              transform: `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scale})`,
              transformOrigin: "center center",
              boxShadow: "0 35px 80px -15px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12), -20px 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Hover Indicator Overlay */}
            <div className="absolute top-3 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-orange-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
              <span>Open Dashboard</span>
              <span>↗</span>
            </div>

            {/* Dashboard Internal 2-Column Grid: Left Sidebar + Right Workspace */}
            <div className="grid grid-cols-12 min-h-[470px]">
              
              {/* Internal Sidebar */}
              <div className="col-span-3 border-r border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hidden sm:flex">
                <div>
                  {/* Brand Header */}
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-black text-xs text-white shadow-md shadow-orange-500/30">
                      K
                    </div>
                    <span className="font-extrabold text-sm text-white tracking-wide">Kynisto OS</span>
                  </div>

                  {/* Real Dashboard Tabs */}
                  <div className="flex flex-col gap-1">
                    {[
                      { name: "Overview", icon: "📊" },
                      { name: "My Wallet", icon: "💳" },
                      { name: "Live OPD", icon: "🏥" },
                      { name: "My Orders", icon: "📦" },
                      { name: "Favorites", icon: "❤️" },
                      { name: "Reviews", icon: "⭐" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                          activeTab === item.name
                            ? "bg-white/15 text-white font-bold"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      >
                        <span className="text-xs">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Sidebar User Info */}
                <div className="flex flex-col gap-1.5 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-[10px] font-bold text-orange-400">
                      👤
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-[11px] font-bold text-white truncate">Member Portal</div>
                      <div className="text-[9px] text-emerald-400 font-semibold">● Signed In</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Real Dashboard Workspace Canvas */}
              <div className="col-span-12 sm:col-span-9 p-4 sm:p-5 flex flex-col gap-4">
                
                {/* Search & Top Telemetry Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      readOnly
                      value="Search my doctor tokens, orders, cards..."
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-300 outline-none pointer-events-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/10 text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-emerald-400">D1 Sync</span>
                  </div>
                </div>

                {/* Top Tiles: Digital Universal Pass & Live OPD Queue Card */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  
                  {/* Real Kynisto Universal Member Card */}
                  <div className="sm:col-span-7 rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#131d36] to-slate-900 border border-white/20 shadow-xl flex flex-col justify-between min-h-[145px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">KYNISTO DIGITAL PASS</span>
                      </div>
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        ★ PLATINUM VIP
                      </span>
                    </div>

                    <div className="my-2 relative z-10">
                      <div className="text-sm font-mono tracking-wider text-white font-bold">KYN-8821-4901-2026</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Verified Account Member</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200 relative z-10">
                      <div>
                        <span className="text-[9px] text-slate-400 block -mb-0.5">Cashback Balance</span>
                        <span className="text-xs font-bold text-emerald-400">₹4,250.00</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">
                        <span>QR Code Active</span>
                        <span>📱</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Active OPD Consultation & Appointment Card */}
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-cyan-500/30 flex items-center justify-between shadow-lg shadow-cyan-500/5">
                      <div>
                        <div className="text-[9px] text-cyan-400 font-bold uppercase tracking-wider">⚡ Live OPD Token</div>
                        <div className="text-xs font-bold text-white mt-0.5">Apex Multi-Specialty</div>
                        <div className="text-[10px] text-slate-300">Dr. Sarah Rao (OPD 02)</div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 block">
                          #14
                        </span>
                        <span className="text-[9px] text-emerald-400 font-semibold block mt-1">
                          Wait ~3m
                        </span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] text-slate-400 font-semibold">Store Reward Points</div>
                        <div className="text-xs font-bold text-amber-300 mt-0.5">1,450 Pts Available</div>
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        100% Redeemable
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Recent Logged-In Activity & Store Visits */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Recent Activity & Token Log</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">Live</span>
                    </span>
                    <span className="text-[10px] text-orange-400 font-semibold group-hover:underline">
                      Click to View All →
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-36 overflow-hidden">
                    {recentActivities.map((act) => (
                      <div
                        key={act.id}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs flex-shrink-0"
                            style={{ background: act.badgeBg, color: act.badgeColor }}
                          >
                            {act.icon}
                          </span>
                          <div className="overflow-hidden">
                            <div className="font-semibold text-white truncate text-[11px]">{act.title}</div>
                            <div className="text-[9px] text-slate-400 truncate">{act.subtitle}</div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                            style={{ background: act.badgeBg, color: act.badgeColor }}
                          >
                            {act.status}
                          </div>
                          <div className="text-[8px] text-slate-500 mt-0.5">{act.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
