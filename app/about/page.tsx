import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { Building2, Compass, Activity, ShieldCheck, Users, Zap, Award, ArrowRight, HeartPulse, CheckCircle2, Globe2 } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Kynisto - The Hyperlocal Intelligence & Virtual Queue Grid",
  description: "Learn about Kynisto's mission to eliminate waiting rooms in medical clinics, revitalize neighborhood commerce, and connect residents with verified local services across Delhi-NCR.",
  alternates: {
    canonical: "https://kynisto.in/about",
  },
};

export default function AboutPage() {
  const aboutJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kynisto Technologies Inc.",
    url: "https://kynisto.in",
    logo: "https://kynisto.in/og.svg",
    foundingDate: "2025",
    founders: [
      {
        "@type": "Person",
        name: "Arshit Anand",
        jobTitle: "Founder & Chief Architect",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "B-5/13, DLF Ankur Vihar, Loni",
      addressLocality: "Ghaziabad",
      addressRegion: "Uttar Pradesh",
      postalCode: "201102",
      addressCountry: "IN",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Support & Grievance Desk",
      email: "nxt.arshit@gmail.com",
      url: "https://kynisto.in/contact",
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar3D />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-36 pb-28">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider shadow-sm">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Company Mission &amp; Architecture</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Building the Real-Time Locality Grid
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Kynisto connects residents with verified neighborhood storefronts, independent healthcare clinics, and essential home professionals with sub-second live telemetry and zero waiting rooms.
          </p>
        </div>

        {/* Origin & Philosophy with Spacious Padding */}
        <section className="p-8 sm:p-12 lg:p-14 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 mb-16">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-orange-600" /> Our Origin &amp; Purpose
          </h2>
          <div className="space-y-5 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              In an era dominated by centralized e-commerce giants and algorithmic aggregators, local neighborhood commerce suffered from severe technological disconnect. While big-box retailers offered mobile apps, local clinics, family pharmacies, neighborhood grocery stores, and licensed repair technicians remained digitally invisible or burdened by predatory 30% platform commissions.
            </p>
            <p>
              <strong>Kynisto</strong> was established with a singular objective: <em>to restore technological parity to neighborhood urban ecosystems without middleman fees</em>. We believe that independent merchants, family doctors, and trade professionals form the foundational heartbeat of resilient, healthy communities.
            </p>
            <p>
              By combining sub-millisecond Cloudflare edge computing, relational SQLite/D1 indexing, and event-driven virtual queuing, Kynisto provides modern urbanites with an instantaneous, 15-minute locality grid right in their mobile browser.
            </p>
          </div>
        </section>

        {/* 4 Core Pillars with Generous Spacing */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 mb-16">
          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mb-5 border border-sky-200">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Zero-Wait Healthcare Queues</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              We eliminate crowded, high-risk outpatient waiting rooms. Patients join virtually via web or clinic QR code, track real-time doctor progress, and receive dynamic ETA notifications to arrive exactly when their turn is called.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-5 border border-indigo-200">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">High-Precision Discovery</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Our multi-domain search engine scans local stores, verified doctors, home services, and catalog items in under 150ms, sorted by geodesic proximity and live operational status.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Strict Verification &amp; Trust</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Every medical practitioner, store owner, and technician undergoes credential checks and physical storefront audits before listing, guaranteeing safety and accountability.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-md">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center mb-5 border border-orange-200">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Zero-Commission Fair Commerce</h3>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              Unlike aggregators that take 20–35% of merchant revenues, Kynisto connects customers directly to local businesses without commission cuts, keeping wealth inside the local neighborhood.
            </p>
          </div>
        </div>

        {/* Verification Methodology */}
        <section className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-md mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-600" /> How We Verify Businesses &amp; Clinics
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 mt-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">1. Statutory Licenses</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Medical council registrations (MCI/SMC), pharmacy drug licenses, and GSTIN business registrations are verified.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">2. Physical Location Audit</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Operating addresses, opening hours, and consultation facilities are geocoded and confirmed.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-base mb-2">3. Customer Telemetry</h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Continuous monitoring of queue completion rates, patient reviews, and service delivery timestamps.
              </p>
            </div>
          </div>
        </section>

        {/* Publisher Transparency Card */}
        <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-4">Official Publisher &amp; Governance Details</h3>
          <div className="grid sm:grid-cols-2 gap-6 text-sm text-slate-700">
            <div className="space-y-2">
              <p><strong>Legal Entity:</strong> Kynisto Technologies Inc.</p>
              <p><strong>Primary Domain:</strong> https://kynisto.in</p>
              <p><strong>Registered HQ:</strong> B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, Uttar Pradesh, India – 201102</p>
            </div>
            <div className="space-y-2">
              <p><strong>Founder &amp; Chief Architect:</strong> Arshit Anand (nxt.arshit@gmail.com)</p>
              <p><strong>Customer Support:</strong> kynisto.in@gmail.com</p>
              <p><strong>Locality Coverage:</strong> Delhi-NCR, Ghaziabad, Noida, and expanding urban centers</p>
            </div>
          </div>
        </section>
      </main>

      <Footer3D />
    </div>
  );
}
