import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { Building2, Compass, Activity, ShieldCheck, Users, Zap, Award, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us | Kynisto - Everything Around You, Smarter",
  description: "Discover Kynisto's mission: transforming neighborhood commerce, eliminating clinic waiting rooms with live virtual queues, and building real-time locality intelligence.",
  alternates: {
    canonical: "https://kynisto.in/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar3D />

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100/80 border border-sky-300 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <Building2 className="w-4 h-4 text-sky-600" />
            <span>Company &amp; Vision</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight mb-6 leading-tight">
            Building the Real-Time Locality Grid
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed">
            Kynisto connects residents with verified neighborhood storefronts, independent clinics,
            and essential home services with sub-second live telemetry and zero waiting rooms.
          </p>
        </div>

        {/* Mission Statement */}
        <section className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-md mb-16">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-sky-600" /> Our Mission
          </h2>
          <p className="text-slate-700 text-base sm:text-lg leading-relaxed mb-4">
            In an era where online e-commerce giants disconnected consumers from their physical surroundings, <strong>Kynisto</strong> was founded to empower local urban ecosystems. We believe local merchants and healthcare providers form the heartbeat of every vibrant neighborhood.
          </p>
          <p className="text-slate-700 text-base sm:text-lg leading-relaxed">
            By building real-time virtual queue tokens, instant doctor appointment scheduling, and live inventory indexing, we eliminate the friction of physical waiting rooms and give neighborhood stores the technological edge to thrive.
          </p>
        </section>

        {/* 3 Pillars */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Zero Waiting Rooms</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Patients receive live mobile queue tokens with dynamic ETA alerts, arriving exactly when the physician is ready.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Hyperlocal Discovery</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Instant distance-sorted search covering groceries, pharmacies, salons, home repairs, and top-rated local cafes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Verified &amp; Safe</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Every merchant and medical clinic undergoes operational verification before listing on our high-speed directory.
            </p>
          </div>
        </div>

        {/* Publisher Transparency Box */}
        <section className="p-8 rounded-2xl bg-slate-100 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 mb-3">Publisher Information</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <p><strong>Operating Entity:</strong> Kynisto Technologies Inc.</p>
              <p><strong>Primary Domain:</strong> https://kynisto.in</p>
              <p><strong>Headquarters:</strong> B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, UP, India - 201102</p>
            </div>
            <div>
              <p><strong>Editorial &amp; Founder Desk:</strong> nxt.arshit@gmail.com</p>
              <p><strong>Support &amp; Inquiries:</strong> kynisto.in@gmail.com</p>
              <p><strong>Network Coverage:</strong> 50+ Municipalities &amp; Localities</p>
            </div>
          </div>
        </section>
      </main>

      <Footer3D />
    </div>
  );
}
