import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store-data";
import { StoreActions } from "@/components/store/StoreActions";
import { ProductActions } from "@/components/store/ProductActions";
import { KynistoLogo } from "@/components/brand/KynistoLogo";

export const dynamic = "force-dynamic";

type RouteProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) return { title: "Business not found | Kynisto" };
  const title = `${store.name} in ${store.area} | Kynisto`;
  const description = `${store.description.slice(0, 145)} Find address, hours, reviews, services and directions.`;
  return {
    title,
    description,
    alternates: { canonical: `/stores/${store.slug}` },
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
  const mapsUrl = store.googleMapsUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    description: store.description,
    image: [store.logoUrl, store.bannerUrl, ...store.images.map((image) => String(image.url))].filter(Boolean),
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
    aggregateRating: store.reviews > 0 ? { "@type": "AggregateRating", ratingValue: store.rating, reviewCount: store.reviews } : undefined,
  };

  return (
    <main className="profilePage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header className="profileNav">
        <Link className="profileBrand" href="/"><KynistoLogo /></Link>
        <nav aria-label="Business profile navigation">
          <Link href="/">Explore nearby</Link>
          <Link href="/healthcare">Healthcare</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <section className="profileHero">
        <div className="profileHeroArt" style={store.bannerUrl ? { backgroundImage: `linear-gradient(110deg,rgba(16,25,19,.68),rgba(16,25,19,.12)),url(${store.bannerUrl})` } : undefined}>
          <span>{store.icon}</span><small>{store.category}</small>
        </div>
        <div className="profileHeroCopy">
          <div className="profileBadgeRow"><span>{store.category}</span>{store.subcategory && <span>{store.subcategory}</span>}<em className={store.open ? "open" : "closed"}>{store.open ? "Open now" : "Closed"}</em>{store.queueEnabled && <em className={store.queueStatus === "open" ? "open" : "closed"}>Live Queue {store.queueStatus ?? "closed"}</em>}</div>
          <h1>{store.name}</h1>
          <p>{store.description}</p>
          <div className="profileFacts"><b>★ {store.rating.toFixed(1)} <small>({store.reviews} reviews)</small></b><span>{store.distance.toFixed(1)} km away</span><span>{store.hours}</span></div>
          <StoreActions store={{ id: store.id, slug: store.slug, name: store.name, address: store.address, mapsUrl, phone: store.phone, whatsapp: store.whatsapp, website: store.website, hasOwner: store.hasOwner, categoryModule: store.categoryModule, queueEnabled: store.queueEnabled }} />
        </div>
      </section>

      <div className="profileContent">
        <div className="profileMain">
          {(store.services.length > 0 || store.products.length > 0) && <section className="profileSection"><div className="profileSectionTitle"><span>What they offer</span><h2>Services & products</h2></div><div className="offerGrid">{store.services.map((service) => { const media = (service.media ?? []) as Array<Record<string, unknown>>; return <article key={String(service.id)} className={media.length ? "productOfferCard" : undefined}>{media.slice(0, 1).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="metadata" playsInline /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? service.name)} loading="lazy" style={{ objectPosition: `${Number(asset.cropX ?? 50)}% ${Number(asset.cropY ?? 50)}%` }} />)}<span>Service</span><h3>{String(service.name)}</h3><p>{String(service.description ?? "Available at this business.")}</p>{service.priceFrom != null && <b>From ₹{Number(service.priceFrom).toLocaleString("en-IN")}</b>}{media.length > 1 && <div className="catalogMediaStrip">{media.slice(1, 5).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="none" playsInline /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? service.name)} loading="lazy" />)}</div>}</article>})}{store.products.map((product) => { const media = (product.media ?? []) as Array<Record<string, unknown>>; return <article key={String(product.id)} className={Boolean(product.imageUrl) || media.length ? "productOfferCard" : undefined}>{media.length ? media.slice(0, 1).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="metadata" playsInline /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? product.name)} loading="lazy" style={{ objectPosition: `${Number(asset.cropX ?? 50)}% ${Number(asset.cropY ?? 50)}%` }} />) : Boolean(product.imageUrl) && <img src={String(product.imageUrl)} alt={String(product.name)} loading="lazy" />}<span>Product</span><h3>{String(product.name)}</h3><p>{String(product.description ?? "Available in store.")}</p>{product.price != null && <b>₹{Number(product.price).toLocaleString("en-IN")}</b>}{media.length > 1 && <div className="catalogMediaStrip">{media.slice(1, 5).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="none" playsInline /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? product.name)} loading="lazy" />)}</div>}<ProductActions productId={String(product.id)} available={Number(product.available ?? 0)} /></article>})}</div></section>}

          {store.offers.length > 0 && <section className="profileSection"><div className="profileSectionTitle"><span>Limited time</span><h2>Current offers</h2></div><div className="offerStrip">{store.offers.map((offer) => <article key={String(offer.id)}><div><small>LOCAL OFFER</small><h3>{String(offer.title)}</h3><p>{String(offer.description ?? "Ask the business for details.")}</p></div>{Boolean(offer.code) && <b>{String(offer.code)}</b>}</article>)}</div></section>}

          {store.images.some((image) => String(image.kind) === "gallery") && <section className="profileSection"><div className="profileSectionTitle"><span>Inside the business</span><h2>Gallery</h2></div><div className="profileGallery">{store.images.filter((image) => String(image.kind) === "gallery").map((image) => <figure key={String(image.id)}><img src={String(image.url)} alt={String(image.altText ?? `${store.name} gallery image`)} loading="lazy" /><figcaption>{String(image.altText ?? store.name)}</figcaption></figure>)}</div></section>}

          <section className="profileSection" id="reviews"><div className="profileSectionTitle"><span>Neighbourhood feedback</span><h2>Customer reviews</h2></div>{store.reviewItems.length ? <div className="publicReviews">{store.reviewItems.map((review) => <article key={String(review.id)}><div><b>{String(review.reviewerName)}</b><span>★ {String(review.rating)}</span></div>{Boolean(review.title) && <h3>{String(review.title)}</h3>}<p>{String(review.comment)}</p>{Boolean(review.ownerReply) && <blockquote><b>Owner reply</b>{String(review.ownerReply)}</blockquote>}</article>)}</div> : <p className="profileEmpty">No published reviews yet. Be the first local customer to share an experience.</p>}</section>
        </div>

        <aside className="profileAside">
          <section><span className="asideKicker">Visit the business</span><h2>Location & contact</h2><div className="storeMap"><iframe title={`Map showing ${store.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.openstreetmap.org/export/embed.html?bbox=${store.longitude - .012}%2C${store.latitude - .008}%2C${store.longitude + .012}%2C${store.latitude + .008}&layer=mapnik&marker=${store.latitude}%2C${store.longitude}`} /></div><dl><div><dt>Full address</dt><dd>{store.address}, {store.city}, {store.state} {store.postalCode}</dd></div>{store.phone && <div><dt>Phone</dt><dd><a href={`tel:${store.phone}`}>{store.phone}</a></dd></div>}{store.email && <div><dt>Email</dt><dd><a href={`mailto:${store.email}`}>{store.email}</a></dd></div>}{store.website && <div><dt>Website</dt><dd><a href={store.website} target="_blank" rel="noreferrer">Visit website ↗</a></dd></div>}</dl><a className="mapDirection" href={mapsUrl} target="_blank" rel="noreferrer">Get directions ↗</a></section>
          <section><span className="asideKicker">Business hours</span><h2>Opening days</h2><div className="hoursList">{Object.entries(store.businessHours as Record<string, { open: string; close: string }>).map(([day, hours]) => <div key={day}><b>{day}</b><span>{hours.open} – {hours.close}</span></div>)}</div></section>
        </aside>
      </div>
    </main>
  );
}
