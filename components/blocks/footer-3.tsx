"use client";

import Link from "next/link";
import { KynistoLogo } from "@/components/brand/KynistoLogo";

export function EfferdFooter3() {
  return (
    <footer className="kynistoFooterRoot">
      <style dangerouslySetInnerHTML={{ __html: `
        .kynistoFooterRoot {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: radial-gradient(ellipse at bottom, rgba(30, 41, 59, 0.5) 0%, #0B0F17 100%);
          color: #94a3b8;
          padding: 48px 24px 32px;
          margin-top: 48px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .footerGrid {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 32px;
        }
        .footerBottomBar {
          max-width: 1200px;
          margin: 40px auto 0;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 13px;
          color: #64748b;
        }
        @media (max-width: 768px) {
          .kynistoFooterRoot {
            padding: 32px 16px 24px !important;
            margin-top: 28px !important;
          }
          .footerGrid {
            grid-template-columns: 1fr 1fr !important;
            gap: 24px 16px !important;
          }
          .footerBrandCol {
            grid-column: span 2 !important;
            margin-bottom: 4px !important;
          }
          .footerBrandCol p {
            font-size: 0.85rem !important;
            max-width: 320px !important;
          }
          .footerCol h4 {
            font-size: 0.88rem !important;
            margin-bottom: 8px !important;
          }
          .footerCol ul {
            gap: 6px !important;
            font-size: 0.82rem !important;
          }
          .footerBottomBar {
            margin-top: 24px !important;
            padding-top: 16px !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 6px !important;
            font-size: 0.75rem !important;
          }
        }
      `}} />

      <div className="footerGrid">
        <div className="footerBrandCol">
          <Link href="/" style={{ display: "inline-block", marginBottom: "12px" }}>
            <KynistoLogo />
          </Link>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#64748b", margin: 0 }}>
            Everything Around You, Smarter. Discover top local businesses, pharmacies, clinics, and live queues.
          </p>
        </div>

        <div className="footerCol">
          <h4 style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 700, margin: "0 0 12px 0" }}>Explore</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <li><Link href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>Home &amp; Nearby</Link></li>
            <li><Link href="/healthcare" style={{ color: "#94a3b8", textDecoration: "none" }}>Healthcare &amp; Clinics</Link></li>
            <li><Link href="/services" style={{ color: "#94a3b8", textDecoration: "none" }}>Home Services</Link></li>
            <li><Link href="/products" style={{ color: "#94a3b8", textDecoration: "none" }}>Local Products</Link></li>
          </ul>
        </div>

        <div className="footerCol">
          <h4 style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 700, margin: "0 0 12px 0" }}>Portals</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <li><Link href="/dashboard" style={{ color: "#94a3b8", textDecoration: "none" }}>Dashboard</Link></li>
            <li><Link href="/owner" style={{ color: "#94a3b8", textDecoration: "none" }}>Business Owner Portal</Link></li>
            <li><Link href="/pricing" style={{ color: "#94a3b8", textDecoration: "none" }}>Plans &amp; Pricing</Link></li>
            <li><Link href="/wallet" style={{ color: "#94a3b8", textDecoration: "none" }}>My Wallet</Link></li>
          </ul>
        </div>

        <div className="footerCol" style={{ gridColumn: "span 2" }}>
          <h4 style={{ color: "#FFFFFF", fontSize: "15px", fontWeight: 700, margin: "0 0 12px 0" }}>App &amp; Support</h4>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px" }}>
            <li><a href="/downloads/Kynisto-2.1.0-release.apk" style={{ color: "#FF5722", fontWeight: 600, textDecoration: "none" }}>⚡ Download Android APK</a></li>
            <li><Link href="/account" style={{ color: "#94a3b8", textDecoration: "none" }}>Account Settings</Link></li>
            <li><Link href="/login" style={{ color: "#94a3b8", textDecoration: "none" }}>Sign In</Link></li>
          </ul>
        </div>
      </div>

      <div className="footerBottomBar">
        <span>&copy; {new Date().getFullYear()} Kynisto Platform. All rights reserved.</span>
        <span>Built for Ultra-Fast Performance &middot; Latency &lt; 15ms</span>
      </div>
    </footer>
  );
}
