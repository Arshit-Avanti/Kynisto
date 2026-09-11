"use client";

import Link from "next/link";
import { BookOpen, ArrowRight, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { getAllArticles } from "@/lib/articles-data";

export function EditorialGuidesSection() {
  const articles = getAllArticles().slice(0, 4);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 my-10 font-sans" aria-label="Locality Guides & Articles">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5 text-orange-400" />
            <span>Kynisto Knowledge Hub</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-sm">
            Locality Guides &amp; Health Insights
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
            In-depth guides on outpatient virtual queues, neighborhood clinics, and local commerce.
          </p>
        </div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-orange-400 hover:text-orange-300 transition-colors shrink-0 group self-start sm:self-auto"
        >
          <span>View all 16 guides</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="p-5 rounded-2xl bg-white/[0.08] hover:bg-white/[0.13] border border-white/15 hover:border-orange-500/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {article.readTime}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm sm:text-base leading-snug group-hover:text-orange-300 transition-colors line-clamp-2 mb-2">
                {article.title}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                {article.summary}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-xs text-orange-400 font-semibold group-hover:text-orange-300">
              <span>Read Guide</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

