"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { apiFetch } from "@/lib/client-api";
import { ProductActions } from "@/components/store/ProductActions";

type Product = Record<string, string | number | null | undefined>;

export function ProductDiscovery() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch<{ items: Product[] }>(`/api/products?q=${encodeURIComponent(submitted)}&limit=48`);
      setItems(result.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load products.");
    } finally {
      setLoading(false);
    }
  }, [submitted]);

  useEffect(() => { void load(); }, [load]);
  function submit(event: FormEvent) { event.preventDefault(); setSubmitted(query.trim()); }

  return <main className="productDiscovery"><header><Link href="/" className="productBrand"><KynistoLogo /></Link><nav><Link href="/">Nearby shops</Link><Link href="/account?tab=cart">My cart</Link><Link href="/login">Log in</Link></nav></header><section className="productIntro"><span>DLF Ankur Vihar · near Karawal Nagar</span><h1>Shop what is nearby.</h1><p>Products with live local availability, from approved Kynisto businesses around 28.7381° N, 77.2669° E.</p><form onSubmit={submit}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product or shop…" aria-label="Search products" /><button type="submit">Search products</button></form></section>{error && <p className="productError" role="alert">{error}</p>}{loading ? <div className="productSkeleton"><span /><span /><span /></div> : items.length ? <section className="productGrid" aria-label="Local products">{items.map((item) => { const available = Number(item.availableQuantity ?? item.available ?? 0); const ratingCount = Number(item.productReviewCount ?? 0); const rating = Number(item.productRating ?? 0); return <article key={String(item.id)}><div className="productVisual">{item.imageUrl ? <img src={String(item.imageUrl)} alt="" loading="lazy" /> : <span>{String(item.name ?? "P").slice(0, 1)}</span>}</div><small>{item.storeName}</small><h2>{item.name}</h2><p>{item.description}</p><div className="productMeta"><b>₹{Number(item.price ?? 0).toLocaleString("en-IN")}</b><em>{available} available</em></div><div className="productRating" aria-label={ratingCount ? `${rating.toFixed(1)} from ${ratingCount} product ratings` : "No product ratings yet"}>{ratingCount ? `★ ${rating.toFixed(1)}` : "☆ New product"} <span>{ratingCount ? `(${ratingCount})` : ""}</span></div><ProductActions productId={String(item.id)} available={available} /><Link className="viewShop" href={`/stores/${item.storeSlug}`}>View shop →</Link></article>; })}</section> : <section className="productEmpty"><h2>No matching products</h2><p>Try a broader search or browse nearby shops.</p></section>}</main>;
}
