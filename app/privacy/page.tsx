import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { ShieldCheck, Lock, FileText, Globe, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Kynisto",
  description: "Learn how Kynisto collects, protects, and manages your personal information in compliance with global privacy standards, Google AdSense policies, and Indian DPDP guidelines.",
  alternates: {
    canonical: "https://kynisto.in/privacy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 30, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
      <Navbar3D />

      <main className="max-w-4xl mx-auto px-6 sm:px-8 pt-36 pb-28">
        {/* Header */}
        <div className="border-b border-slate-200 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-800 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>Official Policy Document</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm">
            Last Updated: <strong className="text-slate-900">{lastUpdated}</strong> • Effective immediately for all visitors, patients, and merchants.
          </p>
        </div>

        {/* Content Body */}
        <article className="space-y-10 text-slate-700 text-base sm:text-lg leading-relaxed">
          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <Lock className="w-6 h-6 text-orange-600" /> 1. Introduction &amp; Commitment
            </h2>
            <p>
              At <strong>Kynisto</strong> (operated by Kynisto Technologies Inc., &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we are committed to safeguarding your privacy and ensuring transparency in all our data handling practices. This Privacy Policy governs your use of <strong>https://kynisto.in</strong>, our mobile web applications, local merchant discovery tools, and virtual healthcare queue management services.
            </p>
            <p className="mt-4">
              By accessing or using Kynisto, you acknowledge that you have read, understood, and agreed to the collection, storage, and processing of your personal information as detailed in this policy.
            </p>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <Globe className="w-6 h-6 text-sky-600" /> 2. Google AdSense &amp; Advertising Cookies Policy
            </h2>
            <p>
              We partner with <strong>Google AdSense</strong> to display advertisements across our public publisher pages. Google uses cookies and web beacons to serve ads based on a user&apos;s prior visits to our website or other websites on the internet.
            </p>
            <ul className="list-disc list-inside space-y-3 mt-4 text-slate-700 text-sm sm:text-base">
              <li>
                <strong>DoubleClick DART Cookie:</strong> Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to Kynisto and/or other sites on the Internet.
              </li>
              <li>
                <strong>Third-Party Vendors:</strong> Third-party vendors and ad networks may also place and read cookies on your browser or use web beacons to collect information as a result of ad serving on Kynisto.
              </li>
              <li>
                <strong>Opt-Out of Personalized Advertising:</strong> Users may opt out of personalized advertising by visiting{" "}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold underline">
                  Google Ads Settings
                </a>{" "}
                or by visiting{" "}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-orange-600 font-bold underline">
                  aboutads.info
                </a>.
              </li>
            </ul>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-indigo-600" /> 3. Information We Collect
            </h2>
            <p>We collect information to provide, improve, and secure our services:</p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-2">A. Information You Provide</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Name, email address, phone number (for appointment token verification), business listing details, and customer reviews.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-base mb-2">B. Automated Data</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Approximate geolocation (with explicit user permission), IP address, browser type, device telemetry, and diagnostic logs.
                </p>
              </div>
            </div>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. How We Use Your Information</h2>
            <ul className="space-y-3 text-sm sm:text-base">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                <span><strong>Hyperlocal Discovery:</strong> Sorting nearby verified stores, clinics, and pharmacies by proximity.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                <span><strong>Virtual Healthcare Queues:</strong> Issuing live digital token numbers and sending real-time SMS/web consultation alerts.</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-1 shrink-0" />
                <span><strong>Security &amp; Fraud Prevention:</strong> Preventing automated scraping, abuse, and verifying merchant identities.</span>
              </li>
            </ul>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Data Retention &amp; Security</h2>
            <p>
              We employ enterprise-grade TLS 1.3 encryption, secure Cloudflare D1 relational partitioning, and Cloudflare edge firewalls. Queue tokens and temporary session identifiers are automatically scrubbed upon completion of service.
            </p>
          </section>

          <section className="p-8 sm:p-10 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Grievance Redressal &amp; Contact Information</h2>
            <p>
              In accordance with the Information Technology Act and DPDP rules, our designated Grievance Officer details are provided below:
            </p>
            <div className="mt-5 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-sm space-y-2 text-slate-700">
              <p><strong>Grievance Officer:</strong> Arshit Anand</p>
              <p><strong>Entity:</strong> Kynisto Technologies Inc.</p>
              <p><strong>Official Email:</strong> nxt.arshit@gmail.com / kynisto.in@gmail.com</p>
              <p><strong>Website:</strong> https://kynisto.in</p>
              <p><strong>Address:</strong> B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, UP, India – 201102</p>
            </div>
          </section>
        </article>
      </main>

      <Footer3D />
    </div>
  );
}
