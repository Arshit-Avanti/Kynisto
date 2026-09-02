import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { FileCheck, Shield, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | Kynisto",
  description: "Read the Terms of Service for Kynisto, governing usage of our neighborhood directory, appointment booking, virtual queues, and merchant tools.",
  alternates: {
    canonical: "https://kynisto.in/terms",
  },
};

export default function TermsPage() {
  const lastUpdated = "August 30, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <Navbar3D />

      <main className="max-w-4xl mx-auto px-6 sm:px-8 pt-36 pb-28">
        {/* Header */}
        <div className="border-b border-slate-200 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <FileCheck className="w-4 h-4 text-orange-600" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-600 text-sm">
            Last Updated: <strong className="text-slate-900">{lastUpdated}</strong> • Please read these terms carefully before accessing Kynisto.
          </p>
        </div>

        {/* Content Body */}
        <article className="space-y-10 text-slate-700 text-base sm:text-lg leading-relaxed">
          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing, browsing, or using the services provided on <strong>https://kynisto.in</strong> or any affiliated Kynisto applications, you agree to be bound by these Terms of Service and all applicable local, national, and international laws and regulations.
            </p>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Services</h2>
            <p>
              Kynisto is a real-time hyperlocal discovery and digital orchestration platform that provides:
            </p>
            <ul className="list-disc list-inside space-y-3 mt-4 text-slate-700 text-sm sm:text-base">
              <li>Neighborhood store, clinic, and service provider directories with live operational indicators.</li>
              <li>Virtual waiting room management and digital queue token dispatch for outpatient medical clinics.</li>
              <li>Online appointment booking and customer-to-merchant direct messaging.</li>
              <li>Digital loyalty points and contactless redemption rewards.</li>
            </ul>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Medical Disclaimer &amp; Patient Responsibilities</h2>
            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4 text-amber-950 text-sm sm:text-base">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Important Medical Notice:</strong> Kynisto is a queue management and scheduling software platform, NOT a healthcare provider or hospital. For acute medical emergencies, always call national emergency services (112 / 108 in India) immediately. Virtual token estimates are dynamic and subject to clinical variations.
              </div>
            </div>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Merchant &amp; Listing Standards</h2>
            <p>
              Store owners and healthcare providers registered on Kynisto represent and warrant that all business information, operating hours, doctor credentials, and pricing displayed are accurate, lawful, and updated. Kynisto reserves the right to suspend or remove any fraudulent or non-compliant listings immediately.
            </p>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Intellectual Property &amp; Acceptable Use</h2>
            <p>
              All trademarks, logos, UI designs, codebases, and intellectual assets associated with Kynisto are the proprietary property of Kynisto Technologies Inc. Users may not scrape, reverse engineer, or deploy automated bots to access our directories without written consent.
            </p>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Governing Law &amp; Dispute Resolution</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in Ghaziabad / Delhi NCR, Uttar Pradesh, India.
            </p>
          </section>
        </article>
      </main>

      <Footer3D />
    </div>
  );
}
