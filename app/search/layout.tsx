import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Stores, Clinics & Services | Kynisto",
  description: "Search verified local stores, doctors, clinics, OPD queues, products and home services in your neighborhood.",
  alternates: { canonical: "https://kynisto.in/search" },
  openGraph: {
    title: "Search Kynisto",
    description: "Search verified local stores, clinics, products and home services in your neighborhood.",
    type: "website",
    url: "https://kynisto.in/search",
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
