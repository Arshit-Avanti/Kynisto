"use client";

import Link from "next/link";
import { HelpCircle, Stethoscope, ShoppingBag, ArrowRight, BookOpen } from "lucide-react";

export function EditorialFaqSection() {
  const faqs = [
    {
      question: "What is Kynisto and how does it serve local communities?",
      answer: "Kynisto connects you to nearby stores, live clinic waiting queues, and local services in real time with instant directions and availability.",
    },
    {
      question: "How do virtual healthcare queue tokens eliminate physical waiting rooms?",
      answer: "Join clinic queues directly from your phone, track live token counts and estimated wait times, and arrive right when the doctor is ready.",
    },
    {
      question: "How do local merchants and store owners benefit from listing on Kynisto?",
      answer: "Merchants get a digital storefront, real-time product and service indexing, customer chat, and queue tools to boost neighborhood footfall.",
    },
    {
      question: "Is personal health and contact data kept private and secure?",
      answer: "Yes. Queue tokens are automatically scrubbed after your visit, and all health data is encrypted and never shared or sold.",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 sm:my-16 space-y-16 sm:space-y-20">
      
      {/* 1. SECTION: LOCALITY KNOWLEDGE & GUIDANCE (TRANSPARENT BACKGROUND) */}
      <section
        className="w-full bg-transparent text-white transition-all"
        aria-labelledby="editorial-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-sky-400 font-bold text-xs uppercase tracking-widest block mb-2">
              Locality Knowledge &amp; Guidance
            </span>
            <h2 id="editorial-heading" className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 drop-shadow-md">
              Understanding the Kynisto Locality Network
            </h2>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Learn how our event-driven infrastructure empowers neighborhood commerce, eliminates clinic overcrowding, and connects communities.
            </p>
          </div>

          {/* Editorial Articles Grid */}
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {/* Healthcare Guide Card */}
            <div className="editorialCard editorialCardHealthcare group p-6 sm:p-7 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer relative overflow-hidden">
              <div className="relative z-10">
                <div className="editorialCardBadge w-11 h-11 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-4 transition-all duration-300">
                  <Stethoscope className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-sky-300 transition-colors drop-shadow-sm">
                  Digital Healthcare &amp; Outpatient Queuing
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-normal">
                  Overcrowded waiting rooms increase patient anxiety and cross-infection risks. Kynisto&apos;s real-time queue engine powers transparent, dynamic doctor consultation scheduling.
                </p>
              </div>
              <Link href="/guide" className="relative z-10 text-sky-400 group-hover:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-all">
                <span>Read Clinical Queue Guide</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </div>

            {/* Merchant Retail Card */}
            <div className="editorialCard editorialCardRetail group p-6 sm:p-7 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl transition-all duration-300 flex flex-col justify-between shadow-xl cursor-pointer relative overflow-hidden">
              <div className="relative z-10">
                <div className="editorialCardBadge w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4 transition-all duration-300">
                  <ShoppingBag className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors drop-shadow-sm">
                  Hyperlocal Retail &amp; Verified Merchant Commerce
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-normal">
                  Find grocery stock, salon slots, and repair experts in your immediate neighborhood without relying on unverified phone directories or distant delivery services.
                </p>
              </div>
              <Link href="/about" className="relative z-10 text-emerald-400 group-hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all">
                <span>Learn About Our Platform</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: FREQUENTLY ASKED QUESTIONS (TRANSPARENT BACKGROUND) */}
      <section
        className="w-full bg-transparent text-white transition-all"
        aria-labelledby="faq-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10 sm:mb-12">
            <span className="text-orange-400 font-bold text-xs uppercase tracking-widest block mb-2">
              Common Inquiries &amp; Support
            </span>
            <h2 id="faq-heading" className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 flex items-center justify-center gap-2.5 drop-shadow-md">
              <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-orange-400" />
              <span>Frequently Asked Questions</span>
            </h2>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Clear answers about our real-time clinic queuing, local merchant catalog indexing, and private data protection.
            </p>
          </div>

          {/* FAQ Accordion Items */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="faqCard group p-5 sm:p-6 rounded-2xl bg-white/[0.06] border border-white/15 backdrop-blur-xl transition-all duration-300 shadow-md cursor-default hover:-translate-y-1.5 hover:bg-white/[0.09] hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10"
              >
                <h3 className="font-bold text-white text-base sm:text-lg mb-2 group-hover:text-orange-300 transition-colors drop-shadow-sm">
                  {faq.question}
                </h3>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed font-normal">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.1] hover:bg-white/[0.18] border border-white/20 backdrop-blur-md text-white font-bold text-xs sm:text-sm transition-all shadow-lg hover:shadow-orange-500/10"
            >
              <BookOpen className="w-4 h-4 text-orange-400" />
              <span>Visit Complete FAQ &amp; Help Center</span>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
