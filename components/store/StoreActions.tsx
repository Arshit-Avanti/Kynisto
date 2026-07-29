"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

type StoreActionData = { id: string; slug: string; name: string; address: string; mapsUrl: string; phone: string | null; whatsapp: string | null; website: string | null; hasOwner: boolean; categoryModule: string; queueEnabled: boolean };

const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const PhoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>;
const WhatsAppIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>;
const HeartIcon = ({ filled }: { filled?: boolean }) => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
const ChatIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const QueueIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

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

  const actionStyle = (bg: string, color: string): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: bg,
    color: color,
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    border: `1px solid ${bg === '#f8fafc' ? '#e2e8f0' : bg}`,
    cursor: "pointer",
    transition: "all 0.2s ease"
  });

  return <>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "16px" }}>
      <a style={actionStyle("#2563eb", "#ffffff")} href={store.mapsUrl} target="_blank" rel="noreferrer" onClick={() => void track("direction")}>
        <MapPinIcon /> Directions
      </a>
      {store.phone && <a style={actionStyle("#f8fafc", "#0f172a")} href={`tel:${store.phone}`} onClick={() => void track("phone")}><PhoneIcon /> Call</a>}
      {store.whatsapp && <a style={actionStyle("#f8fafc", "#0f172a")} href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" onClick={() => void track("whatsapp")}><WhatsAppIcon /> WhatsApp</a>}
      <button style={actionStyle(saved ? "#fee2e2" : "#f8fafc", saved ? "#ef4444" : "#0f172a")} type="button" aria-pressed={saved} onClick={() => void toggleFavorite()}>
        <HeartIcon filled={saved} /> {saved ? "Saved" : "Save"}
      </button>
      <button style={actionStyle("#f8fafc", "#0f172a")} type="button" onClick={() => void share()}>
        <ShareIcon /> Share
      </button>
      <button style={{ ...actionStyle("#f8fafc", store.hasOwner ? "#0f172a" : "#94a3b8"), opacity: store.hasOwner ? 1 : 0.6 }} type="button" disabled={!store.hasOwner} onClick={() => void startChat()}>
        <ChatIcon /> {store.hasOwner ? "Message" : "Chat unavailable"}
      </button>
      {store.categoryModule === "healthcare" && store.queueEnabled && <Link style={actionStyle("#f8fafc", "#0f172a")} href={`/healthcare?provider=${encodeURIComponent(store.id)}`}><QueueIcon /> Join Queue</Link>}
      <button style={actionStyle("#f8fafc", "#0f172a")} type="button" onClick={() => setReviewing((value) => !value)}>
        <EditIcon /> Review
      </button>
    </div>
    {message && <p style={{ marginTop: "12px", fontSize: "14px", color: "#0f172a", backgroundColor: "#f1f5f9", padding: "12px", borderRadius: "8px" }} role="status">{message}</p>}
    {reviewing && <form className="quickReview" onSubmit={submitReview} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px", fontWeight: 500, color: "#475569", flex: 1 }}>Rating
          <select name="rating" defaultValue="5" style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }}>
            <option value="5">5 — Excellent</option>
            <option value="4">4 — Good</option>
            <option value="3">3 — Average</option>
            <option value="2">2 — Poor</option>
            <option value="1">1 — Very poor</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px", fontWeight: 500, color: "#475569", flex: 2 }}>Short title
          <input name="title" maxLength={100} placeholder="What stood out?" style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
        </label>
      </div>
      <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "14px", fontWeight: 500, color: "#475569" }}>Review
        <textarea name="comment" minLength={10} maxLength={1500} placeholder="Share useful details for nearby customers" required style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", minHeight: "80px" }} />
      </label>
      <button type="submit" style={{ ...actionStyle("#2563eb", "#ffffff"), justifyContent: "center" }}>Publish review</button>
      {!canUseCustomerFeatures && <small style={{ color: "#64748b", fontSize: "12px" }}>You’ll be asked to <Link href={`/login?returnTo=/stores/${store.slug}#reviews`} style={{ color: "#2563eb", textDecoration: "underline" }}>log in as a customer</Link>.</small>}
    </form>}
  </>;
}

