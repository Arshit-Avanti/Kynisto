"use client";

import { MapPin, Globe, Cpu, Layers } from "lucide-react";

export function ProductIntroSection() {
  return (
    <section className="py-24 relative" id="ecosystem">
      <div className="max-w-4xl mx-auto text-center mb-16">
        <span className="text-[#00f0ff] font-bold text-xs uppercase tracking-widest block mb-3">
          Quantum Locality Architecture
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-6">
          Architected for the High-Speed Modern Economy
        </h2>
        <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Traditional directory platforms are static and disconnected. Kynisto operates as a live,
          event-driven network that synchronizes doctor appointments, customer live queues, and store
          inventories with sub-second latency.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="metricCard">
          <div className="metricValue">15K+</div>
          <div className="metricLabel">Verified Local Businesses</div>
        </div>
        <div className="metricCard">
          <div className="metricValue">&lt; 30s</div>
          <div className="metricLabel">Live Queue Turnaround</div>
        </div>
        <div className="metricCard">
          <div className="metricValue">99.8%</div>
          <div className="metricLabel">Appointment Fulfillment</div>
        </div>
        <div className="metricCard">
          <div className="metricValue">50+</div>
          <div className="metricLabel">Cities and Localities</div>
        </div>
      </div>
    </section>
  );
}
