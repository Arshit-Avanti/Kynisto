"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Tag,
  Package,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  Flame,
  Star,
  Award,
  Zap,
  TrendingUp,
  ShieldCheck,
  Megaphone,
  BarChart3,
  Users,
  CreditCard,
  Layers,
  DollarSign,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { MarketplaceFeature, MarketplaceCombo } from "@/lib/subscriptions";

const BADGE_PRESETS = [
  { label: "🔥 Best Seller", value: "Best Seller" },
  { label: "⭐ Best Value", value: "Best Value" },
  { label: "⚡ Most Popular", value: "Most Popular" },
  { label: "👑 Recommended", value: "Recommended" },
  { label: "🚀 New Release", value: "New" },
  { label: "⏳ Coming Soon", value: "Coming Soon" },
  { label: "💯 All-In-One", value: "ALL-IN-ONE" },
];

const CATEGORY_PRESETS = [
  "Queue & Operations",
  "Branding & Trust",
  "Marketing",
  "Insights",
  "Visibility",
  "Customer Retention",
  "VIP Pass",
  "General",
];

export function AdminMarketplaceControlCenter() {
  const [features, setFeatures] = useState<MarketplaceFeature[]>([]);
  const [combos, setCombos] = useState<MarketplaceCombo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"features" | "combos">("features");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "coming_soon" | "inactive">("all");
  const [badgeFilter, setBadgeFilter] = useState("all");

  // Modal State for Create/Edit Feature
  const [featureModal, setFeatureModal] = useState<{
    open: boolean;
    item?: MarketplaceFeature;
  }>({ open: false });

  // Modal State for Create/Edit Combo Pack
  const [comboModal, setComboModal] = useState<{
    open: boolean;
    item?: MarketplaceCombo;
  }>({ open: false });

  const [busy, setBusy] = useState(false);

  const fetchMarketplaceData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/subscriptions/marketplace");
      if (!res.ok) throw new Error("Failed to load marketplace items from D1.");
      const data = await res.json();
      setFeatures(data.features || []);
      setCombos(data.combos || []);
    } catch (err: any) {
      setError(err.message || "Failed to load marketplace control center.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketplaceData();
  }, [fetchMarketplaceData]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Quick Status Toggle
  const handleToggleStatus = async (item: MarketplaceFeature | MarketplaceCombo, type: "feature" | "combo") => {
    setBusy(true);
    try {
      const newActive = !item.isActive;
      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type,
          name: item.name,
          isActive: newActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle status");
      setToast(`Updated "${item.name}" status to ${newActive ? "Active" : "Inactive"}`);
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Failed to update item status");
    } finally {
      setBusy(false);
    }
  };

  // Quick Badge Update
  const handleQuickBadge = async (item: MarketplaceFeature | MarketplaceCombo, type: "feature" | "combo", newBadge: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          type,
          name: item.name,
          badge: newBadge,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update badge");
      setToast(`Badge set to "${newBadge || "None"}" for "${item.name}"`);
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Failed to update badge");
    } finally {
      setBusy(false);
    }
  };

  // Delete Item
  const handleDeleteItem = async (id: string, name: string, type: "feature" | "combo") => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from D1 marketplace?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/marketplace?id=${id}&type=${type}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");
      setToast(`Deleted "${name}" from marketplace`);
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Failed to delete marketplace item");
    } finally {
      setBusy(false);
    }
  };

  // Save Feature
  const handleSaveFeature = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const description = formData.get("description") as string;
      const price = Number(formData.get("price")) || 0;
      const originalPrice = Number(formData.get("originalPrice")) || 0;
      const category = formData.get("category") as string;
      const badge = formData.get("badge") as string;
      const icon = formData.get("icon") as string;
      const isActive = formData.get("isActive") === "true";

      const payload = {
        id: featureModal.item?.id,
        type: "feature",
        name,
        slug,
        description,
        price,
        originalPrice,
        category,
        badge,
        icon,
        isActive,
      };

      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save feature");

      setToast(`Successfully saved feature "${name}" in D1`);
      setFeatureModal({ open: false });
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Save feature error");
    } finally {
      setBusy(false);
    }
  };

  // Save Combo Pack
  const handleSaveCombo = async (e: React.FormEvent<HTMLFormElement>, selectedFeatures: string[]) => {
    e.preventDefault();
    setBusy(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const slug = (formData.get("slug") as string) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const description = formData.get("description") as string;
      const price = Number(formData.get("price")) || 0;
      const originalPrice = Number(formData.get("originalPrice")) || 0;
      const badge = formData.get("badge") as string;
      const isActive = formData.get("isActive") === "true";

      const payload = {
        id: comboModal.item?.id,
        type: "combo",
        name,
        slug,
        description,
        price,
        originalPrice,
        features: selectedFeatures,
        badge,
        isActive,
      };

      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save combo pack");

      setToast(`Successfully saved combo pack "${name}" in D1`);
      setComboModal({ open: false });
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Save combo pack error");
    } finally {
      setBusy(false);
    }
  };

  // Filtered Lists
  const filteredFeatures = useMemo(() => {
    return features.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.isActive
          : statusFilter === "coming_soon"
          ? item.badge?.toLowerCase().includes("coming")
          : !item.isActive;

      const matchesBadge =
        badgeFilter === "all"
          ? true
          : badgeFilter === "none"
          ? !item.badge
          : item.badge?.toLowerCase() === badgeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesBadge;
    });
  }, [features, searchQuery, statusFilter, badgeFilter]);

  const filteredCombos = useMemo(() => {
    return combos.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.isActive
          : statusFilter === "coming_soon"
          ? item.badge?.toLowerCase().includes("coming")
          : !item.isActive;

      const matchesBadge =
        badgeFilter === "all"
          ? true
          : badgeFilter === "none"
          ? !item.badge
          : item.badge?.toLowerCase() === badgeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesBadge;
    });
  }, [combos, searchQuery, statusFilter, badgeFilter]);

  // Statistics
  const totalFeatures = features.length;
  const activeFeaturesCount = features.filter((f) => f.isActive).length;
  const totalCombos = combos.length;
  const activeCombosCount = combos.filter((c) => c.isActive).length;
  const bestSellersCount = [...features, ...combos].filter((i) => i.badge?.toLowerCase().includes("seller")).length;
  const bestValuesCount = [...features, ...combos].filter((i) => i.badge?.toLowerCase().includes("value")).length;

  return (
    <div style={{ padding: "10px 0" }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "24px",
            right: "24px",
            zIndex: 99999,
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#FFF",
            padding: "14px 24px",
            borderRadius: "16px",
            fontWeight: 800,
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(16,185,129,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Sparkles size={18} /> {toast}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid #EF4444",
            color: "#EF4444",
            padding: "14px 20px",
            borderRadius: "14px",
            marginBottom: "24px",
            fontWeight: 700,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            style={{ background: "transparent", border: "none", color: "#EF4444", fontWeight: 900, cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header & KPI Summary */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.95) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "24px",
          padding: "28px",
          marginBottom: "32px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(34,197,94,0.15)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.3)", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>
              <Sparkles size={14} /> D1 Database Control Center
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", margin: "10px 0 6px", letterSpacing: "-0.5px" }}>
              Subscription Marketplace Control Center
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0, maxWidth: "700px" }}>
              Manage individual subscription features, edit prices, set Best Seller / Best Value badges, toggle Active or Coming Soon status, and bundle high-margin Combo Packs dynamically from D1 without hardcoded values.
            </p>
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFeatureModal({ open: true })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                color: "#FFF",
                fontWeight: 800,
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(34,197,94,0.3)",
              }}
            >
              <Plus size={18} /> Create New Feature
            </button>

            <button
              type="button"
              onClick={() => setComboModal({ open: true })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 20px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                color: "#000",
                fontWeight: 900,
                fontSize: "14px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(245,158,11,0.3)",
              }}
            >
              <Package size={18} /> Create Combo Pack
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "24px" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>Total Features</div>
            <div style={{ color: "#FFF", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>{totalFeatures}</div>
            <div style={{ color: "#22C55E", fontSize: "12px", fontWeight: 700 }}>{activeFeaturesCount} Active in D1</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>Combo Packs</div>
            <div style={{ color: "#F59E0B", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>{totalCombos}</div>
            <div style={{ color: "#F59E0B", fontSize: "12px", fontWeight: 700 }}>{activeCombosCount} Active Bundles</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>🔥 Best Sellers</div>
            <div style={{ color: "#EF4444", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>{bestSellersCount}</div>
            <div style={{ color: "#EF4444", fontSize: "12px", fontWeight: 700 }}>Badged High Conversion</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>⭐ Best Values</div>
            <div style={{ color: "#3B82F6", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>{bestValuesCount}</div>
            <div style={{ color: "#3B82F6", fontSize: "12px", fontWeight: 700 }}>Badged Recommended</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation (Features vs Combo Packs) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px", background: "rgba(15,23,42,0.8)", padding: "6px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            type="button"
            onClick={() => setActiveTab("features")}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "14px",
              border: "none",
              background: activeTab === "features" ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" : "transparent",
              color: activeTab === "features" ? "#FFF" : "#94A3B8",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Tag size={16} /> Individual Features ({features.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("combos")}
            style={{
              padding: "10px 24px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "14px",
              border: "none",
              background: activeTab === "combos" ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" : "transparent",
              color: activeTab === "combos" ? "#000" : "#94A3B8",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Package size={16} /> Combo Packs &amp; Bundles ({combos.length})
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: "220px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, description..."
              style={{
                width: "100%",
                padding: "9px 12px 9px 36px",
                borderRadius: "12px",
                background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "#FFF",
                fontSize: "13px",
              }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: "9px 14px",
              borderRadius: "12px",
              background: "#1E293B",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#FFF",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="coming_soon">Coming Soon</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Badge Filter */}
          <select
            value={badgeFilter}
            onChange={(e) => setBadgeFilter(e.target.value)}
            style={{
              padding: "9px 14px",
              borderRadius: "12px",
              background: "#1E293B",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#FFF",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <option value="all">All Badges</option>
            <option value="Best Seller">🔥 Best Seller</option>
            <option value="Best Value">⭐ Best Value</option>
            <option value="Most Popular">⚡ Most Popular</option>
            <option value="Recommended">👑 Recommended</option>
            <option value="none">No Badge</option>
          </select>
        </div>
      </div>

      {/* TAB CONTENT: FEATURES */}
      {activeTab === "features" && (
        <>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading D1 marketplace features...</div>
          ) : filteredFeatures.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", background: "rgba(15,23,42,0.8)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              No marketplace features found matching filters. Click "+ Create New Feature" above to add one.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {filteredFeatures.map((feat) => {
                const isBestSeller = feat.badge?.toLowerCase().includes("seller");
                const isBestValue = feat.badge?.toLowerCase().includes("value");
                const isComingSoon = feat.badge?.toLowerCase().includes("coming") || !feat.isActive;

                return (
                  <div
                    key={feat.id}
                    style={{
                      background: "rgba(15,23,42,0.92)",
                      border: isBestSeller
                        ? "2px solid #EF4444"
                        : isBestValue
                        ? "2px solid #3B82F6"
                        : "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "20px",
                      padding: "24px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: isBestSeller ? "0 8px 24px rgba(239,68,68,0.2)" : "0 8px 24px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Badge Tag */}
                    {feat.badge && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          right: "20px",
                          background: isBestSeller ? "#EF4444" : isBestValue ? "#3B82F6" : "#22C55E",
                          color: "#FFF",
                          fontSize: "11px",
                          fontWeight: 900,
                          padding: "3px 12px",
                          borderRadius: "12px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {feat.badge}
                      </span>
                    )}

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <span style={{ fontSize: "11px", color: "#60A5FA", fontWeight: 700, textTransform: "uppercase" }}>
                            {feat.category || "General"}
                          </span>
                          <h3 style={{ fontSize: "18px", fontWeight: 850, color: "#FFF", margin: "2px 0 0" }}>
                            {feat.name}
                          </h3>
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: feat.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            color: feat.isActive ? "#22C55E" : "#EF4444",
                            border: feat.isActive ? "1px solid #22C55E" : "1px solid #EF4444",
                          }}
                        >
                          {feat.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "1.5", marginBottom: "16px", minHeight: "38px" }}>
                        {feat.description}
                      </p>

                      {/* Pricing Display */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px", background: "rgba(255,255,255,0.03)", padding: "10px 14px", borderRadius: "12px" }}>
                        <span style={{ color: "#22C55E", fontSize: "24px", fontWeight: 900 }}>
                          ₹{feat.price}
                        </span>
                        <span style={{ color: "#94A3B8", fontSize: "12px" }}>/month</span>
                        {feat.originalPrice && feat.originalPrice > feat.price ? (
                          <span style={{ color: "#64748B", fontSize: "13px", textDecoration: "line-through", marginLeft: "auto" }}>
                            ₹{feat.originalPrice}
                          </span>
                        ) : null}
                      </div>

                      {/* Quick Badge Selector Dropdown */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", fontWeight: 700, marginBottom: "4px" }}>
                          Quick Badge Selector:
                        </label>
                        <select
                          value={feat.badge || ""}
                          onChange={(e) => handleQuickBadge(feat, "feature", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            background: "#0F172A",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#FFF",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          <option value="">No Badge</option>
                          <option value="Best Seller">🔥 Best Seller</option>
                          <option value="Best Value">⭐ Best Value</option>
                          <option value="Most Popular">⚡ Most Popular</option>
                          <option value="Recommended">👑 Recommended</option>
                          <option value="Coming Soon">⏳ Coming Soon</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(feat, "feature")}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "10px",
                          background: feat.isActive ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                          border: feat.isActive ? "1px solid #EF4444" : "1px solid #22C55E",
                          color: feat.isActive ? "#EF4444" : "#22C55E",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {feat.isActive ? "Disable" : "Enable"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setFeatureModal({ open: true, item: feat })}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          background: "rgba(59,130,246,0.15)",
                          border: "1px solid #3B82F6",
                          color: "#3B82F6",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(feat.id, feat.name, "feature")}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                        title="Delete Feature"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT: COMBO PACKS */}
      {activeTab === "combos" && (
        <>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading D1 combo packs...</div>
          ) : filteredCombos.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", background: "rgba(15,23,42,0.8)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              No combo packs found matching filters. Click "+ Create Combo Pack" above to build a bundle.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
              {filteredCombos.map((combo) => {
                const isBestSeller = combo.badge?.toLowerCase().includes("seller");
                const isBestValue = combo.badge?.toLowerCase().includes("value");

                return (
                  <div
                    key={combo.id}
                    style={{
                      background: "linear-gradient(180deg, rgba(245,158,11,0.12) 0%, rgba(15,23,42,0.96) 100%)",
                      border: isBestSeller
                        ? "2px solid #EF4444"
                        : isBestValue
                        ? "2px solid #3B82F6"
                        : "2px solid #F59E0B",
                      borderRadius: "22px",
                      padding: "24px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: "0 10px 30px rgba(245,158,11,0.15)",
                    }}
                  >
                    {/* Badge Tag */}
                    {combo.badge && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          right: "20px",
                          background: isBestSeller ? "#EF4444" : isBestValue ? "#3B82F6" : "#F59E0B",
                          color: isBestSeller || isBestValue ? "#FFF" : "#000",
                          fontSize: "11px",
                          fontWeight: 900,
                          padding: "4px 14px",
                          borderRadius: "12px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {combo.badge}
                      </span>
                    )}

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <span style={{ fontSize: "11px", color: "#F59E0B", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            COMBO PACK BUNDLE
                          </span>
                          <h3 style={{ fontSize: "20px", fontWeight: 850, color: "#FFF", margin: "2px 0 0" }}>
                            {combo.name}
                          </h3>
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: combo.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            color: combo.isActive ? "#22C55E" : "#EF4444",
                            border: combo.isActive ? "1px solid #22C55E" : "1px solid #EF4444",
                          }}
                        >
                          {combo.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <p style={{ color: "#CBD5E1", fontSize: "13px", lineHeight: "1.5", marginBottom: "16px" }}>
                        {combo.description}
                      </p>

                      {/* Pricing Display */}
                      <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px", background: "rgba(245,158,11,0.1)", padding: "10px 14px", borderRadius: "12px", border: "1px solid rgba(245,158,11,0.2)" }}>
                        <span style={{ color: "#F59E0B", fontSize: "26px", fontWeight: 900 }}>
                          ₹{combo.price}
                        </span>
                        <span style={{ color: "#94A3B8", fontSize: "12px" }}>/month bundle</span>
                        {combo.originalPrice && combo.originalPrice > combo.price ? (
                          <span style={{ color: "#64748B", fontSize: "13px", textDecoration: "line-through", marginLeft: "auto" }}>
                            ₹{combo.originalPrice}
                          </span>
                        ) : null}
                      </div>

                      {/* Included Features Checklist */}
                      <div style={{ marginBottom: "16px" }}>
                        <strong style={{ fontSize: "12px", color: "#F59E0B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          Bundled Features ({combo.features.length}):
                        </strong>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
                          {combo.features.map((slug, idx) => {
                            const matchingFeat = features.find((f) => f.slug === slug || f.id === slug);
                            return (
                              <span
                                key={idx}
                                style={{
                                  background: "rgba(255,255,255,0.06)",
                                  border: "1px solid rgba(255,255,255,0.12)",
                                  color: "#FFF",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "3px 10px",
                                  borderRadius: "8px",
                                }}
                              >
                                ✓ {matchingFeat ? matchingFeat.name : slug}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Badge Selector Dropdown */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", fontWeight: 700, marginBottom: "4px" }}>
                          Set Combo Badge:
                        </label>
                        <select
                          value={combo.badge || ""}
                          onChange={(e) => handleQuickBadge(combo, "combo", e.target.value)}
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: "8px",
                            background: "#0F172A",
                            border: "1px solid rgba(245,158,11,0.3)",
                            color: "#F59E0B",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          <option value="">No Badge</option>
                          <option value="Best Seller">🔥 Best Seller</option>
                          <option value="Best Value">⭐ Best Value</option>
                          <option value="Most Popular">⚡ Most Popular</option>
                          <option value="Recommended">👑 Recommended</option>
                          <option value="ALL-IN-ONE">💯 ALL-IN-ONE</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(combo, "combo")}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "10px",
                          background: combo.isActive ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                          border: combo.isActive ? "1px solid #EF4444" : "1px solid #22C55E",
                          color: combo.isActive ? "#EF4444" : "#22C55E",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {combo.isActive ? "Disable Combo" : "Enable Combo"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setComboModal({ open: true, item: combo })}
                        style={{
                          padding: "8px 14px",
                          borderRadius: "10px",
                          background: "rgba(245,158,11,0.2)",
                          border: "1px solid #F59E0B",
                          color: "#F59E0B",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Edit3 size={14} /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(combo.id, combo.name, "combo")}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                        title="Delete Combo Pack"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* CREATE / EDIT FEATURE MODAL */}
      {featureModal.open && (
        <div
          role="presentation"
          onMouseDown={(e) => e.currentTarget === e.target && setFeatureModal({ open: false })}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#1E293B",
              border: "1px solid rgba(34,197,94,0.4)",
              borderRadius: "24px",
              padding: "28px",
              color: "#FFF",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setFeatureModal({ open: false })}
              style={{ position: "absolute", top: "18px", right: "18px", background: "transparent", border: "none", color: "#94A3B8", fontSize: "22px", cursor: "pointer" }}
            >
              ×
            </button>

            <h3 style={{ fontSize: "20px", fontWeight: 850, margin: "0 0 16px", color: "#22C55E" }}>
              {featureModal.item ? "Edit Marketplace Feature" : "Create New Marketplace Feature"}
            </h3>

            <form onSubmit={handleSaveFeature}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Feature Name *</label>
                <input
                  required
                  name="name"
                  defaultValue={featureModal.item?.name || ""}
                  placeholder="e.g. Live Queue Pro"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Slug (Unique Identifier)</label>
                <input
                  name="slug"
                  defaultValue={featureModal.item?.slug || ""}
                  placeholder="e.g. live-queue-pro"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#94A3B8", fontSize: "13px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Description *</label>
                <textarea
                  required
                  name="description"
                  rows={3}
                  defaultValue={featureModal.item?.description || ""}
                  placeholder="Describe how this feature benefits customers or shop owners..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Price Monthly (₹) *</label>
                  <input
                    required
                    type="number"
                    name="price"
                    defaultValue={featureModal.item?.price ?? 99}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid #22C55E", color: "#22C55E", fontWeight: 800, fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Original / Crossout Price (₹)</label>
                  <input
                    type="number"
                    name="originalPrice"
                    defaultValue={featureModal.item?.originalPrice ?? 199}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#94A3B8", fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Category</label>
                  <select
                    name="category"
                    defaultValue={featureModal.item?.category || "Queue & Operations"}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                  >
                    {CATEGORY_PRESETS.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Badge / Highlight</label>
                  <input
                    name="badge"
                    defaultValue={featureModal.item?.badge || ""}
                    placeholder="e.g. Best Seller, Best Value"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Status</label>
                <select
                  name="isActive"
                  defaultValue={featureModal.item ? String(featureModal.item.isActive) : "true"}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                >
                  <option value="true">Active (Visible in Marketplace)</option>
                  <option value="false">Inactive / Coming Soon</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={busy}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                  color: "#FFF",
                  fontWeight: 900,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {busy ? "Saving Feature..." : featureModal.item ? "Save Changes to D1" : "Create Feature in D1"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT COMBO PACK MODAL */}
      {comboModal.open && (
        <ComboModalForm
          item={comboModal.item}
          availableFeatures={features}
          onClose={() => setComboModal({ open: false })}
          onSubmit={handleSaveCombo}
          busy={busy}
        />
      )}
    </div>
  );
}

// Inner helper component for Combo Pack modal multi-select features
function ComboModalForm({
  item,
  availableFeatures,
  onClose,
  onSubmit,
  busy,
}: {
  item?: MarketplaceCombo;
  availableFeatures: MarketplaceFeature[];
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>, selectedFeatures: string[]) => Promise<void>;
  busy: boolean;
}) {
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(item?.features || []);

  const toggleSlug = (slug: string) => {
    setSelectedSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <div
      role="presentation"
      onMouseDown={(e) => e.currentTarget === e.target && onClose()}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: "rgba(0,0,0,0.85)",
        backdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        style={{
          maxWidth: "540px",
          width: "100%",
          maxHeight: "85vh",
          overflowY: "auto",
          background: "#1E293B",
          border: "2px solid #F59E0B",
          borderRadius: "24px",
          padding: "28px",
          color: "#FFF",
          position: "relative",
        }}
      >
        <button
          type="button"
          onClick={onClose}
          style={{ position: "absolute", top: "18px", right: "18px", background: "transparent", border: "none", color: "#94A3B8", fontSize: "22px", cursor: "pointer" }}
        >
          ×
        </button>

        <h3 style={{ fontSize: "20px", fontWeight: 850, margin: "0 0 16px", color: "#F59E0B" }}>
          {item ? "Edit Combo Pack Bundle" : "Create New Combo Pack Bundle"}
        </h3>

        <form onSubmit={(e) => onSubmit(e, selectedSlugs)}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Combo Pack Name *</label>
            <input
              required
              name="name"
              defaultValue={item?.name || ""}
              placeholder="e.g. Growth Pack"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Slug</label>
            <input
              name="slug"
              defaultValue={item?.slug || ""}
              placeholder="e.g. growth-pack"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#94A3B8", fontSize: "13px", fontFamily: "monospace" }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Description *</label>
            <textarea
              required
              name="description"
              rows={3}
              defaultValue={item?.description || ""}
              placeholder="Explain the value proposition of this bundled combo..."
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Bundle Price (₹) *</label>
              <input
                required
                type="number"
                name="price"
                defaultValue={item?.price ?? 499}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid #F59E0B", color: "#F59E0B", fontWeight: 800, fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Original Unbundled Price (₹)</label>
              <input
                type="number"
                name="originalPrice"
                defaultValue={item?.originalPrice ?? 699}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#94A3B8", fontSize: "14px" }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Highlight Badge</label>
            <select
              name="badge"
              defaultValue={item?.badge || "BEST VALUE"}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
            >
              <option value="BEST VALUE">⭐ BEST VALUE</option>
              <option value="Best Seller">🔥 Best Seller</option>
              <option value="POPULAR">⚡ POPULAR</option>
              <option value="RECOMMENDED">👑 RECOMMENDED</option>
              <option value="STARTER">🚀 STARTER</option>
              <option value="ALL-IN-ONE">💯 ALL-IN-ONE</option>
            </select>
          </div>

          {/* Feature Checklist Multi-Select */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "6px", color: "#F59E0B" }}>
              Select Included Features ({selectedSlugs.length} selected):
            </label>
            <div style={{ display: "grid", gap: "8px", maxHeight: "160px", overflowY: "auto", background: "rgba(0,0,0,0.4)", padding: "12px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.1)" }}>
              {availableFeatures.map((f) => {
                const checked = selectedSlugs.includes(f.slug) || selectedSlugs.includes(f.id);
                return (
                  <label key={f.id} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: checked ? "#FFF" : "#94A3B8", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSlug(f.slug)}
                      style={{ accentColor: "#F59E0B", width: "16px", height: "16px" }}
                    />
                    <span><b>{f.name}</b> (₹{f.price})</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Combo Status</label>
            <select
              name="isActive"
              defaultValue={item ? String(item.isActive) : "true"}
              style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
            >
              <option value="true">Active (Visible to Store Owners)</option>
              <option value="false">Inactive / Draft</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={busy}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              color: "#000",
              fontWeight: 900,
              fontSize: "14px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {busy ? "Saving Combo Pack..." : item ? "Save Bundle Changes to D1" : "Create Combo Pack in D1"}
          </button>
        </form>
      </div>
    </div>
  );
}
