import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { getAllArticles, getArticleBySlug } from "@/lib/articles-data";
import { Clock, Calendar, ArrowLeft, ArrowRight, UserCheck, ShieldCheck, HelpCircle, CheckCircle2, Share2 } from "lucide-react";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "Article Not Found | Kynisto",
    };
  }

  const canonicalUrl = `https://kynisto.in/blog/${article.slug}`;

  return {
    title: `${article.title} | Kynisto Guide`,
    description: article.summary,
    keywords: article.keywords,
    authors: [{ name: article.author.name }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      url: canonicalUrl,
      siteName: "Kynisto",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.summary,
    },
  };
}

export default async function SingleArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = getAllArticles();
  const relatedArticles = allArticles.filter((a) => a.slug !== article.slug).slice(0, 2);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    url: `https://kynisto.in/blog/${article.slug}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      "@type": "Person",
      name: article.author.name,
      jobTitle: article.author.role,
    },
    publisher: {
      "@type": "Organization",
      name: "Kynisto",
      url: "https://kynisto.in",
      logo: {
        "@type": "ImageObject",
        url: "https://kynisto.in/og.svg",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://kynisto.in/blog/${article.slug}`,
    },
  };

  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://kynisto.in",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Knowledge Hub",
        item: "https://kynisto.in/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: `https://kynisto.in/blog/${article.slug}`,
      },
    ],
  };

  const faqJsonLd =
    article.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      <Navbar3D />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-white transition-colors">Knowledge Hub</Link>
          <span>/</span>
          <span className="text-orange-400 truncate max-w-xs">{article.category}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-10 pb-8 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30">
              {article.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {article.readTime}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              Published: {article.publishedAt}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            {article.title}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6 font-medium">
            {article.subtitle}
          </p>

          {/* Author Byline Box */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {article.author.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  <span>{article.author.name}</span>
                  <UserCheck className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <div className="text-xs text-slate-400">
                  {article.author.role} • <span className="text-slate-300">{article.author.credentials}</span>
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-500 uppercase tracking-wider block">Peer Reviewed</span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-3.5 h-3.5" /> Medically / Technically Verified
              </span>
            </div>
          </div>
        </header>

        {/* Key Takeaways Callout Box */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <aside className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-orange-500/30 mb-12 shadow-xl">
            <h2 className="text-lg font-bold text-orange-400 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-400" /> Key Insights &amp; Takeaways
            </h2>
            <ul className="space-y-3">
              {article.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="text-xs sm:text-sm text-slate-200 flex items-start gap-2.5 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Article Content Body */}
        <article className="prose prose-invert max-w-none space-y-10 text-slate-300 text-sm sm:text-base leading-relaxed">
          {article.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight border-l-4 border-orange-500 pl-3">
                {section.heading}
              </h2>
              {section.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.callout && (
                <div className="p-4 sm:p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-200 text-xs sm:text-sm font-medium">
                  {section.callout}
                </div>
              )}
            </section>
          ))}
        </article>

        {/* FAQs Section */}
        {article.faqs && article.faqs.length > 0 && (
          <section className="mt-14 p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-400" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {article.faqs.map((faq, fIdx) => (
                <div key={fIdx} className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-white/5">
                  <h3 className="font-bold text-white text-sm sm:text-base mb-2">{faq.q}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Articles Footer */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-white/10">
            <h3 className="text-lg font-bold text-white mb-6">Related Locality Guides</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="p-5 rounded-2xl bg-slate-900/50 border border-white/10 hover:border-orange-500/40 transition-all block group"
                >
                  <span className="text-[11px] font-bold text-orange-400 block mb-1">{rel.category}</span>
                  <h4 className="font-bold text-white text-sm group-hover:text-orange-300 transition-colors line-clamp-2 mb-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2">{rel.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to Blog Hub Button */}
        <div className="mt-12 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Knowledge Hub Guides</span>
          </Link>
        </div>
      </main>

      <Footer3D />
    </div>
  );
}
