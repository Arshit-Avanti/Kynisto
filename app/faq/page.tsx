import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { HelpCircle, Stethoscope, ShoppingBag, ShieldCheck, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Kynisto",
  description: "Comprehensive answers to common questions about Kynisto: live clinic virtual queues, finding verified doctors, neighborhood store messaging, merchant listings, and loyalty rewards.",
  alternates: {
    canonical: "https://kynisto.in/faq",
  },
};

export default function FaqPage() {
  const faqCategories = [
    {
      category: "Healthcare & Virtual OPD Queues",
      icon: Stethoscope,
      iconColor: "text-sky-700 bg-sky-100 border-sky-200",
      questions: [
        {
          q: "How does the live virtual queue token system work?",
          a: "When you join a clinic's queue on Kynisto, our system generates a cryptographically verified digital token with your current position in line and estimated wait time (ETA). As the physician completes consultations with preceding patients, your token advances automatically via real-time Server-Sent Events (SSE). You receive live audio/visual alerts on your phone so you only need to arrive at the clinic when your turn is imminent.",
        },
        {
          q: "Do I need to download a heavy mobile app to join a clinic queue?",
          a: "No! Kynisto operates as a lightweight, zero-install Progressive Web App that runs in any modern browser (Chrome, Safari, Firefox, Edge). You can join from home via the web portal or scan the clinic's unique physical QR code at reception.",
        },
        {
          q: "What happens if I encounter traffic and arrive late for my turn?",
          a: "You can tap 'Running Late' directly from your live queue pass. This notifies the clinic and temporarily shifts your turn by 2 positions without cancelling your registration, allowing the physician to continue with the next waiting patient while giving you extra transit time.",
        },
        {
          q: "Can I book appointments or join queues for family members?",
          a: "Yes. When joining a queue, you can enter the patient's name, age, gender, and consultation type (general consultation, follow-up, or pediatric review). Multiple passes can be active on a single device.",
        },
        {
          q: "How does the estimated wait time (ETA) calculate so accurately?",
          a: "The ETA engine dynamically recalculates based on the specific physician's real-time average consultation duration for that day, taking into account recent patient turnaround times, lunch breaks, and emergency priorities.",
        },
      ],
    },
    {
      category: "Neighborhood Stores & Local Discovery",
      icon: ShoppingBag,
      iconColor: "text-orange-700 bg-orange-100 border-orange-200",
      questions: [
        {
          q: "How are stores and services verified on Kynisto?",
          a: "Every merchant listed on Kynisto undergoes operational verification. Our team checks statutory business licenses (GSTIN, Trade License, Drug License for pharmacies), verifies physical storefront existence, and confirms operating hours before issuing a verified checkmark.",
        },
        {
          q: "Can I chat directly with local store owners before visiting?",
          a: "Yes! Kynisto features real-time, encrypted merchant messaging. You can inquire about item stock, request custom price quotes, check fresh produce arrivals, or coordinate curbside pickup directly from the store's profile page.",
        },
        {
          q: "How does Kynisto sort search results?",
          a: "Search results are sorted by geodesic proximity to your current GPS location, combined with verified customer ratings, real-time operational status (Open Now vs. Closed), and catalog match relevance.",
        },
        {
          q: "How do I list my shop or clinic on Kynisto?",
          a: "Click 'Merchant Portal' or 'Dashboard' to sign up as a Store Owner. You can complete your business profile, upload catalog items or services, and activate virtual queue tokens in less than 5 minutes for free.",
        },
      ],
    },
    {
      category: "Home Services & Certified Professionals",
      icon: Wrench,
      iconColor: "text-purple-700 bg-purple-100 border-purple-200",
      questions: [
        {
          q: "What types of home services can I find on Kynisto?",
          a: "You can discover certified electricians, plumbers, air conditioner repair technicians, home appliance mechanics, pest control experts, carpenters, and painting contractors in your immediate locality.",
        },
        {
          q: "Are technician prices transparent?",
          a: "Yes. Verified service listings detail standard inspection charges, hourly labor estimates, and common repair package pricing upfront.",
        },
        {
          q: "How do I communicate with a technician for emergency repairs?",
          a: "Each verified technician profile includes a direct one-tap call button, WhatsApp connection, and in-platform messaging for fast emergency response.",
        },
      ],
    },
    {
      category: "Security, Privacy & Loyalty Rewards",
      icon: ShieldCheck,
      iconColor: "text-emerald-700 bg-emerald-100 border-emerald-200",
      questions: [
        {
          q: "Is my personal healthcare and contact data secure?",
          a: "Yes. All data transmissions are protected using TLS 1.3 encryption. We strictly follow Google AdSense publisher privacy standards, GDPR, and Indian Digital Personal Data Protection guidelines. We never sell your personal data to third parties.",
        },
        {
          q: "How does the Kynisto Loyalty Rewards Wallet work?",
          a: "Every time you visit a participating local store, complete an appointment, or use a local service, loyalty reward coins are credited to your digital wallet. You can redeem these coins for instant discounts by showing your wallet QR code at checkout.",
        },
        {
          q: "Does Kynisto charge commission fees on my purchases?",
          a: "No. Kynisto is a zero-commission locality platform. You pay the merchant directly with no hidden middleman fees or platform markups.",
        },
      ],
    },
  ];

  const allFaqs = faqCategories.flatMap((cat) => cat.questions);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar3D />

      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-36 pb-28">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 border border-sky-200 text-sky-800 text-xs font-bold uppercase tracking-wider shadow-sm">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Comprehensive Help Center</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about using virtual queues, finding verified doctors, messaging local merchants, and navigating your locality.
          </p>
        </div>

        {/* Categories & Q&A Blocks with Spacious Padding */}
        <div className="space-y-16">
          {faqCategories.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.category} className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-md">
                <div className="flex items-center gap-3.5 mb-8 border-b border-slate-100 pb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${section.iconColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{section.category}</h2>
                </div>

                <div className="space-y-6">
                  {section.questions.map((faq, idx) => (
                    <div key={idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all">
                      <h3 className="font-bold text-slate-900 text-lg mb-2.5 flex items-start gap-3">
                        <span className="text-orange-600 font-black shrink-0">Q.</span>
                        <span>{faq.q}</span>
                      </h3>
                      <p className="text-slate-600 text-sm sm:text-base leading-relaxed pl-7">
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Still Have Questions Box */}
        <div className="mt-20 p-10 sm:p-14 rounded-3xl bg-orange-50 border border-orange-200 text-center shadow-sm">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Still have questions?</h3>
          <p className="text-sm sm:text-base text-slate-600 mb-8 max-w-lg mx-auto">
            Our support desk is available 6 days a week to help with queue issues, merchant registrations, and technical inquiries.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm shadow-lg shadow-orange-500/20 hover:from-orange-600 hover:to-amber-600 transition-all"
          >
            <span>Contact Support Desk</span>
          </Link>
        </div>
      </main>

      <Footer3D />
    </div>
  );
}
