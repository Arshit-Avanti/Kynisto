import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { BookOpen, Stethoscope, Compass, ShoppingBag, ShieldCheck, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Guide to Smarter Locality Living & Virtual Queues | Kynisto",
  description: "Comprehensive guide to avoiding clinic waiting rooms, finding verified local shops, booking instant appointments, and maximizing neighborhood loyalty rewards.",
  alternates: {
    canonical: "https://kynisto.in/guide",
  },
};

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar3D />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-100/80 border border-indigo-300 text-indigo-800 text-xs font-bold uppercase tracking-wider mb-4">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Editorial Guide</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            The Complete Guide to Smarter Locality Living
          </h1>
          <p className="text-slate-600 text-base leading-relaxed">
            How modern urban residents and local merchants leverage Kynisto to save time, eliminate crowded clinic waiting rooms, and streamline daily commerce.
          </p>
        </div>

        <article className="prose prose-slate max-w-none space-y-10 text-slate-700 leading-relaxed text-base">
          <section className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-sky-600" /> 1. The End of Physical Waiting Rooms
            </h2>
            <p>
              Traditional outpatient clinics and specialized doctors often suffer from unpredictable wait times. Patients are forced to sit in crowded waiting rooms for 45 to 90 minutes, risking exposure to infectious illnesses and losing valuable personal time.
            </p>
            <p className="mt-3">
              With <strong>Kynisto Healthcare</strong>, clinics transition to a live event-driven queue model. Patients join virtually via the web or a quick QR scan at reception, receive a live digital token number, and can wait comfortably at home or a nearby cafe until their turn is called.
            </p>
          </section>

          <section className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-600" /> 2. Real-Time Locality Discovery vs. Static Directories
            </h2>
            <p>
              Traditional search engines and yellow pages provide outdated phone numbers and unverified listings. Kynisto indexes verified neighborhood stores with live operational indicators:
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-slate-700">
              <li><strong>Live Open/Closed Status:</strong> Real-time operational hours synchronized with the merchant&apos;s daily schedule.</li>
              <li><strong>Direct Merchant Chat:</strong> Instant end-to-end messaging for prescription inquiries, stock checks, and repair estimates.</li>
              <li><strong>Hyperlocal Radius Filtering:</strong> Search strictly within your immediate walking or short driving radius.</li>
            </ul>
          </section>

          <section className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-emerald-600" /> 3. Empowering Local Business Owners
            </h2>
            <p>
              Neighborhood commerce thrives when local business owners have access to the same high-performance digital tools used by large corporations. Kynisto provides free digital storefronts, catalog management, patient flow analytics, and automated appointment scheduling to help neighborhood businesses grow sustainably.
            </p>
          </section>

          <div className="p-8 rounded-3xl bg-sky-50 border border-sky-200 text-center">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to explore your locality?</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
              Find verified clinics, restaurants, salons, and repair shops near you today.
            </p>
            <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-sky-600 text-white font-bold text-sm shadow-md hover:bg-sky-700 transition-all">
              <span>Start Exploring</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>
      </main>

      <Footer3D />
    </div>
  );
}
