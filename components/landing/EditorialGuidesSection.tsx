"use client";

import Link from "next/link";
import { getAllArticles } from "@/lib/articles-data";
import { BookOpen, Clock, ArrowRight, ShieldCheck, Sparkles, HeartPulse, Store, Wrench, Compass } from "lucide-react";

export function EditorialGuidesSection() {
  const articles = getAllArticles().slice(0, 6);

  return (
    <section className="py-20 px-6 sm:px-8 lg:px-12 max-w-7xl mx-auto font-sans" aria-label="Locality Editorial Guides">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider shadow-sm">
          <BookOpen className="w-4 h-4 text-orange-600" />
          <span>Kynisto Editorial &amp; Knowledge Hub</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Locality Living, Health &amp; Commerce Guides
        </h2>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Explore research-backed patient safety manuals, 15-minute city frameworks, and neighborhood business insights curated by the Kynisto Editorial Desk.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <article
            key={article.slug}
            className="p-8 rounded-3xl bg-white border border-slate-200 shadow-md hover:shadow-xl hover:border-orange-400/80 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-orange-600 border border-slate-200">
                  {article.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {article.readTime}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                <Link href={`/blog/${article.slug}`}>
                  {article.title}
                </Link>
              </h3>

              <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                {article.summary}
              </p>
            </div>

            <div className="border-t border-slate-100 pt-5 mt-6 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium truncate max-w-[160px]">
                By {article.author.name}
              </span>
              <Link
                href={`/blog/${article.slug}`}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
              >
                <span>Read Guide</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 transition-all hover:-translate-y-0.5"
        >
          <BookOpen className="w-4 h-4" />
          <span>Explore All 16 Locality &amp; Health Guides</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
