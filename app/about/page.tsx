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
    <div className="min-h-screen bg-slate-950 text-white font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <Navbar3D />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>Company Mission &amp; Architecture</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-6 leading-tight">
            Building the Real-Time Locality Grid
          </h1>
          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Kynisto connects residents with verified neighborhood storefronts, independent healthcare clinics, and essential home professionals with sub-second live telemetry and zero waiting rooms.
          </p>
        </div>

        {/* Origin & Philosophy */}
        <section className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-white/10 shadow-2xl mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-white mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-orange-400" /> Our Origin &amp; Purpose
          </h2>
          <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
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

        {/* 4 Core Pillars */}
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center mb-5 border border-sky-500/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero-Wait Healthcare Queues</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We eliminate crowded, high-risk outpatient waiting rooms. Patients join virtually via web or clinic QR code, track real-time doctor progress, and receive dynamic ETA notifications to arrive exactly when their turn is called.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-5 border border-indigo-500/20">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">High-Precision Discovery</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Our multi-domain search engine scans local stores, verified doctors, home services, and catalog items in under 150ms, sorted by geodesic proximity and live operational status.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-5 border border-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Strict Verification &amp; Trust</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every medical practitioner, store owner, and technician undergoes credential checks and physical storefront audits before listing, guaranteeing safety and accountability.
            </p>
          </div>

          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/50 border border-white/10 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-5 border border-orange-500/20">
              <Globe2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero-Commission Fair Commerce</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Unlike aggregators that take 20–35% of merchant revenues, Kynisto connects customers directly to local businesses without commission cuts, keeping wealth inside the local neighborhood.
            </p>
          </div>
        </div>

        {/* Verification Methodology */}
        <section className="p-8 sm:p-10 rounded-3xl bg-slate-900/60 border border-white/10 mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" /> How We Verify Businesses &amp; Clinics
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <h4 className="font-bold text-white text-sm mb-1">1. Statutory Licenses</h4>
              <p className="text-xs text-slate-400">
                Medical council registrations (MCI/SMC), pharmacy drug licenses, and GSTIN business registrations are verified.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <h4 className="font-bold text-white text-sm mb-1">2. Physical Location Audit</h4>
              <p className="text-xs text-slate-400">
                Operating addresses, opening hours, and consultation facilities are geocoded and confirmed.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/5">
              <h4 className="font-bold text-white text-sm mb-1">3. Customer Telemetry</h4>
              <p className="text-xs text-slate-400">
                Continuous monitoring of queue completion rates, patient reviews, and service delivery timestamps.
              </p>
            </div>
          </div>
        </section>

        {/* Publisher Transparency Card */}
        <section className="p-8 rounded-3xl bg-slate-900/90 border border-white/15 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4">Official Publisher &amp; Governance Details</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-300">
            <div className="space-y-1.5">
              <p><strong>Legal Entity:</strong> Kynisto Technologies Inc.</p>
              <p><strong>Primary Domain:</strong> https://kynisto.in</p>
              <p><strong>Registered HQ:</strong> B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, Uttar Pradesh, India – 201102</p>
            </div>
            <div className="space-y-1.5">
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
