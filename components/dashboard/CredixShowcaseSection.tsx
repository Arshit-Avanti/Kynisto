"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CobeGlobe } from "@/components/blocks/cobe-globe";

interface ActivityItem {
  id: string;
  type: "queue" | "loyalty" | "health" | "store";
  title: string;
  detail: string;
  time: string;
  badge: string;
  badgeColor: string;
  amount?: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: "act-1",
    type: "health",
    title: "Apex Multi-Specialty Clinic",
    detail: "Dr. Sarah Rao • Token #14 Called",
    time: "Just now",
    badge: "Active Queue",
    badgeColor: "#00E5FF",
    amount: "Wait ~3m",
  },
  {
    id: "act-2",
    type: "loyalty",
    title: "Artisan Coffee Roasters",
    detail: "Member #KY-8821 redeemed 150 pts",
    time: "1m ago",
    badge: "Reward Claimed",
    badgeColor: "#00E676",
    amount: "₹150 OFF",
  },
  {
    id: "act-3",
    type: "store",
    title: "Urban Tech & Gadgets",
    detail: "Fast Track Express Pickup Ready",
    time: "3m ago",
    badge: "Order Ready",
    badgeColor: "#FF9100",
    amount: "Token #29",
  },
  {
    id: "act-4",
    type: "queue",
    title: "Central Diagnostics & Lab",
    detail: "Blood Sample & X-Ray • Token #08",
    time: "4m ago",
    badge: "Next in Line",
    badgeColor: "#3B82F6",
    amount: "Room 102",
  },
  {
    id: "act-5",
    type: "loyalty",
    title: "Green Earth Organics",
    detail: "Tier 1 Platinum Membership Activated",
    time: "6m ago",
    badge: "Tier Upgrade",
    badgeColor: "#A855F7",
    amount: "+500 Pts",
  },
  {
    id: "act-6",
    type: "health",
    title: "CarePlus Pediatric Wing",
    detail: "Dr. Arvind Mehta • Token #05 Serving",
    time: "8m ago",
    badge: "In Consultation",
    badgeColor: "#00E5FF",
    amount: "OPD 04",
  },
];

