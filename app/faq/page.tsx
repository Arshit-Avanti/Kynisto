import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { HelpCircle, Stethoscope, ShoppingBag, Wallet, Shield, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) | Kynisto",
  description: "Find answers to common questions about using Kynisto: live clinic queues, doctor appointment scheduling, neighborhood store discovery, and digital loyalty rewards.",
  alternates: {
    canonical: "https://kynisto.in/faq",
  },
};

export default function FaqPage() {
  const faqItems = [
    {
      category: "Healthcare & Virtual Queues",
      icon: Stethoscope,
      questions: [
        {
          q: "How does the live virtual queue token system work?",
          a: "When you join a clinic's queue on Kynisto, our system generates an encrypted digital token with your current position in line and estimated wait time (ETA). As the doctor finishes with preceding patients, your token advances automatically. You receive real-time notifications on your phone so you only need to arrive when the doctor is ready for you.",
        },
        {
          q: "Do I need to install an app to join a clinic queue?",
          a: "No! Kynisto operates as a lightweight Progressive Web App that works seamlessly in any mobile browser or desktop. You can also scan the clinic's unique physical QR code at the reception to join instantly.",
        },
        {
          q: "What happens if I arrive late for my queue token?",
          a: "You can tap 'Running Late' directly from your queue tracker to notify the clinic. The receptionist or physician can grant a grace period or hold your spot safely without cancelling your turn.",
        },
      ],
    },
    {
      category: "Local Stores & Discovery",
      icon: ShoppingBag,
      questions: [
        {
          q: "How are stores and services verified on Kynisto?",
          a: "Every merchant listed on Kynisto undergoes operational verification. We verify business registrations, physical storefront locations, active phone numbers, and operational hours before publishing their profile to the public directory.",
        },
        {
          q: "Can I chat directly with local store owners?",
          a: "Yes! Kynisto features real-time, encrypted merchant messaging. You can inquire about item stock, request custom price quotes, or coordinate curbside pickup directly from the store's profile page.",
        },
        {
          q: "How do I list my shop or medical clinic on Kynisto?",
          a: "Click 'Merchant Portal' or 'Dashboard' to sign up as a Store Owner. You can complete your business profile, upload catalog items or services, and activate virtual queues in less than 5 minutes.",
        },
      ],
    },
    {
      category: "Wallet & Loyalty Rewards",
      icon: Wallet,
      questions: [
        {
          q: "How do I earn and redeem Kynisto loyalty coins?",
          a: "Every time you complete an appointment, purchase products, or visit participating neighborhood stores, loyalty coins are automatically credited to your digital wallet. You can redeem these coins by showing your unique QR code at checkout for instant discounts.",
        },
        {
          q: "Are my personal health and payment details secure?",
          a: "Yes. All data transmissions are encrypted using industry-standard TLS 1.3 encryption. We do not store sensitive payment card details, and queue entries are automatically archived after completion of service.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar3D />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100/80 border border-sky-300 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-4 h-4 text-sky-600" />
            <span>Knowledge Base</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            Everything you need to know about navigating your locality, booking medical appointments, and using Kynisto.
          </p>
        </div>

        <div className="space-y-12">
          {faqItems.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.category} className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{section.category}</h2>
                </div>

                <div className="space-y-6">
                  {section.questions.map((faq, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
                      <h3 className="font-bold text-slate-900 text-base mb-2">{faq.q}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      <Footer3D />
    </div>
  );
}
