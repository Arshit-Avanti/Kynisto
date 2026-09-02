"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export function EditorialGuidesSection() {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8 font-sans">
      <Link
        href="/blog"
        className="block p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/[0.07] hover:bg-white/[0.11] border border-white/15 hover:border-orange-500/40 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
      >
        {/* Subtle Glass Glow Highlight */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/10 transition-transform duration-300 group-hover:scale-110">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white mb-1 drop-shadow-sm group-hover:text-orange-300 transition-colors">
                Kynisto Knowledge Hub &amp; Guides
              </h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
                Explore 16 in-depth guides on healthcare queues, local commerce, and urban living.
              </p>
            </div>
          </div>

          <span
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 group-hover:from-orange-600 group-hover:to-amber-600 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-orange-500/25 shrink-0 group-hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4" />
            <span>Blog</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </div>
  );
}
