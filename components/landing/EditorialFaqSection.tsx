"use client";

import Link from "next/link";
import { HelpCircle, Stethoscope, ShoppingBag, ArrowRight, BookOpen } from "lucide-react";

export function EditorialFaqSection() {

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 sm:my-16 space-y-16 sm:space-y-20">
      
      {/* 1. SECTION: LOCALITY KNOWLEDGE & GUIDANCE (TRANSPARENT BACKGROUND) */}
      <section
        className="w-full bg-transparent text-white transition-all"
        aria-labelledby="editorial-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-sky-400 font-bold text-xs uppercase tracking-widest block mb-2">
              Locality Knowledge &amp; Guidance
            </span>
            <h2 id="editorial-heading" className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
              Understanding the Kynisto Locality Network
            </h2>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Learn how our event-driven infrastructure empowers neighborhood commerce, eliminates clinic overcrowding, and connects communities.
            </p>
          </div>

          {/* Editorial Articles Grid */}
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {/* Healthcare Guide Card */}
            <div className="editorialCard editorialCardHealthcare group p-6 sm:p-7 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer relative overflow-hidden">
              <div className="relative z-10">
                <div className="editorialCardBadge w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-4 transition-all duration-300">
                  <Stethoscope className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors drop-shadow-sm">
                  Digital Healthcare &amp; Outpatient Queuing
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-normal">
                  Overcrowded waiting rooms increase patient anxiety and cross-infection risks. Kynisto&apos;s real-time queue engine powers transparent, dynamic doctor consultation scheduling.
                </p>
              </div>
              <Link href="/guide" className="relative z-10 text-sky-400 group-hover:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all">
                <span>Read Clinical Queue Guide</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </div>

            {/* Merchant Retail Card */}
            <div className="editorialCard editorialCardRetail group p-6 sm:p-7 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer relative overflow-hidden">
              <div className="relative z-10">
                <div className="editorialCardBadge w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 transition-all duration-300">
                  <ShoppingBag className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors drop-shadow-sm">
                  Hyperlocal Retail &amp; Verified Merchant Commerce
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-normal">
                  Find grocery stock, salon slots, and repair experts in your immediate neighborhood without relying on unverified phone directories or distant delivery services.
                </p>
              </div>
              <Link href="/about" className="relative z-10 text-emerald-400 group-hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all">
                <span>Learn About Our Platform</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: 1-CLICK FAQ & HELP CENTER ACCESS (TRANSPARENT GLASSMORPHISM) */}
      <section
        className="w-full max-w-4xl mx-auto"
        aria-labelledby="faq-help-heading"
      >
        <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.07] hover:bg-white/[0.11] border border-white/15 hover:border-orange-500/40 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-6 text-left relative overflow-hidden group">
          {/* Subtle Glass Glow Highlight */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10 transition-transform duration-300 group-hover:scale-110">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 id="faq-help-heading" className="text-base sm:text-lg font-bold text-white mb-1 drop-shadow-sm group-hover:text-orange-300 transition-colors">
                Have questions about Kynisto?
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                Explore guides, clinic queuing answers, merchant benefits, privacy, and support.
              </p>
            </div>
          </div>

          <Link
            href="/faq"
            className="relative z-10 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 shrink-0 hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            <span>Visit Complete FAQ &amp; Help Center</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

    </div>
  );
}
