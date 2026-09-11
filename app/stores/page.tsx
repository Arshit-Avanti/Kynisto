import type { Metadata } from "next";
import { listStores, listCategories } from "@/lib/store-data";
import { StoreDirectoryView } from "@/components/store/StoreDirectoryView";

export const metadata: Metadata = {
  title: "Verified Local Stores & Healthcare Clinics Near You | Kynisto",
  description: "Explore verified neighborhood stores, medical centers, family clinics, salons, and local professionals near you with live hours, ratings, and directions.",
  alternates: { canonical: "https://kynisto.in/stores" },
  openGraph: {
    title: "Verified Local Stores & Healthcare Clinics Near You | Kynisto",
    description: "Explore verified neighborhood stores, medical centers, family clinics, salons, and local professionals near you with live hours, ratings, and directions.",
    type: "website",
    url: "https://kynisto.in/stores",
  },
};

export default async function StoresPage() {
  const [storesResult, categoriesResult] = await Promise.all([
    listStores({ limit: 60 }).catch(() => ({ items: [] })),
    listCategories("all").catch(() => []),
  ]);

  const stores = (storesResult as any).items || [];
  const categories = Array.isArray(categoriesResult) ? categoriesResult : [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Verified Local Stores & Clinics on Kynisto",
    description: "Discover local stores, clinics, and businesses in your area.",
    numberOfItems: stores.length,
    itemListElement: stores.slice(0, 25).map((store: any, index: number) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: store.name,
        description: store.description,
        url: `https://kynisto.in/stores/${store.slug}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: store.address,
          addressLocality: store.city,
          addressRegion: store.state,
          postalCode: store.postalCode,
          addressCountry: "India",
        },
        aggregateRating:
          Number(store.reviews ?? 0) > 0
            ? {
                "@type": "AggregateRating",
                ratingValue: Number(store.rating ?? 5),
                reviewCount: Number(store.reviews ?? 1),
              }
            : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <StoreDirectoryView initialStores={stores} categories={categories} />
    </>
  );
}
