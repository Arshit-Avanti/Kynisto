"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import type { SessionUser } from "@/lib/auth";
import { ChatCenter } from "@/components/dashboard/ChatCenter";
import { UserSubscriptionDashboard } from "@/components/subscription/UserSubscriptionDashboard";
import { SubscriptionExpiryBanner } from "@/components/subscription/SubscriptionExpiryBanner";
import KynistoWalletView from "@/components/wallet/KynistoWalletView";
import { Heart, MessageSquare, ShoppingCart, MapPin, Package, Calendar, Ticket, CheckCircle2, ArrowRight, Store, Star, Wallet } from "lucide-react";

type Item = Record<string, unknown>;
type Payload = Record<string, unknown>;

const commerceTabs = new Set(["profile", "addresses", "wishlist", "cart", "orders", "notifications", "settings", "support"]);

function Status({ value }: { value: unknown }) {
  const text = String(value ?? "unknown");
  return <span className={`statusPill ${text}`}>{text.replaceAll("_", " ")}</span>;
}

function Empty({ text, icon: Icon = Package }: { text: string, icon?: React.ElementType }) {
  return <div className="emptyPortal"><div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem" }}><Icon size={48} color="#94a3b8" style={{ marginBottom: "0.5rem" }} /><b>Nothing here yet</b><p>{text}</p></div></div>;
}

