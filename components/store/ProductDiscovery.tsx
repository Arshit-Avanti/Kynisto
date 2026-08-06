"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, startTransition, type FormEvent } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { ProductActions } from "@/components/store/ProductActions";

type Product = Record<string, string | number | null | undefined>;


const Icons = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Location: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Heart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Sliders: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
};

const modernCleanTechStyles = `
  .site, .healthPage, .productDiscovery {
    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
    background-color: #0B0F17 !important;
    background-image: radial-gradient(circle at 15% 50%, rgba(37, 99, 235, 0.15), transparent 25%),
                      radial-gradient(circle at 85% 30%, rgba(139, 92, 246, 0.15), transparent 25%) !important;
    color: #f8fafc !important;
  }
  .searchBox, .healthSearch, .productIntro form, .locationPill, .categoryTile, .storeCard, .advancedFilters input, .providerGrid article {
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    color: #f8fafc !important;
  }
  .searchBox input, .healthSearch input, .productIntro form input, .advancedFilters input {
    background: transparent !important;
    color: #f8fafc !important;
  }
  .searchBox input::placeholder, .productIntro form input::placeholder {
    color: rgba(255,255,255,0.5) !important;
  }
  .searchBox:focus-within, .healthSearch:focus-within, .productIntro form:focus-within, .advancedFilters input:focus {
    border-color: rgba(59, 130, 246, 0.5) !important;
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.3) !important;
    outline: none !important;
  }
  .locationPill:hover, .categoryTile:hover {
    border-color: rgba(255,255,255,0.2) !important;
    background: rgba(255, 255, 255, 0.08) !important;
  }
  .categoryTile {
    transition: all 0.3s ease, transform 0.2s ease !important;
  }
  .categoryTile[aria-pressed="true"], .careTypes button.active {
    background: rgba(59, 130, 246, 0.2) !important;
    color: #fff !important;
    border-color: rgba(59, 130, 246, 0.5) !important;
    box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
    transform: translateY(-2px) !important;
  }
  .categoryTile[aria-pressed="true"] svg, .careTypes button.active svg {
    stroke: #60a5fa !important;
  }
  .storeCard {
    overflow: hidden !important;
  }
  .storeCard:hover, .providerGrid article:hover {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-6px) !important;
  }
  .storeVisual, .providerTop, .productVisual {
    position: relative !important;
    background: rgba(0, 0, 0, 0.2) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    overflow: hidden !important;
  }
  .storeVisual img, .productVisual img {
    transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  }
  .storeCard:hover .storeVisual img, .storeCard:hover .productVisual img, article:hover .productVisual img {
    transform: scale(1.05) !important;
  }
  .statusBadge, .liveQueueBadge {
    border-radius: 4px !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    backdrop-filter: blur(8px) !important;
  }
  .statusBadge.isOpen {
    background: rgba(34, 197, 94, 0.2) !important;
    color: #86efac !important;
    border: 1px solid rgba(34, 197, 94, 0.3) !important;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.2) !important;
  }
  .statusBadge.isClosed {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #94a3b8 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  .distanceBadge {
    border-radius: 4px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #cbd5e1 !important;
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(4px) !important;
  }
  .categoryLabel {
    font-size: 0.75rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    color: #93c5fd !important;
    background: rgba(59, 130, 246, 0.15) !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-weight: 700 !important;
    border: 1px solid rgba(59, 130, 246, 0.3) !important;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.2) !important;
  }
  .detailsButton, .cardActions a, .providerActions a, .providerActions button {
    background: linear-gradient(135deg, #2563eb, #3b82f6) !important;
    color: white !important;
    border-radius: 6px !important;
    border: none !important;
    font-weight: 500 !important;
    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4) !important;
    transition: all 0.3s ease !important;
  }
  .detailsButton:hover, .cardActions a:hover, .providerActions a:hover, .providerActions button:hover {
    background: linear-gradient(135deg, #1d4ed8, #2563eb) !important;
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6) !important;
    transform: translateY(-1px) !important;
  }
  .storeGlyph {
    font-size: 2rem !important;
    color: #94a3b8 !important;
  }
  .rating, .productRating {
    color: #fef08a !important;
    text-shadow: 0 0 8px rgba(253, 224, 71, 0.4) !important;
  }
  .productDiscovery article, .productGrid article {
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    color: #f8fafc !important;
    overflow: hidden !important;
  }
  .productGrid article:hover {
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-6px) !important;
  }
`;

