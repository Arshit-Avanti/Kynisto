"use client";

import Link from "next/link";
import { HelpCircle, Stethoscope, ShoppingBag, ArrowRight, BookOpen } from "lucide-react";

export function EditorialFaqSection() {
  const faqs = [
    {
      question: "What is Kynisto and how does it serve local communities?",
      answer: "Kynisto is a next-generation real-time locality intelligence network. It bridges the gap between urban residents and neighborhood businesses by providing live open/closed indicators, direct inventory inquiries, and digital waiting room queue tokens for outpatient clinics, pharmacies, and specialty salons.",
    },
    {
      question: "How do virtual healthcare queue tokens eliminate physical waiting rooms?",
      answer: "When visiting a participating hospital or outpatient clinic, patients can register their arrival digitally or join the queue remotely. Kynisto issues a secure digital token that updates with live position and ETA countdowns, allowing patients to wait safely at home and arrive only when the physician is ready.",
    },
    {
      question: "How do local merchants and store owners benefit from listing on Kynisto?",
      answer: "Local shop owners receive a dedicated digital storefront, real-time product/service catalog indexing, customer messaging channels, and operational analytics. Merchants experience reduced counter congestion, higher customer retention, and increased neighborhood footfall.",
    },
    {
      question: "Is personal health and contact data kept private and secure?",
      answer: "Yes. Kynisto enforces strict data minimization principles under global privacy regulations and India's Digital Personal Data Protection Act. Queue tokens are temporary session objects scrubbed after consultation, and health records are never sold or shared with third-party advertisers.",
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-12 sm:my-16">
      <section
        className="py-12 sm:py-16 px-6 sm:px-12 rounded-3xl border border-white/15 bg-[#0e1628]/90 backdrop-blur-2xl text-white shadow-2xl shadow-black/80 transition-all"
        aria-labelledby="editorial-heading"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 sm:mb-14">
            <span className="text-sky-400 font-bold text-xs uppercase tracking-widest block mb-2">
              Locality Knowledge &amp; Guidance
            </span>
            <h2 id="editorial-heading" className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
              Understanding the Kynisto Locality Network
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Learn how our event-driven infrastructure empowers neighborhood commerce, eliminates clinic overcrowding, and connects communities.
            </p>
          </div>

          {/* Editorial Articles Grid */}
          <div className="grid md:grid-cols-2 gap-5 sm:gap-6 mb-12 sm:mb-14">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-4">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Digital Healthcare &amp; Outpatient Queuing</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Overcrowded waiting rooms increase patient anxiety and cross-infection risks. Kynisto&apos;s real-time queue engine powers transparent, dynamic doctor consultation scheduling.
                </p>
              </div>
              <Link href="/guide" className="text-sky-400 hover:text-sky-300 font-bold text-xs flex items-center gap-1.5 transition-colors">
                <span>Read Clinical Queue Guide</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-4">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">Hyperlocal Retail &amp; Verified Merchant Commerce</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                  Find grocery stock, salon slots, and repair experts in your immediate neighborhood without relying on unverified phone directories or distant delivery services.
                </p>
              </div>
              <Link href="/about" className="text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-colors">
                <span>Learn About Our Platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* FAQ Accordion Items */}
          <div className="space-y-3.5 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-400" /> Frequently Asked Questions
            </h3>
            {faqs.map((faq, index) => (
              <div key={index} className="p-4 sm:p-5 rounded-xl bg-white/[0.03] border border-white/10">
                <h4 className="font-bold text-white text-sm sm:text-base mb-1.5">{faq.question}</h4>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 text-white font-bold text-xs transition-all shadow-md">
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Visit Complete FAQ &amp; Help Center</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
