"use client";

import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Shield, Globe, Mail, MapPin, BookOpen, ArrowUpRight } from "lucide-react";

export function Footer3D() {
  return (
    <footer className="border-t border-white/15 bg-slate-950/70 backdrop-blur-2xl pt-16 pb-14 mt-16 text-slate-200 font-sans shadow-2xl relative z-10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main Grid with Generous Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-14 mb-14">
          
          {/* Brand & Address Column (4 Cols) */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block">
              <KynistoLogo showTagline variant="light" />
            </Link>
            <p className="text-slate-200 text-sm leading-relaxed max-w-md font-normal">
              The next-generation locality intelligence platform. Connecting residents with neighborhood
              stores, verified healthcare clinics, live virtual queues, and zero-commission local commerce.
            </p>

            <div className="text-xs text-slate-200 space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span className="text-slate-200">B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, UP, India – 201102</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span className="text-slate-200">kynisto.in@gmail.com • nxt.arshit@gmail.com</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <a
                href="https://kynisto.in"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white shadow-sm hover:text-orange-300 hover:bg-white/20 hover:border-orange-400/40 transition-all"
                aria-label="Official Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <Link
                href="/privacy"
                className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white shadow-sm hover:text-orange-300 hover:bg-white/20 hover:border-orange-400/40 transition-all"
                aria-label="Security & Privacy Policy"
              >
                <Shield className="w-4 h-4" />
              </Link>
              <Link
                href="/blog"
                className="p-2.5 rounded-xl bg-white/10 border border-white/20 text-white shadow-sm hover:text-orange-300 hover:bg-white/20 hover:border-orange-400/40 transition-all"
                aria-label="Knowledge Hub & Articles"
              >
                <BookOpen className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Spacer Column (1 Col) on large screens */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Ecosystem Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider drop-shadow-sm">Ecosystem</h4>
            <ul className="space-y-3 text-sm text-slate-200">
              <li>
                <Link href="/services" className="hover:text-orange-300 transition-colors">
                  Local Services
                </Link>
              </li>
              <li>
                <Link href="/healthcare" className="hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                  <span>Healthcare &amp; OPD</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-300 transition-colors">
                  Product Catalogs
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-orange-300 transition-colors">
                  Smart Discovery
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-orange-300 transition-colors">
                  Store Plans
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-orange-300 transition-colors">
                  Loyalty Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Knowledge & Guides Column (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider drop-shadow-sm">Knowledge &amp; Guides</h4>
            <ul className="space-y-3 text-sm text-slate-200">
              <li>
                <Link href="/blog" className="text-white font-bold hover:text-orange-300 transition-colors flex items-center gap-1">
                  <span>Knowledge Hub &amp; Blog</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-orange-400" />
                </Link>
              </li>
              <li>
                <Link href="/blog/opd-virtual-queue-guide-delhi-ncr" className="hover:text-orange-300 transition-colors">
                  OPD Virtual Queue Guide
                </Link>
              </li>
              <li>
                <Link href="/blog/15-minute-city-hyperlocal-discovery" className="hover:text-orange-300 transition-colors">
                  15-Minute City Guide
                </Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-orange-300 transition-colors">
                  User &amp; Merchant Manual
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-orange-300 transition-colors">
                  FAQ &amp; Help Center
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-orange-300 transition-colors">
                  About Kynisto
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-300 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Legal Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider drop-shadow-sm">Security &amp; Legal</h4>
            <ul className="space-y-3 text-sm text-slate-200">
              <li>
                <Link href="/privacy" className="hover:text-orange-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-orange-300 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/owner" className="hover:text-orange-300 transition-colors">
                  Merchant Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-orange-300 transition-colors">
                  Admin Gateway
                </Link>
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Systems Active
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-300 gap-4">
          <p>© {new Date().getFullYear()} Kynisto Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-slate-300">
            <span>Verified Publisher Network</span>
            <span>•</span>
            <span>Google AdSense &amp; Privacy Compliant</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
