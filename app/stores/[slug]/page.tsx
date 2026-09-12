import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store-data";
import { cache } from "react";
import { StoreProfileModernView } from "@/components/store/StoreProfileModernView";

const getCachedStoreBySlug = cache(async (slug: string) => {
  return getStoreBySlug(slug);
});

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getCachedStoreBySlug(slug);
  if (!store) return { title: "Business not found | Kynisto" };
  const title = `${store.name} in ${store.area || store.city || "locality"} | Kynisto`;
  const description = `${(store.description || "").slice(0, 145)} Find address, hours, reviews, services and directions.`;
  return {
    title,
    description,
    alternates: { canonical: `https://kynisto.in/stores/${store.slug}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: store.bannerUrl ? [{ url: store.bannerUrl, alt: store.name }] : [{ url: "/og.svg", alt: "Kynisto local discovery" }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function StoreProfilePage({ params }: RouteProps) {
  const { slug } = await params;
  const store = await getCachedStoreBySlug(slug);
  if (!store) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    description: store.description,
    image: [store.logoUrl, store.bannerUrl, ...(store.images || []).map((image: any) => String(image?.url || ""))].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      streetAddress: store.address,
      addressLocality: store.city,
      addressRegion: store.state,
      postalCode: store.postalCode,
      addressCountry: store.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: store.latitude, longitude: store.longitude },
    telephone: store.phone,
    url: store.website,
    aggregateRating:
      Number(store.reviews ?? 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(store.rating ?? 0),
            reviewCount: Number(store.reviews ?? 0),
          }
        : undefined,
  };

  return (
    <>
      {/* productOfferCard preload="none" loading="lazy" */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <StoreProfileModernView store={store as any} />
    </>
  );
}
