"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
    icon: "🩺",
    title: "Dr. Sharma Clinic OPD",
    date: "Token #07 · Calling Now",
    amount: "Active",
  },
  {
    id: "tx-2",
    icon: "🛠️",
    title: "Home AC Repair Service",
    date: "Today, 10:30 AM",
    amount: "₹499.00",
  },
  {
    id: "tx-3",
    icon: "🏪",
    title: "Sharma General Store",
    date: "Yesterday · Cashback",
    amount: "+50 pts",
  },
  {
    id: "tx-4",
    icon: "🦷",
    title: "City Dental Care",
    date: "18 Aug · Consultation",
    amount: "₹200.00",
  },
];

interface CredixInteractiveHeroFeaturesProps {
  query: string;
  setQuery: (q: string) => void;
}

export function CredixInteractiveHeroFeatures({ query, setQuery }: CredixInteractiveHeroFeaturesProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("Overview");

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const windowHeight = window.innerHeight || 800;

          // Compute scroll progress from hero start down through features section
          const scrollDistance = windowHeight * 0.65;
          const currentScroll = Math.max(0, -rect.top);
          const rawProgress = currentScroll / scrollDistance;
          const progress = Math.max(0, Math.min(1, rawProgress));
          setScrollProgress(progress);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Continuous Responsive Scroll 3D Dynamics:
  // On Desktop: Glides from center (0%) to right (+26%) with 3D tilt & rotation
  // On Mobile: Separate dedicated 3D float physics (vertical lift, pitch dynamic, and breathing scale)
  const translateXVal = isDesktop ? scrollProgress * 26 : 0;
  const rotY = isDesktop ? 0 - scrollProgress * 14 : (scrollProgress - 0.5) * 4;
  const rotX = isDesktop ? 5 + scrollProgress * 4 : 4 * Math.cos(scrollProgress * Math.PI);
  const rotZ = isDesktop ? 0 - scrollProgress * 2.5 : 0;
  const translateYMobile = isDesktop ? 0 : -Math.sin(scrollProgress * Math.PI) * 12;
  const scale = isDesktop ? 0.98 + scrollProgress * 0.02 : 0.97 + scrollProgress * 0.03;

  // Features Left Content emergence
  const featuresTranslateX = isDesktop ? Math.max(0, (1 - scrollProgress) * -40) : 0;
  const featuresOpacity = isDesktop
    ? Math.min(1, Math.max(0, (scrollProgress - 0.1) * 1.3))
    : 1;

  const handleDashboardClick = () => {
    router.push("/dashboard");
  };

  return (
    <div ref={containerRef} className="w-full relative overflow-hidden max-w-[100vw]">
      
      {/* 1. HERO SECTION */}
      <section
        className="hero"
        id="top"
        style={{
          textAlign: "center",
          padding: "85px 16px 12px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          justifyContent: "flex-start",
          overflow: "visible",
          width: "100%",
          maxWidth: "100vw",
          background: "transparent",
        }}
      >
        <div
          className="heroCopy"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "1000px",
            position: "relative",
            zIndex: 2,
            width: "100%",
            boxSizing: "border-box",
            background: "transparent",
            width: "100%",
            maxWidth: "1000px",
            padding: "0 12px",
          }}
        >
          {/* Refined Professional Heading */}
          <h1 className="arise-on-scroll arise-delay-1 text-2xl sm:text-3xl md:text-4xl lg:text-[44px] font-bold text-white tracking-tight leading-tight sm:leading-[1.2] mb-2.5 sm:mb-3 text-center max-w-2xl mx-auto px-2 drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
            Your City. Your Health.{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
              Your Life, Smarter.
            </span>
          </h1>

          {/* Refined Subtitle */}
          <p className="arise-on-scroll arise-delay-2 text-xs sm:text-sm md:text-[15px] text-slate-100/90 font-normal max-w-lg mx-auto mb-5 sm:mb-6 leading-relaxed drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)] px-3 text-center">
            Discover verified local stores, book home services, join live doctor OPD queues, and unlock smart rewards across your neighborhood.
          </p>

          {/* High-Contrast Responsive Pill Input Form */}
          <form
            className="searchBox heroSearchBox arise-on-scroll arise-delay-3 w-full max-w-md mx-auto p-1 sm:p-1.5 rounded-full bg-slate-950/80 backdrop-blur-2xl border border-white/20 shadow-2xl flex items-center gap-1.5 sm:gap-2 mb-2"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <label className="sr-only" htmlFor="store-search">Search nearby stores</label>
            <span className="pl-3 text-slate-400 text-xs sm:text-sm">🔍</span>
            <input
              id="store-search"
              className="flex-1 min-w-0 bg-transparent text-white placeholder:text-slate-400 text-xs sm:text-sm pr-1 outline-none font-medium"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stores, clinics, plumbers, salons..."
            />
            <button
              className="px-3.5 sm:px-5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 cursor-pointer"
              type="submit"
            >
              Explore Now
            </button>
          </form>
        </div>
      </section>

      {/* 2. DYNAMIC SCROLL TRANSITION CONTAINER: Features on the Left + Dashboard glides to the Right */}
      <section
        className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-12 lg:py-16 relative"
        style={{ perspective: isDesktop ? "1400px" : "none" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          
          {/* FEATURES LISTED ON THE LEFT SIDE (High Contrast Frosted Dark Container) */}
          <div
            className="lg:col-span-5 flex flex-col items-start text-left transition-all duration-700 ease-out w-full p-5 sm:p-7 rounded-3xl bg-slate-950/85 backdrop-blur-2xl border border-white/20 shadow-2xl"
            style={{
              transform: `translateX(${featuresTranslateX}px)`,
              opacity: featuresOpacity > 0.05 ? featuresOpacity : 0.2 + scrollProgress * 0.8,
              pointerEvents: isDesktop && scrollProgress <= 0.15 ? "none" : "auto",
            }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-[10px] sm:text-[11px] font-bold text-orange-400 mb-3 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              Hyperlocal Infrastructure
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-[1.15] mb-3">
              Local Commerce &amp; Care, <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">Wherever You Are</span>
            </h2>

            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed mb-5 max-w-lg font-normal">
              Experience your neighborhood with unprecedented speed. From real-time clinic turn alerts to instant home service dispatches and digital passes, everything is just a tap away.
            </p>

            {/* Feature Points on Left Side */}
            <div className="flex flex-col gap-2.5 mb-6 w-full">
              {[
                { title: "Universal Loyalty & Smart Rewards", desc: "Instant reward points credited to your Kynisto digital pass at verified neighborhood stores." },
                { title: "Live Healthcare & OPD Telemetry", desc: "Real-time doctor turn tracking so you arrive right on time without crowded clinic waiting rooms." },
                { title: "Verified Home Services & Instant Dispatch", desc: "Book verified electricians, plumbers, and AC repair technicians with guaranteed rates." },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.05] border border-white/10 hover:border-orange-500/30 transition-colors">
                  <span className="w-6 h-6 rounded-xl bg-orange-500/20 text-orange-400 font-black flex items-center justify-center text-xs flex-shrink-0 mt-0.5 shadow-sm">
                    ✓
                  </span>
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm">{feat.title}</div>
                    <div className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-relaxed font-normal">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href="/services"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition-all"
              >
                Explore Home Services
              </Link>
              <Link
                href="/healthcare"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 font-bold text-xs sm:text-sm transition-all"
              >
                ⚡ Live Healthcare Hub →
              </Link>
            </div>
          </div>

          {/* 3D DASHBOARD THAT MOVES FROM CENTER TO RIGHT SIDE AS YOU SCROLL (Separate Mobile vs PC Animation) */}
          <div
            className="lg:col-span-7 w-full flex justify-center lg:justify-end cursor-pointer group"
            onClick={handleDashboardClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") handleDashboardClick();
            }}
            aria-label="Click to open full Kynisto Account Dashboard"
            style={{
              transformStyle: "preserve-3d",
              transform: isDesktop ? `translateX(${translateXVal}%)` : `translateY(${translateYMobile}px)`,
              transition: isDesktop
                ? "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)"
                : "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
              maxWidth: "100%",
            }}
          >
            <div
              className={`w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/15 bg-[#0e1628]/95 backdrop-blur-2xl text-slate-100 overflow-hidden shadow-xl sm:shadow-2xl shadow-black/90 transition-all duration-300 ease-out group-hover:border-orange-500/50 group-hover:shadow-orange-500/20 relative ${
                isDesktop ? "desktopHeroDashboard" : "mobileHeroDashboard"
              }`}
              style={{
                transform: isDesktop
                  ? `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scale})`
                  : `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`,
                transformOrigin: "center center",
                boxShadow: isDesktop
                  ? "0 35px 80px -15px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12), -20px 20px 40px rgba(0,0,0,0.5)"
                  : "0 20px 45px -10px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.12), 0 0 25px rgba(56, 189, 248, 0.15)",
              }}
            >
              {/* Hover Indicator Overlay */}
              <div className="absolute top-2.5 right-3 sm:top-3 sm:right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-orange-500 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg flex items-center gap-1">
                <span>Open Dashboard</span>
                <span>↗</span>
              </div>

              {/* Exact 3-Zone Kynisto Dashboard */}
              <div className="grid grid-cols-12 min-h-0 sm:min-h-[470px]">

                {/* Mobile Tab Switcher (Visible on mobile screens) */}
                <div className="col-span-12 flex sm:hidden items-center gap-1.5 p-2 bg-white/[0.04] border-b border-white/10 overflow-x-auto no-scrollbar">
                  {[
                    { name: "Overview", icon: "🏠" },
                    { name: "Healthcare", icon: "🩺", badge: "Live" },
                    { name: "Services", icon: "🛠️" },
                    { name: "Wallet Pass", icon: "💳" },
                    { name: "Stores", icon: "🏪" },
                    { name: "Rewards", icon: "✨" },
                  ].map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(item.name);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                        activeTab === item.name
                          ? "bg-orange-500 text-white font-bold shadow-md shadow-orange-500/30"
                          : "bg-white/[0.05] text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.name}</span>
                    </button>
                  ))}
                </div>

                {/* 1. Left Sidebar (Visible on Tablet & Desktop) */}
                <div className="col-span-12 sm:col-span-4 lg:col-span-3 border-r border-white/10 bg-white/[0.02] p-3 sm:p-4 flex flex-col justify-between hidden sm:flex">
                  <div>
                    <div className="flex items-center gap-2 mb-4 sm:mb-6 px-1">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-black text-xs text-white shadow-md shadow-orange-500/30">
                        K
                      </div>
                      <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">Kynisto</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      {[
                        { name: "Overview", icon: "🏠" },
                        { name: "Healthcare", icon: "🩺", badge: "Live" },
                        { name: "Services", icon: "🛠️" },
                        { name: "Wallet Pass", icon: "💳" },
                        { name: "Stores", icon: "🏪" },
                        { name: "Rewards", icon: "✨" },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveTab(item.name);
                          }}
                          className={`flex items-center justify-between px-2 sm:px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-semibold transition-all text-left w-full cursor-pointer ${
                            activeTab === item.name
                              ? "bg-white/15 text-white font-bold border border-white/20 shadow-sm"
                              : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs">{item.icon}</span>
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-emerald-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center animate-pulse">
                              !
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-3 sm:pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/account");
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-[11px] sm:text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <span>👤</span>
                      <span>Account</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/account");
                      }}
                      className="flex items-center gap-2 px-2 py-1.5 text-[11px] sm:text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <span>⚙️</span>
                      <span>Settings</span>
                    </button>
                  </div>
                </div>

                {/* 2. Center Content: Dynamic Multi-Tab Interactive Engine */}
                <div className="col-span-12 sm:col-span-8 lg:col-span-9 p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 text-left">
                  
                  {/* Search Bar with Live Execution */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full"
                  >
                    <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search stores, clinics, plumbers, salons..."
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-7 sm:pl-8 pr-20 py-1.5 sm:py-2 text-[11px] sm:text-xs text-slate-200 placeholder:text-slate-400 outline-none focus:border-orange-500 focus:bg-white/[0.08] transition-all"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] sm:text-[11px] transition-colors"
                    >
                      Search
                    </button>
                  </form>

                  {/* TAB 1: OVERVIEW */}
                  {activeTab === "Overview" && (
                    <div className="flex flex-col gap-3.5">
                      <div className="flex flex-col gap-2">
                        <div className="text-[11px] sm:text-xs font-bold text-white flex items-center justify-between">
                          <span>Live Status &amp; Passes</span>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Live Sync
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                          
                          {/* Kynisto VIP Pass Card */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/wallet");
                            }}
                            className="sm:col-span-7 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 relative overflow-hidden bg-gradient-to-br from-orange-950/90 via-slate-900 to-slate-950 border border-orange-500/40 shadow-xl flex flex-col justify-between min-h-[115px] sm:min-h-[135px] hover:border-orange-400 hover:scale-[1.02] transition-all cursor-pointer group/card"
                          >
                            <div className="flex items-center justify-between relative z-10">
                              <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-orange-400 uppercase">KYNISTO VIP PASS</span>
                              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">● ACTIVE</span>
                            </div>

                            <div className="my-1 relative z-10">
                              <div className="text-xs sm:text-sm font-mono tracking-widest text-white font-bold group-hover/card:text-orange-200 transition-colors">KYN-8941 2026 5633</div>
                              <div className="text-[8px] sm:text-[9px] text-slate-300 mt-0.5">DLF Ankur Vihar • Verified Member</div>
                            </div>

                            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-300 relative z-10">
                              <span>Valid 2026–2027</span>
                              <div className="flex items-center gap-1 text-[8px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                                <span>⚡ SMART PASS ↗</span>
                              </div>
                            </div>
                          </div>

                          {/* Live Queue Token & Loyalty Points */}
                          <div className="sm:col-span-5 flex flex-col gap-1.5 sm:gap-2">
                            <div className="text-[10px] sm:text-[11px] font-semibold text-slate-300">Active Queue &amp; Rewards</div>
                            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push("/healthcare");
                                }}
                                className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/20 flex flex-col justify-between cursor-pointer transition-all hover:scale-105"
                              >
                                <div className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">🩺</div>
                                <div className="mt-1">
                                  <div className="text-[7px] sm:text-[8px] text-slate-300 font-medium">OPD Token</div>
                                  <div className="text-[10px] sm:text-[11px] font-bold text-emerald-400">#07 (Next)</div>
                                </div>
                              </div>

                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push("/wallet");
                                }}
                                className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/20 flex flex-col justify-between cursor-pointer transition-all hover:scale-105"
                              >
                                <div className="w-5 h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">⭐</div>
                                <div className="mt-1">
                                  <div className="text-[7px] sm:text-[8px] text-slate-300 font-medium">Rewards</div>
                                  <div className="text-[10px] sm:text-[11px] font-bold text-amber-300">1,250 pts</div>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="flex flex-col gap-1.5 sm:gap-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] sm:text-xs font-bold text-white">Recent activity &amp; bookings</span>
                          <span className="text-[9px] sm:text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">All Visits ⌄</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          {recentTransactions.slice(0, 3).map((tx) => (
                            <div
                              key={tx.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (tx.icon === "🩺") router.push("/healthcare");
                                else if (tx.icon === "🛠️") router.push("/services");
                                else router.push("/wallet");
                              }}
                              className="p-1.5 sm:p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-orange-500/30 flex items-center justify-between gap-2 sm:gap-3 text-xs transition-all cursor-pointer group/row"
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs">
                                  {tx.icon}
                                </span>
                                <div>
                                  <div className="font-semibold text-white text-[10px] sm:text-[11px] group-hover/row:text-orange-300 transition-colors">{tx.title}</div>
                                  <div className="text-[7px] sm:text-[8px] text-slate-400">{tx.date}</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400">{tx.amount}</span>
                                <span className="text-orange-400 text-xs group-hover/row:translate-x-0.5 transition-transform">→</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: HEALTHCARE & LIVE QUEUES */}
                  {activeTab === "Healthcare" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>🩺 Live Doctor OPD Telemetry</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          ● Online
                        </span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/50 to-slate-900 border border-emerald-500/30 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white">Dr. Sharma Clinic (General OPD)</div>
                            <div className="text-[10px] text-slate-300">DLF Ankur Vihar • 09:00 AM – 02:00 PM</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] text-slate-400 uppercase">Est. Wait</div>
                            <div className="text-xs font-bold text-amber-400">~8 mins</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 bg-black/30 p-2.5 rounded-xl border border-white/5 text-center">
                          <div>
                            <div className="text-[8px] text-slate-400 uppercase">Now Serving</div>
                            <div className="text-sm font-black text-amber-300">#06</div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-400 uppercase">Your Token</div>
                            <div className="text-sm font-black text-emerald-400">#07</div>
                          </div>
                          <div>
                            <div className="text-[8px] text-slate-400 uppercase">Waiting</div>
                            <div className="text-sm font-black text-white">1 Patient</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/healthcare");
                            }}
                            className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/25 hover:brightness-110 transition-all text-center"
                          >
                            Open Live Queue Hub ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: SERVICES */}
                  {activeTab === "Services" && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">🛠️ Verified On-Demand Home Services</div>
                        <Link href="/services" className="text-[10px] text-orange-400 font-bold hover:underline">
                          View All →
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { title: "AC Repair & Gas", price: "₹499", time: "30m Dispatch", icon: "❄️" },
                          { title: "Electrician Visit", price: "₹199", time: "Instant Slot", icon: "⚡" },
                          { title: "Plumbing Service", price: "₹249", time: "45m Arrival", icon: "🔧" },
                        ].map((srv, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/services");
                            }}
                            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/50 hover:bg-white/[0.08] transition-all cursor-pointer flex flex-col justify-between gap-2 group/srv"
                          >
                            <div>
                              <span className="text-base">{srv.icon}</span>
                              <div className="text-xs font-bold text-white mt-1 group-hover/srv:text-orange-400 transition-colors">{srv.title}</div>
                              <div className="text-[9px] text-slate-400">{srv.time}</div>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-white/5">
                              <span className="text-xs font-extrabold text-orange-400">{srv.price}</span>
                              <span className="text-[9px] bg-orange-500/20 text-orange-300 font-bold px-2 py-0.5 rounded-md">Book</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: WALLET PASS */}
                  {activeTab === "Wallet Pass" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">💳 Digital Membership &amp; Wallet Pass</div>
                        <span className="text-[10px] text-emerald-400 font-bold">1-Tap Scan</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-orange-950/40 to-slate-950 border border-orange-500/40 shadow-xl flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">KYNISTO DIGITAL PASS</div>
                            <div className="text-sm font-mono font-black text-white mt-0.5">KYN-8941 2026 5633</div>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center">
                            <span className="text-black font-black text-[10px]">QR</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                          <div>
                            <div className="text-[8px] text-slate-400">Available Loyalty</div>
                            <div className="text-xs font-bold text-emerald-400">₹250.00 (1,250 pts)</div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push("/wallet");
                            }}
                            className="px-3 py-1.5 rounded-lg bg-orange-500 text-white font-bold text-xs shadow-md hover:bg-orange-600 transition-colors"
                          >
                            Open Wallet Pass ↗
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: STORES */}
                  {activeTab === "Stores" && (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">🏪 Verified Local Stores</div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
                          }}
                          className="text-[10px] text-orange-400 font-bold hover:underline"
                        >
                          Browse All ↓
                        </button>
                      </div>

                      <div className="flex flex-col gap-2">
                        {[
                          { name: "Sharma General Store", cat: "Groceries & Daily Essentials", offer: "5% Cashback", dist: "0.2 km" },
                          { name: "Apollo MedPlus Pharmacy", cat: "Medicines & Health", offer: "10% Pass Off", dist: "0.4 km" },
                          { name: "Organic Harvest Hub", cat: "Fresh Fruits & Veggies", offer: "Free Delivery", dist: "0.6 km" },
                        ].map((st, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
                            }}
                            className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 hover:border-orange-500/40 hover:bg-white/[0.08] flex items-center justify-between transition-all cursor-pointer"
                          >
                            <div>
                              <div className="text-xs font-bold text-white">{st.name}</div>
                              <div className="text-[9px] text-slate-400">{st.cat} • {st.dist}</div>
                            </div>
                            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md">
                              {st.offer}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: REWARDS */}
                  {activeTab === "Rewards" && (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-white">✨ Smart Loyalty &amp; Rewards</div>
                        <span className="text-xs font-extrabold text-amber-400">1,250 Points</span>
                      </div>

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                        <div>
                          <div className="text-xs font-bold text-white">Cashback Balance: ₹250.00</div>
                          <div className="text-[9px] text-slate-300">Usable at all 100+ verified partner stores</div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push("/wallet");
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
                        >
                          Redeem ↗
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