export function ProductDiscovery() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole, setUserRole] = useState<"admin" | "store_owner" | "customer" | null>(null);

  // Throttled input handler to keep responsiveness < 15ms
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 150);
    return () => window.clearTimeout(timer);
  }, [query]);

  const handleQueryChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  }, []);

  useEffect(() => {
    apiFetch<{ user: { role: "admin" | "store_owner" | "customer" } | null }>("/api/auth/me")
      .then((res) => {
        if (res?.user?.role) setUserRole(res.user.role);
      })
      .catch(() => setUserRole(null));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const activeSearch = submitted || debouncedQuery;
      const result = await apiFetch<{ items: Product[] }>(`/api/products?q=${encodeURIComponent(activeSearch)}&limit=48`);
      startTransition(() => {
        setItems(result.items);
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load products.");
    } finally {
      setLoading(false);
    }
  }, [submitted, debouncedQuery]);

  useEffect(() => { void load(); }, [load]);

  const submit = useCallback((event: FormEvent) => {
    event.preventDefault();
    startTransition(() => {
      setSubmitted(query.trim());
    });
  }, [query]);

  const renderedProductGrid = useMemo(() => {
    return items.map((item) => {
      const available = Number(item.availableQuantity ?? item.available ?? 0);
      const ratingCount = Number(item.productReviewCount ?? 0);
      const rating = Number(item.productRating ?? 0);
      return (
        <article key={String(item.id)}>
          <div className="productVisual">
            {item.imageUrl ? <img src={String(item.imageUrl)} alt="" loading="lazy" /> : <span>{String(item.name ?? "P").slice(0, 1)}</span>}
          </div>
          <small>{item.storeName}</small>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <div className="productMeta"><b>₹{Number(item.price ?? 0).toLocaleString("en-IN")}</b><em>{available} available</em></div>
          <div className="productRating" aria-label={ratingCount ? `${rating.toFixed(1)} from ${ratingCount} product ratings` : "No product ratings yet"}>
            {ratingCount ? <><Icons.Star /> {rating.toFixed(1)}</> : <><Icons.Star /> New product</>} <span>{ratingCount ? `(${ratingCount})` : ""}</span>
          </div>
          <ProductActions productId={String(item.id)} available={available} />
          <Link className="viewShop" href={`/stores/${item.storeSlug}`}>View shop <Icons.ArrowRight /></Link>
        </article>
      );
    });
  }, [items]);

  return (
    <main className="productDiscovery">
      <style dangerouslySetInnerHTML={{ __html: modernCleanTechStyles }} />
      <header>
        <Link href="/" className="productBrand"><KynistoLogo /></Link>
        <nav>
          <Link href="/">Nearby shops</Link>
          <Link href="/account?tab=cart">My cart</Link>
          {userRole ? <Link href={userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account"}>{userRole === "admin" ? "Admin Panel" : userRole === "store_owner" ? "Owner Dashboard" : "My Account"}</Link> : <Link href="/login">Log in</Link>}
        </nav>
      </header>
      <section className="productIntro">
        <span>Your Locality</span>
        <h1>Shop what is nearby.</h1>
        <form onSubmit={submit}>
          <input value={query} onChange={handleQueryChange} placeholder="Search product or shop…" aria-label="Search products" />
          <button type="submit">Search products</button>
        </form>
      </section>
      {error && <p className="productError" role="alert">{error}</p>}
      {loading ? (
        <div className="productSkeleton"><span /><span /><span /></div>
      ) : items.length ? (
        <section className="productGrid" aria-label="Local products">
          {renderedProductGrid}
        </section>
      ) : (
        <section className="productEmpty">
          <h2>No matching products</h2>
          <p>Try a broader search or browse nearby shops.</p>
        </section>
      )}
    </main>
  );
}

