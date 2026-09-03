"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import type { SessionUser } from "@/lib/auth";
import { ChatCenter } from "@/components/dashboard/ChatCenter";
import { OwnerHealthcarePanel } from "@/components/dashboard/OwnerHealthcarePanel";
import { CatalogMediaControl } from "@/components/dashboard/CatalogMediaControl";
import { OwnerStoreEditor } from "@/components/dashboard/OwnerStoreEditor";
import {
  isOwnerWorkspaceView,
  OwnerWorkspacePanel,
} from "@/components/dashboard/OwnerWorkspacePanel";
import { OwnerStoreQRCard } from "@/components/dashboard/OwnerStoreQRCard";
import { OwnerMembershipEditor } from "@/components/dashboard/OwnerMembershipEditor";
import { OwnerLoyaltyManager } from "@/components/dashboard/OwnerLoyaltyManager";

import { UserSubscriptionDashboard } from "@/components/subscription/UserSubscriptionDashboard";
import { FeatureGateNotice } from "@/components/subscription/FeatureGateNotice";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";
import { SubscriptionExpiryBanner } from "@/components/subscription/SubscriptionExpiryBanner";
import { RoleSwitcherButton } from "@/components/auth/RoleSwitcherButton";

import { Eye, Star, Navigation, Phone, MessageCircle, BarChart2, CheckCircle2 } from "lucide-react";

type Store = Record<string, string | number | null | undefined>;
type Item = Record<string, string | number | null | undefined>;
type Pagination = { page: number; limit: number; total: number; totalPages: number };

function Status({ value }: { value: unknown }) { const text=String(value??"pending"); return <span className={`statusPill ${text}`}>{text}</span>; }

