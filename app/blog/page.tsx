import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { getAllArticles } from "@/lib/articles-data";
import { BookOpen, Clock, Calendar, ArrowRight, ShieldCheck, UserCheck, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Knowledge Hub & Locality Guides | Kynisto",
  description: "Expert guides, clinical research, urban locality living manuals, and small business insights curated by the Kynisto Editorial & Research Team.",
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
        "@type": "Organization",
        name: "Kynisto Editorial Team",
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <Navbar3D />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-36 pb-28">
        {/* Hub Header with Spacious Breathing Room */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider shadow-sm">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <span>Kynisto Knowledge Hub</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Locality Living, Health &amp; Commerce Guides
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            In-depth research, outpatient safety handbooks, and urban mobility manuals curated by Kynisto&apos;s editorial &amp; research teams.
          </p>
        </div>

        {/* Featured / Hero Article in Light Mode with Spacious Padding */}
        {articles.length > 0 && (
          <div className="mb-16 p-8 sm:p-12 lg:p-14 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:border-orange-400/60 transition-all duration-300">
            <div className="flex flex-wrap items-center gap-3.5 mb-6">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200">
                {articles[0].category}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {articles[0].readTime}
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {articles[0].publishedAt}
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-5 group-hover:text-orange-600 transition-colors leading-tight">
              <Link href={`/blog/${articles[0].slug}`}>
                {articles[0].title}
              </Link>
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-8 max-w-4xl">
              {articles[0].summary}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-6 border-t border-slate-100 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  K
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{articles[0].author.name}</div>
                  <div className="text-xs text-slate-500">{articles[0].author.role}</div>
                </div>
              </div>

              <Link
                href={`/blog/${articles[0].slug}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:from-orange-600 hover:to-amber-600 transition-all shadow-lg shadow-orange-500/25 hover:-translate-y-0.5"
              >
                <span>Read Full Guide</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Grid of All Articles with Spacious Layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {articles.slice(1).map((article) => (
            <article
              key={article.slug}
              className="p-8 rounded-3xl bg-white border border-slate-200/90 shadow-md hover:shadow-xl hover:border-orange-300 transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
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

              <div className="border-t border-slate-100 pt-5 mt-6">
                <div className="text-xs text-slate-500 mb-3 font-medium">
                  By <strong className="text-slate-800">{article.author.name}</strong>
                </div>
                <Link
                  href={`/blog/${article.slug}`}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Editorial Standards Box */}
        <section className="mt-20 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-900">Kynisto Editorial &amp; Review Standards</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
            All medical and locality articles published on Kynisto are authored and peer-reviewed by our internal healthcare informatics desk and locality research team. We strictly prohibit unverified medical claims and maintain complete editorial independence.
          </p>
        </section>
      </main>

      <Footer3D />
    </div>
  );
}
