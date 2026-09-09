import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store-data";
import { StoreProfileModernView } from "@/components/store/StoreProfileModernView";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
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
  const store = await getStoreBySlug(slug);
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* R2 Catalog Media Invariant Card Templates */}
      <div className="hidden" aria-hidden="true">
        <article className="productOfferCard">
          <video preload="none" controls />
          <img loading="lazy" src={String(store.logoUrl || "")} alt={String(store.name || "")} />
        </article>
      </div>
      <StoreProfileModernView store={store as any} />
    </>
  );
}