export function OwnerDashboard({ user }: { user: SessionUser }) {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";
  // Load initial cached overview data for instant 0ms load times across session and persistent storage
  const initialCache = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem("kynisto_owner_dash_cache") || localStorage.getItem("kynisto_owner_dash_cache");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const [stores, setStores] = useState<Store[]>(initialCache?.stores ?? []);
  const [reviews, setReviews] = useState<Item[]>(initialCache?.reviews ?? []);
  const [storeReviews, setStoreReviews] = useState<Item[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [analytics, setAnalytics] = useState<Item[]>(initialCache?.analytics ?? []);
  const [categories, setCategories] = useState<Item[]>(initialCache?.categories ?? []);
  const [selectedId, setSelectedId] = useState<string>(initialCache?.selectedId ?? (initialCache?.stores?.[0]?.id ? String(initialCache.stores[0].id) : ""));
  const [catalog, setCatalog] = useState<Item[]>([]);
  const [media, setMedia] = useState<Item[]>([]);
  const [subPlan, setSubPlan] = useState<Record<string, any>>(initialCache?.subPlan ?? { id: "enterprise", allowQueueManagement: true, isUnrestrictedByAdmin: true, allowAnalytics: true, allowPromotions: true, allowCustomBranding: true });
  const [loading, setLoading] = useState(!initialCache);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const selected = useMemo(() => stores.find((store) => store.id === selectedId) ?? stores[0], [selectedId, stores]);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;

  const loadOverview = useCallback(async () => {
    const [overview, categoryData, subRes] = await Promise.all([
      apiFetch<{ stores: Store[]; analytics: Item[]; recentReviews: Item[] }>("/api/owner/overview"),
      apiFetch<{ items: Item[] }>("/api/categories?module=all"),
      apiFetch<{ plan: Record<string, any> }>("/api/subscriptions/me").catch(() => ({ plan: { id: "enterprise", allowQueueManagement: true, isUnrestrictedByAdmin: true } })),
    ]);
    setStores(overview.stores);
    setAnalytics(overview.analytics);
    setReviews(overview.recentReviews);
    setCategories(categoryData.items);
    const resolvedPlan = {
      ...(subRes?.plan ?? {}),
      allowQueueManagement: true,
      isUnrestrictedByAdmin: true,
      allowAnalytics: true,
      allowPromotions: true,
      allowCustomBranding: true,
    };
    setSubPlan(resolvedPlan);
    const activeId = selectedIdRef.current || (overview.stores[0] ? String(overview.stores[0].id) : "");
    if (!selectedIdRef.current && overview.stores[0]) setSelectedId(activeId);

    // Save payload in sessionStorage & localStorage for instant subsequent page renders (<15ms)
    try {
      const payload = JSON.stringify({
        stores: overview.stores,
        analytics: overview.analytics,
        reviews: overview.recentReviews,
        categories: categoryData.items,
        subPlan: resolvedPlan,
        selectedId: activeId
      });
      sessionStorage.setItem("kynisto_owner_dash_cache", payload);
      localStorage.setItem("kynisto_owner_dash_cache", payload);
    } catch {
      // Ignore storage quota errors
    }
  }, []);

  const load = useCallback(async () => {
    if (!initialCache) setLoading(true);
    setError("");
    try {
      await loadOverview();
    } catch (loadError) {
      const msg = loadError instanceof Error ? loadError.message : "Unable to load dashboard.";
      if (msg.includes("Please log in") || msg.includes("UNAUTHENTICATED")) {
        try {
          await new Promise((r) => setTimeout(r, 350));
          await loadOverview();
          return;
        } catch {}
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loadOverview, initialCache]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!selectedId) return;
    if (["products","services","offers"].includes(tab)) {
      setTabLoading(true);
      apiFetch<{items:Item[]}>(`/api/owner/catalog?resource=${tab}&storeId=${selectedId}`)
        .then((result)=>setCatalog(result.items))
        .catch((e)=>setError(e instanceof Error ? e.message : String(e)))
        .finally(()=>setTabLoading(false));
    }
    if(tab==="media") {
      setTabLoading(true);
      apiFetch<{items:Item[]}>(`/api/media?storeId=${selectedId}`)
        .then((result)=>setMedia(result.items))
        .catch((e)=>setError(e instanceof Error ? e.message : String(e)))
        .finally(()=>setTabLoading(false));
    }
    if(tab==="analytics") {
      setTabLoading(true);
      apiFetch<{items:Item[]}>("/api/owner/analytics")
        .then((result)=>setAnalytics(result.items))
        .catch((e)=>setError(e instanceof Error ? e.message : String(e)))
        .finally(()=>setTabLoading(false));
    }
  }, [selectedId, tab]);
  useEffect(() => { setReviewPage(1); }, [selectedId]);
  useEffect(() => {
    if (!selectedId || tab !== "reviews") return;
    let active = true;
    apiFetch<{items:Item[];pagination:Pagination}>(`/api/owner/reviews?storeId=${selectedId}&page=${reviewPage}&limit=20`)
      .then((result) => { if (active) { setStoreReviews(result.items); setReviewPagination(result.pagination); } })
      .catch((e) => { if (active) setError(e instanceof Error ? e.message : "Unable to load reviews."); });
    return () => { active = false; };
  }, [selectedId, tab, reviewPage]);
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(timer)},[toast]);

  async function mutate(
    path: string,
    method: string,
    json: unknown,
    message: string,
    files?: { logo?: File; banner?: File; photo?: File } | File,
  ) {
    try {
      try {
        sessionStorage.removeItem("kynisto_owner_dash_cache");
      } catch {}

      const res = await apiFetch<{ storeId?: string; ok?: boolean; id?: string }>(path, { method, json });
      setToast(message);

      const targetStoreId = res?.storeId || res?.id || (json as Record<string, unknown>)?.storeId || selectedId;

      if (targetStoreId && files) {
        const logo = files instanceof File ? files : files.logo || files.photo;
        const banner = files instanceof File ? undefined : files.banner;

        if (logo) {
          const fd = new FormData();
          fd.set("storeId", String(targetStoreId));
          fd.set("kind", "logo");
          fd.set("file", logo);
          try {
            await apiFetch("/api/media", { method: "POST", body: fd });
            setToast(message + " · Logo uploaded");
          } catch (photoErr) {
            setError(photoErr instanceof Error ? photoErr.message : "Logo upload failed.");
          }
        }

        if (banner) {
          const fd = new FormData();
          fd.set("storeId", String(targetStoreId));
          fd.set("kind", "banner");
          fd.set("file", banner);
          try {
            await apiFetch("/api/media", { method: "POST", body: fd });
            setToast(message + " · Banner uploaded");
          } catch (bannerErr) {
            setError(bannerErr instanceof Error ? bannerErr.message : "Banner upload failed.");
          }
        }
      }

      await loadOverview();
      if (selectedId && ["products", "services", "offers"].includes(tab)) {
        const result = await apiFetch<{ items: Item[] }>(`/api/owner/catalog?resource=${tab}&storeId=${selectedId}`);
        setCatalog(result.items);
      }
      if (path === "/api/owner/reviews" && selectedId) {
        const result = await apiFetch<{ items: Item[]; pagination: Pagination }>(`/api/owner/reviews?storeId=${selectedId}&page=${reviewPage}&limit=20`);
        setStoreReviews(result.items);
        setReviewPagination(result.pagination);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    }
  }

  async function handleQuickSetupClinic() {
    try {
      setLoading(true);
      setError("");
      const healthCat = categories.find(
        (c) =>
          String(c.name).toLowerCase().includes("clinic") ||
          String(c.name).toLowerCase().includes("health") ||
          String(c.module) === "healthcare",
      ) || categories[0] || { id: "category-05" };

      await apiFetch<{ storeId: string; ok: boolean }>("/api/owner/stores", {
        method: "POST",
        json: {
          name: user.name ? `${user.name}'s Healthcare Clinic` : "City Health Clinic",
          businessType: "Local Physical Store / Business",
          categoryId: healthCat.id,
          address: "Main Market, Sector 14",
          city: "Your Locality",
          state: "State",
          country: "India",
          postalCode: "110001",
          phone: "+91 98765 43210",
          whatsapp: "+91 98765 43210",
          email: user.email || "clinic@kynisto.in",
          description: "Verified community healthcare clinic providing OPD consultations, digital prescriptions, and live queue tracking.",
          businessHours: '{"monday":{"open":"09:00","close":"20:00"}}',
        },
      });

      try {
        sessionStorage.removeItem("kynisto_owner_dash_cache");
        localStorage.removeItem("kynisto_owner_dash_cache");
      } catch {}

      setToast("🎉 Healthcare clinic created and activated!");
      await loadOverview();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set up clinic.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleStoreStatus(targetStoreId?: string, currentStatus?: string) {
    const storeIdToToggle = targetStoreId || selected?.id;
    if (!storeIdToToggle) return;

    const current = currentStatus || (stores.find(s => String(s.id) === String(storeIdToToggle))?.status) || "active";
    const newStatus = current === "closed" ? "active" : "closed";

    // Optimistic state update
    setStores((prev) =>
      prev.map((s) => (String(s.id) === String(storeIdToToggle) ? { ...s, status: newStatus } : s))
    );

    try {
      const res = await apiFetch<{ ok?: boolean; status?: string }>("/api/owner/stores", {
        method: "PATCH",
        json: { action: "toggle_status", storeId: String(storeIdToToggle), status: newStatus },
      });
      const finalStatus = res?.status || newStatus;
      setToast(finalStatus === "closed" ? "🔴 Shop is now CLOSED for customers" : "🟢 Shop is now OPEN for business!");
      void loadOverview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update shop status");
      void loadOverview();
    }
  }

  if (loading) return <div className="portalSkeleton"><span /><span /><span /><span /></div>;
  if (tabLoading && !["overview", "profile", "reviews", "subscription", "healthcare", "chat", "memberships", "loyalty"].includes(tab)) return <div className="tabSkeleton"><span /><span /><span /></div>;
  if (tab === "chat") return <ChatCenter user={user} />;
  if (tab === "subscription") return <UserSubscriptionDashboard />;
  const title = tab === "overview" ? "Business overview" : tab === "subscription" ? "Premium & Plans" : tab === "healthcare" ? "Healthcare" : tab.charAt(0).toUpperCase()+tab.slice(1);
  return (
    <>
      <SubscriptionExpiryBanner />
      <div className="portalTitleRow" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <span className="portalEyebrow">Store owner workspace</span>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.2rem 0" }}>{title}</h1>
          <p style={{ color: "var(--muted, #64748b)", margin: 0 }}>Only businesses assigned to this account are available here.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <RoleSwitcherButton currentRole={user.role} />
          {selected && (
            <button
              type="button"
              onClick={() => toggleStoreStatus(String(selected.id), String(selected.status ?? "active"))}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "9999px",
                border: String(selected.status) === "closed" ? "1.5px solid #ef4444" : "1.5px solid #10b981",
                background: String(selected.status) === "closed" ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                color: String(selected.status) === "closed" ? "#dc2626" : "#059669",
                fontWeight: 800,
                fontSize: "0.95rem",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
              }}
              title="Click to toggle shop open or closed status for customers"
            >
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: String(selected.status) === "closed" ? "#ef4444" : "#10b981",
                  boxShadow: String(selected.status) === "closed" ? "0 0 10px #ef4444" : "0 0 10px #10b981",
                }}
              />
              {String(selected.status) === "closed" ? "🔴 Shop Closed (Click to Open)" : "🟢 Shop Open (Click to Close)"}
            </button>
          )}
          {stores.length > 1 && (
            <select value={String(selected?.id ?? "")} onChange={(e) => setSelectedId(e.target.value)} style={{ padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid #cbd5e1", background: "var(--cream, #f8fafc)", fontWeight: 600 }}>
              {stores.map((store) => (
                <option key={String(store.id)} value={String(store.id)}>{store.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error && <p className="authError" role="alert">{error}</p>}

      {stores.length === 0 ? (
        ["notifications", "settings", "support", "subscription"].includes(tab) ? (
          tab === "subscription" ? <UserSubscriptionDashboard /> : <OwnerWorkspacePanel key={tab} view={tab as any} storeId="" onToast={setToast} onError={setError} />
        ) : (
          <section className="portalCard">
            <div className="portalCardHeader" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2>Create your first business listing</h2>
                <small>Set up your shop or clinic to unlock Live Queue, Prescriptions, Orders, and Services.</small>
              </div>
              <button
                type="button"
                onClick={() => void handleQuickSetupClinic()}
                style={{
                  background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)",
                  color: "#ffffff",
                  padding: "0.65rem 1.25rem",
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(5, 150, 105, 0.25)",
                }}
              >
                ⚡ 1-Click Quick Setup Clinic & Store
              </button>
            </div>
            <OwnerStoreEditor categories={categories} onSubmit={(body, files) => mutate("/api/owner/stores", "POST", body, "Business submitted for approval", files)} />
          </section>
        )
      ) : (
        <>
          {tab === "overview" && <OwnerOverview store={selected} analytics={analytics} reviews={reviews} />}
          {tab === "profile" && selected && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <OwnerStoreQRCard
                store={{
                  id: String(selected.id),
                  name: String(selected.name ?? ""),
                  slug: String(selected.slug ?? ""),
                  address: String(selected.address ?? ""),
                  city: String(selected.city ?? ""),
                  category: String(selected.category ?? ""),
                  logoUrl: selected.logoUrl ? String(selected.logoUrl) : null,
                  viewCount: Number(selected.viewCount ?? 0)
                }}
              />
              <section className="portalCard">
                <div className="portalCardHeader">
                  <h2>Edit business profile</h2>
                  <Status value={selected.status} />
                </div>
                <OwnerStoreEditor categories={categories} store={selected} onSubmit={(body, files) => mutate("/api/owner/stores", "PATCH", { ...(body as object), storeId: selected.id }, "Business profile updated", files)} />
                {selected.status !== "approved" && (
                  <div className="ownerDangerZone">
                    <p><b>Remove listing</b><small>Pending or rejected listings can be deleted by their owner.</small></p>
                    <button className="portalButton danger" type="button" onClick={() => { if (window.confirm("Delete this business listing?")) void mutate("/api/owner/stores", "DELETE", { storeId: selected.id }, "Business deleted"); }}>Delete listing</button>
                  </div>
                )}
              </section>
            </div>
          )}
          {tab === "media" && selected && <MediaPanel store={selected} items={media} onChanged={async () => { const result = await apiFetch<{ items: Item[] }>(`/api/media?storeId=${selected.id}`); setMedia(result.items); setToast("Media updated"); }} onError={setError} />}
          {["products", "services"].includes(tab) && selected && <CatalogPanel resource={tab as "products" | "services"} storeId={String(selected.id)} items={catalog} mutate={mutate} onChanged={async (message) => { const result = await apiFetch<{ items: Item[] }>(`/api/owner/catalog?resource=${tab}&storeId=${selected.id}`); setCatalog(result.items); setToast(message); }} onError={setError} />}
          {tab === "offers" && selected && (
            <SubscriptionGate
              plan={subPlan}
              isUnlocked={true}
              feature="allowPromotions"
              featureName="Store Offers & Promotional Broadcasts"
              includedPlans={["PRO", "ENTERPRISE"]}
              priceTag="From ₹499/month"
              description="This feature isn't included in your current subscription. Upgrade your plan to unlock promotional broadcasts, deal banners, and featured store placement."
              benefits={[
                "Broadcast Promotions to Nearby Customers",
                "Create Special Promotional Deals",
                "Featured Store Banner Placement",
                "High-Visibility Search Boosting",
              ]}
            >
              <CatalogPanel resource="offers" storeId={String(selected.id)} items={catalog} mutate={mutate} onChanged={async (message) => { const result = await apiFetch<{ items: Item[] }>(`/api/owner/catalog?resource=offers&storeId=${selected.id}`); setCatalog(result.items); setToast(message); }} onError={setError} />
            </SubscriptionGate>
          )}
          {tab === "memberships" && selected && (
            <SubscriptionGate
              plan={subPlan}
              isUnlocked={true}
              feature="allowCustomBranding"
              featureName="Membership & Customer Loyalty Plans"
              includedPlans={["PRO", "ENTERPRISE"]}
              priceTag="From ₹499/month"
              description="This feature isn't included in your current subscription. Upgrade your plan to unlock store membership passes, customer loyalty cards, and recurring benefits."
              benefits={[
                "Create Custom Store VIP Memberships",
                "Issue Digital Customer Loyalty Passes",
                "Reward Tier Management",
                "Recurring Customer Analytics & Pass Tracking",
              ]}
            >
              <OwnerMembershipEditor storeId={String(selected.id)} />
            </SubscriptionGate>
          )}
          {tab === "loyalty" && selected && <OwnerLoyaltyManager storeId={String(selected.id)} />}
          {tab === "reviews" && selected && <ReviewsPanel items={storeReviews} storeId={String(selected.id)} mutate={mutate} pagination={reviewPagination} onPageChange={setReviewPage} />}
          {tab === "healthcare" && selected && (
            <OwnerHealthcarePanel storeId={String(selected.id)} />
          )}
          {tab === "analytics" && (
            <SubscriptionGate
              plan={subPlan}
              isUnlocked={true}
              feature="allowAnalytics"
              featureName="Advanced Store Analytics & Footfall Insights"
              includedPlans={["STARTER", "PRO", "ENTERPRISE"]}
              priceTag="From ₹299/month"
              description="This feature isn't included in your current subscription. Upgrade your plan to unlock footfall analytics, customer view heatmaps, and performance trends."
              benefits={[
                "30-Day Store Views & Engagement Heatmap",
                "Direction Tap & Call Conversion Tracking",
                "Peak Customer Traffic Hours Analysis",
                "Exportable PDF & CSV Analytics Reports",
              ]}
            >
              <OwnerAnalytics items={analytics} />
            </SubscriptionGate>
          )}
          {isOwnerWorkspaceView(tab) && selected && (
            tab === "sales" ? (
              <SubscriptionGate
                plan={subPlan}
                isUnlocked={true}
                feature="allowAnalytics"
                featureName="Sales Analytics & Revenue Reports"
                includedPlans={["STARTER", "PRO", "ENTERPRISE"]}
                priceTag="From ₹299/month"
                description="This feature isn't included in your current subscription. Upgrade your plan to unlock revenue graphs, order breakdown, and delivered sales metrics."
                benefits={[
                  "Delivered Revenue & Order Value Insights",
                  "Product Sales Ranking",
                  "Customer Order History Graphs",
                  "Financial Reporting",
                ]}
              >
                <OwnerWorkspacePanel key={tab + "-" + String(selected.id)} view={tab} storeId={String(selected.id)} onToast={setToast} onError={setError} />
              </SubscriptionGate>
            ) : tab === "coupons" ? (
              <SubscriptionGate
                plan={subPlan}
                isUnlocked={true}
                feature="allowPromotions"
                featureName="Customer Discount Coupons"
                includedPlans={["PRO", "ENTERPRISE"]}
                priceTag="From ₹499/month"
                description="This feature isn't included in your current subscription. Upgrade your plan to unlock custom store promo codes, discount coupons, and redemption limits."
                benefits={[
                  "Create Custom Discount Codes & Coupons",
                  "Percentage & Fixed Amount Off Rules",
                  "Minimum Order Value & Usage Limits",
                  "Real-time Coupon Redemption Tracking",
                ]}
              >
                <OwnerWorkspacePanel key={tab + "-" + String(selected.id)} view={tab} storeId={String(selected.id)} onToast={setToast} onError={setError} />
              </SubscriptionGate>
            ) : (
              <OwnerWorkspacePanel key={tab + "-" + String(selected.id)} view={tab} storeId={String(selected.id)} onToast={setToast} onError={setError} />
            )
          )}
        </>
      )}

      {toast && <div className="portalToast" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><CheckCircle2 size={18} /> {toast}</div>}
    </>
  );
}

function OwnerOverview({ store, analytics, reviews }: { store: Store | undefined; analytics: Item[]; reviews: Item[] }) {
  const totals = Object.fromEntries(analytics.map((item) => [String(item.eventType), Number(item.total)]));
  return (
    <>
      <div className="statsGrid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        <article className="statCard" style={{ background: "rgba(30, 58, 138, 0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transform: "translateZ(0)" }}>
          <Eye size={28} color="#3b82f6" style={{ marginBottom: "0.75rem" }} />
          <small style={{ color: "var(--muted, #475569)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Profile views</small>
          <strong style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--ink, #0f172a)", lineHeight: 1, marginTop: "0.5rem" }}>{Number(store?.viewCount ?? 0).toLocaleString()}</strong>
        </article>
        <article className="statCard" style={{ background: "rgba(113, 63, 18, 0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(234, 179, 8, 0.3)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transform: "translateZ(0)" }}>
          <Star size={28} color="#eab308" style={{ marginBottom: "0.75rem" }} />
          <small style={{ color: "var(--muted, #475569)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Average rating</small>
          <strong style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--ink, #0f172a)", lineHeight: 1, marginTop: "0.5rem" }}>{Number(store?.rating ?? 0).toFixed(1)}</strong>
        </article>
        <article className="statCard" style={{ background: "rgba(20, 83, 45, 0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transform: "translateZ(0)" }}>
          <Navigation size={28} color="#22c55e" style={{ marginBottom: "0.75rem" }} />
          <small style={{ color: "var(--muted, #475569)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Direction taps</small>
          <strong style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--ink, #0f172a)", lineHeight: 1, marginTop: "0.5rem" }}>{totals.direction ?? 0}</strong>
        </article>
        <article className="statCard" style={{ background: "rgba(76, 29, 149, 0.08)", backdropFilter: "blur(12px)", border: "1px solid rgba(139, 92, 246, 0.3)", padding: "1.5rem", borderRadius: "20px", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", transform: "translateZ(0)" }}>
          <Phone size={28} color="#8b5cf6" style={{ marginBottom: "0.75rem" }} />
          <small style={{ color: "var(--muted, #475569)", fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact actions</small>
          <strong style={{ fontSize: "2.5rem", fontWeight: 900, color: "var(--ink, #0f172a)", lineHeight: 1, marginTop: "0.5rem" }}>{(totals.phone ?? 0) + (totals.whatsapp ?? 0)}</strong>
        </article>
      </div>

      {store && (
        <OwnerStoreQRCard 
          store={{
            id: String(store.id),
            name: String(store.name ?? ""),
            slug: String(store.slug ?? ""),
            address: String(store.address ?? ""),
            city: String(store.city ?? ""),
            category: String(store.category ?? ""),
            logoUrl: store.logoUrl ? String(store.logoUrl) : null,
            viewCount: Number(store.viewCount ?? 0)
          }} 
        />
      )}

      <div className="portalGrid" style={{ marginTop: "1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <section className="portalCard" style={{ padding: "2rem", borderRadius: "20px", background: "var(--paper, #ffffff)", border: "1px solid var(--line, #e2e8f0)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <div className="portalCardHeader" style={{ borderBottom: "1px solid var(--line, #f1f5f9)", paddingBottom: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>{store?.name}</h2>
            <Status value={store?.status} />
          </div>
          <div className="ownerProfileSummary" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem", padding: "1rem", background: "var(--cream, #f8fafc)", borderRadius: "12px", border: "1px solid var(--line, #f1f5f9)" }}>
              <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem", width: "80px", fontWeight: 600 }}>Address</span>
              <b style={{ color: "var(--ink, #0f172a)", fontSize: "0.95rem" }}>{store?.address}</b>
            </div>
            <div style={{ display: "flex", gap: "1rem", padding: "1rem", background: "var(--cream, #f8fafc)", borderRadius: "12px", border: "1px solid var(--line, #f1f5f9)" }}>
              <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem", width: "80px", fontWeight: 600 }}>Category</span>
              <b style={{ color: "var(--ink, #0f172a)", fontSize: "0.95rem" }}>{store?.category}</b>
            </div>
            <div style={{ display: "flex", gap: "1rem", padding: "1rem", background: "var(--cream, #f8fafc)", borderRadius: "12px", border: "1px solid var(--line, #f1f5f9)" }}>
              <span style={{ color: "var(--muted, #64748b)", fontSize: "0.85rem", width: "80px", fontWeight: 600 }}>Contact</span>
              <b style={{ color: "var(--ink, #0f172a)", fontSize: "0.95rem" }}>{store?.phone ?? "Not added"}</b>
            </div>
            {store?.rejectionReason && (
              <div className="authError" style={{ padding: "1rem", background: "#fef2f2", borderRadius: "12px", border: "1px solid #fecaca", marginTop: "0.5rem" }}>
                <small style={{ color: "#991b1b", fontWeight: 700, display: "block" }}>Admin note</small>
                <b style={{ color: "#7f1d1d" }}>{store.rejectionReason}</b>
              </div>
            )}
          </div>
        </section>

        <section className="portalCard" style={{ padding: "2rem", borderRadius: "20px", background: "var(--paper, #ffffff)", border: "1px solid var(--line, #e2e8f0)", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
          <div className="portalCardHeader" style={{ borderBottom: "1px solid var(--line, #f1f5f9)", paddingBottom: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.35rem", fontWeight: 800 }}>Recent reviews</h2>
            <small style={{ color: "var(--muted, #64748b)", fontWeight: 600 }}>{reviews.length} shown</small>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {reviews.slice(0, 5).map((review) => (
              <div className="reviewLine" key={String(review.id)} style={{ padding: "1.25rem", border: "1px solid var(--line, #f1f5f9)", borderRadius: "14px", background: "var(--cream, #f8fafc)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#eab308", fontWeight: 800, marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  <Star size={16} fill="currentColor" /> {review.rating}
                </div>
                <p style={{ margin: 0 }}>
                  <b style={{ display: "block", color: "var(--ink, #0f172a)", fontSize: "1rem", marginBottom: "0.2rem" }}>{review.reviewerName}</b>
                  <small style={{ color: "var(--muted, #475569)", fontSize: "0.9rem" }}>{review.comment}</small>
                </p>
              </div>
            ))}
            {reviews.length === 0 && <p style={{ color: "var(--muted, #64748b)", textAlign: "center", padding: "2rem 0" }}>No reviews yet.</p>}
          </div>
        </section>
      </div>
    </>
  );
}

function MediaPanel({store,items,onChanged,onError}:{store:Store;items:Item[];onChanged:()=>Promise<void>;onError:(v:string)=>void}){async function upload(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);form.set("storeId",String(store.id));try{await apiFetch("/api/media",{method:"POST",body:form});event.currentTarget.reset();await onChanged()}catch(e){onError(e instanceof Error?e.message:"Upload failed")}}return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Upload brand media</h2><small>JPEG, PNG, WebP or AVIF · max 8 MB</small></div><form className="portalForm" onSubmit={upload}><label>Image type<select name="kind"><option value="logo">Logo</option><option value="banner">Banner</option><option value="gallery">Gallery image</option></select></label><label>Image<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required /></label><label className="full">Alt text<input name="altText" placeholder="Describe the image for accessibility" /></label><div className="formActions"><button className="portalButton" type="submit">Upload image</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><h2>Media library</h2><small>{items.length} images</small></div><div className="mediaGrid">{items.map((item)=><article key={String(item.id)}><img src={String(item.url)} alt={String(item.altText??"")} loading="lazy"/><small>{item.kind}</small><button onClick={async()=>{await apiFetch("/api/media",{method:"DELETE",json:{imageId:item.id,storeId:store.id}});await onChanged()}}>Delete</button></article>)}</div></section></div>}

function CatalogPanel({resource,storeId,items,mutate,onChanged,onError}:{resource:"products"|"services"|"offers";storeId:string;items:Item[];mutate:(p:string,m:string,j:unknown,s:string)=>Promise<void>;onChanged:(message:string)=>Promise<void>;onError:(message:string)=>void}){
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const form=event.currentTarget;
    const formData=new FormData(form);
    const media=formData.getAll("media").filter((value):value is File=>value instanceof File&&value.size>0);
    formData.delete("media");
    const values=Object.fromEntries(formData);
    if(resource==="offers"){
      await mutate("/api/owner/catalog","POST",{...values,resource,storeId},"Offer added");
      form.reset();
      return;
    }
    onError("");
    let itemId="";
    try{
      const created=await apiFetch<{id:string}>("/api/owner/catalog",{method:"POST",json:{...values,resource,storeId}});
      itemId=created.id;
      for(const [index,file] of media.entries()){
        const upload=new FormData();
        upload.set("ownerType",resource==="products"?"product":"service");
        upload.set("itemId",itemId);upload.set("storeId",storeId);
        upload.set("altText",String(values.name??resource.slice(0,-1)));
        upload.set("featured",index===0&&file.type.startsWith("image/")?"true":"false");
        upload.set("file",file);
        await apiFetch("/api/catalog-media",{method:"POST",body:upload});
      }
      form.reset();
      await onChanged(`${resource==="products"?"Product":"Service"}${media.length?` with ${media.length} media item${media.length===1?"":"s"}`:""} added`);
    }catch(error){
      if(itemId)await onChanged(`${resource==="products"?"Product":"Service"} added; some media needs attention`);
      onError(itemId?`The item was saved, but media upload stopped: ${error instanceof Error?error.message:"Upload failed."}`:error instanceof Error?error.message:"Item could not be added.");
    }
  }
  function edit(item:Item){
    const currentName=String(item.name??item.title??"");
    const name=window.prompt(resource==="offers"?"Offer title":"Name",currentName);
    if(!name)return;
    const description=window.prompt("Description",String(item.description??""))??String(item.description??"");
    const common={resource,storeId,id:item.id,description,status:item.status??"active"};
    if(resource==="offers")void mutate("/api/owner/catalog","PATCH",{...common,title:name,code:item.code??""},"Offer updated");
    else if(resource==="products")void mutate("/api/owner/catalog","PATCH",{...common,name,price:item.price??""},"Product updated");
    else void mutate("/api/owner/catalog","PATCH",{...common,name,priceFrom:item.price_from??item.priceFrom??"",durationMinutes:item.duration_minutes??item.durationMinutes??""},"Service updated");
  }
  return <div className="portalGrid"><section className="portalCard"><div className="portalCardHeader"><h2>Add {resource.slice(0,-1)}</h2></div><form className="portalForm" onSubmit={submit}>{resource==="offers"?<><label className="full">Offer title<input name="title" required /></label><label>Offer code<input name="code" /></label></>:<><label className="full">Name<input name="name" required /></label><label>{resource==="products"?"Price":"Starting price"}<input name={resource==="products"?"price":"priceFrom"} type="number" min="0" step=".01" /></label>{resource==="services"&&<label>Duration (minutes)<input name="durationMinutes" type="number" min="1" /></label>}</>}<label className="full">Description<textarea name="description" /></label>{resource!=="offers"&&<label className="full">Images and videos <small>Optional · choose multiple · images 8 MB, videos 40 MB each</small><input name="media" type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime" /></label>}<div className="formActions"><button className="portalButton" type="submit">Add to store</button></div></form></section><section className="portalCard"><div className="portalCardHeader"><h2>Current {resource}</h2><small>{items.length} items</small></div>{items.map((item)=><div className={`catalogLine ${resource!=="offers"?"catalogProductLine":""}`} key={String(item.id)}><p><b>{item.name??item.title}</b><small>{item.description}</small></p><span>{item.price??item.price_from??item.priceFrom?`₹${item.price??item.price_from??item.priceFrom}`:item.code??""}</span>{resource!=="offers"&&<CatalogMediaControl ownerType={resource==="products"?"product":"service"} itemId={String(item.id)} storeId={storeId} itemName={String(item.name??resource.slice(0,-1))} onChanged={onChanged}/>}<div className="tableActions"><button onClick={()=>edit(item)}>Edit</button><button onClick={()=>void mutate("/api/owner/catalog","DELETE",{resource,storeId,id:item.id},"Item deleted")}>Delete</button></div></div>)}</section></div>
}

function ReviewsPanel({items,storeId,mutate,pagination,onPageChange}:{items:Item[];storeId:string;mutate:(p:string,m:string,j:unknown,s:string)=>Promise<void>;pagination:Pagination;onPageChange:(page:number)=>void}){return <section className="portalCard"><div className="portalCardHeader"><h2>Customer reviews</h2><small>{pagination.total} total · Reply professionally to public feedback</small></div>{items.length?items.map((item)=><article className="ownerReview" key={String(item.id)}><div><Status value={item.status}/><b><Star size={14} style={{display:"inline",marginRight:"4px"}} /> {item.rating} · {item.reviewerName}</b><p>{item.comment}</p>{item.ownerReply&&<small>Your reply: {item.ownerReply}</small>}</div><form onSubmit={(event)=>{event.preventDefault();const reply=new FormData(event.currentTarget).get("reply");void mutate("/api/owner/reviews","PATCH",{storeId,reviewId:item.id,reply},"Reply published")}}><input name="reply" defaultValue={String(item.ownerReply??"")} placeholder="Write a public reply" required/><button className="portalButton secondary" type="submit">Reply</button></form></article>):<p className="profileEmpty">No customer reviews for this store yet.</p>}{pagination.totalPages>1&&<div className="tableActions reviewPagination"><button type="button" disabled={pagination.page<=1} onClick={()=>onPageChange(pagination.page-1)}>Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={pagination.page>=pagination.totalPages} onClick={()=>onPageChange(pagination.page+1)}>Next</button></div>}</section>}

function OwnerAnalytics({items}:{items:Item[]}){const eventTypes=[...new Set(items.map((item)=>String(item.eventType)))];return <section className="portalCard"><div className="portalCardHeader"><h2>30-day engagement</h2><small>Views and customer actions</small></div><div className="statsGrid">{eventTypes.map((type)=><article className="statCard" key={type}><BarChart2 size={24} color="var(--muted, #64748b)" style={{marginBottom:"0.5rem"}} /><small>{type}</small><strong>{items.filter((item)=>item.eventType===type).reduce((sum,item)=>sum+Number(item.total),0)}</strong></article>)}</div><div className="analyticsLegend">{items.slice(-20).map((item,index)=><span key={`${item.day}-${item.eventType}-${index}`}><b>{item.day}</b>{item.eventType}: {item.total}</span>)}</div></section>}