export function CustomerDashboard({ user }: { user: SessionUser }) {
  const tab = useSearchParams().get("tab") ?? "overview";
  const [favorites, setFavorites] = useState<Item[]>([]);
  const [reviews, setReviews] = useState<Item[]>([]);
  const [productReviews, setProductReviews] = useState<Item[]>([]);
  const [data, setData] = useState<Payload>({});
  const [addresses, setAddresses] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeQueue, setActiveQueue] = useState<{
    storeId: string; storeName: string; tokenNumber: number;
    status: string; queueCode: string | null;
    queueState: { position: number; estimatedWaitMinutes: number; waitingCount: number } | null;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (tab === "overview" || tab === "favorites" || tab === "reviews") {
        const [saved, written, rated] = await Promise.all([
          apiFetch<{ items: Item[] }>("/api/favorites"),
          apiFetch<{ items: Item[] }>("/api/reviews"),
          apiFetch<{ items: Item[] }>("/api/product-reviews"),
        ]);
        setFavorites(saved.items);
        setReviews(written.items);
        setProductReviews(rated.items);
        if (tab === "overview") {
          const cart = await apiFetch<Payload>("/api/customer/workspace?view=cart");
          setData(cart);
        } else if (tab === "reviews") {
          setData(await apiFetch<Payload>("/api/customer/workspace?view=orders&status=delivered&limit=50"));
        }
      } else if (commerceTabs.has(tab)) {
        const requests: Promise<Payload>[] = [apiFetch<Payload>(`/api/customer/workspace?view=${tab}`)];
        if (tab === "cart") requests.push(apiFetch<Payload>("/api/customer/workspace?view=addresses"));
        const [workspace, addressData] = await Promise.all(requests);
        setData(workspace);
        if (addressData) setAddresses((addressData.items as Item[] | undefined) ?? []);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load account.");
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2400); return () => clearTimeout(timer); }, [toast]);

  // Fetch active queue on mount and poll every 30s
  const fetchActiveQueue = useCallback(async () => {
    try {
      const res = await apiFetch<{ activeQueue: typeof activeQueue }>("/api/healthcare/queue/active");
      setActiveQueue(res.activeQueue ?? null);
    } catch { /* silent */ }
  }, []);
  useEffect(() => { void fetchActiveQueue(); }, [fetchActiveQueue]);
  useEffect(() => {
    const timer = setInterval(() => { void fetchActiveQueue(); }, 30_000);
    return () => clearInterval(timer);
  }, [fetchActiveQueue]);

  async function handleLeaveQueue() {
    if (!activeQueue?.storeId) return;
    if (!window.confirm("Leave the queue? You will lose your spot.")) return;
    try {
      await apiFetch("/api/healthcare/queue", { method: "POST", json: { action: "leave", storeId: activeQueue.storeId } });
      setActiveQueue(null);
      setToast("You have left the queue.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not leave queue."); }
  }

  async function mutate(method: "POST" | "PATCH" | "DELETE", json: Payload, message: string) {
    setError("");
    try {
      await apiFetch("/api/customer/workspace", { method, json });
      setToast(message);
      await load();
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "Action failed.");
    }
  }

  async function removeFavorite(storeId: unknown) {
    try { await apiFetch("/api/favorites", { method: "DELETE", json: { storeId } }); setToast("Removed from saved shops"); await load(); }
    catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : "Action failed."); }
  }

  async function deleteReview(reviewId: unknown) {
    try { await apiFetch("/api/reviews", { method: "DELETE", json: { reviewId } }); setToast("Review deleted"); await load(); }
    catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : "Action failed."); }
  }

  async function mutateProductReview(method: "POST" | "DELETE", json: Payload, message: string) {
    try { await apiFetch("/api/product-reviews", { method, json }); setToast(message); await load(); }
    catch (mutationError) { setError(mutationError instanceof Error ? mutationError.message : "Action failed."); }
  }

  if (loading) return <div className="portalSkeleton"><span /><span /><span /><span /></div>;
  if (tab === "chat") return <ChatCenter user={user} />;
  if (tab === "subscription") return <UserSubscriptionDashboard />;
  const titles: Record<string, string> = { overview: "My Kynisto", subscription: "Premium & Plans", profile: "Profile", addresses: "Saved addresses", favorites: "Favourite shops", wishlist: "Product wishlist", cart: "Shopping cart", orders: "Orders & tracking", reviews: "My reviews", notifications: "Notifications", settings: "Settings", support: "Support & complaints" };
  const items = (data.items as Item[] | undefined) ?? [];

  return <>
    <SubscriptionExpiryBanner />
    <div className="portalTitleRow">
      <div>
        <span className="portalEyebrow">MY ACCOUNT</span>
        <h1 style={{ fontSize: "2.2rem", fontWeight: 800 }}>Welcome back, <span style={{ color: "#0ea5e9" }}>{user.name.split(" ")[0]}</span>!</h1>
        <p style={{ color: "#64748b", marginTop: "0.5rem" }}>Manage your profile, orders, wishlist and preferences. All your account information is secure and private.</p>
      </div>
      <Link className="portalButton" href="/products" style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#0ea5e9", color: "#fff", padding: "0.75rem 1.25rem", borderRadius: "12px", textDecoration: "none", fontWeight: 700 }}>
        Explore Local Products <ArrowRight size={18} />
      </Link>
    </div>
    {error && <p className="authError" role="alert">{error}</p>}
    
    {activeQueue && (
      <div style={{
        background: "rgba(30, 27, 75, 0.4)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(99, 102, 241, 0.3)",
        color: "#ffffff",
        padding: "1.5rem 2rem",
        borderRadius: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1.5rem",
        marginBottom: "2rem",
        boxShadow: "0 0 30px rgba(99, 102, 241, 0.15), inset 0 0 20px rgba(99, 102, 241, 0.05)"
      }}>
        <style>{`
          @keyframes pulseTicket {
            0%, 100% { filter: drop-shadow(0 0 5px rgba(129, 140, 248, 0.5)); transform: scale(1); }
            50% { filter: drop-shadow(0 0 15px rgba(129, 140, 248, 0.9)); transform: scale(1.05); }
          }
        `}</style>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ background: "rgba(99, 102, 241, 0.1)", padding: "1rem", borderRadius: "16px", border: "1px solid rgba(129, 140, 248, 0.3)" }}>
            <Ticket size={32} color="#a5b4fc" style={{ animation: "pulseTicket 2s infinite" }} />
          </div>
          <div>
            <strong style={{ fontSize: "1.2rem", display: "block", marginBottom: "0.25rem", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>You&apos;re in a queue at {activeQueue.storeName}</strong>
            <span style={{ color: "#c7d2fe", fontSize: "0.95rem", textShadow: "0 0 5px rgba(199, 210, 254, 0.5)" }}>
              Token #{activeQueue.tokenNumber}
              {activeQueue.queueState ? ` · ${Math.max(0, (activeQueue.queueState.position ?? 1) - 1)} ahead · ~${activeQueue.queueState.estimatedWaitMinutes ?? 0} min wait` : ""}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {activeQueue.queueCode ? (
            <Link href={`/q/${activeQueue.queueCode}`} style={{ background: "rgba(79, 70, 229, 0.8)", backdropFilter: "blur(4px)", border: "1px solid rgba(129, 140, 248, 0.5)", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: 700, textDecoration: "none", boxShadow: "0 0 15px rgba(79, 70, 229, 0.4)" }}>View Queue</Link>
          ) : (
            <Link href="/healthcare" style={{ background: "rgba(79, 70, 229, 0.8)", backdropFilter: "blur(4px)", border: "1px solid rgba(129, 140, 248, 0.5)", color: "#fff", padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: 700, textDecoration: "none", boxShadow: "0 0 15px rgba(79, 70, 229, 0.4)" }}>View Queue</Link>
          )}
          <button type="button" onClick={() => void handleLeaveQueue()} style={{ background: "rgba(248, 113, 113, 0.1)", backdropFilter: "blur(4px)", color: "#fca5a5", border: "1px solid rgba(248, 113, 113, 0.3)", padding: "0.75rem 1.5rem", borderRadius: "12px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>Leave</button>
        </div>
      </div>
    )}

    {tab === "overview" && <CustomerOverview user={user} favorites={favorites} reviews={[...reviews, ...productReviews]} cart={(data.items as Item[] | undefined) ?? []} />}
    {tab === "wallet" && <KynistoWalletView />}
    {tab === "profile" && <ProfilePanel profile={(data.profile as Item | undefined) ?? { name: user.name, email: user.email }} mutate={mutate} />}
    {tab === "addresses" && <AddressesPanel items={items} mutate={mutate} />}
    {tab === "favorites" && <section className="portalCard"><FavoriteList items={favorites} remove={removeFavorite} /></section>}
    {tab === "wishlist" && <WishlistPanel items={items} mutate={mutate} />}
    {tab === "cart" && <CartPanel items={items} subtotal={Number(data.subtotal ?? 0)} addresses={addresses} mutate={mutate} />}
    {tab === "orders" && <OrdersPanel items={items} mutate={mutate} />}
    {tab === "reviews" && <ReviewsPanel items={reviews} remove={deleteReview} productReviews={productReviews} deliveredOrders={items} mutateProduct={mutateProductReview} />}
    {tab === "notifications" && <NotificationsPanel items={items} mutate={mutate} />}
    {tab === "settings" && <SettingsPanel preferences={(data.preferences as Item | undefined) ?? {}} mutate={mutate} />}
    {tab === "support" && <SupportPanel items={items} mutate={mutate} />}
    
    {toast && <div className="portalToast" role="status" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><CheckCircle2 size={18} /> {toast}</div>}
  </>;
}

function CustomerOverview({ user, favorites, reviews, cart }: { user: SessionUser; favorites: Item[]; reviews: Item[]; cart: Item[] }) {
  return (
    <>
      <div className="statsGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <article className="statCard" style={{ background: "linear-gradient(135deg, rgba(131, 24, 67, 0.85), rgba(190, 24, 93, 0.9))", backdropFilter: "blur(12px)", border: "1px solid rgba(244, 114, 182, 0.4)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px -10px rgba(219, 39, 119, 0.4), inset 0 0 20px rgba(219, 39, 119, 0.1)", transform: "translateZ(0)" }}>
          <Heart size={28} color="#f472b6" style={{ marginBottom: "0.75rem", filter: "drop-shadow(0 0 8px rgba(244, 114, 182, 0.8))" }} />
          <small style={{ color: "#fbcfe8", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>FAVOURITE SHOPS</small>
          <strong style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1, marginTop: "0.5rem", textShadow: "0 0 15px rgba(255,255,255,0.5)" }}>{favorites.length}</strong>
          <span className="subText" style={{ color: "#f9a8d4", fontSize: "0.85rem", marginTop: "0.25rem" }}>Saved shops</span>
        </article>
        <article className="statCard" style={{ background: "linear-gradient(135deg, rgba(120, 53, 15, 0.85), rgba(180, 83, 9, 0.9))", backdropFilter: "blur(12px)", border: "1px solid rgba(251, 191, 36, 0.4)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px -10px rgba(217, 119, 6, 0.4), inset 0 0 20px rgba(217, 119, 6, 0.1)", transform: "translateZ(0)" }}>
          <Star size={28} color="#fbbf24" style={{ marginBottom: "0.75rem", filter: "drop-shadow(0 0 8px rgba(251, 191, 36, 0.8))" }} />
          <small style={{ color: "#fde68a", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>REVIEWS WRITTEN</small>
          <strong style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1, marginTop: "0.5rem", textShadow: "0 0 15px rgba(255,255,255,0.5)" }}>{reviews.length}</strong>
          <span className="subText" style={{ color: "#fcd34d", fontSize: "0.85rem", marginTop: "0.25rem" }}>Reviews written</span>
        </article>
        <article className="statCard" style={{ background: "linear-gradient(135deg, rgba(30, 58, 138, 0.85), rgba(29, 78, 216, 0.9))", backdropFilter: "blur(12px)", border: "1px solid rgba(96, 165, 250, 0.4)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.4), inset 0 0 20px rgba(37, 99, 235, 0.1)", transform: "translateZ(0)" }}>
          <ShoppingCart size={28} color="#60a5fa" style={{ marginBottom: "0.75rem", filter: "drop-shadow(0 0 8px rgba(96, 165, 250, 0.8))" }} />
          <small style={{ color: "#bfdbfe", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>CART PRODUCTS</small>
          <strong style={{ fontSize: "2.5rem", fontWeight: 900, color: "#fff", lineHeight: 1, marginTop: "0.5rem", textShadow: "0 0 15px rgba(255,255,255,0.5)" }}>{cart.length}</strong>
          <span className="subText" style={{ color: "#93c5fd", fontSize: "0.85rem", marginTop: "0.25rem" }}>Items in your cart</span>
        </article>
        <article className="statCard" style={{ background: "linear-gradient(135deg, rgba(17, 94, 89, 0.85), rgba(15, 118, 110, 0.9))", backdropFilter: "blur(12px)", border: "1px solid rgba(45, 212, 191, 0.4)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", boxShadow: "0 10px 30px -10px rgba(13, 148, 136, 0.4), inset 0 0 20px rgba(13, 148, 136, 0.1)", transform: "translateZ(0)" }}>
          <MapPin size={28} color="#2dd4bf" style={{ marginBottom: "0.75rem", filter: "drop-shadow(0 0 8px rgba(45, 212, 191, 0.8))" }} />
          <small style={{ color: "#99f6e4", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>LOCATION</small>
          <strong style={{ fontSize: "1.5rem", fontWeight: 800, color: "#fff", lineHeight: 1.2, marginTop: "0.5rem", textShadow: "0 0 10px rgba(255,255,255,0.3)" }}>Your Locality</strong>
          <span className="subText" style={{ color: "#5eead4", fontSize: "0.85rem", marginTop: "0.25rem" }}>Your current locality</span>
        </article>
      </div>

      <div className="portalGrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <section className="portalCard" style={{ padding: "2rem", borderRadius: "20px", background: "var(--portal-card-bg, #ffffff)", border: "1px solid var(--portal-border, #e2e8f0)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <div className="portalCardHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>Recently Saved</h2>
            <Link href="/account?tab=favorites" style={{ color: "#0ea5e9", textDecoration: "none", fontSize: "0.9rem", fontWeight: 700 }}>
              View all
            </Link>
          </div>
          {favorites.length > 0 ? (
            <FavoriteList items={favorites.slice(0, 4)} remove={async () => undefined} hideActions />
          ) : (
            <Empty text="Save your favorite local shops and places to quickly find them later." icon={Store} />
          )}
        </section>

        <section className="portalCard" style={{ padding: "2rem", borderRadius: "20px", background: "var(--portal-card-bg, #ffffff)", border: "1px solid var(--portal-border, #e2e8f0)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <div className="portalCardHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>Account Identity</h2>
            <span className="statusPill active">Active</span>
          </div>
          <div className="accountDetail" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#0ea5e9", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.75rem", fontWeight: 800 }}>
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <b style={{ fontSize: "1.25rem", color: "var(--text-primary, #0f172a)" }}>{user.name}</b>
                <small style={{ display: "block", color: "var(--text-secondary, #64748b)", marginTop: "0.25rem", fontSize: "0.95rem" }}>{user.email}</small>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "1.25rem", background: "var(--cream, #f8fafc)", borderRadius: "16px", border: "1px solid var(--line, #f1f5f9)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#0ea5e9", fontSize: "0.95rem", fontWeight: 500 }}>
                <MapPin size={18} /> Customer • 28.7381° N, 77.2689° E
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-secondary, #64748b)", fontSize: "0.95rem", fontWeight: 500 }}>
                <Calendar size={18} /> Member since May 22, 2024
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function ProfilePanel({ profile, mutate }: { profile: Item; mutate: (method: "PATCH", json: Payload, message: string) => Promise<void> }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void mutate("PATCH", { action: "update_profile", ...Object.fromEntries(new FormData(event.currentTarget)) }, "Profile updated"); }
  return <section className="portalCard"><div className="portalCardHeader"><h2>Personal details</h2><small>Your Google account is your secure login identity</small></div><form className="portalForm" onSubmit={submit}><label>Full name<input name="name" defaultValue={String(profile.name ?? "")} required minLength={2} maxLength={80} /></label><label>Google email<input value={String(profile.email ?? "")} readOnly /></label><label>Phone<input name="phone" defaultValue={String(profile.phone ?? "")} placeholder="+91…" /></label><div className="formActions"><button className="portalButton" type="submit">Save profile</button></div></form></section>;
}

function AddressesPanel({ items, mutate }: { items: Item[]; mutate: (method: "POST" | "PATCH" | "DELETE", json: Payload, message: string) => Promise<void> }) {
  function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void mutate("POST", { action: "create_address", ...Object.fromEntries(new FormData(event.currentTarget)) }, "Address saved"); }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Add an address</h2><small>Used only for your orders</small></div><form className="portalForm" onSubmit={create}><label>Label<input name="label" defaultValue="Home" required /></label><label>Recipient<input name="recipientName" required /></label><label>Phone<input name="phone" required /></label><label>PIN code<input name="postalCode" defaultValue="201102" required /></label><label className="full">Address line<input name="line1" required /></label><label>Area<input name="area" defaultValue="Your Locality" required /></label><label>City<input name="city" defaultValue="Loni" required /></label><label>State<input name="state" defaultValue="Uttar Pradesh" required /></label><label>Country<input name="country" defaultValue="India" required /></label><div className="formActions"><button className="portalButton" type="submit">Save address</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><h2>Saved addresses</h2><small>{items.length} addresses</small></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.label ?? "Address")}{Boolean(item.isDefault) && " · Default"}</b><p>{String(item.line1)}, {String(item.area)}, {String(item.city)} {String(item.postalCode)}</p><small>{String(item.recipientName)} · {String(item.phone)}</small></div><div className="tableActions">{!item.isDefault && <button onClick={() => void mutate("PATCH", { action: "set_default_address", addressId: item.id }, "Default address updated")}>Make default</button>}<button onClick={() => void mutate("DELETE", { action: "delete_address", addressId: item.id }, "Address deleted")}>Delete</button></div></article>)}</div> : <Empty text="Add a delivery address to place an order." icon={MapPin} />}</section></div>;
}

function WishlistPanel({ items, mutate }: { items: Item[]; mutate: (method: "POST" | "DELETE", json: Payload, message: string) => Promise<void> }) {
  return <section className="portalCard"><div className="portalCardHeader"><h2>Saved products</h2><Link href="/products">Find products</Link></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.name ?? item.productName)}</b><p>{String(item.storeName ?? "Local shop")}</p><small>₹{Number(item.price ?? 0).toLocaleString("en-IN")} · {Number(item.availableQuantity ?? item.available ?? 0)} available</small></div><div className="tableActions"><button onClick={() => void mutate("POST", { action: "add_cart", productId: item.productId ?? item.id, quantity: 1 }, "Added to cart")}>Add to cart</button><button onClick={() => void mutate("DELETE", { action: "remove_wishlist", productId: item.productId ?? item.id }, "Removed from wishlist")}>Remove</button></div></article>)}</div> : <Empty text="Save products from approved local shops." icon={Heart} />}</section>;
}

