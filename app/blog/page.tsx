import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { getAllArticles } from "@/lib/articles-data";
import { BookOpen, Clock, Calendar, ArrowRight, ShieldCheck, Stethoscope, Compass, ShoppingBag, Wrench, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Knowledge Hub & Locality Guides | Kynisto",
  description: "Expert guides, clinical research, urban locality living manuals, and small business insights curated by Kynisto's editorial and healthcare advisory team.",
  alternates: {
    canonical: "https://kynisto.in/blog",
  },
  openGraph: {
    title: "Knowledge Hub & Locality Guides | Kynisto",
    description: "Expert guides, clinical research, urban locality living manuals, and small business insights.",
    url: "https://kynisto.in/blog",
    siteName: "Kynisto",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const articles = getAllArticles();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Kynisto Knowledge Hub & Locality Guides",
    description: "Expert guides, clinical research, urban locality living manuals, and small business insights.",
    url: "https://kynisto.in/blog",
    publisher: {
      "@type": "Organization",
      name: "Kynisto",
      url: "https://kynisto.in",
      logo: {
        "@type": "ImageObject",
        url: "https://kynisto.in/og.svg",
      },
    },
    hasPart: articles.map((article) => ({
      "@type": "Article",
      headline: article.title,
      description: article.summary,
      url: `https://kynisto.in/blog/${article.slug}`,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: {
        "@type": "Person",
        name: article.author.name,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <Navbar3D />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        {/* Hub Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-4 h-4 text-orange-400" />
            <span>Kynisto Knowledge Hub</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Locality Living, Health &amp; Commerce Guides
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            In-depth research, patient safety handbooks, and urban mobility guides curated by doctors, urban planners, and local commerce specialists.
          </p>
        </div>

        {/* Featured / Hero Article */}
        {articles.length > 0 && (
          <div className="mb-14 p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-slate-900/90 to-slate-900/50 border border-white/10 shadow-2xl relative overflow-hidden group hover:border-orange-500/40 transition-all">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
                {articles[0].category}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {articles[0].readTime}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                {articles[0].publishedAt}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4 group-hover:text-orange-400 transition-colors">
              <Link href={`/blog/${articles[0].slug}`}>
                {articles[0].title}
              </Link>
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-3xl">
              {articles[0].summary}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
              <div className="text-xs text-slate-400">
                By <strong className="text-white">{articles[0].author.name}</strong> • {articles[0].author.credentials}
              </div>
              <Link
                href={`/blog/${articles[0].slug}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs sm:text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/20"
              >
                <span>Read Full Guide</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Grid of All Articles */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {articles.slice(1).map((article) => (
            <article
              key={article.slug}
              className="p-6 rounded-3xl bg-slate-900/60 border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group hover:-translate-y-1 duration-300 shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/5 border border-white/10 text-orange-400">
                    {article.category}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                  <Link href={`/blog/${article.slug}`}>
                    {article.title}
                  </Link>
                </h3>

                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed mb-4 line-clamp-3">
                  {article.summary}
                </p>
              </div>

              <div className="border-t border-white/10 pt-4 mt-auto">
                <div className="text-[11px] text-slate-400 mb-3">
                  By <strong className="text-slate-200">{article.author.name}</strong>
                </div>
                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Editorial Standards Box */}
        <section className="mt-16 p-8 rounded-3xl bg-slate-900/40 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Our Editorial &amp; Review Standards</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            All medical and locality articles published on Kynisto are written or reviewed by qualified healthcare professionals, certified engineers, or urban researchers. We strictly prohibit unverified medical claims and maintain complete editorial independence from commercial sponsorships.
          </p>
        </section>
      </main>

      <Footer3D />
    </div>
  );
}
