import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./kynisto-brand.css";
import "./google-auth.css";
import { AppUpdateManager } from "@/components/AppUpdateManager";
import { SupabaseAuthManager } from "@/components/auth/SupabaseAuthManager";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "kynisto.app";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description = "Discover trusted salons, groceries, clinics, stationery shops and more around DLF Ankur Vihar, Loni, with verified addresses, hours, ratings and directions.";
  return {
    metadataBase: new URL(origin),
    applicationName: "Kynisto",
    title: { default: "Kynisto – Everything Around You, Smarter.", template: "%s | Kynisto" },
    description,
    keywords: ["local businesses", "DLF Ankur Vihar", "Loni", "Ghaziabad", "nearby stores", "salon", "grocery", "clinic"],
    authors: [{ name: "Kynisto" }],
    alternates: { canonical: "/" },
    manifest: "/manifest.webmanifest",
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "Kynisto",
      title: "Kynisto – Everything Around You, Smarter.",
      description,
      url: origin,
      locale: "en_IN",
      images: [{ url: `${origin}/og.svg`, width: 1200, height: 630, alt: "Kynisto — Everything Around You, Smarter." }],
    },
    twitter: { card: "summary_large_image", title: "Kynisto – Everything Around You, Smarter.", description, images: [`${origin}/og.svg`] },
  };
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Kynisto",
  description: "Discover salons, groceries, clinics, stationery shops and more in your locality.",
  potentialAction: { "@type": "SearchAction", target: "/?q={search_term_string}", "query-input": "required name=search_term_string" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <SupabaseAuthManager />
        {children}
        <AppUpdateManager />
      </body>
    </html>
  );
}