function CartPanel({ items, subtotal, addresses, mutate }: { items: Item[]; subtotal: number; addresses: Item[]; mutate: (method: "POST" | "PATCH" | "DELETE", json: Payload, message: string) => Promise<void> }) {
  function checkout(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void mutate("POST", { action: "place_order", ...values }, "Order placed"); }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Cart</h2><b>₹{subtotal.toLocaleString("en-IN")}</b></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.productName ?? item.name)}</b><p>{String(item.storeName)}</p><small>₹{Number(item.price ?? item.unitPrice ?? 0).toLocaleString("en-IN")} each</small></div><div className="tableActions"><input aria-label="Quantity" type="number" min={1} max={99} defaultValue={Number(item.quantity ?? 1)} onBlur={(event) => void mutate("PATCH", { action: "update_cart", productId: item.productId, quantity: Number(event.target.value) }, "Cart updated")} /><button onClick={() => void mutate("DELETE", { action: "remove_cart", productId: item.productId }, "Removed from cart")}>Remove</button></div></article>)}</div> : <Empty text="Your cart is ready for local products." icon={ShoppingCart} />}</section><section className="portalCard"><div className="portalCardHeader"><h2>Checkout</h2><small>Totals are verified on the server</small></div><form className="portalForm" onSubmit={checkout}><label>Fulfilment<select name="fulfillmentType" defaultValue="delivery"><option value="delivery">Delivery</option><option value="pickup">Pickup</option></select></label><label>Delivery address<select name="addressId"><option value="">Select address</option>{addresses.map((address) => <option key={String(address.id)} value={String(address.id)}>{String(address.label)} · {String(address.area)}</option>)}</select></label><label className="full">Coupon code<input name="couponCode" /></label><label className="full">Order note<textarea name="notes" /></label><div className="formActions"><button className="portalButton success" type="submit" disabled={!items.length}>Place secure order</button></div></form></section></div>;
}

