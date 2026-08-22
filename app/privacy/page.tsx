import type { Metadata } from "next";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { Footer3D } from "@/components/landing/Footer3D";
import { ShieldCheck, Lock, FileText, Globe, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Kynisto",
  description: "Learn how Kynisto collects, protects, and manages your personal information in compliance with global privacy standards, Google AdSense policies, and data protection laws.",
  alternates: {
    canonical: "https://kynisto.in/privacy",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 22, 2026";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Navbar3D />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Header */}
        <div className="border-b border-slate-200 pb-8 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100/80 border border-sky-300 text-sky-800 text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            <span>Official Policy Document</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-600 text-sm">
            Last Updated: <strong>{lastUpdated}</strong> • Effective immediately for all users and visitors.
          </p>
        </div>

        {/* Content Body */}
        <article className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-sky-600" /> 1. Introduction &amp; Commitment
            </h2>
            <p>
              At <strong>Kynisto</strong> (operated by Kynisto Technologies Inc., &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), we are committed to safeguarding your privacy and ensuring transparency in all our data handling practices. This Privacy Policy governs your use of <strong>https://kynisto.in</strong>, our mobile web applications, local merchant discovery tools, and virtual healthcare queue management services.
            </p>
            <p className="mt-2">
              By accessing or using Kynisto, you acknowledge that you have read, understood, and agreed to the collection, storage, and processing of your personal information as detailed in this policy.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-sky-600" /> 2. Google AdSense &amp; Advertising Cookies Policy
            </h2>
            <p>
              We partner with <strong>Google AdSense</strong> to display advertisements across our public publisher pages. Google uses cookies and web beacons to serve ads based on a user&apos;s prior visits to our website or other websites on the internet.
            </p>
            <ul className="list-disc list-inside space-y-2 mt-3 text-slate-700">
              <li>
                <strong>DoubleClick DART Cookie:</strong> Google&apos;s use of advertising cookies enables it and its partners to serve ads to our users based on their visit to Kynisto and/or other sites on the Internet.
              </li>
              <li>
                <strong>Third-Party Vendors:</strong> Third-party vendors and ad networks may also place and read cookies on your browser or use web beacons to collect information as a result of ad serving on Kynisto.
              </li>
              <li>
                <strong>Opt-Out of Personalized Advertising:</strong> Users may opt out of personalized advertising by visiting{" "}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold underline">
                  Google Ads Settings
                </a>{" "}
                or by visiting{" "}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-semibold underline">
                  aboutads.info
                </a>.
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-sky-600" /> 3. Information We Collect
            </h2>
            <p>We collect information to provide, improve, and secure our services:</p>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-1">A. Information You Provide</h3>
                <p className="text-xs text-slate-600">
                  Name, email address, phone number (for appointment token verification), business listing details, and customer reviews.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-slate-900 text-sm mb-1">B. Automated Data</h3>
                <p className="text-xs text-slate-600">
                  Approximate geolocation (with explicit user permission), IP address, browser type, device information, and diagnostic telemetry logs.
                </p>
              </div>
            </div>
          </section>

          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3">4. How We Use Your Information</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                <span><strong>Hyperlocal Discovery:</strong> Sorting nearby verified stores, clinics, and pharmacies by proximity.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                <span><strong>Virtual Healthcare Queues:</strong> Issuing live digital token numbers and sending real-time SMS/web consultation alerts.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                <span><strong>Security &amp; Fraud Prevention:</strong> Preventing automated scraping, abuse, and verifying merchant identities.</span>
              </li>
            </ul>
          </section>

          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Retention &amp; Security</h2>
            <p>
              We employ enterprise-grade TLS encryption, secure SQLite/D1 relational partitioning, and Cloudflare edge firewalls. Queue tokens and temporary session identifiers are automatically scrubbed upon completion of service.
            </p>
          </section>

          <section className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-3">6. Grievance Officer &amp; Contact Information</h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact our designated Grievance Officer:
            </p>
            <div className="mt-4 p-4 rounded-xl bg-sky-50 border border-sky-200 text-sm">
              <p><strong>Grievance Officer:</strong> Data Privacy Desk</p>
              <p><strong>Entity:</strong> Kynisto Technologies Inc.</p>
              <p><strong>Email:</strong> privacy@kynisto.in / support@kynisto.in</p>
              <p><strong>Website:</strong> https://kynisto.in</p>
              <p><strong>Location:</strong> Delhi NCR, India</p>
            </div>
          </section>
        </article>
      </main>

      <Footer3D />
    </div>
  );
}
