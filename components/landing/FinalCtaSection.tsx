"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

export function FinalCtaSection() {
  return (
    <section className="py-28 text-center relative overflow-hidden">
      <div className="max-w-4xl mx-auto p-12 sm:p-16 rounded-3xl bg-gradient-to-b from-blue-950/40 via-slate-900/80 to-slate-950/90 border border-blue-500/20 backdrop-blur-2xl shadow-[0_20px_80px_rgba(36,87,255,0.15)] relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-[#00f0ff] text-xs font-bold uppercase tracking-wider mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Your Locality Experience</span>
        </div>

        <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
          Ready to Experience the <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Future of Neighborhood Living?
          </span>
        </h2>

        <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed">
          Join over 15,000 verified stores and clinics delivering effortless virtual queues and instant local discovery.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/login" className="btnPrimary3d text-base py-4 px-8">
            <span>Get Started for Free</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/healthcare" className="btnSecondary3d text-base py-4 px-8">
            <span>Explore Healthcare Clinics</span>
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#10b981]" /> No Credit Card Required
          </span>
          <span>•</span>
          <span>Instant 2-Minute Setup</span>
          <span>•</span>
          <span>Cancel Anytime</span>
        </div>
      </div>
    </section>
  );
}
