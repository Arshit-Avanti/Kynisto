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
  Grid,
  Check,
  X,
  Lock,
  Unlock,
  Building2,
  UserCheck,
  Shield,
  HelpCircle,
  RefreshCw,
} from "lucide-react";
import { MarketplaceFeature, MarketplaceCombo, DbPlan } from "@/lib/subscriptions";

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

const DEFAULT_MATRIX_FEATURES = [
  { key: "live_queue", name: "Live Queue Pro", category: "Operations" },
  { key: "verified_badge", name: "Verified Badge", category: "Trust" },
  { key: "promotions", name: "Promotions & Offers", category: "Marketing" },
  { key: "analytics", name: "Analytics & Insights", category: "Insights" },
  { key: "top_search_ranking", name: "Top Search Ranking", category: "Visibility" },
  { key: "membership_management", name: "Membership Management", category: "Retention" },
  { key: "ai_assistant", name: "AI Assistant & Future Access", category: "VIP" },
  { key: "staff_management", name: "Staff Management", category: "Operations" },
  { key: "custom_branding", name: "Custom Store Branding", category: "Trust" },
  { key: "qr_queue", name: "QR Code Self-Checkin", category: "Operations" },
  { key: "whatsapp", name: "WhatsApp Alerts", category: "Marketing" },
  { key: "reports_export", name: "CSV Reports Export", category: "Insights" },
  { key: "coupons", name: "Custom Coupon Creation", category: "Marketing" },
];