function OrdersPanel({ items, mutate }: { items: Item[]; mutate: (method: "PATCH", json: Payload, message: string) => Promise<void> }) {
  const cancellable = new Set(["pending", "confirmed"]);
  return <section className="portalCard"><div className="portalCardHeader"><h2>Order history</h2><small>Live status and tracking</small></div>{items.length ? <div className="workspaceList orderList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.orderNumber ?? item.id)}</b><p>{String(item.storeName)} · ₹{Number(item.total ?? 0).toLocaleString("en-IN")}</p><small>{new Date(Number(item.createdAt ?? item.placedAt ?? 0) * 1000).toLocaleString()}</small></div><div className="tableActions"><Status value={item.status} />{cancellable.has(String(item.status)) && <button onClick={() => void mutate("PATCH", { action: "cancel_order", orderId: item.id }, "Order cancelled")}>Cancel</button>}</div></article>)}</div> : <Empty text="Orders placed with local shops will appear here." icon={Package} />}</section>;
}

function ReviewsPanel({ items, remove, productReviews, deliveredOrders, mutateProduct }: { items: Item[]; remove: (id: unknown) => Promise<void>; productReviews: Item[]; deliveredOrders: Item[]; mutateProduct: (method: "POST" | "DELETE", json: Payload, message: string) => Promise<void> }) {
  const purchased = new Map<string, Item>();
  for (const order of deliveredOrders) for (const item of ((order.items as Item[] | undefined) ?? [])) if (item.productId) purchased.set(String(item.productId), item);
  const reviewed = new Set(productReviews.map((review) => String(review.productId)));
  const eligible = [...purchased.values()].filter((item) => !reviewed.has(String(item.productId)));
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Shop reviews</h2><small>Public neighbourhood feedback</small></div>{items.length ? items.map((review) => <article className="accountReview" key={String(review.id)}><div><b style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Star size={14} /> {String(review.rating)} · {String(review.storeName)}</b><small>{String(review.title ?? "")}</small><p>{String(review.comment)}</p>{Boolean(review.ownerReply) && <em>Owner reply: {String(review.ownerReply)}</em>}</div><div className="tableActions"><Link href={`/stores/${String(review.slug)}`}>View store</Link><button onClick={() => void remove(review.id)}>Delete</button></div></article>) : <Empty text="Review a shop after a local experience." icon={Star} />}</section><section className="portalCard"><div className="portalCardHeader"><h2>Verified product ratings</h2><small>Delivered orders only</small></div>{productReviews.map((review) => <article className="accountReview" key={String(review.id)}><div><b style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Star size={14} /> {String(review.rating)} · {String(review.productName)}</b><small>{String(review.storeName)}</small><p>{String(review.comment)}</p></div><button className="portalButton secondary" onClick={() => void mutateProduct("DELETE", { reviewId: review.id }, "Product review deleted")}>Delete</button></article>)}{eligible.map((item) => <form className="productReviewForm" key={String(item.productId)} onSubmit={(event) => { event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); void mutateProduct("POST", { productId: item.productId, ...values, rating: Number(values.rating) }, "Product review published"); }}><b>Rate {String(item.productName)}</b><select name="rating" defaultValue="5"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select><input name="title" placeholder="Short title" /><textarea name="comment" minLength={10} required placeholder="Share at least 10 characters about the product" /><button className="portalButton" type="submit">Publish rating</button></form>)}{!productReviews.length && !eligible.length && <Empty text="Delivered products you can rate will appear here." icon={Package} />}</section></div>;
}

