"use client";

import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Shield, Heart, Globe } from "lucide-react";

export function Footer3D() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-xl pt-16 pb-12 mt-12">
      <div className="landingContent grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
        <div className="col-span-2">
          <Link href="/" className="inline-block mb-4">
            <KynistoLogo showTagline />
          </Link>
          <p className="text-slate-600 text-sm leading-relaxed max-w-sm mb-6">
            The next-generation locality intelligence platform. Connecting residents with neighborhood
            stores, verified clinics, live virtual queues, and smart commerce.
          </p>
          <div className="flex items-center gap-3 text-slate-500">
            <a href="https://kynisto.in" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:text-slate-900 transition-colors" aria-label="Website">
              <Globe className="w-4 h-4" />
            </a>
            <a href="https://kynisto.in/privacy" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:text-sky-600 transition-colors" aria-label="Security">
              <Shield className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Ecosystem</h4>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li><Link href="/healthcare" className="hover:text-sky-600 transition-colors">Healthcare Queues</Link></li>
            <li><Link href="/pricing" className="hover:text-sky-600 transition-colors">Marketplace Plans</Link></li>
            <li><Link href="/wallet" className="hover:text-sky-600 transition-colors">Digital Wallet</Link></li>
            <li><Link href="/owner" className="hover:text-sky-600 transition-colors">Merchant Portal</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li><a href="#features" className="hover:text-sky-600 transition-colors">Core Capabilities</a></li>
            <li><a href="#how-it-works" className="hover:text-sky-600 transition-colors">How It Works</a></li>
            <li><Link href="/downloads/Kynisto-2.1.0-release.apk" className="hover:text-sky-600 transition-colors">Android Mobile APK</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Security &amp; Legal</h4>
          <ul className="space-y-2.5 text-sm text-slate-600">
            <li><Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-sky-600 transition-colors">Terms of Service</Link></li>
            <li><Link href="/admin" className="hover:text-sky-600 transition-colors">Admin Gateway</Link></li>
            <li><span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Systems Operational</span></li>
          </ul>
        </div>
      </div>

      <div className="landingContent border-t border-slate-100 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        <p>© {new Date().getFullYear()} Kynisto Technologies Inc. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Engineered with precision for ultra-low latency.
        </p>
      </div>
    </footer>
  );
}
