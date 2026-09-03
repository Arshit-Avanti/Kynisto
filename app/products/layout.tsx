import type { Metadata } from "next";
import "./products.css";
import "./product-ratings.css";

export const metadata: Metadata = {
  title: "Nearby Products & Local Inventory | Kynisto",
  description: "Browse nearby products and store catalogues from verified local shops in your neighborhood.",
  alternates: { canonical: "https://kynisto.in/products" },
  openGraph: { title: "Kynisto Products", description: "Browse nearby products and store catalogues in your locality.", type: "website", url: "https://kynisto.in/products" },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