function NotificationsPanel({ items, mutate }: { items: Item[]; mutate: (method: "PATCH", json: Payload, message: string) => Promise<void> }) {
  return <section className="portalCard"><div className="portalCardHeader"><h2>Notifications</h2><small>Orders, support and platform news</small></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)} className={item.readAt ? "" : "unread"}><div><b>{String(item.title)}</b><p>{String(item.message)}</p><small>{new Date(Number(item.createdAt ?? 0) * 1000).toLocaleString()}</small></div>{!item.readAt && Boolean(item.canMarkRead) && <button className="portalButton secondary" onClick={() => void mutate("PATCH", { action: "mark_notification_read", notificationId: item.id }, "Marked as read")}>Mark read</button>}</article>)}</div> : <Empty text="You are all caught up." icon={MessageSquare} />}</section>;
}

function SettingsPanel({ preferences, mutate }: { preferences: Item; mutate: (method: "PATCH", json: Payload, message: string) => Promise<void> }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); void mutate("PATCH", { action: "update_preferences", emailNotifications: form.get("emailNotifications") === "on", orderNotifications: form.get("orderNotifications") === "on", marketingNotifications: form.get("marketingNotifications") === "on" }, "Preferences saved"); }
  return <section className="portalCard narrowCard"><div className="portalCardHeader"><h2>Notification preferences</h2></div><form className="toggleList" onSubmit={submit}><label><span><b>Email notifications</b><small>Important account updates</small></span><input name="emailNotifications" type="checkbox" defaultChecked={Boolean(preferences.emailNotifications ?? true)} /></label><label><span><b>Order notifications</b><small>Status and delivery updates</small></span><input name="orderNotifications" type="checkbox" defaultChecked={Boolean(preferences.orderNotifications ?? true)} /></label><label><span><b>Local offers</b><small>Optional marketing messages</small></span><input name="marketingNotifications" type="checkbox" defaultChecked={Boolean(preferences.marketingNotifications)} /></label><button className="portalButton" type="submit">Save settings</button></form></section>;
}

