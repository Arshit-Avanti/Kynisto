"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, Activity, ShieldCheck, Zap, Star, Search, Clock, CheckCircle2 } from "lucide-react";

export function HeroSection3D({ onExploreClick }: { onExploreClick?: () => void }) {
  const [queueCount, setQueueCount] = useState(14);
  const [waitSeconds, setWaitSeconds] = useState(240);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaitSeconds((prev) => (prev > 10 ? prev - 1 : 240));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatWait = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <section className="heroSection3d" aria-label="Hero">
      {/* High-Tech Whisk Status Pill */}
      <div className="heroTag">
        <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] animate-spin" style={{ animationDuration: "8s" }} />
        <span>Kynisto 2.1 — Next-Generation Locality Intelligence</span>
      </div>

      <h1 className="heroTitle">
        Everything Around You, <br />
        <span className="gradientTextHero">Smarter, Faster &amp; Realtime</span>
      </h1>

      <p className="heroSubtitle">
        The unified intelligence grid connecting local clinics, retail storefronts, and instant
        virtual queues into one seamless, ultra-low-latency ecosystem.
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

      {/* Floating Interactive Live Micro-Widgets */}
      <div className="mt-12 flex items-center justify-center gap-4 flex-wrap max-w-3xl">
        {/* Live Token Simulator Widget */}
        <div className="p-4 px-5 rounded-2xl bg-slate-900/70 border border-slate-700/60 backdrop-blur-xl flex items-center gap-3.5 shadow-xl hover:border-cyan-500/50 transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex flex-col items-center justify-center font-black">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Token</span>
            <span className="text-sm leading-none">#{queueCount}</span>
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>CarePoint Health Clinic</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-cyan-300">
                <Clock className="w-3 h-3" /> ETA: {formatWait(waitSeconds)}
              </span>
              <span>•</span>
              <span className="text-emerald-400">3 ahead</span>
            </div>
          </div>
        </div>

        {/* Digital Wallet Rewards Badge */}
        <div className="p-4 px-5 rounded-2xl bg-slate-900/70 border border-slate-700/60 backdrop-blur-xl flex items-center gap-3.5 shadow-xl hover:border-amber-500/50 transition-all text-left">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>500 Welcome Coins</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">READY</span>
            </div>
            <span className="text-[11px] text-slate-400">1-Click QR redemption at local stores</span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry Status Bar */}
      <div className="heroTelemetryBar">
        <div className="telemetryItem">
          <span className="pulseDot" />
          <span>Active Grid: <b>15,240+ Places</b></span>
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
