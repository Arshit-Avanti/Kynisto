"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CobeGlobe } from "@/components/blocks/cobe-globe";

interface TransactionItem {
  id: string;
  icon: string;
  title: string;
  date: string;
  amount: string;
}

const recentTransactions: TransactionItem[] = [
  {
    id: "tx-1",
    icon: "🚖",
    title: "Taxi Trips",
    date: "05 Aug 2026, 10:15",
    amount: "₹56.50",
  },
  {
    id: "tx-2",
    icon: "🚆",
    title: "Public Transport",
    date: "01 Aug 2026, 12:01",
    amount: "₹2.50",
  },
  {
    id: "tx-3",
    icon: "✈️",
    title: "Plane Tickets",
    date: "28 Jul 2026, 21:40",
    amount: "₹70.00",
  },
  {
    id: "tx-4",
    icon: "⛽",
    title: "Gas Station",
    date: "28 Jul 2026, 09:28",
    amount: "₹30.75",
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

      // Calculate progress starting from top of hero (0 = top, 1 = scrolled into showcase)
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
      aria-label="Credix SaaS Showcase"
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
            Banking, Anytime, Wherever You Are
          </h2>

          {/* Subtitle */}
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8 max-w-lg">
            Manage your finances, doctor OPD tokens, and loyalty cashbacks on the go with a seamless mobile experience. Whether you&apos;re transferring money, booking clinic tokens, or tracking expenses, everything is connected in one unified canvas.
          </p>

          {/* Key Quick Badges / CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <Link
              href="/wallet"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
            >
              Open Account
            </Link>
            <Link
              href="/healthcare"
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-slate-200 hover:text-white hover:bg-white/[0.1] font-semibold text-sm transition-all"
            >
              Live Queues →
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

        {/* RIGHT COLUMN: Exact Credix 3-Zone Dashboard (Starts in Hero & Moves into Right-Tilted Showcase on Scroll) */}
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
          {/* Main 3D Dashboard Window Container matching Credix design */}
          <div
            className="w-full max-w-4xl rounded-3xl border border-white/15 bg-[#0e1628]/95 backdrop-blur-2xl text-slate-100 overflow-hidden shadow-2xl shadow-black/90 transition-all duration-500 ease-out group-hover:border-orange-500/50 group-hover:shadow-orange-500/10 relative"
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

            {/* Dashboard Internal 3-Zone Grid: Left Sidebar + Center Content + Right Metrics */}
            <div className="grid grid-cols-12 min-h-[480px]">
              
              {/* 1. LEFT SIDEBAR */}
              <div className="col-span-12 sm:col-span-3 lg:col-span-2 border-r border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hidden sm:flex">
                <div>
                  {/* Brand Header */}
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-black text-xs text-white shadow-md shadow-orange-500/30">
                      K
                    </div>
                    <span className="font-extrabold text-sm text-white tracking-wide">Credix</span>
                  </div>

                  {/* Nav Menu */}
                  <div className="flex flex-col gap-1">
                    {[
                      { name: "Overview", icon: "🏠" },
                      { name: "Messages", icon: "✉️", badge: "!" },
                      { name: "Community", icon: "👥" },
                      { name: "Payments", icon: "💳" },
                      { name: "Statistics", icon: "📈" },
                      { name: "Referrals", icon: "✨" },
                    ].map((item) => (
                      <div
                        key={item.name}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                          activeTab === item.name
                            ? "bg-white/15 text-white font-bold"
                            : "text-slate-400 group-hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs">{item.icon}</span>
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-bold flex items-center justify-center">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Sidebar User Navigation */}
                <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400">
                    <span>👤</span>
                    <span>Account</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1 text-xs text-slate-400">
                    <span>⚙️</span>
                    <span>Settings</span>
                  </div>
                </div>
              </div>

              {/* 2. CENTER CONTENT: Dashboard Card + Upcoming Payments + Recent Transactions */}
              <div className="col-span-12 sm:col-span-9 lg:col-span-6 p-4 sm:p-5 flex flex-col gap-4 border-r border-white/10">
                
                {/* Search Bar at Top of Center Content */}
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                  <input
                    type="text"
                    readOnly
                    value="Search..."
                    className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-300 outline-none pointer-events-none"
                  />
                </div>

                {/* Dashboard Title & Cards Grid */}
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-white">Dashboard</div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    
                    {/* Glowing Digital Card */}
                    <div className="sm:col-span-7 rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br from-indigo-900/90 via-slate-900 to-indigo-950/90 border border-white/20 shadow-xl flex flex-col justify-between min-h-[135px]">
                      <div className="flex items-center justify-between relative z-10">
                        <span className="text-[9px] font-bold tracking-widest text-slate-300 uppercase">Credix Platinum</span>
                        <span className="text-xs text-slate-300">⚡</span>
                      </div>

                      <div className="my-1.5 relative z-10">
                        <div className="text-xs sm:text-sm font-mono tracking-widest text-white font-bold">2506 5633 7859 4841</div>
                        <div className="text-[9px] text-slate-400 mt-0.5">Patrick Parker</div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-300 relative z-10">
                        <span>Valid 08/29</span>
                        <div className="flex -space-x-1">
                          <span className="w-3.5 h-3.5 rounded-full bg-red-500/90 inline-block" />
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-400/90 inline-block" />
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Payments (2 Square Tiles) */}
                    <div className="sm:col-span-5 flex flex-col gap-2">
                      <div className="text-[11px] font-semibold text-slate-300">Upcoming payments</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                          <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">💼</div>
                          <div className="mt-1">
                            <div className="text-[8px] text-slate-400 font-medium">Freelance</div>
                            <div className="text-[11px] font-bold text-white">$1,500</div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between">
                          <div className="w-5 h-5 rounded-lg bg-white/10 flex items-center justify-center text-[10px]">💰</div>
                          <div className="mt-1">
                            <div className="text-[8px] text-slate-400 font-medium">Salary</div>
                            <div className="text-[11px] font-bold text-white">$4,000</div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Recent Transactions List with Sort Dropdown */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Recent transactions</span>
                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">Sort by ⌄</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {recentTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[11px]">
                            {tx.icon}
                          </span>
                          <div>
                            <div className="font-semibold text-white text-[11px]">{tx.title}</div>
                            <div className="text-[8px] text-slate-400">{tx.date}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-white">{tx.amount}</span>
                          <span className="text-slate-500 text-[10px]">•••</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 3. RIGHT METRICS SIDEBAR: Spent This Day + Wave Visualizer + Available Cards */}
              <div className="col-span-12 lg:col-span-4 p-4 sm:p-5 flex flex-col gap-4 bg-white/[0.01] hidden lg:flex">
                
                {/* Top Spent This Day Tile */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Spent this day</span>
                    <span className="bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-slate-300">Weekly ⌄</span>
                  </div>
                  <div className="text-xl font-black text-white">$259.75</div>

                  {/* Interactive Multi-Curve Wave Graph */}
                  <div className="w-full h-20 relative flex items-end mt-1">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 200 70" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="credixWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 0 55 Q 30 10, 60 40 T 100 20 T 140 50 T 200 25 L 200 70 L 0 70 Z"
                        fill="url(#credixWaveGrad)"
                      />
                      <path
                        d="M 0 55 Q 30 10, 60 40 T 100 20 T 140 50 T 200 25"
                        fill="none"
                        stroke="#00E5FF"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <circle cx="100" cy="20" r="3" fill="#00E5FF" />
                      <circle cx="100" cy="20" r="6" fill="#00E5FF" fillOpacity="0.3" className="animate-ping" />
                    </svg>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500 px-1">
                    <span>Mon</span>
                    <span className="text-cyan-400 font-bold">Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                {/* Available Cards Tile */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-white text-[11px]">Available cards</span>
                    <span className="text-[9px] text-slate-400">See all</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">98,500 <span className="text-[9px] text-slate-400">USD</span></div>
                      <div className="text-[8px] text-slate-400 mt-0.5">•••• 6367</div>
                    </div>
                    <div className="w-6 h-4 rounded bg-white/10 flex items-center justify-center text-[8px] text-slate-300">
                      VISA
                    </div>
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
