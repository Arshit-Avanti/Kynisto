"use client";

import { CheckCircle2, XCircle, TrendingUp, Clock, Users, Shield, Zap, Sparkles } from "lucide-react";

export function BenefitsSection() {
  const comparisonRows = [
    {
      feature: "Clinic & Hospital Wait Times",
      traditional: "45–90 min physical waiting room delay",
      kynisto: "Live mobile queue token with exact ETA",
      highlight: true,
    },
    {
      feature: "Local Store Inventory & Pricing",
      traditional: "Manual phone calls or walk-ins required",
      kynisto: "Instant real-time catalog search & chat",
      highlight: false,
    },
    {
      feature: "Appointment Confirmation",
      traditional: "Manual paper slips or missed callbacks",
      kynisto: "1-Click automated slot reservation",
      highlight: true,
    },
    {
      feature: "Customer Loyalty & Rewards",
      traditional: "Lost physical punch cards",
      kynisto: "Digital wallet points across neighborhood",
      highlight: false,
    },
  ];

  return (
    <section className="py-24">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <span className="text-[#0284c7] font-bold text-xs uppercase tracking-widest block mb-2">
          Measurable Impact &amp; Architecture
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
          Why Modern Cities Choose Kynisto
        </h2>
        <p className="text-slate-600 text-base">
          Proven metrics delivering tangible time-savings and 3.2x higher merchant throughput.
        </p>
      </div>

      {/* Comparison Matrix Table */}
      <div className="max-w-4xl mx-auto mb-16 p-6 sm:p-8 rounded-3xl bg-white/90 border border-slate-200/90 backdrop-blur-xl shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-4 text-xs font-bold uppercase tracking-wider text-slate-500">Capability</th>
                <th className="pb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Traditional Directory</th>
                <th className="pb-4 text-xs font-bold uppercase tracking-wider text-[#0284c7]">Kynisto Modern</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 font-semibold text-slate-900">{row.feature}</td>
                  <td className="py-4 text-slate-500 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{row.traditional}</span>
                  </td>
                  <td className="py-4 text-sky-700 font-medium">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{row.kynisto}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
