import type { Metadata } from "next";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import "./kynisto-brand.css";
import "./google-auth.css";
import { AdSenseManager } from "@/components/ads/AdSenseManager";
import { AppUpdateManager } from "@/components/AppUpdateManager";
import { SupabaseAuthManager } from "@/components/auth/SupabaseAuthManager";
import { AppReturnBanner } from "@/components/ui/AppReturnBanner";
import { AudioPermissionModal } from "@/components/ui/AudioPermissionModal";
import { NotificationPermissionModal } from "@/components/ui/NotificationPermissionModal";

export async function generateMetadata(): Promise<Metadata> {
  const canonicalBase = "https://kynisto.in";
  const description = "Discover trusted salons, groceries, clinics, home services and local professionals near you with verified addresses, hours, ratings and directions.";
  return {
    metadataBase: new URL(canonicalBase),
    applicationName: "Kynisto",
    title: { default: "Kynisto – Everything Around You, Smarter.", template: "%s | Kynisto" },
    description,
    keywords: ["local businesses", "home services", "nearby stores", "salon", "grocery", "clinic", "plumber", "electrician"],
    authors: [{ name: "Kynisto" }],
    alternates: {
      canonical: "https://kynisto.in/",
    },
    manifest: "/manifest.webmanifest",
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Kynisto",
      title: "Kynisto – Everything Around You, Smarter.",
      description,
      url: "https://kynisto.in/",
      locale: "en_IN",
      images: [{ url: "https://kynisto.in/og.svg", width: 1200, height: 630, alt: "Kynisto — Everything Around You, Smarter." }],
    },
    twitter: { card: "summary_large_image", title: "Kynisto – Everything Around You, Smarter.", description, images: ["https://kynisto.in/og.svg"] },
  };
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Kynisto",
  url: "https://kynisto.in/",
  description: "Discover salons, groceries, clinics, stationery shops and more in your locality.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#0B0F17" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="google-adsense-account" content="ca-pub-9178031569606873" />
        <Script
          id="google-adsense"
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9178031569606873"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
        <link rel="preconnect" href="https://tpc.googlesyndication.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://tpc.googlesyndication.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <link rel="preconnect" href="https://kynisto.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://kynisto.in" />
        <link rel="preconnect" href="https://kynstio.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://kynstio.in" />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(window.location.hostname.endsWith(".workers.dev")){window.location.replace("https://kynisto.in"+window.location.pathname+window.location.search+window.location.hash);}}catch(e){}})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <SupabaseAuthManager />
        <AppReturnBanner />
        <AdSenseManager />
        {children}
        <AppUpdateManager />
        <AudioPermissionModal />
        <NotificationPermissionModal />
      </body>
    </html>
  );
}
