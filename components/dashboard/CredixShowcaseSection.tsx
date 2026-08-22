"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CobeGlobe } from "@/components/blocks/cobe-globe";

interface TransactionItem {
  id: string;
  icon: string;
  title: string;
  category: string;
  date: string;
  amount: string;
  isPositive?: boolean;
}

const mockTransactions: TransactionItem[] = [
  {
    id: "tx-1",
    icon: "🏥",
    title: "Apex Multi-Specialty Clinic",
    category: "Dr. Sarah Rao • Token #14",
    date: "22 Aug 2026, 12:45",
    amount: "Wait ~3m",
    isPositive: true,
  },
  {
    id: "tx-2",
    icon: "☕",
    title: "Artisan Coffee Roasters",
    category: "Loyalty Cashback Claimed",
    date: "22 Aug 2026, 11:30",
    amount: "₹150 OFF",
    isPositive: true,
  },
  {
    id: "tx-3",
    icon: "🏪",
    title: "Urban Tech & Electronics",
    category: "Express Order Ready • #29",
    date: "22 Aug 2026, 10:15",
    amount: "Token #29",
  },
  {
    id: "tx-4",
    icon: "🔬",
    title: "Central Diagnostics & Lab",
    category: "Token #08 • Room 102",
    date: "21 Aug 2026, 18:20",
    amount: "Next in line",
    isPositive: true,
  },
  {
    id: "tx-5",
    icon: "🛒",
    title: "Green Earth Organics",
    category: "Platinum Tier +500 Pts",
    date: "21 Aug 2026, 15:40",
    amount: "+500 Pts",
    isPositive: true,
  },
];