export function CredixShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "rewards">("overview");

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;
      
      // Calculate how far the showcase section has entered the viewport
      // 0 = when section just enters from bottom, 1 = fully in view
      const rawProgress = (windowHeight - rect.top) / (windowHeight + rect.height * 0.4);
      const progress = Math.max(0, Math.min(1, rawProgress));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll animations:
  // Center dashboard slides down and expands into place
  const dashboardTranslateY = Math.max(0, (1 - scrollProgress) * 45);
  const dashboardScale = 0.94 + 0.06 * scrollProgress;
  
  // Side features slide inward from left and right as dashboard comes down
  const sideOffset = Math.max(0, (1 - scrollProgress) * 35);
  const sideOpacity = Math.min(1, scrollProgress * 1.3);

  return (
    <section
      ref={sectionRef}
      className="credix-showcase-section w-full max-w-7xl mx-auto px-4 py-12 relative overflow-hidden"
      aria-label="Platform Architecture & Live Ecosystem"
    >
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/12 text-xs font-bold text-orange-400 mb-3 tracking-wider uppercase">
          <span>⚡ CORE CAPABILITIES</span>
        </div>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
          Everything Connected in One Unified Canvas
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-2">
          Watch live queues, store transactions, and medical appointments sync in real time.
        </p>
      </div>

      {/* Dynamic 3-Column Layout: Left Features | Center Sliding Dashboard | Right Features */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT FLANKING FEATURES (3 Cols on LG) */}
        <div
          className="lg:col-span-3 flex flex-col gap-5 transition-all duration-700 ease-out"
          style={{
            transform: `translateX(-${sideOffset}px)`,
            opacity: sideOpacity,
          }}
        >
          {/* Feature 1: Real-time Queues */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:border-cyan-500/40 transition-all shadow-xl group">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Smart Hospital & Store Queues</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Skip waiting rooms completely. Track live token calls on your phone and arrive exactly when it&apos;s your turn.
            </p>
            <Link
              href="/healthcare"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <span>Explore OPD Queues</span>
              <span>→</span>
            </Link>
          </div>

          {/* Feature 2: Universal Discovery */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:border-orange-500/40 transition-all shadow-xl group">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mb-3 group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Proximity Discovery</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Locate verified stores, pharmacies, restaurants, and medical centers near you with sub-second accuracy.
            </p>
            <a
              href="#places"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:text-orange-300"
            >
              <span>View Directory</span>
              <span>↓</span>
            </a>
          </div>
        </div>

        {/* CENTER SLIDING DASHBOARD SHOWCASE (6 Cols on LG) */}
        <div
          className="lg:col-span-6 flex flex-col transition-all duration-500 ease-out"
          style={{
            transform: `translateY(${dashboardTranslateY}px) scale(${dashboardScale})`,
          }}
        >
          {/* Main 3D Glass Dashboard Window */}
          <div className="rounded-2xl border border-white/15 bg-slate-950/85 backdrop-blur-2xl text-slate-100 overflow-hidden shadow-2xl shadow-black/80 relative">
            {/* Top Window Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10 select-none">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#FF5F56] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#FFBD2E] inline-block" />
                <span className="w-3 h-3 rounded-full bg-[#27C93F] inline-block" />
                <span className="ml-2 text-xs font-semibold tracking-wider text-slate-400 uppercase hidden sm:inline">
                  Kynisto Core OS
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full border border-white/10 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-2.5" />
                <span className="font-semibold text-slate-200">1,480 Active Nodes</span>
              </div>

              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
                {(["overview", "queue", "rewards"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-0.5 rounded capitalize font-medium transition-all ${
                      activeTab === tab
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Dashboard Body */}
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {/* 3 Metric Tiles */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-semibold text-slate-400">Live Footfall</div>
                  <div className="text-base sm:text-lg font-bold text-white mt-0.5">42.8k</div>
                  <div className="text-[9px] text-emerald-400">↑ 28% Today</div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-semibold text-slate-400">Queue Time</div>
                  <div className="text-base sm:text-lg font-bold text-cyan-300 mt-0.5">4.2 min</div>
                  <div className="text-[9px] text-cyan-400">⚡ Realtime</div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="text-[10px] font-semibold text-slate-400">Rewards Paid</div>
                  <div className="text-base sm:text-lg font-bold text-amber-300 mt-0.5">₹1.48M</div>
                  <div className="text-[9px] text-amber-400">★ 99.8% Claimed</div>
                </div>
              </div>

              {/* Performance Flow Wave Visualizer */}
              <div className="p-3.5 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>⚡ Live Throughput</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Sub-20ms
                    </span>
                  </span>
                  <Link href="/dashboard" className="text-[11px] text-orange-400 hover:text-orange-300 font-semibold">
                    Open Dashboard →
                  </Link>
                </div>

                {/* Animated SVG Sparkline Wave */}
                <div className="w-full h-20 relative flex items-end">
                  <svg className="w-full h-full overflow-visible" viewBox="0 0 400 90" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="showcaseChartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.35" />
                        <stop offset="70%" stopColor="#00D4FF" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="showcaseLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FF7A00" />
                        <stop offset="50%" stopColor="#FFB300" />
                        <stop offset="100%" stopColor="#00E5FF" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 70 Q 50 15, 100 48 T 200 35 T 300 12 T 400 30 L 400 90 L 0 90 Z"
                      fill="url(#showcaseChartGrad)"
                    />
                    <path
                      d="M 0 70 Q 50 15, 100 48 T 200 35 T 300 12 T 400 30"
                      fill="none"
                      stroke="url(#showcaseLineGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx="300" cy="12" r="3.5" fill="#00E5FF" className="animate-ping" />
                    <circle cx="300" cy="12" r="3.5" fill="#FFFFFF" />
                  </svg>
                </div>
              </div>

              {/* Credix Live Activity Scrolling Feed */}
              <div className="relative h-48 overflow-hidden rounded-xl bg-black/30 border border-white/5 p-2">
                <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

                <div className="flex flex-col gap-1.5 animate-continuous-scroll hover:[animation-play-state:paused]">
                  {[...mockActivities, ...mockActivities].map((item, idx) => (
                    <div
                      key={`${item.id}-${idx}`}
                      className="p-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span
                          className="w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] flex-shrink-0"
                          style={{
                            background: `${item.badgeColor}22`,
                            color: item.badgeColor,
                            border: `1px solid ${item.badgeColor}44`,
                          }}
                        >
                          {item.type === "health" ? "🏥" : item.type === "loyalty" ? "★" : item.type === "store" ? "🏪" : "⏱️"}
                        </span>
                        <div className="overflow-hidden">
                          <div className="font-semibold text-white truncate text-[11px]">{item.title}</div>
                          <div className="text-[9px] text-slate-400 truncate">{item.detail}</div>
                        </div>
                      </div>

                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{
                          background: `${item.badgeColor}20`,
                          color: item.badgeColor,
                        }}
                      >
                        {item.amount || item.badge}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FLANKING FEATURES (3 Cols on LG) */}
        <div
          className="lg:col-span-3 flex flex-col gap-5 transition-all duration-700 ease-out"
          style={{
            transform: `translateX(${sideOffset}px)`,
            opacity: sideOpacity,
          }}
        >
          {/* Feature 3: Unified Loyalty */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:border-emerald-500/40 transition-all shadow-xl group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-1.5">Universal Loyalty Pass</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              One digital wallet for every store. Earn points, unlock cashback, and redeem rewards instantly.
            </p>
            <Link
              href="/wallet"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
            >
              <span>Open My Wallet</span>
              <span>→</span>
            </Link>
          </div>

          {/* Feature 4: Three.js Interactive 3D Earth Globe */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl hover:border-orange-500/40 transition-all shadow-xl flex flex-col justify-between overflow-hidden relative">
            <div className="mb-2">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-1">
                <span>🌍 Global & Local Sync</span>
              </div>
              <h3 className="text-sm font-bold text-white">Live Earth Node</h3>
            </div>

            {/* Embedded Three.js 3D Earth */}
            <div className="w-full h-44 rounded-xl overflow-hidden relative flex items-center justify-center bg-black/40 border border-white/5">
              <CobeGlobe />
            </div>

            <p className="text-[10px] text-slate-400 mt-2 text-center">
              Drag to rotate • Real-time coordinate mapping
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
