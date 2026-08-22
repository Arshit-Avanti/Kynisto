"use client";

import Link from "next/link";
import { HelpCircle, Stethoscope, ShoppingBag, ShieldCheck, ArrowRight, BookOpen } from "lucide-react";

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
    <section className="py-20 border-t border-slate-200/80 mt-16 bg-white/70 backdrop-blur-xl rounded-3xl p-8 sm:p-12 shadow-sm" aria-labelledby="editorial-heading">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[#0284c7] font-bold text-xs uppercase tracking-widest block mb-2">
            Locality Knowledge &amp; Guidance
          </span>
          <h2 id="editorial-heading" className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Understanding the Kynisto Locality Network
          </h2>
          <p className="text-slate-600 text-base max-w-2xl mx-auto leading-relaxed">
            Learn how our event-driven infrastructure empowers neighborhood commerce, eliminates clinic overcrowding, and connects communities.
          </p>
        </div>

        {/* Editorial Articles Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Digital Healthcare &amp; Outpatient Queuing</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Overcrowded waiting rooms increase patient anxiety and cross-infection risks. Kynisto&apos;s real-time queue engine powers transparent, dynamic doctor consultation scheduling.
              </p>
            </div>
            <Link href="/guide" className="text-sky-600 hover:text-sky-700 font-bold text-xs flex items-center gap-1">
              <span>Read Clinical Queue Guide</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Hyperlocal Retail &amp; Verified Merchant Commerce</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Find grocery stock, salon slots, and repair experts in your immediate neighborhood without relying on unverified phone directories or distant delivery services.
              </p>
            </div>
            <Link href="/about" className="text-emerald-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1">
              <span>Learn About Our Platform</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* FAQ Accordion Items */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-sky-600" /> Frequently Asked Questions
          </h3>
          {faqs.map((faq, index) => (
            <div key={index} className="p-5 rounded-xl bg-slate-50/80 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">{faq.question}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link href="/faq" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors">
            <BookOpen className="w-4 h-4 text-sky-600" />
            <span>Visit Complete FAQ &amp; Help Center</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
