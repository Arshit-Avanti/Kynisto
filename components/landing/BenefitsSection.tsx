"use client";

import { CheckCircle2, TrendingUp, Clock, Users } from "lucide-react";

export function BenefitsSection() {
  const benefits = [
    {
      title: "For Customers & Patients",
      highlight: "Save 45+ mins per visit",
      points: [
        "Never wait in crowded clinic waiting rooms again",
        "Search verified prices and live stock before stepping out",
        "Direct chat with store owners and doctor staff",
        "Earn digital coins redeemable at all neighborhood stores",
      ],
    },
    {
      title: "For Clinic & Store Owners",
      highlight: "3.2x Average Revenue Lift",
      points: [
        "Eliminate counter congestion and manage patient flow effortlessly",
        "Automated WhatsApp & Web Push appointment reminders",
        "Broadcast promotions to verified neighborhood residents",
        "Multi-user staff access with role permissions and analytics",
      ],
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="text-[#10b981] font-bold text-xs uppercase tracking-widest block mb-2">
          Measurable Impact
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
          Transforming Local Daily Commerce
        </h2>
        <p className="text-slate-400 text-base">
          Proven metrics delivering tangible time-savings and higher business throughput.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {benefits.map((card) => (
          <div key={card.title} className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl hover:border-slate-700 transition-all duration-300">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#38bdf8] bg-sky-950/60 px-3 py-1 rounded-full inline-block mb-4 border border-sky-800/40">
              {card.highlight}
            </span>
            <h3 className="text-2xl font-bold text-white mb-6">{card.title}</h3>
            <ul className="space-y-4">
              {card.points.map((pt) => (
                <li key={pt} className="flex items-start gap-3 text-sm text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                  <span>{pt}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
