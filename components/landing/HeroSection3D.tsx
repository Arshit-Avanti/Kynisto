"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Activity, ShieldCheck, Zap, Layers, Clock, Star } from "lucide-react";

export function HeroSection3D({ onExploreClick }: { onExploreClick?: () => void }) {
  return (
    <section className="heroSection3d" aria-label="Hero">
      {/* High-Tech Badge */}
      <div className="heroTag">
        <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] animate-spin" style={{ animationDuration: "8s" }} />
        <span>Kynisto 2.1 Pro Max — Next-Gen Locality &amp; Healthcare Grid</span>
      </div>

      <h1 className="heroTitle">
        Everything Around You, <br />
        <span className="gradientTextHero">Smarter, Faster &amp; Realtime</span>
      </h1>

      <p className="heroSubtitle">
        The unified intelligence grid connecting local clinics, pharmacies, retail stores, and
        instant queue management into one seamless interactive ecosystem.
      </p>

      <div className="heroActions">
        <button
          type="button"
          onClick={onExploreClick}
          className="btnPrimary3d"
        >
          <span>Explore Live Locality Grid</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <Link href="/healthcare" className="btnSecondary3d">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <span>Live Healthcare Queues</span>
        </Link>
      </div>

      {/* Floating 3D Micro-Widget Previews */}
      <div className="mt-12 flex items-center justify-center gap-4 flex-wrap max-w-2xl">
        <div className="p-3.5 px-5 rounded-2xl bg-slate-900/65 border border-slate-700/60 backdrop-blur-xl flex items-center gap-3 shadow-lg hover:border-cyan-500/50 transition-all">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-black text-xs">
            #14
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>CarePoint Clinic</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[11px] text-slate-400">Estimated wait: 4 mins</span>
          </div>
        </div>

        <div className="p-3.5 px-5 rounded-2xl bg-slate-900/65 border border-slate-700/60 backdrop-blur-xl flex items-center gap-3 shadow-lg hover:border-cyan-500/50 transition-all">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Star className="w-4 h-4 fill-amber-400" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-white">500 Loyalty Coins</div>
            <span className="text-[11px] text-slate-400">Ready for redemption</span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Status Bar */}
      <div className="heroTelemetryBar">
        <div className="telemetryItem">
          <span className="pulseDot" />
          <span>Active Grid: <b>15,240+ Stores &amp; Clinics</b></span>
        </div>
        <div className="telemetryItem">
          <Zap className="w-3.5 h-3.5 text-[#ff8a00]" />
          <span>Avg Queue Turnaround: <b>&lt; 30 Seconds</b></span>
        </div>
        <div className="telemetryItem">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Telemetry Uptime: <b>99.99% Operational</b></span>
        </div>
      </div>
    </section>
  );
}
