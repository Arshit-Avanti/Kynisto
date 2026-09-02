"use client";

import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { Shield, Globe, Mail, MapPin, BookOpen, HeartPulse, ArrowUpRight } from "lucide-react";

export function Footer3D() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50/95 backdrop-blur-xl pt-20 pb-16 mt-20 text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Main Grid with Generous Spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          
          {/* Brand & Address Column (5 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <Link href="/" className="inline-block">
              <KynistoLogo showTagline variant="dark" />
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed max-w-md">
              The next-generation locality intelligence platform. Connecting residents with neighborhood
              stores, verified healthcare clinics, live virtual queues, and zero-commission local commerce.
            </p>

            <div className="text-xs text-slate-500 space-y-2.5 pt-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>B-5/13, DLF Ankur Vihar, Loni, Ghaziabad, UP, India – 201102</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-orange-500 shrink-0" />
                <span>kynisto.in@gmail.com • nxt.arshit@gmail.com</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 text-slate-600">
              <a
                href="https://kynisto.in"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:text-orange-600 hover:border-orange-300 transition-all"
                aria-label="Official Website"
              >
                <Globe className="w-4 h-4" />
              </a>
              <Link
                href="/privacy"
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:text-orange-600 hover:border-orange-300 transition-all"
                aria-label="Security & Privacy Policy"
              >
                <Shield className="w-4 h-4" />
              </Link>
              <Link
                href="/blog"
                className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:text-orange-600 hover:border-orange-300 transition-all"
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
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider">Ecosystem</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/services" className="hover:text-orange-600 transition-colors">
                  Local Services
                </Link>
              </li>
              <li>
                <Link href="/healthcare" className="hover:text-emerald-600 transition-colors flex items-center gap-1.5">
                  <span>Healthcare &amp; OPD</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-orange-600 transition-colors">
                  Product Catalogs
                </Link>
              </li>
              <li>
                <Link href="/search" className="hover:text-orange-600 transition-colors">
                  Smart Discovery
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-orange-600 transition-colors">
                  Store Plans
                </Link>
              </li>
              <li>
                <Link href="/wallet" className="hover:text-orange-600 transition-colors">
                  Loyalty Wallet
                </Link>
              </li>
            </ul>
          </div>

          {/* Knowledge & Guides Column (3 Cols) */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider">Knowledge &amp; Guides</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/blog" className="text-slate-900 font-bold hover:text-orange-600 transition-colors flex items-center gap-1">
                  <span>Knowledge Hub &amp; Blog</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-orange-500" />
                </Link>
              </li>
              <li>
                <Link href="/blog/opd-virtual-queue-guide-delhi-ncr" className="hover:text-orange-600 transition-colors">
                  OPD Virtual Queue Guide
                </Link>
              </li>
              <li>
                <Link href="/blog/15-minute-city-hyperlocal-discovery" className="hover:text-orange-600 transition-colors">
                  15-Minute City Guide
                </Link>
              </li>
              <li>
                <Link href="/guide" className="hover:text-orange-600 transition-colors">
                  User &amp; Merchant Manual
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-orange-600 transition-colors">
                  FAQ &amp; Help Center
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-orange-600 transition-colors">
                  About Kynisto
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-600 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Security & Legal Column (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-slate-900 text-xs font-bold uppercase tracking-wider">Security &amp; Legal</h4>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/privacy" className="hover:text-orange-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-orange-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/owner" className="hover:text-orange-600 transition-colors">
                  Merchant Portal
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-orange-600 transition-colors">
                  Admin Gateway
                </Link>
              </li>
              <li className="pt-2">
                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-300/80 text-emerald-800 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Systems Active
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Kynisto Technologies Inc. All rights reserved.</p>
          <p className="flex items-center gap-1.5 text-slate-500">
            <span>Verified Publisher Network</span>
            <span>•</span>
            <span>Google AdSense &amp; Privacy Compliant</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
