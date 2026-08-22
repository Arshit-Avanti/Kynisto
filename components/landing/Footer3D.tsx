"use client";

import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Shield, Globe, Mail, MapPin } from "lucide-react";

export function Footer3D() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur-xl pt-16 pb-12 mt-16 text-slate-700">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Address Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <KynistoLogo showTagline variant="dark" />
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
              The next-generation locality intelligence platform. Connecting residents with neighborhood
              stores, verified clinics, live virtual queues, and smart commerce.
            </p>
            <div className="text-xs text-slate-500 space-y-1.5 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, UP, India - 201102</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>kynisto.in@gmail.com • nxt.arshit@gmail.com</span>
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 text-slate-500">
              <a
                href="https://kynisto.in"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:text-slate-900 transition-colors"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <Link
                href="/privacy"
                className="p-2 rounded-lg bg-slate-100 border border-slate-200 hover:text-sky-600 transition-colors"
                aria-label="Security"
              >
                <Shield className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Ecosystem Column */}
          <div>
            <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Ecosystem</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link href="/services" className="hover:text-sky-600 transition-colors">Local Services</Link></li>
              <li><Link href="/healthcare" className="hover:text-sky-600 transition-colors">Healthcare Queues</Link></li>
              <li><Link href="/products" className="hover:text-sky-600 transition-colors">Product Catalogs</Link></li>
              <li><Link href="/pricing" className="hover:text-sky-600 transition-colors">Marketplace Plans</Link></li>
              <li><Link href="/wallet" className="hover:text-sky-600 transition-colors">Digital Wallet</Link></li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Resources</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link href="/about" className="hover:text-sky-600 transition-colors">About Us</Link></li>
              <li><Link href="/guide" className="hover:text-sky-600 transition-colors">Locality Guide</Link></li>
              <li><Link href="/faq" className="hover:text-sky-600 transition-colors">FAQ &amp; Help Center</Link></li>
              <li><Link href="/contact" className="hover:text-sky-600 transition-colors">Contact Support</Link></li>
              <li><Link href="/downloads/Kynisto-2.1.0-release.apk" className="hover:text-sky-600 transition-colors">Android Mobile APK</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-slate-900 text-sm font-bold uppercase tracking-wider mb-4">Security &amp; Legal</h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li><Link href="/privacy" className="hover:text-sky-600 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-sky-600 transition-colors">Terms of Service</Link></li>
              <li><Link href="/owner" className="hover:text-sky-600 transition-colors">Merchant Portal</Link></li>
              <li><Link href="/admin" className="hover:text-sky-600 transition-colors">Admin Gateway</Link></li>
              <li>
                <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Systems Operational
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-slate-200/80 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Kynisto Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Verified Publisher Content • AdSense &amp; Privacy Compliant
          </p>
        </div>
      </div>
    </footer>
  );
}
