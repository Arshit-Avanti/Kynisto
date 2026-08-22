"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
    badge: "Order Fulfilled",
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

export function HeroDashboardMockup() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "queue" | "rewards">("overview");

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;
      // Progress from 0 (at bottom of screen) to 1 (at center/top)
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight * 0.9)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Compute 3D tilt based on scroll: starts inclined at 14deg, rolls flat to 0deg as you scroll down
  const tiltDeg = Math.max(0, 14 * (1 - scrollProgress * 0.95));
  const scaleVal = 0.96 + 0.04 * scrollProgress;
  const shadowIntensity = 0.2 + 0.35 * scrollProgress;

  return (
    <div
      ref={containerRef}
      className="hero-dashboard-mockup-wrapper w-full max-w-5xl mx-auto px-4 mt-8 mb-16 relative"
      style={{
        perspective: "1200px",
        zIndex: 5,
      }}
    >
      {/* Dynamic Ambient Underglow Aura */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-60 pointer-events-none transition-all duration-700"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,122,0,0.22) 0%, rgba(0,212,255,0.18) 45%, transparent 70%)",
          filter: "blur(40px)",
          transform: `translateY(${10 * (1 - scrollProgress)}px)`,
        }}
      />

      {/* Main 3D Perspective Glassmorphic Dashboard Window */}
      <div
        className="hero-dashboard-card rounded-2xl border border-white/15 bg-slate-950/80 backdrop-blur-2xl text-slate-100 overflow-hidden transition-all duration-300 ease-out"
        style={{
          transform: `rotateX(${tiltDeg}deg) scale(${scaleVal}) translateZ(0)`,
          boxShadow: `0 ${20 + 30 * scrollProgress}px ${40 + 40 * scrollProgress}px -10px rgba(0, 0, 0, ${shadowIntensity}), 0 0 0 1px rgba(255, 255, 255, 0.12), 0 0 35px rgba(255, 122, 0, 0.15)`,
          transformOrigin: "center top",
          willChange: "transform, box-shadow",
        }}
      >
        {/* Top Window Bar with macOS Controls & Live Status */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/[0.04] border-b border-white/10 select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#FF5F56] border border-black/20 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#FFBD2E] border border-black/20 inline-block" />
            <span className="w-3 h-3 rounded-full bg-[#27C93F] border border-black/20 inline-block" />
            <span className="ml-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
              Kynisto Core OS • Live Stream
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/10 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 -ml-3" />
            <span className="font-semibold text-slate-200">1,480 Local Nodes Connected</span>
          </div>

          <div className="hidden sm:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10 text-xs">
            {(["overview", "queue", "rewards"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md capitalize font-medium transition-all ${
                  activeTab === tab
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: KPI Metric Cards & Interactive Performance Sparkline (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 3 Key Metric Tiles */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-orange-500/40 transition-colors">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Live Footfall</span>
                  <span className="text-emerald-400 text-[10px]">↑ 28%</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-white mt-1">42,890</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Visits Today</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-cyan-500/40 transition-colors">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Queue Efficiency</span>
                  <span className="text-cyan-400 text-[10px]">⚡ Realtime</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-cyan-300 mt-1">4.2 min</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Average Turn Time</div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-colors">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                  <span>Rewards Paid</span>
                  <span className="text-amber-400 text-[10px]">★ 99.8%</span>
                </div>
                <div className="text-lg sm:text-xl font-bold text-amber-300 mt-1">₹1.48M</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Points Redeemed</div>
              </div>
            </div>

            {/* Performance Flow Wave Visualizer */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/10 relative overflow-hidden flex-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>⚡ Live Network Throughput</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      Sub-20ms Sync
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">Stores, queues, & medical check-ins synchronized instantly</p>
                </div>
                <Link
                  href="/dashboard"
                  className="text-xs text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-1"
                >
                  View Portal →
                </Link>
              </div>

              {/* Animated SVG Wave Chart */}
              <div className="w-full h-28 relative flex items-end">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.35" />
                      <stop offset="60%" stopColor="#00D4FF" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF7A00" />
                      <stop offset="50%" stopColor="#FFB300" />
                      <stop offset="100%" stopColor="#00E5FF" />
                    </linearGradient>
                  </defs>
                  {/* Fill Area */}
                  <path
                    d="M 0 80 Q 50 20, 100 55 T 200 40 T 300 15 T 400 35 L 400 100 L 0 100 Z"
                    fill="url(#chartGradient)"
                  />
                  {/* Glowing Stroke Line */}
                  <path
                    d="M 0 80 Q 50 20, 100 55 T 200 40 T 300 15 T 400 35"
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  {/* Live Pulse Node */}
                  <circle cx="300" cy="15" r="4" fill="#00E5FF" className="animate-ping" />
                  <circle cx="300" cy="15" r="4" fill="#FFFFFF" />
                </svg>
              </div>

              {/* Chart Footer Indicators */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                <span>09:00 AM</span>
                <span>12:00 PM</span>
                <span>03:00 PM</span>
                <span>06:00 PM</span>
                <span className="font-semibold text-emerald-400">Peak Efficiency 99.8%</span>
              </div>
            </div>
          </div>

          {/* Right Column: Pinterest Credix Scrolling Animation Live Stream (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                Live Activity Stream
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Real-Time WebSocket</span>
            </div>

            {/* Continuous Scrolling Marquee / Feed Container */}
            <div className="relative h-64 overflow-hidden rounded-xl bg-black/30 border border-white/5 p-2">
              {/* Fade masks at top and bottom */}
              <div className="absolute top-0 inset-x-0 h-6 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
              <div className="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

              {/* Scrolling List with Continuous CSS Keyframe Animation */}
              <div className="flex flex-col gap-2 animate-continuous-scroll hover:[animation-play-state:paused]">
                {/* Render activities twice for seamless infinite loop */}
                {[...mockActivities, ...mockActivities].map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0"
                        style={{
                          background: `${item.badgeColor}22`,
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeColor}44`,
                        }}
                      >
                        {item.type === "health" ? "🏥" : item.type === "loyalty" ? "★" : item.type === "store" ? "🏪" : "⏱️"}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-white truncate">{item.title}</div>
                        <div className="text-[10px] text-slate-400 truncate">{item.detail}</div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded"
                        style={{
                          background: `${item.badgeColor}20`,
                          color: item.badgeColor,
                          border: `1px solid ${item.badgeColor}33`,
                        }}
                      >
                        {item.amount || item.badge}
                      </span>
                      <div className="text-[9px] text-slate-500 mt-0.5">{item.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Action Navigation Bar */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Link
                href="/healthcare"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors"
              >
                <span>🏥 Join Doctor Queue</span>
              </Link>
              <Link
                href="/wallet"
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-amber-500/20 hover:from-orange-500/30 hover:to-amber-500/30 border border-orange-500/30 text-xs font-semibold text-orange-300 transition-colors"
              >
                <span>★ Loyalty Cards</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