export function AdminMarketplaceControlCenter() {
  const [plans, setPlans] = useState<DbPlan[]>([]);
  const [features, setFeatures] = useState<MarketplaceFeature[]>([]);
  const [combos, setCombos] = useState<MarketplaceCombo[]>([]);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<"plans" | "features" | "combos" | "matrix">("plans");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "customer" | "store_owner">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "coming_soon" | "inactive">("all");
  const [badgeFilter, setBadgeFilter] = useState("all");

  // Modal States
  const [planModal, setPlanModal] = useState<{ open: boolean; item?: DbPlan }>({ open: false });
  const [featureModal, setFeatureModal] = useState<{ open: boolean; item?: MarketplaceFeature }>({ open: false });
  const [comboModal, setComboModal] = useState<{ open: boolean; item?: MarketplaceCombo }>({ open: false });

  const [busy, setBusy] = useState(false);

  const fetchMarketplaceData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/subscriptions/marketplace");
      if (!res.ok) throw new Error("Failed to load marketplace data from D1.");
      const data = await res.json();
      setPlans(data.plans || []);
      setFeatures(data.features || []);
      setCombos(data.combos || []);
      setMatrix(data.matrix || {});
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

  // Quick Plan Toggle Status
  const handleTogglePlanStatus = async (plan: DbPlan) => {
    setBusy(true);
    try {
      const newActive = !plan.isActive;
      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_plan",
          type: "plan",
          ...plan,
          isActive: newActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to toggle plan status");
      setToast(`Updated plan "${plan.name}" status to ${newActive ? "Active" : "Inactive"}`);
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Failed to update plan status");
    } finally {
      setBusy(false);
    }
  };

  // Quick Feature / Combo Status Toggle
  const handleToggleItemStatus = async (item: MarketplaceFeature | MarketplaceCombo, type: "feature" | "combo") => {
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
  const handleQuickBadge = async (
    item: DbPlan | MarketplaceFeature | MarketplaceCombo,
    type: "plan" | "feature" | "combo",
    newBadge: string
  ) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(type === "plan" ? { action: "save_plan" } : {}),
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
  const handleDeleteItem = async (id: string, name: string, type: "plan" | "feature" | "combo") => {
    if (!window.confirm(`Are you sure you want to delete ${type} "${name}" from D1 database?`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/marketplace?id=${id}&type=${type}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete item");
      setToast(`Deleted ${type} "${name}" from marketplace D1`);
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Failed to delete marketplace item");
    } finally {
      setBusy(false);
    }
  };

  // Save Plan
  const handleSavePlan = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const id = (formData.get("id") as string) || planModal.item?.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
      const role = formData.get("role") as "customer" | "store_owner";
      const description = formData.get("description") as string;
      const priceMonthly = Number(formData.get("priceMonthly")) || 0;
      const priceYearly = Number(formData.get("priceYearly")) || 0;
      const currency = (formData.get("currency") as string) || "INR";
      const trialDays = Number(formData.get("trialDays")) || 0;
      const badge = formData.get("badge") as string;
      const isPopular = formData.get("isPopular") === "on";
      const isRecommended = formData.get("isRecommended") === "on";
      const isActive = formData.get("isActive") === "true";
      const maxStores = Number(formData.get("maxStores")) || 1;
      const maxDailyBookings = Number(formData.get("maxDailyBookings")) || 30;
      const maxStaff = Number(formData.get("maxStaff")) || 0;
      const maxFavorites = Number(formData.get("maxFavorites")) || 10;
      const rawFeatures = formData.get("features") as string;
      const featuresArr = rawFeatures
        ? rawFeatures.split("\n").map((f) => f.trim()).filter(Boolean)
        : [];

      const payload = {
        action: "save_plan",
        type: "plan",
        id,
        role,
        name,
        description,
        priceMonthly,
        priceYearly,
        currency,
        trialDays,
        badge,
        isPopular,
        isRecommended,
        isActive,
        maxStores,
        maxDailyBookings,
        maxStaff,
        maxFavorites,
        features: featuresArr,
      };

      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save plan");

      setToast(`Successfully saved plan "${name}" in D1`);
      setPlanModal({ open: false });
      fetchMarketplaceData();
    } catch (err: any) {
      setError(err.message || "Save plan error");
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
        action: "save_feature",
        type: "feature",
        id: featureModal.item?.id,
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
        action: "save_combo",
        type: "combo",
        id: comboModal.item?.id,
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

  // Toggle Matrix Permission Cell
  const handleToggleMatrixCell = async (planId: string, featureKey: string) => {
    const currentVal = Boolean(matrix[planId]?.[featureKey]);
    const newVal = !currentVal;

    // Optimistic UI update
    setMatrix((prev) => ({
      ...prev,
      [planId]: {
        ...(prev[planId] || {}),
        [featureKey]: newVal,
      },
    }));

    try {
      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_permission",
          planId,
          featureKey,
          isEnabled: newVal,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permission");
      setToast(`Permission updated for Plan [${planId}] -> Feature [${featureKey}]`);
    } catch (err: any) {
      // Revert on error
      setMatrix((prev) => ({
        ...prev,
        [planId]: {
          ...(prev[planId] || {}),
          [featureKey]: currentVal,
        },
      }));
      setError(err.message || "Failed to update matrix permission");
    }
  };

  // Bulk Matrix Actions for a Plan
  const handleBulkPlanMatrix = async (planId: string, enableAll: boolean) => {
    setBusy(true);
    try {
      const updatedPlanMap: Record<string, boolean> = {};
      DEFAULT_MATRIX_FEATURES.forEach((f) => {
        updatedPlanMap[f.key] = enableAll;
      });

      setMatrix((prev) => ({
        ...prev,
        [planId]: updatedPlanMap,
      }));

      const newFullMatrix = {
        ...matrix,
        [planId]: updatedPlanMap,
      };

      const res = await fetch("/api/admin/subscriptions/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_matrix",
          matrix: newFullMatrix,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update permissions");
      setToast(`${enableAll ? "Enabled" : "Disabled"} all features for plan "${planId}"`);
    } catch (err: any) {
      setError(err.message || "Failed bulk plan update");
    } finally {
      setBusy(false);
    }
  };

  // Filtered Lists
  const filteredPlans = useMemo(() => {
    return plans.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === "all" ? true : item.role === roleFilter;

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? item.isActive
          : !item.isActive;

      const matchesBadge =
        badgeFilter === "all"
          ? true
          : badgeFilter === "none"
          ? !item.badge
          : item.badge?.toLowerCase() === badgeFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus && matchesBadge;
    });
  }, [plans, searchQuery, roleFilter, statusFilter, badgeFilter]);

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

  // Statistics Calculation
  const totalPlans = plans.length;
  const activePlansCount = plans.filter((p) => p.isActive).length;
  const customerPlansCount = plans.filter((p) => p.role === "customer").length;
  const ownerPlansCount = plans.filter((p) => p.role === "store_owner").length;
  const totalFeatures = features.length;
  const activeFeaturesCount = features.filter((f) => f.isActive).length;
  const totalCombos = combos.length;
  const activeCombosCount = combos.filter((c) => c.isActive).length;

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
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(34,197,94,0.15)",
                color: "#22C55E",
                border: "1px solid rgba(34,197,94,0.3)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}
            >
              <Sparkles size={14} /> D1 Database Control Center · Single Source of Truth
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", margin: "10px 0 6px", letterSpacing: "-0.5px" }}>
              Subscription Marketplace &amp; Plans Control Center
            </h2>
            <p style={{ color: "#94A3B8", fontSize: "14px", margin: 0, maxWidth: "780px" }}>
              Manage subscription Plans, individual Features, Combo Packs, and the Feature-Plan Permission Matrix. All changes sync in real-time across database endpoints and frontend interfaces.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setPlanModal({ open: true })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                color: "#FFF",
                fontWeight: 800,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(59,130,246,0.3)",
              }}
            >
              <Plus size={16} /> Create Plan
            </button>

            <button
              type="button"
              onClick={() => setFeatureModal({ open: true })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                color: "#FFF",
                fontWeight: 800,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(34,197,94,0.3)",
              }}
            >
              <Plus size={16} /> Create Feature
            </button>

            <button
              type="button"
              onClick={() => setComboModal({ open: true })}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 18px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                color: "#000",
                fontWeight: 900,
                fontSize: "13px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(245,158,11,0.3)",
              }}
            >
              <Package size={16} /> Create Combo
            </button>
          </div>
        </div>

        {/* KPI Stat Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "24px" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>Total Plans</div>
            <div style={{ color: "#3B82F6", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>{totalPlans}</div>
            <div style={{ color: "#3B82F6", fontSize: "12px", fontWeight: 700 }}>{activePlansCount} Active ({customerPlansCount} Cust / {ownerPlansCount} Owner)</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>Individual Features</div>
            <div style={{ color: "#22C55E", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>{totalFeatures}</div>
            <div style={{ color: "#22C55E", fontSize: "12px", fontWeight: 700 }}>{activeFeaturesCount} Active Features</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>Combo Packs</div>
            <div style={{ color: "#F59E0B", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>{totalCombos}</div>
            <div style={{ color: "#F59E0B", fontSize: "12px", fontWeight: 700 }}>{activeCombosCount} Active Bundles</div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "16px", borderRadius: "16px" }}>
            <div style={{ color: "#94A3B8", fontSize: "12px", fontWeight: 700 }}>Permission Matrix</div>
            <div style={{ color: "#A855F7", fontSize: "28px", fontWeight: 900, margin: "4px 0" }}>⚡ Matrix</div>
            <div style={{ color: "#A855F7", fontSize: "12px", fontWeight: 700 }}>Synced with D1 DB</div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation (Plans, Features, Combo Packs, Permission Matrix) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "8px", background: "rgba(15,23,42,0.8)", padding: "6px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTab("plans")}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              background: activeTab === "plans" ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" : "transparent",
              color: activeTab === "plans" ? "#FFF" : "#94A3B8",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CreditCard size={16} /> Plans ({plans.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("features")}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "13px",
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
            <Tag size={16} /> Features ({features.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("combos")}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "13px",
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
            <Package size={16} /> Combos ({combos.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            style={{
              padding: "10px 20px",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "13px",
              border: "none",
              background: activeTab === "matrix" ? "linear-gradient(135deg, #A855F7 0%, #7E22CE 100%)" : "transparent",
              color: activeTab === "matrix" ? "#FFF" : "#94A3B8",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Grid size={16} /> Permission Matrix
          </button>
        </div>

        {/* Filter Controls Bar (Search & Dropdowns) */}
        {activeTab !== "matrix" && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Search Box */}
            <div style={{ position: "relative", minWidth: "200px" }}>
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 36px",
                  borderRadius: "12px",
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#FFF",
                  fontSize: "13px",
                }}
              />
            </div>

            {/* Role Filter (for Plans tab) */}
            {activeTab === "plans" && (
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "12px",
                  background: "#1E293B",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#FFF",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                <option value="all">All Roles</option>
                <option value="customer">Customer Plans</option>
                <option value="store_owner">Store Owner Plans</option>
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: "8px 12px",
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
              <option value="inactive">Inactive</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: PLANS MANAGEMENT */}
      {activeTab === "plans" && (
        <>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading subscription plans from D1 database...</div>
          ) : filteredPlans.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", background: "rgba(15,23,42,0.8)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              No subscription plans found matching filters. Click "+ Create Plan" above to create one.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))", gap: "20px" }}>
              {filteredPlans.map((plan) => {
                const isCustomer = plan.role === "customer";
                const isPopular = plan.isPopular || plan.badge?.toLowerCase().includes("popular");
                const isRecommended = plan.isRecommended || plan.badge?.toLowerCase().includes("recommended");

                return (
                  <div
                    key={plan.id}
                    style={{
                      background: isCustomer
                        ? "linear-gradient(180deg, rgba(59,130,246,0.1) 0%, rgba(15,23,42,0.96) 100%)"
                        : "linear-gradient(180deg, rgba(34,197,94,0.1) 0%, rgba(15,23,42,0.96) 100%)",
                      border: isPopular
                        ? "2px solid #F59E0B"
                        : isRecommended
                        ? "2px solid #22C55E"
                        : "1px solid rgba(255,255,255,0.12)",
                      borderRadius: "22px",
                      padding: "24px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      boxShadow: isPopular ? "0 8px 24px rgba(245,158,11,0.2)" : "0 8px 24px rgba(0,0,0,0.3)",
                    }}
                  >
                    {/* Badge Tag */}
                    {plan.badge && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-12px",
                          right: "20px",
                          background: isPopular ? "#F59E0B" : isRecommended ? "#22C55E" : "#3B82F6",
                          color: isPopular ? "#000" : "#FFF",
                          fontSize: "11px",
                          fontWeight: 900,
                          padding: "3px 12px",
                          borderRadius: "12px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "8px" }}>
                        <div>
                          <span
                            style={{
                              fontSize: "11px",
                              color: isCustomer ? "#60A5FA" : "#4ADE80",
                              fontWeight: 800,
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {isCustomer ? <UserCheck size={13} /> : <Building2 size={13} />}
                            {isCustomer ? "Customer Plan" : "Store Owner Plan"}
                          </span>
                          <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#FFF", margin: "2px 0 0" }}>
                            {plan.name}
                          </h3>
                        </div>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: plan.isActive ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
                            color: plan.isActive ? "#22C55E" : "#EF4444",
                            border: plan.isActive ? "1px solid #22C55E" : "1px solid #EF4444",
                          }}
                        >
                          {plan.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </div>

                      <p style={{ color: "#94A3B8", fontSize: "13px", lineHeight: "1.5", marginBottom: "16px", minHeight: "36px" }}>
                        {plan.description}
                      </p>

                      {/* Pricing Display */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: "8px",
                          marginBottom: "14px",
                          background: "rgba(255,255,255,0.03)",
                          padding: "10px 14px",
                          borderRadius: "12px",
                        }}
                      >
                        <span style={{ color: "#22C55E", fontSize: "24px", fontWeight: 900 }}>
                          ₹{plan.priceMonthly}
                        </span>
                        <span style={{ color: "#94A3B8", fontSize: "12px" }}>/mo</span>
                        {plan.priceYearly > 0 && (
                          <span style={{ color: "#60A5FA", fontSize: "12px", marginLeft: "auto", fontWeight: 700 }}>
                            ₹{plan.priceYearly}/yr
                          </span>
                        )}
                      </div>

                      {/* Trial Days Pill */}
                      {plan.trialDays ? plan.trialDays > 0 ? (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "rgba(245,158,11,0.15)",
                            border: "1px solid rgba(245,158,11,0.3)",
                            color: "#F59E0B",
                            fontSize: "11px",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "8px",
                            marginBottom: "14px",
                          }}
                        >
                          <Zap size={13} /> {plan.trialDays}-Day Free Trial Enabled
                        </div>
                      ) : null : null}

                      {/* Plan Limits Quota Pills */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
                        {!isCustomer && (
                          <>
                            <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1", fontSize: "11px", padding: "3px 8px", borderRadius: "6px" }}>
                              Max Stores: <b>{plan.maxStores ?? 1}</b>
                            </span>
                            <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1", fontSize: "11px", padding: "3px 8px", borderRadius: "6px" }}>
                              Bookings/Day: <b>{plan.maxDailyBookings && plan.maxDailyBookings > 1000 ? "Unlimited" : plan.maxDailyBookings ?? 30}</b>
                            </span>
                            <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1", fontSize: "11px", padding: "3px 8px", borderRadius: "6px" }}>
                              Staff: <b>{plan.maxStaff ?? 0}</b>
                            </span>
                          </>
                        )}
                        {isCustomer && (
                          <span style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#CBD5E1", fontSize: "11px", padding: "3px 8px", borderRadius: "6px" }}>
                            Max Favorites: <b>{plan.maxFavorites && plan.maxFavorites > 1000 ? "Unlimited" : plan.maxFavorites ?? 10}</b>
                          </span>
                        )}
                      </div>

                      {/* Included Features Bullet Points */}
                      {plan.features && plan.features.length > 0 && (
                        <div style={{ marginBottom: "16px" }}>
                          <strong style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Included Plan Features:
                          </strong>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px" }}>
                            {plan.features.slice(0, 4).map((f, idx) => (
                              <div key={idx} style={{ fontSize: "12px", color: "#CBD5E1", display: "flex", alignItems: "center", gap: "6px" }}>
                                <Check size={13} color="#22C55E" /> {f}
                              </div>
                            ))}
                            {plan.features.length > 4 && (
                              <span style={{ fontSize: "11px", color: "#60A5FA", fontStyle: "italic" }}>
                                + {plan.features.length - 4} more features
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Quick Badge Selector Dropdown */}
                      <div style={{ marginBottom: "16px" }}>
                        <label style={{ display: "block", fontSize: "11px", color: "#94A3B8", fontWeight: 700, marginBottom: "4px" }}>
                          Quick Plan Badge:
                        </label>
                        <select
                          value={plan.badge || ""}
                          onChange={(e) => handleQuickBadge(plan, "plan", e.target.value)}
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
                          <option value="MOST POPULAR">🔥 MOST POPULAR</option>
                          <option value="RECOMMENDED">⭐ RECOMMENDED</option>
                          <option value="POPULAR">⚡ POPULAR</option>
                          <option value="CUSTOM SCALE">👑 CUSTOM SCALE</option>
                          <option value="STARTER">🚀 STARTER</option>
                        </select>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: "flex", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                      <button
                        type="button"
                        onClick={() => handleTogglePlanStatus(plan)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "10px",
                          background: plan.isActive ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
                          border: plan.isActive ? "1px solid #EF4444" : "1px solid #22C55E",
                          color: plan.isActive ? "#EF4444" : "#22C55E",
                          fontSize: "12px",
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {plan.isActive ? "Disable Plan" : "Enable Plan"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setPlanModal({ open: true, item: plan })}
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
                        onClick={() => handleDeleteItem(plan.id, plan.name, "plan")}
                        style={{
                          padding: "8px 12px",
                          borderRadius: "10px",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.3)",
                          color: "#EF4444",
                          fontSize: "12px",
                          cursor: "pointer",
                        }}
                        title="Delete Plan"
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

      {/* TAB 2: INDIVIDUAL FEATURES */}
      {activeTab === "features" && (
        <>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading D1 marketplace features...</div>
          ) : filteredFeatures.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", background: "rgba(15,23,42,0.8)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              No marketplace features found matching filters. Click "+ Create Feature" above to add one.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {filteredFeatures.map((feat) => {
                const isBestSeller = feat.badge?.toLowerCase().includes("seller");
                const isBestValue = feat.badge?.toLowerCase().includes("value");

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
                        onClick={() => handleToggleItemStatus(feat, "feature")}
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

      {/* TAB 3: COMBO PACKS */}
      {activeTab === "combos" && (
        <>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading D1 combo packs...</div>
          ) : filteredCombos.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8", background: "rgba(15,23,42,0.8)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
              No combo packs found matching filters. Click "+ Create Combo" above to build a bundle.
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
                        onClick={() => handleToggleItemStatus(combo, "combo")}
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

      {/* TAB 4: FEATURE-PLAN PERMISSION MATRIX */}
      {activeTab === "matrix" && (
        <div style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(168,85,247,0.3)", borderRadius: "24px", padding: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "22px", fontWeight: 900, color: "#A855F7", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Grid size={22} /> Feature-Plan Permission Matrix
              </h3>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: 0, maxWidth: "750px" }}>
                Control exactly which features are enabled for each subscription plan. Toggle switches persist immediately to D1 database and enforce API feature flags in real-time.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchMarketplaceData}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "12px",
                background: "rgba(168,85,247,0.15)",
                border: "1px solid #A855F7",
                color: "#A855F7",
                fontSize: "12px",
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} /> Refresh Matrix
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#94A3B8" }}>Loading permission matrix...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "14px", textAlign: "left", background: "#0F172A", color: "#94A3B8", fontSize: "12px", fontWeight: 800, borderBottom: "2px solid rgba(255,255,255,0.1)", borderRadius: "12px 0 0 0", minWidth: "220px" }}>
                      FEATURE NAME / KEY
                    </th>
                    {plans.map((plan) => (
                      <th key={plan.id} style={{ padding: "14px 10px", textAlign: "center", background: "#0F172A", borderBottom: "2px solid rgba(255,255,255,0.1)", minWidth: "130px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 900, color: plan.role === "customer" ? "#60A5FA" : "#4ADE80" }}>
                          {plan.name}
                        </div>
                        <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                          {plan.role === "customer" ? "Customer" : "Store Owner"} · ₹{plan.priceMonthly}/mo
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: "4px", marginTop: "6px" }}>
                          <button
                            type="button"
                            onClick={() => handleBulkPlanMatrix(plan.id, true)}
                            style={{ background: "rgba(34,197,94,0.2)", border: "none", color: "#22C55E", fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                            title="Enable all features for this plan"
                          >
                            All ON
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkPlanMatrix(plan.id, false)}
                            style={{ background: "rgba(239,68,68,0.2)", border: "none", color: "#EF4444", fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", cursor: "pointer" }}
                            title="Disable all features for this plan"
                          >
                            All OFF
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_MATRIX_FEATURES.map((feat, rIdx) => (
                    <tr key={feat.key} style={{ background: rIdx % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                      <td style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", color: "#FFF" }}>
                        <div style={{ fontWeight: 800, fontSize: "13px" }}>{feat.name}</div>
                        <div style={{ fontSize: "11px", color: "#94A3B8", fontFamily: "monospace" }}>key: {feat.key}</div>
                      </td>

                      {plans.map((plan) => {
                        const isEnabled = Boolean(matrix[plan.id]?.[feat.key]);
                        return (
                          <td key={plan.id} style={{ padding: "12px 10px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                            <button
                              type="button"
                              onClick={() => handleToggleMatrixCell(plan.id, feat.key)}
                              style={{
                                width: "42px",
                                height: "24px",
                                borderRadius: "12px",
                                background: isEnabled ? "#22C55E" : "#334155",
                                border: "none",
                                cursor: "pointer",
                                position: "relative",
                                transition: "all 0.2s ease",
                                display: "inline-block",
                              }}
                              title={`Toggle ${feat.name} for ${plan.name} (${isEnabled ? "Enabled" : "Disabled"})`}
                            >
                              <span
                                style={{
                                  position: "absolute",
                                  top: "3px",
                                  left: isEnabled ? "21px" : "3px",
                                  width: "18px",
                                  height: "18px",
                                  borderRadius: "50%",
                                  background: "#FFF",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "10px",
                                  fontWeight: 900,
                                  color: isEnabled ? "#16A34A" : "#64748B",
                                }}
                              >
                                {isEnabled ? "✓" : "✕"}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE / EDIT PLAN MODAL */}
      {planModal.open && (
        <div
          role="presentation"
          onMouseDown={(e) => e.currentTarget === e.target && setPlanModal({ open: false })}
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
              maxWidth: "560px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              background: "#1E293B",
              border: "2px solid #3B82F6",
              borderRadius: "24px",
              padding: "28px",
              color: "#FFF",
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={() => setPlanModal({ open: false })}
              style={{ position: "absolute", top: "18px", right: "18px", background: "transparent", border: "none", color: "#94A3B8", fontSize: "22px", cursor: "pointer" }}
            >
              ×
            </button>

            <h3 style={{ fontSize: "20px", fontWeight: 900, margin: "0 0 16px", color: "#60A5FA" }}>
              {planModal.item ? "Edit Subscription Plan" : "Create New Subscription Plan"}
            </h3>

            <form onSubmit={handleSavePlan}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Plan Name *</label>
                  <input
                    required
                    name="name"
                    defaultValue={planModal.item?.name || ""}
                    placeholder="e.g. PRO PLUS"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Plan Role *</label>
                  <select
                    name="role"
                    defaultValue={planModal.item?.role || "store_owner"}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                  >
                    <option value="store_owner">Store Owner Plan</option>
                    <option value="customer">Customer Plan</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Plan ID / Key</label>
                <input
                  name="id"
                  defaultValue={planModal.item?.id || ""}
                  placeholder="e.g. pro_plus (auto-generated if empty)"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#94A3B8", fontSize: "13px", fontFamily: "monospace" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Description *</label>
                <textarea
                  required
                  name="description"
                  rows={2}
                  defaultValue={planModal.item?.description || ""}
                  placeholder="Summary proposition of this plan..."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Monthly (₹) *</label>
                  <input
                    required
                    type="number"
                    name="priceMonthly"
                    defaultValue={planModal.item?.priceMonthly ?? 499}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid #22C55E", color: "#22C55E", fontWeight: 800, fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Yearly (₹)</label>
                  <input
                    type="number"
                    name="priceYearly"
                    defaultValue={planModal.item?.priceYearly ?? 4999}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#60A5FA", fontWeight: 800, fontSize: "14px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Trial Days</label>
                  <input
                    type="number"
                    name="trialDays"
                    defaultValue={planModal.item?.trialDays ?? 14}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid #F59E0B", color: "#F59E0B", fontWeight: 800, fontSize: "14px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Highlight Badge</label>
                  <input
                    name="badge"
                    defaultValue={planModal.item?.badge || ""}
                    placeholder="e.g. MOST POPULAR"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Plan Status</label>
                  <select
                    name="isActive"
                    defaultValue={planModal.item ? String(planModal.item.isActive) : "true"}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px" }}
                  >
                    <option value="true">Active (Visible in Pricing UI)</option>
                    <option value="false">Inactive / Draft</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: "20px", marginBottom: "14px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#F59E0B", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="isPopular"
                    defaultChecked={planModal.item?.isPopular}
                    style={{ accentColor: "#F59E0B", width: "16px", height: "16px" }}
                  />
                  Mark as Popular Flag
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", fontWeight: 700, color: "#22C55E", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name="isRecommended"
                    defaultChecked={planModal.item?.isRecommended}
                    style={{ accentColor: "#22C55E", width: "16px", height: "16px" }}
                  />
                  Mark as Recommended Flag
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8" }}>Max Stores</label>
                  <input type="number" name="maxStores" defaultValue={planModal.item?.maxStores ?? 1} style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8" }}>Max Bookings/Day</label>
                  <input type="number" name="maxDailyBookings" defaultValue={planModal.item?.maxDailyBookings ?? 30} style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8" }}>Max Staff</label>
                  <input type="number" name="maxStaff" defaultValue={planModal.item?.maxStaff ?? 0} style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "12px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#94A3B8" }}>Max Favorites</label>
                  <input type="number" name="maxFavorites" defaultValue={planModal.item?.maxFavorites ?? 10} style={{ width: "100%", padding: "8px", borderRadius: "8px", background: "#0F172A", border: "1px solid rgba(255,255,255,0.1)", color: "#FFF", fontSize: "12px" }} />
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px" }}>Features Highlights (One per line)</label>
                <textarea
                  name="features"
                  rows={4}
                  defaultValue={planModal.item?.features ? planModal.item.features.join("\n") : ""}
                  placeholder="Join unlimited queues&#10;Ad-free experience&#10;Priority Queue Access"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", color: "#FFF", fontSize: "13px", resize: "vertical" }}
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                  color: "#FFF",
                  fontWeight: 900,
                  fontSize: "14px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {busy ? "Saving Plan..." : planModal.item ? "Save Plan Changes to D1" : "Create Plan in D1"}
              </button>
            </form>
          </div>
        </div>
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
