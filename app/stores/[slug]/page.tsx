import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/store-data";
import { StoreActions } from "@/components/store/StoreActions";
import { ProductActions } from "@/components/store/ProductActions";
import { StoreMembershipStorefront } from "@/components/store/StoreMembershipStorefront";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { BackButton } from "@/components/ui/BackButton";

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
  const mapsUrl = store.googleMapsUrl ?? `https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: store.name,
    description: store.description,
    image: [store.logoUrl, store.bannerUrl, ...(store.images || []).map((image) => String(image?.url || ""))].filter(Boolean),
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
    aggregateRating: Number(store.reviews ?? 0) > 0 ? { "@type": "AggregateRating", ratingValue: Number(store.rating ?? 0), reviewCount: Number(store.reviews ?? 0) } : undefined,
  };

  return (
    <main style={{ backgroundColor: "#0B0F17", color: "#f8fafc", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-green {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .glass-section {
          background: rgba(255,255,255,0.03);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        .glass-button {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f8fafc;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .glass-button:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
          box-shadow: 0 0 15px rgba(255,255,255,0.15);
          transform: translateY(-2px);
        }
        .glass-button.shimmer::after {
          content: '';
          position: absolute;
          top: 0; right: 0; bottom: 0; left: 0;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }
        .glass-card {
          background: rgba(255,255,255,0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.05);
          transition: all 0.3s ease;
        }
        .glass-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.15);
          box-shadow: 0 8px 32px 0 rgba(0,0,0,0.5);
        }
        .glass-card-img-wrapper {
          overflow: hidden;
          border-radius: 8px;
        }
        .glass-card img, .glass-card video {
          transition: transform 0.5s ease;
        }
        .glass-card:hover img, .glass-card:hover video {
          transform: scale(1.05);
        }
        .neon-text {
          text-shadow: 0 0 10px rgba(255,255,255,0.3);
        }
        .neon-border {
          box-shadow: 0 0 20px rgba(96, 165, 250, 0.4), inset 0 0 10px rgba(96, 165, 250, 0.2);
          border-color: rgba(96, 165, 250, 0.6) !important;
        }
        .glowing-offer {
          border: 1px dashed rgba(96, 165, 250, 0.6);
          box-shadow: 0 0 20px rgba(96, 165, 250, 0.1) inset;
          background: rgba(96, 165, 250, 0.05);
        }
        .owner-reply-glow {
          border-left: 4px solid #60a5fa;
          box-shadow: -10px 0 20px -10px rgba(96, 165, 250, 0.4);
          background: rgba(96, 165, 250, 0.05);
        }
        .badge-neon {
          background: rgba(96,165,250,0.1);
          color: #93c5fd;
          border: 1px solid rgba(96,165,250,0.3);
          box-shadow: 0 0 10px rgba(96,165,250,0.2);
        }
      `}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      
      <header className="glass-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: "10px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center" }}><KynistoLogo /></Link>
        <nav aria-label="Business profile navigation" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <BackButton
            fallback="/"
            label="Back"
            className="glass-button"
            style={{
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 600,
              padding: "6px 10px",
            }}
          />
          <Link href="/" style={{ fontSize: "13px", fontWeight: 500, color: "#cbd5e1", textDecoration: "none" }}>Explore</Link>
          <Link href="/healthcare" style={{ fontSize: "13px", fontWeight: 500, color: "#cbd5e1", textDecoration: "none" }}>Healthcare</Link>
          <Link href="/dashboard" style={{ fontSize: "13px", fontWeight: 500, color: "#cbd5e1", textDecoration: "none" }}>Dashboard</Link>
        </nav>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "16px" }}>
        {(() => {
          const heroImage = store.bannerUrl || store.logoUrl || (store.images && store.images.length > 0 ? store.images[0].url : null);
          const avatarImage = store.logoUrl || (store.images && store.images.find((i: any) => i.kind === "logo")?.url) || (store.images && store.images.length > 0 ? store.images[0].url : null);
          const storeInitial = (store.name || "S").trim().charAt(0).toUpperCase();
          const hasCustomIcon = store.icon && store.icon !== "⌖" && store.icon !== "+" && store.icon.length <= 4;

          return (
            <section className="glass-section" style={{ borderRadius: "16px", overflow: "hidden", marginBottom: "24px" }}>
              <div style={{
                height: "260px",
                position: "relative",
                backgroundColor: "#0F172A",
                backgroundImage: heroImage ? `url(${heroImage})` : `radial-gradient(ellipse at top right, rgba(255,87,34,0.25) 0%, rgba(30,41,59,0.9) 60%, #0B0F17 100%)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}>
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0B0F17 0%, rgba(11,15,23,0.5) 50%, rgba(11,15,23,0.2) 100%)" }} />
                {!heroImage && (
                  <div style={{ position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                )}
                <div style={{ position: "absolute", bottom: "-36px", left: "24px", display: "flex", gap: "16px", alignItems: "flex-end", zIndex: 10 }}>
                  {avatarImage ? (
                    <img
                      src={avatarImage}
                      alt={store.name}
                      className="neon-border"
                      style={{
                        width: "88px",
                        height: "88px",
                        borderRadius: "18px",
                        objectFit: "cover",
                        border: "3px solid #1E293B",
                        background: "#0B0F17",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6)",
                      }}
                    />
                  ) : (
                    <div
                      className="neon-border"
                      style={{
                        width: "88px",
                        height: "88px",
                        borderRadius: "18px",
                        border: "3px solid #1E293B",
                        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: hasCustomIcon ? "34px" : "36px",
                        fontWeight: 900,
                        color: "#FF5722",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.6), inset 0 0 15px rgba(255,87,34,0.2)",
                        letterSpacing: "-1px",
                      }}
                    >
                      {hasCustomIcon ? store.icon : storeInitial}
                    </div>
                  )}
                </div>
              </div>
              <div style={{ padding: "52px 24px 24px" }}>
                <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
                  <span className="badge-neon" style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>{store.category}</span>
                  {store.subcategory && <span className="badge-neon" style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>{store.subcategory}</span>}
                  <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: store.open ? "#4ade80" : "#f87171", backgroundColor: store.open ? "rgba(74, 222, 128, 0.1)" : "rgba(248, 113, 113, 0.1)", border: `1px solid ${store.open ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, padding: "4px 10px", borderRadius: "6px", animation: store.open ? 'pulse-green 2s infinite' : 'pulse-red 2s infinite' }}>
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: store.open ? "#4ade80" : "#f87171", boxShadow: `0 0 5px ${store.open ? '#4ade80' : '#f87171'}` }} />
                    {store.open ? "Open now" : "Closed"}
                  </span>
                  {store.queueEnabled && (
                    <span style={{ backgroundColor: store.queueStatus === "open" ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: store.queueStatus === "open" ? "#4ade80" : "#f87171", border: `1px solid ${store.queueStatus === "open" ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)"}`, padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                      Queue: {store.queueStatus ?? "closed"}
                    </span>
                  )}
                </div>
                <h1 className="neon-text" style={{ fontSize: "32px", fontWeight: 800, color: "#ffffff", margin: "0 0 12px 0", letterSpacing: "-0.5px" }}>{store.name}</h1>
                <p style={{ fontSize: "16px", color: "#94a3b8", lineHeight: 1.6, margin: "0 0 20px 0", maxWidth: "800px" }}>{store.description}</p>
                <div style={{ display: "flex", gap: "16px", color: "#94a3b8", fontSize: "14px", fontWeight: 500, flexWrap: "wrap" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f8fafc", fontWeight: 700 }}>
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 5px rgba(251,191,36,0.5))" }}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                     {Number(store.rating ?? 0).toFixed(1)} <span style={{ color: "#64748b", fontWeight: 500 }}>({store.reviews ?? 0} reviews)</span>
                  </span>
                  <span>•</span>
                  <span>{Number(store.distance ?? 0).toFixed(1)} km away</span>
                  <span>•</span>
                  <span>{store.hours || "Open today"}</span>
                </div>
                <StoreActions store={{ id: store.id, slug: store.slug, name: store.name, address: store.address, mapsUrl, phone: store.phone, whatsapp: store.whatsapp, website: store.website, hasOwner: store.hasOwner, categoryModule: store.categoryModule, queueEnabled: store.queueEnabled }} />
              </div>
            </section>
          );
        })()}

        <style dangerouslySetInnerHTML={{ __html: `
          .storefrontResponsiveLayout {
            display: flex;
            flex-direction: column;
            gap: 24px;
            width: 100%;
          }
          @media (min-width: 768px) {
            .storefrontResponsiveLayout {
              display: grid;
              grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
              align-items: start;
            }
          }
        `}} />

        <div className="storefrontResponsiveLayout">
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div id="membership-plans">
              <StoreMembershipStorefront storeId={store.id} storeName={store.name} />
            </div>
            {((store.services || []).length > 0 || (store.products || []).length > 0) && (
              <section className="glass-section" style={{ padding: "24px", borderRadius: "16px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", textShadow: "0 0 10px rgba(96,165,250,0.3)" }}>What they offer</span>
                  <h2 className="neon-text" style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "4px 0 0 0" }}>Services & products</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                  {store.services.map((service) => {
                    const media = (service.media ?? []) as Array<Record<string, unknown>>;
                    return (
                      <article key={String(service.id)} className="glass-card productOfferCard" style={{ padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {media.length > 0 && (
                          <div className="glass-card-img-wrapper" style={{ width: "100%", height: "160px" }}>
                            {media.slice(0, 1).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="metadata" playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? service.name)} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${Number(asset.cropX ?? 50)}% ${Number(asset.cropY ?? 50)}%` }} />)}
                          </div>
                        )}
                        <div>
                          <span style={{ display: "inline-block", padding: "2px 8px", backgroundColor: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", fontSize: "11px", fontWeight: 700, borderRadius: "4px", marginBottom: "8px" }}>Service</span>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px 0" }}>{String(service.name)}</h3>
                          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{String(service.description ?? "Available at this business.")}</p>
                        </div>
                        {service.priceFrom != null && <b style={{ fontSize: "16px", color: "#e2e8f0", marginTop: "auto" }}>From ₹{Number(service.priceFrom).toLocaleString("en-IN")}</b>}
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
                      <article key={String(product.id)} className="glass-card productOfferCard" style={{ padding: "16px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        {(media.length > 0 || product.imageUrl) && (
                          <div className="glass-card-img-wrapper" style={{ width: "100%", height: "160px" }}>
                            {media.length ? media.slice(0, 1).map((asset) => asset.mediaType === "video" ? <video key={String(asset.id)} src={String(asset.publicUrl)} poster={asset.thumbnailUrl ? String(asset.thumbnailUrl) : undefined} controls preload="metadata" playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <img key={String(asset.id)} src={String(asset.publicUrl)} alt={String(asset.altText ?? product.name)} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${Number(asset.cropX ?? 50)}% ${Number(asset.cropY ?? 50)}%` }} />) : Boolean(product.imageUrl) && <img src={String(product.imageUrl)} alt={String(product.name)} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                          </div>
                        )}
                        <div>
                          <span style={{ display: "inline-block", padding: "2px 8px", backgroundColor: "rgba(148, 163, 184, 0.1)", border: "1px solid rgba(148,163,184,0.3)", color: "#cbd5e1", fontSize: "11px", fontWeight: 700, borderRadius: "4px", marginBottom: "8px" }}>Product</span>
                          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#f8fafc", margin: "0 0 4px 0" }}>{String(product.name)}</h3>
                          <p style={{ fontSize: "14px", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>{String(product.description ?? "Available in store.")}</p>
                        </div>
                        {product.price != null && <b style={{ fontSize: "16px", color: "#e2e8f0", marginTop: "auto" }}>₹{Number(product.price).toLocaleString("en-IN")}</b>}
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
              <section className="glass-section" style={{ padding: "24px", borderRadius: "16px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Limited time</span>
                  <h2 className="neon-text" style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "4px 0 0 0" }}>Current offers</h2>
                </div>
                <div style={{ display: "flex", gap: "16px", overflowX: "auto", paddingBottom: "8px" }}>
                  {store.offers.map((offer) => (
                    <article key={String(offer.id)} className="glass-card glowing-offer" style={{ minWidth: "250px", padding: "20px", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <small style={{ color: "#93c5fd", fontSize: "11px", fontWeight: 800, textShadow: "0 0 5px rgba(147, 197, 253, 0.5)" }}>LOCAL OFFER</small>
                        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#bfdbfe", margin: "4px 0 8px 0" }}>{String(offer.title)}</h3>
                        <p style={{ fontSize: "14px", color: "#93c5fd", margin: 0, lineHeight: 1.4 }}>{String(offer.description ?? "Ask the business for details.")}</p>
                      </div>
                      {Boolean(offer.code) && <b style={{ marginTop: "auto", padding: "8px", backgroundColor: "rgba(59, 130, 246, 0.2)", border: "1px solid rgba(59,130,246,0.5)", color: "#ffffff", textAlign: "center", borderRadius: "6px", fontSize: "15px", boxShadow: "0 0 10px rgba(59,130,246,0.3)" }}>{String(offer.code)}</b>}
                    </article>
                  ))}
                </div>
              </section>
            )}

            {store.images.some((image) => String(image.kind) === "gallery") && (
              <section className="glass-section" style={{ padding: "24px", borderRadius: "16px" }}>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Inside the business</span>
                  <h2 className="neon-text" style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "4px 0 0 0" }}>Gallery</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                  {store.images.filter((image) => String(image.kind) === "gallery").map((image) => (
                    <figure key={String(image.id)} className="glass-card-img-wrapper" style={{ margin: 0, position: "relative", borderRadius: "12px", aspectRatio: "1" }}>
                      <img src={String(image.url)} alt={String(image.altText ?? `${store.name} gallery image`)} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease" }} onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'} />
                    </figure>
                  ))}
                </div>
              </section>
            )}

            <section id="reviews" className="glass-section" style={{ padding: "24px", borderRadius: "16px" }}>
              <div style={{ marginBottom: "20px" }}>
                <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Neighbourhood feedback</span>
                <h2 className="neon-text" style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", margin: "4px 0 0 0" }}>Customer reviews</h2>
              </div>
              {store.reviewItems.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {store.reviewItems.map((review) => (
                    <article key={String(review.id)} className="glass-card" style={{ padding: "20px", borderRadius: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <b style={{ color: "#f8fafc", fontSize: "15px" }}>{String(review.reviewerName)}</b>
                        <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: "14px", filter: "drop-shadow(0 0 5px rgba(251,191,36,0.5))" }}>★ {String(review.rating)}</span>
                      </div>
                      {Boolean(review.title) && <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 8px 0", color: "#f8fafc" }}>{String(review.title)}</h3>}
                      <p style={{ color: "#cbd5e1", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>{String(review.comment)}</p>
                      {Boolean(review.ownerReply) && (
                        <blockquote className="owner-reply-glow" style={{ margin: "16px 0 0 0", padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
                          <b style={{ display: "block", fontSize: "13px", color: "#93c5fd", marginBottom: "4px" }}>Owner reply</b>
                          <span style={{ fontSize: "14px", color: "#bfdbfe" }}>{String(review.ownerReply)}</span>
                        </blockquote>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p style={{ color: "#94a3b8", fontSize: "15px", fontStyle: "italic" }}>No published reviews yet. Be the first local customer to share an experience.</p>
              )}
            </section>
          </div>

          <aside style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <section className="glass-section" style={{ padding: "24px", borderRadius: "16px" }}>
              <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Visit the business</span>
              <h2 className="neon-text" style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "4px 0 16px 0" }}>Location & contact</h2>
              <div style={{ borderRadius: "12px", overflow: "hidden", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.1)", height: "200px" }}>
                <iframe title={`Map showing ${store.name}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={`https://www.openstreetmap.org/export/embed.html?bbox=${store.longitude - .012}%2C${store.latitude - .008}%2C${store.longitude + .012}%2C${store.latitude + .008}&layer=mapnik&marker=${store.latitude}%2C${store.longitude}`} style={{ width: "100%", height: "100%", border: "none", filter: "invert(90%) hue-rotate(180deg)" }} />
              </div>
              <dl style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "0 0 16px 0" }}>
                <div>
                  <dt style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Full address</dt>
                  <dd style={{ margin: "4px 0 0 0", fontSize: "14px", color: "#f8fafc", fontWeight: 500 }}>{store.address}, {store.city}, {store.state} {store.postalCode}</dd>
                </div>
                {store.phone && (
                  <div>
                    <dt style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Phone</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: 500 }}><a href={`tel:${store.phone}`} style={{ color: "#60a5fa", textDecoration: "none" }}>{store.phone}</a></dd>
                  </div>
                )}
                {store.email && (
                  <div>
                    <dt style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Email</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: 500 }}><a href={`mailto:${store.email}`} style={{ color: "#60a5fa", textDecoration: "none" }}>{store.email}</a></dd>
                  </div>
                )}
                {store.website && (
                  <div>
                    <dt style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>Website</dt>
                    <dd style={{ margin: "4px 0 0 0", fontSize: "14px", fontWeight: 500 }}><a href={store.website} target="_blank" rel="noreferrer" style={{ color: "#60a5fa", textDecoration: "none" }}>Visit website ↗</a></dd>
                  </div>
                )}
              </dl>
              <a href={mapsUrl} target="_blank" rel="noreferrer" className="glass-button shimmer" style={{ display: "block", textAlign: "center", padding: "12px", color: "#ffffff", fontWeight: 600, borderRadius: "8px", textDecoration: "none", fontSize: "14px" }}>Get directions ↗</a>
            </section>
            
            <section className="glass-section" style={{ padding: "24px", borderRadius: "16px" }}>
              <span style={{ color: "#60a5fa", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Business hours</span>
              <h2 className="neon-text" style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "4px 0 16px 0" }}>Weekly Schedule</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {typeof store.businessHours === "string" && !store.businessHours.startsWith("{") ? (
                  <div style={{ padding: "12px", backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "8px" }}>
                    <span style={{ fontSize: "14px", color: "#f8fafc", fontWeight: 600 }}>{store.businessHours}</span>
                  </div>
                ) : (
                  Object.entries(
                    (store.businessHours as Record<string, { open?: string; close?: string; open2?: string; close2?: string; closed?: boolean }>) ?? {}
                  ).map(([day, hours]) => {
                    const dayLabels: Record<string, string> = {
                      sun: "Sunday",
                      mon: "Monday",
                      tue: "Tuesday",
                      wed: "Wednesday",
                      thu: "Thursday",
                      fri: "Friday",
                      sat: "Saturday",
                    };
                    const dayName = dayLabels[day.toLowerCase()] || day;
                    const isClosed = hours.closed === true || (!hours.open && !hours.open2);

                    const fmt = (t?: string) => {
                      if (!t || !t.includes(":")) return t || "";
                      const [h, m] = t.split(":").map(Number);
                      const sfx = h >= 12 ? "PM" : "AM";
                      const hr = h % 12 || 12;
                      return `${hr}:${String(m).padStart(2, "0")} ${sfx}`;
                    };

                    return (
                      <div
                        key={day}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          padding: "10px 12px",
                          backgroundColor: isClosed ? "rgba(239, 68, 68, 0.05)" : "rgba(255,255,255,0.03)",
                          border: isClosed ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid rgba(255,255,255,0.06)",
                          borderRadius: "10px",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <b style={{ fontSize: "14px", color: isClosed ? "#94a3b8" : "#f8fafc" }}>{dayName}</b>
                          {isClosed ? (
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#f87171", background: "rgba(239, 68, 68, 0.15)", padding: "2px 8px", borderRadius: "6px" }}>
                              Closed
                            </span>
                          ) : (
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4ade80", background: "rgba(34, 197, 94, 0.15)", padding: "2px 8px", borderRadius: "6px" }}>
                              Open
                            </span>
                          )}
                        </div>

                        {!isClosed && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "2px", fontSize: "13px", color: "#cbd5e1" }}>
                            {hours.open && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#fbbf24", fontSize: "12px" }}>☀️ Morning:</span>
                                <span style={{ fontWeight: 500 }}>{fmt(hours.open)} – {fmt(hours.close)}</span>
                              </div>
                            )}
                            {hours.open2 && (
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ color: "#818cf8", fontSize: "12px" }}>🌙 Evening:</span>
                                <span style={{ fontWeight: 500 }}>{fmt(hours.open2)} – {fmt(hours.close2)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
