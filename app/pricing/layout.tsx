import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store Plans and Customer Memberships | Kynisto",
  description: "Explore Kynisto membership plans, zero-commission shop listing tools, and VIP locality privileges.",
  alternates: { canonical: "https://kynisto.in/pricing" },
  openGraph: {
    title: "Pricing and Memberships | Kynisto",
    description: "Explore Kynisto membership plans, zero-commission shop listing tools, and VIP locality privileges.",
    type: "website",
    url: "https://kynisto.in/pricing",
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
