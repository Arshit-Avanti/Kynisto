"use client";

import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";

export function EditorialGuidesSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 my-8 font-sans" aria-label="Guides & Blog">
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/[0.08] border border-white/15 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight drop-shadow-sm">
              Guides &amp; Blog
            </h2>
            <p className="text-xs text-slate-200 hidden sm:block">
              Explore local living guides and community updates.
            </p>
          </div>
        </div>
        <Link
          href="/blog"
          className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm shadow transition-all flex items-center justify-center gap-1.5 shrink-0 group"
        >
          <span>Visit</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}


