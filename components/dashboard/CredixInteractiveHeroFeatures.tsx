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
  // On Desktop: Glides from center (0%) to right (+26%) with 3D tilt
  // On Mobile: Fits 100% within mobile viewport with subtle vertical depth (0% horizontal translate to prevent any overflow)
  const translateXVal = isDesktop ? scrollProgress * 26 : 0;
  const rotY = isDesktop ? 0 - scrollProgress * 14 : 0 - scrollProgress * 3;
  const rotX = isDesktop ? 5 + scrollProgress * 4 : 4 * (1 - scrollProgress);
  const rotZ = isDesktop ? 0 - scrollProgress * 2.5 : 0;
  const scale = isDesktop ? 0.98 + scrollProgress * 0.02 : 1;

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
          }}
        >
          {/* Badge */}
          <div className="arise-on-scroll arise-delay-1 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.08] border border-white/20 text-[10px] sm:text-[11px] font-bold text-orange-400 mb-3 backdrop-blur-md shadow-md shadow-orange-500/10 tracking-wide uppercase max-w-full truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping flex-shrink-0" />
            <span className="truncate">EVERYTHING AROUND YOU, SMARTER • 2026</span>
          </div>

          {/* Compact Responsive Title */}
          <h1
            className="highContrastText arise-on-scroll arise-delay-2"
            style={{
              fontSize: "clamp(1.65rem, 6.5vw, 3.2rem)",
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              margin: "0 0 8px 0",
              maxWidth: "780px",
              fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif",
              wordBreak: "break-word",
            }}
          >
            Your City. Your Health. Your Life, Smarter.
          </h1>

          {/* Compact Responsive Subtitle */}
          <p
            className="highContrastText arise-on-scroll arise-delay-3"
            style={{
              fontSize: "clamp(0.82rem, 3.2vw, 0.98rem)",
              fontWeight: 400,
              margin: "0 0 16px 0",
              opacity: 0.9,
              letterSpacing: "-0.01em",
              maxWidth: "580px",
              lineHeight: 1.45,
              padding: "0 8px",
            }}
          >
            Discover verified local stores, book home services, join live doctor OPD queues, and unlock smart rewards across your neighborhood.
          </p>

          {/* Compact Responsive Pill Input Form */}
          <form
            className="searchBox heroSearchBox arise-on-scroll arise-delay-4"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "50px",
              padding: "4px 4px 4px 14px",
              boxShadow: "0 10px 25px -4px rgba(0, 0, 0, 0.25)",
              maxWidth: "440px",
              width: "100%",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
            }}
          >
            <label className="srOnly" htmlFor="store-search">Search nearby stores</label>
            <input
              id="store-search"
              className="heroSearchInput highContrastText"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stores, clinics, plumbers, salons..."
              style={{
                background: "transparent",
                border: "none",
                color: "#ffffff",
                fontSize: "0.82rem",
                outline: "none",
                flex: 1,
                minWidth: 0,
              }}
            />
            <button
              className="searchSubmit heroSearchButton"
              type="submit"
              style={{
                background: "#ffffff",
                color: "#0f172a",
                fontWeight: 700,
                fontSize: "0.8rem",
                borderRadius: "40px",
                padding: "8px 16px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.12)",
                transition: "all 0.2s ease",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
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
          
          {/* FEATURES LISTED ON THE LEFT SIDE (Mobile Responsive) */}
          <div
            className="lg:col-span-5 flex flex-col items-start text-left transition-all duration-700 ease-out w-full"
            style={{
              transform: `translateX(${featuresTranslateX}px)`,
              opacity: featuresOpacity > 0.05 ? featuresOpacity : 0.2 + scrollProgress * 0.8,
              pointerEvents: isDesktop && scrollProgress <= 0.15 ? "none" : "auto",
            }}
          >
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] mb-3 sm:mb-5">
              Local Commerce &amp; Care, Wherever You Are
            </h2>

            <p className="text-slate-300 text-xs sm:text-base leading-relaxed mb-6 sm:mb-8 max-w-lg">
              Experience your neighborhood with unprecedented speed. From real-time clinic turn alerts to instant home service dispatches and digital passes, everything is just a tap away.
            </p>

            {/* Feature Points on Left Side */}
            <div className="flex flex-col gap-2.5 sm:gap-4 mb-6 sm:mb-8 w-full">
              {[
                { title: "Universal Loyalty & Smart Rewards", desc: "Instant reward points credited to your Kynisto digital pass at verified neighborhood stores." },
                { title: "Live Healthcare & OPD Telemetry", desc: "Real-time doctor turn tracking so you arrive right on time without crowded clinic waiting rooms." },
                { title: "Verified Home Services & Instant Dispatch", desc: "Book verified electricians, plumbers, and AC repair technicians with guaranteed rates." },
              ].map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-orange-500/20 text-orange-400 font-bold flex items-center justify-center text-[10px] sm:text-xs flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <div>
                    <div className="font-bold text-white text-xs sm:text-sm">{feat.title}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <Link
                href="/services"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
              >
                Explore Home Services
              </Link>
              <Link
                href="/healthcare"
                className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/15 text-slate-200 hover:text-white hover:bg-white/[0.1] font-semibold text-xs sm:text-sm transition-all"
              >
                ⚡ Live Healthcare Hub →
              </Link>
            </div>
          </div>

          {/* 3D DASHBOARD THAT MOVES FROM CENTER TO RIGHT SIDE AS YOU SCROLL (Mobile Responsive) */}
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
              transformStyle: isDesktop ? "preserve-3d" : "flat",
              transform: `translateX(${translateXVal}%)`,
              transition: "transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)",
              maxWidth: "100%",
            }}
          >
            <div
              className="w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-white/15 bg-[#0e1628]/95 backdrop-blur-2xl text-slate-100 overflow-hidden shadow-xl sm:shadow-2xl shadow-black/90 transition-all duration-300 ease-out group-hover:border-orange-500/50 group-hover:shadow-orange-500/20 relative"
              style={{
                transform: isDesktop
                  ? `perspective(1200px) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${scale})`
                  : `scale(${scale})`,
                transformOrigin: "center center",
                boxShadow: isDesktop
                  ? "0 35px 80px -15px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.12), -20px 20px 40px rgba(0,0,0,0.5)"
                  : "0 20px 40px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.1)",
              }}
            >
              {/* Hover Indicator Overlay */}
              <div className="absolute top-2.5 right-3 sm:top-3 sm:right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-orange-500 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full shadow-lg flex items-center gap-1">
                <span>Open Dashboard</span>
                <span>↗</span>
              </div>

              {/* Exact 3-Zone Kynisto Dashboard */}
              <div className="grid grid-cols-12 min-h-0 sm:min-h-[470px]">
                
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
                        <div
                          key={item.name}
                          className={`flex items-center justify-between px-2 sm:px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all text-left ${
                            activeTab === item.name
                              ? "bg-white/15 text-white font-bold"
                              : "text-slate-400 group-hover:text-slate-200"
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
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-3 sm:pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 px-2 py-0.5 text-[11px] sm:text-xs text-slate-400">
                      <span>👤</span>
                      <span>Account</span>
                    </div>
                    <div className="flex items-center gap-2 px-2 py-0.5 text-[11px] sm:text-xs text-slate-400">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </div>
                  </div>
                </div>

                {/* 2. Center Content: Dashboard Card + Upcoming Payments + Recent Transactions */}
                <div className="col-span-12 sm:col-span-8 lg:col-span-9 p-3 sm:p-5 flex flex-col gap-3 sm:gap-4 text-left">
                  
                  <div className="relative">
                    <span className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">🔍</span>
                    <input
                      type="text"
                      readOnly
                      value="Search stores, clinics, services..."
                      className="w-full bg-white/[0.05] border border-white/10 rounded-xl pl-7 sm:pl-8 pr-3 py-1 sm:py-1.5 text-[11px] sm:text-xs text-slate-300 outline-none pointer-events-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="text-[11px] sm:text-xs font-bold text-white">Live Status &amp; Passes</div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-3">
                      
                      {/* Kynisto VIP Pass Card */}
                      <div className="sm:col-span-7 rounded-xl sm:rounded-2xl p-3 sm:p-4 relative overflow-hidden bg-gradient-to-br from-orange-950/80 via-slate-900 to-slate-950 border border-orange-500/30 shadow-xl flex flex-col justify-between min-h-[110px] sm:min-h-[135px]">
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-orange-400 uppercase">KYNISTO VIP PASS</span>
                          <span className="text-xs text-emerald-400 font-bold">● ACTIVE</span>
                        </div>

                        <div className="my-1 relative z-10">
                          <div className="text-xs sm:text-sm font-mono tracking-widest text-white font-bold">KYN-8941 2026 5633</div>
                          <div className="text-[8px] sm:text-[9px] text-slate-300 mt-0.5">DLF Ankur Vihar • Verified Member</div>
                        </div>

                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-300 relative z-10">
                          <span>Valid 2026–2027</span>
                          <div className="flex items-center gap-1 text-[8px] font-bold text-orange-400">
                            <span>⚡ SMART PASS</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Queue Token & Loyalty Points */}
                      <div className="sm:col-span-5 flex flex-col gap-1.5 sm:gap-2">
                        <div className="text-[10px] sm:text-[11px] font-semibold text-slate-300">Active Queue &amp; Rewards</div>
                        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[9px] sm:text-[10px]">🩺</div>
                            <div className="mt-1">
                              <div className="text-[7px] sm:text-[8px] text-slate-300 font-medium">OPD Token</div>
                              <div className="text-[10px] sm:text-[11px] font-bold text-emerald-400">#07 (Next)</div>
                            </div>
                          </div>

                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col justify-between">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-[9px] sm:text-[10px]">⭐</div>
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
                          className="p-1.5 sm:p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-2 sm:gap-3 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[10px] sm:text-[11px]">
                              {tx.icon}
                            </span>
                            <div>
                              <div className="font-semibold text-white text-[10px] sm:text-[11px]">{tx.title}</div>
                              <div className="text-[7px] sm:text-[8px] text-slate-400">{tx.date}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400">{tx.amount}</span>
                            <span className="text-slate-500 text-[9px] sm:text-[10px]">•••</span>
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

    </div>
  );
}
