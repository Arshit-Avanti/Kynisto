"use client";

import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Shield, Globe, Mail, MapPin, BookOpen } from "lucide-react";

export function Footer3D() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/90 backdrop-blur-xl pt-16 pb-12 mt-16 text-slate-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Address Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <KynistoLogo showTagline variant="light" />
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              The next-generation locality intelligence platform. Connecting residents with neighborhood
              stores, verified clinics, live virtual queues, and zero-commission commerce.
            </p>
            <div className="text-xs text-slate-400 space-y-1.5 pt-2">
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, UP, India – 201102</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>kynisto.in@gmail.com • nxt.arshit@gmail.com</span>
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a
                href="https://kynisto.in"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:text-white transition-colors"
                aria-label="Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <Link
                href="/privacy"
                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:text-orange-400 transition-colors"
                aria-label="Security"
              >
                <Shield className="w-4 h-4" />
              </Link>
              <Link
                href="/blog"
                className="p-2 rounded-xl bg-slate-900 border border-white/10 hover:text-orange-400 transition-colors"
                aria-label="Articles & Knowledge Hub"
              >
                <BookOpen className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Ecosystem Column */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Ecosystem</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li><Link href="/services" className="hover:text-orange-400 transition-colors">Local Services</Link></li>
              <li><Link href="/healthcare" className="hover:text-orange-400 transition-colors">Healthcare &amp; OPD Queues</Link></li>
              <li><Link href="/products" className="hover:text-orange-400 transition-colors">Product Catalogs</Link></li>
              <li><Link href="/search" className="hover:text-orange-400 transition-colors">Smart Discovery</Link></li>
              <li><Link href="/pricing" className="hover:text-orange-400 transition-colors">Store Plans</Link></li>
              <li><Link href="/wallet" className="hover:text-orange-400 transition-colors">Digital Loyalty Wallet</Link></li>
            </ul>
          </div>

          {/* Resources & Knowledge Column */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Knowledge &amp; Guides</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li><Link href="/blog" className="hover:text-orange-400 font-semibold text-slate-200 transition-colors">Knowledge Hub &amp; Blog</Link></li>
              <li><Link href="/blog/opd-virtual-queue-guide-delhi-ncr" className="hover:text-orange-400 transition-colors">OPD Queue Guide</Link></li>
              <li><Link href="/blog/15-minute-city-hyperlocal-discovery" className="hover:text-orange-400 transition-colors">15-Minute City Guide</Link></li>
              <li><Link href="/guide" className="hover:text-orange-400 transition-colors">User &amp; Merchant Manual</Link></li>
              <li><Link href="/faq" className="hover:text-orange-400 transition-colors">FAQ &amp; Help Center</Link></li>
              <li><Link href="/about" className="hover:text-orange-400 transition-colors">About Kynisto</Link></li>
              <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact Support</Link></li>
            </ul>
          </div>

          {/* Legal & Portals Column */}
          <div>
            <h4 className="text-white text-xs font-bold uppercase tracking-wider mb-4">Security &amp; Legal</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
              <li><Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/owner" className="hover:text-orange-400 transition-colors">Merchant Portal</Link></li>
              <li><Link href="/admin" className="hover:text-orange-400 transition-colors">Admin Gateway</Link></li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> All Systems Operational
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Kynisto Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1 text-slate-400">
            Verified Publisher Network • Google AdSense &amp; Privacy Compliant
          </p>
        </div>
      </div>
    </footer>
  );
}
