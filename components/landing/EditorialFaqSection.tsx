"use client";

import Link from "next/link";
import { HelpCircle, Stethoscope, ShoppingBag, ArrowRight, BookOpen } from "lucide-react";

export function EditorialFaqSection() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-10 sm:my-14">
      {/* 1-CLICK FAQ & HELP CENTER ACCESS (TRANSPARENT GLASSMORPHISM) */}
      <section
        className="w-full"
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
