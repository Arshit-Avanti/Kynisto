import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Support and Help Desk | Kynisto",
  description: "Get in touch with Kynisto support for customer assistance, clinic onboarding, and shop verification.",
  alternates: { canonical: "https://kynisto.in/contact" },
  openGraph: {
    title: "Contact Support | Kynisto",
    description: "Get in touch with Kynisto support for customer assistance, clinic onboarding, and shop verification.",
    type: "website",
    url: "https://kynisto.in/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