export function CredixShowcaseSection() {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeNav, setActiveNav] = useState<string>("Overview");

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      // Calculate progress as section scrolls through the viewport (0 to 1)
      const start = windowHeight * 0.85;
      const end = -rect.height * 0.2;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 3D Perspective Calculations based on scroll:
  // 1. Dashboard shifts from center to the right as you scroll down
  // 2. Right side angles upward, Left side tilts inward (into the screen):
  //    rotateY negative: left side recedes into z-space, right side comes forward
  //    rotateX positive + rotateZ negative: right side lifts upward
  const rotY = -4 - scrollProgress * 12; // -4deg to -16deg
  const rotX = 3 + scrollProgress * 7;   // +3deg to +10deg
  const rotZ = -1 - scrollProgress * 2.5; // -1deg to -3.5deg
  const transX = (1 - scrollProgress) * -20; // transitions smoothly into right column
  const transY = Math.max(0, (1 - scrollProgress) * 35);
  const scale = 0.95 + scrollProgress * 0.05;

  // Left Content emergence
  const leftTranslateX = Math.max(0, (1 - scrollProgress) * -40);
  const leftOpacity = Math.min(1, 0.2 + scrollProgress * 0.9);

  return (
    <section
      ref={sectionRef}
      className="w-full max-w-7xl mx-auto px-4 py-16 lg:py-24 relative overflow-hidden"
      style={{ perspective: "1400px" }}
      aria-label="Credix 3D Showcase"
    >
      {/* Ambient background glow behind the 3D dashboard */}
      <div
        className="absolute -right-10 top-1/4 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(255, 87, 34, 0.12) 0%, rgba(0, 229, 255, 0.08) 45%, transparent 70%)",
          filter: "blur(90px)",
          zIndex: 0,
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center relative z-10">
        
        {/* LEFT COLUMN: Clean Credix-Style Typography & Capabilities */}
        <div
          className="lg:col-span-5 flex flex-col items-start text-left transition-all duration-700 ease-out"
          style={{
            transform: `translateX(-${leftTranslateX}px)`,
            opacity: leftOpacity,
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

        {/* RIGHT COLUMN: 3D Tilted Credix Dashboard Mockup */}
        <div
          className="lg:col-span-7 w-full flex justify-center lg:justify-end transition-all duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `translateY(${transY}px) scale(${scale})`,
          }}
        >
          {/* Main 3D Tilted Window Container */}
          <div
            className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#0e1628]/95 backdrop-blur-2xl text-slate-100 overflow-hidden shadow-2xl shadow-black/80 transition-transform duration-300 ease-out"
            style={{
              transform: `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`,
              transformOrigin: "center center",
              boxShadow: "0 30px 70px -15px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.12), -20px 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Dashboard Internal 2-Column Grid: Left Sidebar + Right Main Canvas */}
            <div className="grid grid-cols-12 min-h-[460px]">
              
              {/* Internal Sidebar */}
              <div className="col-span-3 border-r border-white/10 bg-white/[0.02] p-4 flex flex-col justify-between hidden sm:flex">
                <div>
                  {/* Brand Header */}
                  <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-black text-xs text-white">
                      K
                    </div>
                    <span className="font-extrabold text-sm text-white tracking-wide">Kynisto</span>
                  </div>

                  {/* Nav Menu */}
                  <div className="flex flex-col gap-1">
                    {[
                      { name: "Overview", icon: "📊" },
                      { name: "Messages", icon: "💬" },
                      { name: "Community", icon: "👥" },
                      { name: "Payments", icon: "💳" },
                      { name: "Statistics", icon: "📈" },
                      { name: "Referrals", icon: "🎁" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setActiveNav(item.name)}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
                          activeNav === item.name
                            ? "bg-white/10 text-white font-bold"
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span className="text-xs">{item.icon}</span>
                        <span>{item.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom Sidebar Nav */}
                <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
                  <button type="button" className="flex items-center gap-2 px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200">
                    <span>👤</span>
                    <span>Account</span>
                  </button>
                  <button type="button" className="flex items-center gap-2 px-2.5 py-1 rounded text-xs text-slate-400 hover:text-slate-200">
                    <span>⚙️</span>
                    <span>Settings</span>
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="col-span-12 sm:col-span-9 p-4 sm:p-5 flex flex-col gap-4">
                {/* Search & Top Bar */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      readOnly
                      value="Search appointments, cards..."
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[11px] font-bold text-emerald-400">Live Sync</span>
                  </div>
                </div>

                {/* Top Tiles: Digital Credix Card & Quick Metric / Upcoming Payments */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  
                  {/* Glowing Digital Member / Loyalty Card */}
                  <div className="sm:col-span-7 rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-900 border border-white/20 shadow-xl flex flex-col justify-between min-h-[140px]">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-[10px] font-bold tracking-widest text-slate-300 uppercase">KYNISTO BLACK PASS</span>
                      <span className="text-xs font-bold text-amber-400">⚡ PLATINUM</span>
                    </div>

                    <div className="my-2 relative z-10">
                      <div className="text-sm font-mono tracking-wider text-white font-bold">2506 5633 7859 4841</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Arshit Avanti • Valid 08/29</div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-200 relative z-10">
                      <span>Balance: ₹24,850</span>
                      <div className="flex -space-x-1">
                        <span className="w-4 h-4 rounded-full bg-red-500/90 inline-block" />
                        <span className="w-4 h-4 rounded-full bg-amber-400/90 inline-block" />
                      </div>
                    </div>
                  </div>

                  {/* Upcoming OPD & Token Call Tile */}
                  <div className="sm:col-span-5 flex flex-col gap-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">Active OPD Call</div>
                        <div className="text-xs font-bold text-white mt-0.5">Token #14 Serving</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        OPD 02
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-slate-400 font-semibold">Monthly Rewards</div>
                        <div className="text-xs font-bold text-emerald-300 mt-0.5">+₹1,500 Earned</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Claimed
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Section: Recent Transactions / Real-Time Activity Feed */}
                <div className="flex flex-col gap-2 pt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-white">Recent Transactions & Tokens</span>
                    <span className="text-[10px] text-slate-400 font-medium">Live Feed</span>
                  </div>

                  <div className="flex flex-col gap-1.5 max-h-40 overflow-hidden">
                    {mockTransactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs flex-shrink-0">
                            {tx.icon}
                          </span>
                          <div className="overflow-hidden">
                            <div className="font-semibold text-white truncate text-[11px]">{tx.title}</div>
                            <div className="text-[9px] text-slate-400 truncate">{tx.category}</div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-[11px] font-bold ${
                              tx.isPositive ? "text-emerald-400" : "text-slate-200"
                            }`}
                          >
                            {tx.amount}
                          </div>
                          <div className="text-[9px] text-slate-500">{tx.date}</div>
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
