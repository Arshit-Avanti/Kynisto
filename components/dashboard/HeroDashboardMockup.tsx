"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

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

export function HeroDashboardMockup() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("Overview");

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;
      // Calculate progress as user scrolls
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight * 0.9)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3D Perspective angle based on scroll: gentle floating 8deg tilt that rolls flat
  const tiltX = Math.max(0, 10 * (1 - scrollProgress * 0.9));
  const scaleVal = 0.98 + 0.02 * scrollProgress;

  const handleDashboardClick = () => {
    // Navigate to /dashboard (which automatically opens account if logged in, or redirects to /login?returnTo=/dashboard if not)
    router.push("/dashboard");
  };

  return (
    <div
      ref={containerRef}
      className="hero-dashboard-mockup-wrapper w-full max-w-6xl mx-auto px-2 sm:px-4 mt-8 mb-6 relative cursor-pointer group arise-on-scroll arise-delay-6"
      onClick={handleDashboardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleDashboardClick();
      }}
      aria-label="Click to open full Kynisto Account Dashboard"
      style={{
        perspective: "1400px",
        zIndex: 10,
      }}
    >
      {/* Dynamic Ambient Underglow Aura */}
      <div
        className="absolute -inset-4 rounded-3xl opacity-60 pointer-events-none transition-all duration-700"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(255,122,0,0.2) 0%, rgba(0,212,255,0.15) 45%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />

      {/* Main 3D Perspective Glassmorphic Dashboard Window matching Credix Design */}
      <div
        className="hero-dashboard-card rounded-3xl border border-white/15 bg-[#0e1628]/95 backdrop-blur-2xl text-slate-100 overflow-hidden transition-all duration-500 ease-out group-hover:border-orange-500/50 group-hover:shadow-orange-500/20 relative"
        style={{
          transform: `rotateX(${tiltX}deg) scale(${scaleVal})`,
          boxShadow: "0 30px 70px -15px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.12)",
          transformOrigin: "center top",
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
          <div className="col-span-12 sm:col-span-9 lg:col-span-6 p-4 sm:p-5 flex flex-col gap-4 border-r border-white/10 text-left">
            
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
          <div className="col-span-12 lg:col-span-4 p-4 sm:p-5 flex flex-col gap-4 bg-white/[0.01] hidden lg:flex text-left">
            
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
                    <linearGradient id="heroWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0 55 Q 30 10, 60 40 T 100 20 T 140 50 T 200 25 L 200 70 L 0 70 Z"
                    fill="url(#heroWaveGrad)"
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
  );
}
