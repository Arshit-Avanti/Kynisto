"use client";

import Link from "next/link";
import { getAllArticles } from "@/lib/articles-data";
import { BookOpen, Clock, ArrowRight, Sparkles } from "lucide-react";

export function EditorialGuidesSection() {
  const articles = getAllArticles().slice(0, 6);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans" aria-label="Locality Editorial Guides">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-sm">
          <BookOpen className="w-4 h-4 text-orange-400" />
          <span>Kynisto Editorial &amp; Knowledge Hub</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
          Locality Living, Health &amp; Commerce Guides
        </h2>
        <p className="text-slate-100 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] font-medium">
          Explore research-backed patient safety manuals, 15-minute city frameworks, and neighborhood business insights curated by the Kynisto Editorial Desk.
        </p>
      </div>

      {/* Grid of Transparent Glassmorphism Cards with High-Contrast Text */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="p-7 sm:p-8 rounded-3xl bg-slate-900/60 hover:bg-slate-900/75 border border-white/20 hover:border-orange-500/50 backdrop-blur-xl shadow-2xl hover:shadow-orange-500/10 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1 relative overflow-hidden"
          >
            {/* Subtle card glow */}
            <div className="pointer-events-none absolute -top-20 -left-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-500" />

            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {article.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {article.readTime}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-white group-hover:text-orange-300 transition-colors line-clamp-2 leading-snug drop-shadow-sm">
                <Link href={`/blog/${article.slug}`}>
                  {article.title}
                </Link>
              </h3>

              <p className="text-slate-200 text-xs sm:text-sm leading-relaxed line-clamp-3 font-normal">
                {article.summary}
              </p>
            </div>

            <div className="border-t border-white/10 pt-5 mt-6 flex items-center justify-between relative z-10">
              <span className="text-xs text-slate-300 font-medium truncate max-w-[150px]">
                By {article.author.name}
              </span>
              <Link
                href={`/blog/${article.slug}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors"
              >
                <span>Read Guide</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      {/* Button */}
      <div className="mt-12 sm:mt-14 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-7 py-3.5 sm:px-8 sm:py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-500/25 transition-all hover:scale-105 active:scale-95"
        >
          <BookOpen className="w-4 h-4" />
          <span>Explore All 16 Locality &amp; Health Guides</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