function SupportPanel({ items, mutate }: { items: Item[]; mutate: (method: "POST", json: Payload, message: string) => Promise<void> }) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void mutate("POST", { action: "create_support_ticket", ...Object.fromEntries(new FormData(event.currentTarget)) }, "Ticket created"); }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Contact Kynisto</h2></div><form className="portalForm" onSubmit={submit}><label>Type<select name="type"><option value="support">Support</option><option value="complaint">Complaint</option></select></label><label>Priority<select name="priority"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option></select></label><label className="full">Subject<input name="subject" required minLength={5} /></label><label className="full">Message<textarea name="message" required minLength={10} /></label><div className="formActions"><button className="portalButton" type="submit">Create ticket</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><h2>Your tickets</h2><small>{items.length} total</small></div>{items.length ? <div className="workspaceList">{items.map((item) => <article key={String(item.id)}><div><b>{String(item.subject)}</b><p>{String(item.message)}</p><small>{String(item.type)} · {String(item.priority)}</small></div><Status value={item.status} /></article>)}</div> : <Empty text="Support requests and complaints are private." icon={MessageSquare} />}</section></div>;
}

function FavoriteList({ items, remove, hideActions = false }: { items: Item[]; remove: (id: unknown) => Promise<void>; hideActions?: boolean }) {
  return items.length ? <div className="favoriteGrid">{items.map((item) => <article key={String(item.id)}><div className="favoriteGlyph"><Store size={24} color="#64748b" /></div><div><span>{String(item.category ?? "Local shop")}</span><b>{String(item.name)}</b><small>{String(item.address)}</small><em style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}><Star size={14} /> {String(item.rating)} ({String(item.reviews)})</em></div>{!hideActions && <div className="tableActions"><Link href={`/stores/${String(item.slug)}`}>View</Link><button onClick={() => void remove(item.storeId)}>Remove</button></div>}</article>)}</div> : <Empty text="Save useful local shops and they will appear here." icon={Store} />;
}
