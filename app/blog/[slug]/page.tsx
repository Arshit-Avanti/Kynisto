import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { getAllArticles, getArticleBySlug } from "@/lib/articles-data";
import { Clock, Calendar, ArrowLeft, ArrowRight, UserCheck, ShieldCheck, HelpCircle, CheckCircle2 } from "lucide-react";

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
      "@type": "Organization",
      name: article.author.name,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd).replace(/</g, "\\u003c") }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <Navbar3D />

      <main className="max-w-4xl mx-auto px-6 sm:px-8 pt-36 pb-28">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-slate-900 transition-colors">Knowledge Hub</Link>
          <span>/</span>
          <span className="text-orange-600 truncate max-w-xs">{article.category}</span>
        </nav>

        {/* Article Header */}
        <header className="mb-12 pb-10 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3.5 mb-5">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
              {article.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {article.readTime}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Published: {article.publishedAt}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-5 leading-tight">
            {article.title}
          </h1>

          <p className="text-slate-600 text-base sm:text-xl leading-relaxed mb-8 font-medium">
            {article.subtitle}
          </p>

          {/* Author Byline Box in Light Mode with Kynisto Identity */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                K
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{article.author.name}</span>
                  <UserCheck className="w-4 h-4 text-sky-600" />
                </div>
                <div className="text-xs text-slate-500">
                  {article.author.role} • <span className="text-slate-700 font-medium">{article.author.credentials}</span>
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-bold">Review Status</span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 justify-end">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Editorial Standard
              </span>
            </div>
          </div>
        </header>

        {/* Key Takeaways Callout Box in Light Mode */}
        {article.keyTakeaways && article.keyTakeaways.length > 0 && (
          <aside className="p-8 rounded-3xl bg-orange-50/80 border border-orange-200 mb-14 shadow-sm">
            <h2 className="text-lg font-bold text-orange-950 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-orange-600" /> Key Insights &amp; Takeaways
            </h2>
            <ul className="space-y-3.5">
              {article.keyTakeaways.map((takeaway, idx) => (
                <li key={idx} className="text-sm text-slate-800 flex items-start gap-3 leading-relaxed">
                  <span className="w-2 h-2 rounded-full bg-orange-500 mt-2 shrink-0" />
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        {/* Article Content Body in Light Mode */}
        <article className="space-y-12 text-slate-800 text-base sm:text-lg leading-relaxed font-normal">
          {article.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight border-l-4 border-orange-500 pl-4 py-0.5">
                {section.heading}
              </h2>
              {section.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
              {section.callout && (
                <div className="p-5 sm:p-6 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-sm sm:text-base font-medium leading-relaxed my-4">
                  {section.callout}
                </div>
              )}
            </section>
          ))}
        </article>

        {/* FAQs Section in Light Mode */}
        {article.faqs && article.faqs.length > 0 && (
          <section className="mt-16 p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-sky-600" /> Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {article.faqs.map((faq, fIdx) => (
                <div key={fIdx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-2">{faq.q}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Articles Footer */}
        {relatedArticles.length > 0 && (
          <section className="mt-16 pt-10 border-t border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Related Locality Guides</h3>
            <div className="grid sm:grid-cols-2 gap-6">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.slug}
                  href={`/blog/${rel.slug}`}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all block group"
                >
                  <span className="text-xs font-bold text-orange-600 block mb-1">{rel.category}</span>
                  <h4 className="font-bold text-slate-900 text-base group-hover:text-orange-600 transition-colors line-clamp-2 mb-2">
                    {rel.title}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{rel.summary}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to Blog Hub Button */}
        <div className="mt-14 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm border border-slate-300 shadow-sm transition-all"
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
