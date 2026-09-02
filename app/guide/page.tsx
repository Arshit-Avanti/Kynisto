import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { BookOpen, Stethoscope, Compass, ShoppingBag, ShieldCheck, ArrowRight, CheckCircle2, QrCode, Smartphone, BellRing, Sparkles, Store } from "lucide-react";

export const metadata: Metadata = {
  title: "User & Merchant Guide | Kynisto - Locality Intelligence Manual",
  description: "Comprehensive illustrated guide to using Kynisto: joining live clinic queues, finding verified local shops, messaging store owners, and activating digital storefronts.",
  alternates: {
    canonical: "https://kynisto.in/guide",
  },
};

export default function GuidePage() {
  const guideJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Use Kynisto Virtual Queues & Locality Discovery",
    description: "Step-by-step guide to joining clinic virtual queues, avoiding physical waiting rooms, and discovering verified neighborhood stores.",
    step: [
      {
        "@type": "HowToStep",
        name: "Search for a Doctor or Local Store",
        text: "Use the smart search bar on Kynisto to find doctors, clinics, or neighborhood shops sorted by distance.",
        url: "https://kynisto.in/search",
      },
      {
        "@type": "HowToStep",
        name: "Join the Live Virtual Queue",
        text: "Click 'Join Live Queue' on any clinic profile or scan the clinic's reception QR code to receive a live digital token number.",
        url: "https://kynisto.in/healthcare",
      },
      {
        "@type": "HowToStep",
        name: "Track Dynamic ETA from Home",
        text: "Watch your live token number advance in real time and receive audio/web alerts when your consultation is 2 numbers away.",
        url: "https://kynisto.in/healthcare",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideJsonLd) }}
      />
      <Navbar3D />

      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-36 pb-28">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider shadow-sm">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <span>Platform Documentation &amp; User Manual</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            The Complete User &amp; Merchant Guide
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about eliminating clinic waiting rooms, messaging local shopkeepers, and digitizing your neighborhood storefront.
          </p>
        </div>

        {/* Section 1: Healthcare & Virtual Queues with Spacious Layout */}
        <section className="p-8 sm:p-12 lg:p-14 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center border border-sky-200">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-700 uppercase tracking-wider">Patient Guide</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">How to Use Virtual OPD Queues</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 my-10">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-black text-base flex items-center justify-center mb-4">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Find Your Doctor</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Navigate to <strong>Healthcare</strong> or search for your required specialty (General Physician, Pediatrician, Dentist). Check live clinic status and current token counters.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-black text-base flex items-center justify-center mb-4">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Join Queue Virtually</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tap <strong>Join Live Queue</strong> from home or scan the clinic&apos;s physical QR code at reception. You receive an instant digital token number with your queue position and live ETA.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-black text-base flex items-center justify-center mb-4">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-lg mb-2">Arrive Just in Time</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Relax at home or at a nearby cafe. Your screen updates live as the doctor completes preceding consultations. Arrive at the clinic when you are 2 tokens away.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 text-sm sm:text-base flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <span><strong>Running Late Feature:</strong> If delayed by traffic, tap &quot;Running Late&quot; on your digital pass to safely postpone your turn by 2 positions without losing your registration spot.</span>
          </div>
        </section>

        {/* Section 2: Local Store Discovery & Messaging */}
        <section className="p-8 sm:p-12 lg:p-14 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center border border-orange-200">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-orange-700 uppercase tracking-wider">Shopper Guide</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">Discovering &amp; Messaging Local Stores</h2>
            </div>
          </div>

          <div className="space-y-6 text-slate-700 text-base sm:text-lg leading-relaxed">
            <p>
              Kynisto eliminates the guesswork from neighborhood shopping. Rather than traveling to a local grocery store, pharmacy, or stationery shop only to find it closed or out of stock, you can:
            </p>
            <ul className="space-y-4 text-sm sm:text-base text-slate-700">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>Check Real-Time Operational Hours:</strong> View whether a store is currently open, on break, or closed before leaving your house.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>Direct Merchant Chat:</strong> Message shop owners directly to confirm prescription availability, ask for specific product brands, or request home delivery.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span><strong>Earn Loyalty Coins:</strong> Accumulate reward points on every transaction and redeem them for instant discounts at participating neighborhood businesses.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 3: Merchant & Clinic Owner Guide */}
        <section className="p-8 sm:p-12 lg:p-14 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-200/50 mb-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Business Owner Guide</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900">How to List Your Store or Clinic</h2>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 my-8 text-sm sm:text-base text-slate-700">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-lg mb-2">1. Register as a Store Owner</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Click <strong>Merchant Portal</strong> to register. Enter your business name, operating locality, contact phone number, and physical store photos.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-lg mb-2">2. Activate Virtual Queues</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                For clinics and appointment-based services, toggle <strong>Live OPD Queue</strong> in your dashboard to generate your clinic&apos;s printable counter QR poster.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-lg mb-2">3. Upload Catalog &amp; Services</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                List products, consultation fees, and repair packages with clear pricing and high-resolution images.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-slate-900 text-lg mb-2">4. Zero Middleman Fees</h4>
              <p className="text-slate-600 text-sm leading-relaxed">
                Enjoy 100% of your customer earnings. Kynisto charges zero sales commissions on orders and appointments.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-600 transition-all"
            >
              <span>Create Free Merchant Account</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer3D />
    </div>
  );
}
