"use client";

import { Compass, QrCode, BellRing, Sparkles } from "lucide-react";

export function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      title: "Discover Your Locality",
      desc: "Instant location-aware search scans nearby stores, pharmacies, salons, and specialty clinics within walking radius.",
      icon: Compass,
    },
    {
      num: "02",
      title: "Join Queue or Book Slot",
      desc: "Tap to issue a digital queue token or reserve an appointment slot without waiting in line at the physical counter.",
      icon: QrCode,
    },
    {
      num: "03",
      title: "Track Live Telemetry",
      desc: "Watch real-time token progression and receive automated notifications when the doctor or stylist is ready for you.",
      icon: BellRing,
    },
    {
      num: "04",
      title: "Fulfill & Earn Rewards",
      desc: "Receive fast, personalized service, rate your experience, and earn loyalty points automatically added to your digital wallet.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="py-24" id="how-it-works">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="text-[#0284c7] font-bold text-xs uppercase tracking-widest block mb-2">
          Operational Pipeline
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
          How Kynisto Powers Seamless Flow
        </h2>
        <p className="text-slate-600 text-base">
          From initial local discovery to finished appointment in 4 effortless steps.
        </p>
      </div>

      <div className="processPipeline">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.num} className="pipelineStep">
              <div className="flex items-center justify-between mb-4">
                <span className="stepNumber">{step.num}</span>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/60 flex items-center justify-center text-sky-600">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
