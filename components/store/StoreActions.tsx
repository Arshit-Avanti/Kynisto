"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

type StoreActionData = { id: string; slug: string; name: string; address: string; mapsUrl: string; phone: string | null; whatsapp: string | null; website: string | null; hasOwner: boolean; categoryModule: string; queueEnabled: boolean };

export function StoreActions({ store }: { store: StoreActionData }) {
  const [role, setRole] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");
  const canUseCustomerFeatures = role === "customer" || role === "admin";

  useEffect(() => {
    void apiFetch("/api/analytics", { method: "POST", json: { storeId: store.id, eventType: "view" } }).catch(() => undefined);
    apiFetch<{ user: { role: string } | null }>("/api/auth/me").then(async ({ user }) => {
      setRole(user?.role ?? null);
      if (user?.role === "customer" || user?.role === "admin") {
        const favorites = await apiFetch<{ items: Array<{ storeId: string }> }>("/api/favorites");
        setSaved(favorites.items.some((item) => item.storeId === store.id));
      }
    }).catch(() => undefined);
  }, [store.id]);

  async function track(eventType: string) {
    try { await apiFetch("/api/analytics", { method: "POST", json: { storeId: store.id, eventType } }); } catch { /* Navigation actions must remain available if analytics fails. */ }
  }

  async function toggleFavorite() {
    if (!canUseCustomerFeatures) { window.location.assign(`/login?returnTo=/stores/${store.slug}`); return; }
    const next = !saved;
    setSaved(next);
    try {
      await apiFetch("/api/favorites", { method: next ? "POST" : "DELETE", json: { storeId: store.id } });
      setMessage(next ? "Saved to your Kynisto favourites." : "Removed from favourites.");
    } catch (error) { setSaved(!next); setMessage(error instanceof Error ? error.message : "Could not update favourites."); }
  }

  async function share() {
    await track("share");
    const data = { title: store.name, text: `Find ${store.name} on Kynisto`, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(window.location.href); setMessage("Store link copied."); }
    } catch { /* A dismissed native share sheet is not an error. */ }
  }

  async function startChat() {
    if (!store.hasOwner) { setMessage("This business does not have a shop owner assigned yet. An admin can assign one before customer chat is enabled."); return; }
    if (!canUseCustomerFeatures) { window.location.assign(`/login?returnTo=/stores/${store.slug}`); return; }
    try {
      const conversation = await apiFetch<{ id: string }>("/api/chat", { method: "POST", json: { action: "start_store", storeId: store.id } });
      window.location.assign(`${role === "admin" ? "/admin" : "/account"}?tab=chat&conversation=${encodeURIComponent(conversation.id)}`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Chat is not available for this shop."); }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUseCustomerFeatures) { window.location.assign(`/login?returnTo=/stores/${store.slug}#reviews`); return; }
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await apiFetch("/api/reviews", { method: "POST", json: { ...values, storeId: store.id } });
      setMessage("Your review is now published."); setReviewing(false); event.currentTarget.reset();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not publish your review."); }
  }

  return <>
    <div className="storeActionRow">
      <a className="primary" href={store.mapsUrl} target="_blank" rel="noreferrer" onClick={() => void track("direction")}>Directions ↗</a>
      {store.phone && <a href={`tel:${store.phone}`} onClick={() => void track("phone")}>Call</a>}
      {store.whatsapp && <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" onClick={() => void track("whatsapp")}>WhatsApp</a>}
      <button type="button" aria-pressed={saved} onClick={() => void toggleFavorite()}>{saved ? "♥ Saved" : "♡ Save"}</button>
      <button type="button" onClick={() => void share()}>Share</button>
      <button type="button" disabled={!store.hasOwner} onClick={() => void startChat()}>{store.hasOwner ? "Message owner" : "Owner chat unavailable"}</button>
      {store.categoryModule === "healthcare" && store.queueEnabled && <Link href={`/healthcare?provider=${encodeURIComponent(store.id)}`}>Join Live Queue</Link>}
      <button type="button" onClick={() => setReviewing((value) => !value)}>Write a review</button>
    </div>
    {message && <p className="storeActionMessage" role="status">{message}</p>}
    {reviewing && <form className="quickReview" onSubmit={submitReview}><div><label>Rating<select name="rating" defaultValue="5"><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Poor</option><option value="1">1 — Very poor</option></select></label><label>Short title<input name="title" maxLength={100} placeholder="What stood out?" /></label></div><label>Review<textarea name="comment" minLength={10} maxLength={1500} placeholder="Share useful details for nearby customers" required /></label><button type="submit">Publish review</button>{!canUseCustomerFeatures && <small>You’ll be asked to <Link href={`/login?returnTo=/stores/${store.slug}#reviews`}>log in as a customer</Link>.</small>}</form>}
  </>;
}
