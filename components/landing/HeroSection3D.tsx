"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Activity, ShieldCheck, Zap } from "lucide-react";

export function HeroSection3D({ onExploreClick }: { onExploreClick?: () => void }) {
  return (
    <section className="heroSection3d" aria-label="Hero">
      <div className="heroTag">
        <Sparkles className="w-3.5 h-3.5 text-[#00f0ff] animate-spin" style={{ animationDuration: "8s" }} />
        <span>Kynisto 2.1 — Next-Generation Locality Intelligence</span>
      </div>

      <h1 className="heroTitle">
        Everything Around You, <br />
        <span className="gradientTextHero">Smarter, Faster &amp; Realtime</span>
      </h1>

      <p className="heroSubtitle">
        The unified intelligence grid connecting local clinics, retail stores, home services, and
        instant queue management into one seamless interactive ecosystem.
      </p>

      <div className="heroActions">
        <button
          type="button"
          onClick={onExploreClick}
          className="btnPrimary3d"
        >
          <span>Explore Live Discovery</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <Link href="/healthcare" className="btnSecondary3d">
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <span>Live Healthcare Queues</span>
        </Link>
      </div>

      {/* Real-time Telemetry Status Bar */}
      <div className="heroTelemetryBar">
        <div className="telemetryItem">
          <span className="pulseDot" />
          <span>Active Grid: <b>15,000+ Stores</b></span>
        </div>
        <div className="telemetryItem">
          <Zap className="w-3.5 h-3.5 text-[#ff8a00]" />
          <span>Avg Wait Time: <b>&lt; 30 Seconds</b></span>
        </div>
        <div className="telemetryItem">
          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
          <span>Telemetry: <b>99.9% Uptime</b></span>
        </div>
      </div>
    </section>
  );
}
