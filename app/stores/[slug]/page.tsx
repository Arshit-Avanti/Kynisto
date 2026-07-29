import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store-data";
import { StoreActions } from "@/components/store/StoreActions";
import { ProductActions } from "@/components/store/ProductActions";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { BackButton } from "@/components/ui/BackButton";

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
    <main style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", backgroundColor: "#ffffff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}><KynistoLogo /></Link>
        <nav aria-label="Business profile navigation" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <BackButton
            fallback="/"
            label="Back"
            style={{
              color: "#475569",
              background: "#f1f5f9",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              padding: "8px 12px",
            }}
          />
          <Link href="/" style={{ fontSize: "14px", fontWeight: 500, color: "#475569", textDecoration: "none" }}>Explore</Link>
          <Link href="/healthcare" style={{ fontSize: "14px", fontWeight: 500, color: "#475569", textDecoration: "none" }}>Healthcare</Link>
          <Link href="/dashboard" style={{ fontSize: "14px", fontWeight: 500, color: "#475569", textDecoration: "none" }}>Dashboard</Link>
        </nav>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px" }}>
        <section style={{ backgroundColor: "#ffffff", borderRadius: "16px", overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.03)", marginBottom: "24px" }}>
          <div style={{ height: "240px", position: "relative", backgroundColor: "#f1f5f9", backgroundImage: store.bannerUrl ? `url(${store.bannerUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
            <div style={{ position: "absolute", bottom: "-32px", left: "24px", display: "flex", gap: "16px", alignItems: "flex-end", zIndex: 10 }}>
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} style={{ width: "80px", height: "80px", borderRadius: "16px", objectFit: "cover", border: "4px solid #ffffff", background: "#ffffff", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }} />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "16px", border: "4px solid #ffffff", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>{store.icon}</div>
              )}
            </div>
          </div>
          <div style={{ padding: "48px 24px 24px" }}>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ backgroundColor: "#eff6ff", color: "#2563eb", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>{store.category}</span>
              {store.subcategory && <span style={{ backgroundColor: "#f1f5f9", color: "#475569", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>{store.subcategory}</span>}
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: store.open ? "#16a34a" : "#dc2626", backgroundColor: store.open ? "#dcfce7" : "#fee2e2", padding: "4px 10px", borderRadius: "6px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: store.open ? "#16a34a" : "#dc2626" }} />
                {store.open ? "Open now" : "Closed"}
              </span>
              {store.queueEnabled && (
                <span style={{ backgroundColor: store.queueStatus === "open" ? "#dcfce7" : "#fee2e2", color: store.queueStatus === "open" ? "#16a34a" : "#dc2626", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                  Queue: {store.queueStatus ?? "closed"}
                </span>
              )}
            </div>
            <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: "0 0 12px 0", letterSpacing: "-0.5px" }}>{store.name}</h1>
            <p style={{ fontSize: "16px", color: "#475569", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: "800px" }}>{store.description}</p>
            <div style={{ display: "flex", gap: "16px", color: "#64748b", fontSize: "14px", fontWeight: 500, flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0f172a", fontWeight: 700 }}>
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                 {store.rating.toFixed(1)} <span style={{ color: "#94a3b8", fontWeight: 500 }}>({store.reviews} reviews)</span>
              </span>
              <span>•</span>
              <span>{store.distance.toFixed(1)} km away</span>
              <span>•</span>
              <span>{store.hours}</span>
            </div>
            <StoreActions store={{ id: store.id, slug: store.slug, name: store.name, address: store.address, mapsUrl, phone: store.phone, whatsapp: store.whatsapp, website: store.website, hasOwner: store.hasOwner, categoryModule: store.categoryModule, queueEnabled: store.queueEnabled }} />
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)", gap: "24px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {(store.services.length > 0 || store.products.length > 0) && (
              <section style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>What they offer</span>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "4px 0 0 0" }}>Services & products</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {store.services.map((service) => {
                    const media = (service.media ?? []) as Array<Record<string, unknown>>;
                    return (
                      <article key={String(service.id)} style={{ padding: "16px", border: "1px solid #f1f5f9", borderRadius: "12px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {media.length > 0 && media.slice(0, 1).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="metadata" playsInline style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px" }} /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? service.name)} loading="lazy" style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", objectPosition: `${Number(asset.cropX ?? 50)}% ${Number(asset.cropY ?? 50)}%` }} />)}
                        <div>
                          <span style={{ display: "inline-block", padding: "2px 8px", backgroundColor: "#e0e7ff", color: "#3730a3", fontSize: "11px", fontWeight: 700, borderRadius: "4px", marginBottom: "8px" }}>Service</span>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>{String(service.name)}</h3>
                          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{String(service.description ?? "Available at this business.")}</p>
                        </div>
                        {service.priceFrom != null && <b style={{ fontSize: "16px", color: "#0f172a", marginTop: "auto" }}>From ₹{Number(service.priceFrom).toLocaleString("en-IN")}</b>}
                        {media.length > 1 && (
                          <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                            {media.slice(1, 5).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="none" playsInline style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? service.name)} loading="lazy" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />)}
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {store.products.map((product) => {
                    const media = (product.media ?? []) as Array<Record<string, unknown>>;
                    return (
                      <article key={String(product.id)} style={{ padding: "16px", border: "1px solid #f1f5f9", borderRadius: "12px", background: "#f8fafc", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {media.length ? media.slice(0, 1).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="metadata" playsInline style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px" }} /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? product.name)} loading="lazy" style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px", objectPosition: `${Number(asset.cropX ?? 50)}% ${Number(asset.cropY ?? 50)}%` }} />) : Boolean(product.imageUrl) && <img src={String(product.imageUrl)} alt={String(product.name)} loading="lazy" style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "8px" }} />}
                        <div>
                          <span style={{ display: "inline-block", padding: "2px 8px", backgroundColor: "#f1f5f9", color: "#475569", fontSize: "11px", fontWeight: 700, borderRadius: "4px", marginBottom: "8px" }}>Product</span>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: "0 0 4px 0" }}>{String(product.name)}</h3>
                          <p style={{ fontSize: "14px", color: "#64748b", margin: 0, lineHeight: 1.5 }}>{String(product.description ?? "Available in store.")}</p>
                        </div>
                        {product.price != null && <b style={{ fontSize: "16px", color: "#0f172a", marginTop: "auto" }}>₹{Number(product.price).toLocaleString("en-IN")}</b>}
                        {media.length > 1 && (
                          <div style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
                            {media.slice(1, 5).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="none" playsInline style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? product.name)} loading="lazy" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }} />)}
                          </div>
                        )}
                        <ProductActions productId={String(product.id)} available={Number(product.available ?? 0)} />
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {store.offers.length > 0 && (
              <section style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Limited time</span>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "4px 0 0 0" }}>Current offers</h2>
                </div>
                <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px" }}>
                  {store.offers.map((offer) => (
                    <article key={String(offer.id)} style={{ minWidth: "250px", padding: "20px", border: "1px dashed #2563eb", borderRadius: "12px", background: "#eff6ff", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <small style={{ color: "#1d4ed8", fontSize: "11px", fontWeight: 800 }}>LOCAL OFFER</small>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1e3a8a", margin: "4px 0 8px 0" }}>{String(offer.title)}</h3>
                        <p style={{ fontSize: "14px", color: "#1e40af", margin: 0, lineHeight: 1.4 }}>{String(offer.description ?? "Ask the business for details.")}</p>
                      </div>
                      {Boolean(offer.code) && <b style={{ marginTop: "auto", padding: "8px", backgroundColor: "#1e3a8a", color: "#ffffff", textAlign: "center", borderRadius: "6px", fontSize: "15px" }}>{String(offer.code)}</b>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {store.images.some((image) => String(image.kind) === "gallery") && (
              <section style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Inside the business</span>
                  <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "4px 0 0 0" }}>Gallery</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                  {store.images.filter((image) => String(image.kind) === "gallery").map((image) => (
                    <figure key={String(image.id)} style={{ margin: 0, position: "relative", overflow: "hidden", borderRadius: "12px", aspectRatio: "1" }}>
                      <img src={String(image.url)} alt={String(image.altText ?? `${store.name} gallery image`)} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }} />
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <section id="reviews" style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Neighbourhood feedback</span>
                <h2 style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", margin: "4px 0 0 0" }}>Customer reviews</h2>
              </div>
              {store.reviewItems.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {store.reviewItems.map((review) => (
                    <article key={String(review.id)} style={{ padding: "20px", border: "1px solid #f1f5f9", borderRadius: "12px", background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <b style={{ color: "#0f172a", fontSize: "15px" }}>{String(review.reviewerName)}</b>
                        <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: "14px" }}>★ {String(review.rating)}</span>
                      </div>
                      {Boolean(review.title) && <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0", color: "#0f172a" }}>{String(review.title)}</h3>}
                      <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{String(review.comment)}</p>
                      {Boolean(review.ownerReply) && (
                        <blockquote style={{ margin: "16px 0 0 0", padding: "12px 16px", backgroundColor: "#eff6ff", borderLeft: "4px solid #2563eb", borderRadius: "0 8px 8px 0" }}>
                          <b style={{ display: "block", fontSize: "13px", color: "#1e3a8a", marginBottom: "4px" }}>Owner reply</b>
                          <span style={{ fontSize: "14px", color: "#1e40af" }}>{String(review.ownerReply)}</span>
                        </blockquote>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#64748b", fontSize: "15px", fontStyle: "italic" }}>No published reviews yet. Be the first local customer to share an experience.</p>
              )}
            </section>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <section style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Visit the business</span>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "4px 0 16px 0" }}>Location & contact</h2>
              <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "16px", border: "1px solid #e2e8f0", height: "200px" }}>
                <iframe title={`Map showing ${store.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.openstreetmap.org/export/embed.html?bbox=${store.longitude - .012}%2C${store.latitude - .008}%2C${store.longitude + .012}%2C${store.latitude + .008}&layer=mapnik&marker=${store.latitude}%2C${store.longitude}`} style={{ width: "100%", height: "100%", border: "none" }} />
              </div>
              <dl style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "0 0 16px 0" }}>
                <div>
                  <dt style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Full address</dt>
                  <dd style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#0f172a", fontWeight: 500 }}>{store.address}, {store.city}, {store.state} {store.postalCode}</dd>
                </div>
                {store.phone && (
                  <div>
                    <dt style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Phone</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: 500 }}><a href={`tel:${store.phone}`} style={{ color: "#2563eb", textDecoration: "none" }}>{store.phone}</a></dd>
                  </div>
                )}
                {store.email && (
                  <div>
                    <dt style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Email</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: 500 }}><a href={`mailto:${store.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>{store.email}</a></dd>
                  </div>
                )}
                {store.website && (
                  <div>
                    <dt style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Website</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: 500 }}><a href={store.website} target="_blank" rel="noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>Visit website ↗</a></dd>
                  </div>
                )}
              </dl>
              <a href={store.mapsUrl} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", padding: "12px", backgroundColor: "#f8fafc", color: "#0f172a", fontWeight: 600, borderRadius: "8px", textDecoration: "none", border: "1px solid #e2e8f0", fontSize: "14px" }}>Get directions ↗</a>
            </section>
            
            <section style={{ backgroundColor: "#ffffff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
              <span style={{ color: "#2563eb", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Business hours</span>
              <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#0f172a", margin: "4px 0 16px 0" }}>Opening days</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {Object.entries(store.businessHours as Record<string, { open: string; close: string }>).map(([day, hours]) => (
                  <div key={day} style={{ display: "flex", justifyContent: "space-between", padding: "8px", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                    <b style={{ fontSize: "14px", color: "#0f172a" }}>{day}</b>
                    <span style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>{hours.open} – {hours.close}</span>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
