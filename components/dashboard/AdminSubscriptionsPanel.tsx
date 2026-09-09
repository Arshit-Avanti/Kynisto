"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ALL_PLANS, CUSTOMER_PLANS, SHOP_OWNER_PLANS, getPlanConfig } from "@/lib/subscriptions-shared";
import { AdminMarketplaceControlCenter } from "@/components/dashboard/AdminMarketplaceControlCenter";
import { AdminMembershipsPanel } from "@/components/dashboard/AdminMembershipsPanel";

interface AdminSubscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: "admin" | "store_owner" | "customer";
  planId: string;
  billingCycle: "monthly" | "yearly";
  amount: number;
  status: string;
  autoRenew: boolean;
  startsAt: number;
  expiresAt: number;
  paymentMethod: string;
  utr?: string;
  receiptNumber?: string;
  createdAt: number;
}

interface Analytics {
  mrr: number;
  totalRevenue: number;
  activeSubscribersTotal: number;
  activeCustomerCount: number;
  activeShopOwnerCount: number;
  planBreakdown: Record<string, { count: number; revenue: number }>;
}

interface PendingMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  paymentTime: string;
  amountPaid: number;
  planId: string;
  planName: string;
  billingCycle: string;
  utr: string;
  status: string;
  createdAt: number;
}

export function AdminSubscriptionsPanel() {
  const searchParams = useSearchParams();
  const requestedView = searchParams?.get("view") || searchParams?.get("subtab");
  const [panelTab, setPanelTab] = useState<"marketplace" | "subscribers" | "memberships">(
    requestedView === "marketplace" ? "marketplace" : requestedView === "memberships" || requestedView === "passes" || requestedView === "store_memberships" ? "memberships" : "subscribers"
  );
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestedView === "marketplace") {
      setPanelTab("marketplace");
    } else if (requestedView === "memberships" || requestedView === "passes" || requestedView === "store_memberships") {
      setPanelTab("memberships");
    } else if (requestedView === "subscribers") {
      setPanelTab("subscribers");
    }
  }, [requestedView]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  // Selection state for Bulk Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Single Action modal state
  const [actionModal, setActionModal] = useState<{
    action: "activate" | "upgrade" | "grant_trial" | "cancel" | "deactivate" | "refund" | "delete";
    subId?: string;
    userId?: string;
    userName?: string;
    targetPlanId?: string;
    targetBillingCycle?: "monthly" | "yearly";
    days?: number;
  } | null>(null);

  // Bulk Action modal state
  const [bulkActionModal, setBulkActionModal] = useState<{
    action: "bulk_delete" | "bulk_deactivate" | "bulk_upgrade" | "bulk_trial";
    targetPlanId?: string;
    targetBillingCycle?: "monthly" | "yearly";
    days?: number;
  } | null>(null);

  const [busy, setBusy] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (planFilter !== "all") params.set("plan", planFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (roleFilter !== "all") params.set("role", roleFilter);

      const res = await fetch(`/api/admin/subscriptions?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to load admin subscriptions.");
      }
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setPendingMessages(data.pendingMessages || []);
      setAnalytics(data.analytics || null);
    } catch (err: any) {
      console.error("Admin subscriptions fetch error:", err);
      setError(err?.message || "Failed to load admin subscriptions.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, planFilter, statusFilter, roleFilter]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  // Message approval & rejection handlers
  const handleApproveMessage = async (messageId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve_message", messageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Approval failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleRejectMessage = async (messageId: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject_message", messageId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Rejection failed.");
    } finally {
      setBusy(false);
    }
  };

  // Checkbox handlers
  const isAllSelected = subscriptions.length > 0 && selectedIds.length === subscriptions.length;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(subscriptions.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Single Action Execution
  const handleExecuteSingleAction = async () => {
    if (!actionModal) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal.action,
          subscriptionId: actionModal.subId,
          userId: actionModal.userId,
          planId: actionModal.targetPlanId,
          billingCycle: actionModal.targetBillingCycle || "monthly",
          days: actionModal.days || 7,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setActionModal(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Action failed.");
    } finally {
      setBusy(false);
    }
  };

  // Bulk Action Execution
  const handleExecuteBulkAction = async () => {
    if (!bulkActionModal || selectedIds.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/subscriptions/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkActionModal.action,
          subscriptionIds: selectedIds,
          planId: bulkActionModal.targetPlanId,
          billingCycle: bulkActionModal.targetBillingCycle || "monthly",
          days: bulkActionModal.days || 7,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSelectedIds([]);
      setBulkActionModal(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.message || "Bulk action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "20px 0" }}>
      {/* Top Panel Tab Switcher */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "28px", background: "#FFFFFF", padding: "6px", borderRadius: "16px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <button
          type="button"
          onClick={() => setPanelTab("marketplace")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 850,
            fontSize: "14px",
            border: "none",
            background: panelTab === "marketplace" ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)" : "transparent",
            color: panelTab === "marketplace" ? "#FFF" : "#64748B",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          🛒 Marketplace Control Center (D1)
        </button>
        <button
          type="button"
          onClick={() => setPanelTab("subscribers")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 850,
            fontSize: "14px",
            border: "none",
            background: panelTab === "subscribers" ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)" : "transparent",
            color: panelTab === "subscribers" ? "#FFF" : "#64748B",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          📊 User Subscriptions &amp; Verifications ({subscriptions.length})
        </button>
        <button
          type="button"
          onClick={() => setPanelTab("memberships")}
          style={{
            flex: 1,
            padding: "12px 20px",
            borderRadius: "12px",
            fontWeight: 850,
            fontSize: "14px",
            border: "none",
            background: panelTab === "memberships" ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" : "transparent",
            color: panelTab === "memberships" ? "#FFF" : "#64748B",
            cursor: "pointer",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          🏪 Store VIP Passes &amp; Memberships
        </button>
      </div>

      {error && (
        <div style={{ background: "#FEF2F2", border: "1px solid #EF4444", color: "#991B1B", padding: "14px 18px", borderRadius: "12px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={() => void fetchAdminData()}
            style={{ background: "#EF4444", color: "#FFF", border: "none", padding: "6px 14px", borderRadius: "8px", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {panelTab === "marketplace" ? (
        <AdminMarketplaceControlCenter />
      ) : panelTab === "memberships" ? (
        <AdminMembershipsPanel />
      ) : (
        <>
          {/* Analytics KPI Cards */}
          {analytics && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "32px" }}>
          <div className="argusCard" style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", border: "1px solid #10B981", boxShadow: "0 8px 24px rgba(16,185,129,0.2)" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#dcfce7", letterSpacing: "1px" }}>MONTHLY RECURRING REVENUE (MRR)</div>
            <div style={{ fontSize: "32px", fontWeight: 900, margin: "6px 0", color: "#FFF" }}>₹{analytics.mrr.toLocaleString()}</div>
            <div style={{ fontSize: "12px", color: "#e2e8f0" }}>Normalized monthly revenue</div>
          </div>

          <div className="argusCard" style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", border: "1px solid #F59E0B", boxShadow: "0 8px 24px rgba(245,158,11,0.2)" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#fef3c7", letterSpacing: "1px" }}>TOTAL REVENUE</div>
            <div style={{ fontSize: "32px", fontWeight: 900, margin: "6px 0", color: "#FFF" }}>₹{analytics.totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: "12px", color: "#e2e8f0" }}>Cumulative payments received</div>
          </div>

          <div className="argusCard" style={{ padding: "20px", borderRadius: "16px", background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)", border: "1px solid #3B82F6", boxShadow: "0 8px 24px rgba(59,130,246,0.2)" }}>
            <div style={{ fontSize: "12px", fontWeight: 800, color: "#dbeafe", letterSpacing: "1px" }}>ACTIVE SUBSCRIBERS</div>
            <div style={{ fontSize: "32px", fontWeight: 900, margin: "6px 0", color: "#FFF" }}>{analytics.activeSubscribersTotal}</div>
            <div style={{ fontSize: "12px", color: "#e2e8f0" }}>
              {analytics.activeCustomerCount} Customers · {analytics.activeShopOwnerCount} Shop Owners
            </div>
          </div>
        </div>
      )}

      {/* Plan-wise Breakdown Bar */}
      {analytics?.planBreakdown && (
        <div style={{ marginBottom: "32px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 800, color: "#475569", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>ACTIVE PLAN DISTRIBUTION</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            {Object.entries(analytics.planBreakdown).map(([planKey, info]) => (
              <div key={planKey} style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", padding: "14px", borderRadius: "14px", fontSize: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ fontWeight: 800, color: "#0F172A" }}>{getPlanConfig(planKey)?.name || planKey}</div>
                <div style={{ color: "#16A34A", fontSize: "16px", fontWeight: 900, margin: "2px 0" }}>{info.count} active</div>
                <div style={{ color: "#64748B" }}>₹{info.revenue} total</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NEW SECTION: SUBSCRIPTION MESSAGES & PENDING PAYMENTS FROM USERS (FOR ADMIN DASHBOARD ONLY) */}
      <div style={{ marginBottom: "36px", background: "#FFFFFF", border: "2px solid #F59E0B", borderRadius: "20px", padding: "24px", boxShadow: "0 8px 30px rgba(245,158,11,0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span style={{ background: "#F59E0B", color: "#000000", fontWeight: 900, fontSize: "11px", padding: "4px 10px", borderRadius: "12px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              🔒 ADMIN DASHBOARD ONLY
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: 850, color: "#0F172A", margin: "8px 0 0" }}>
              📬 Subscription Messages from Users (Pending Payment Verifications)
            </h3>
          </div>
          <span style={{ fontSize: "13px", fontWeight: 850, color: "#B45309", background: "#FEF3C7", padding: "6px 14px", borderRadius: "12px", border: "1px solid #FCD34D" }}>
            {pendingMessages.filter((m) => m.status === "pending").length} Pending Requests
          </span>
        </div>

        {pendingMessages.filter((m) => m.status === "pending").length === 0 ? (
          <div style={{ color: "#64748B", fontSize: "13px", fontStyle: "italic", textAlign: "center", padding: "24px 0", background: "#F8FAFC", borderRadius: "14px", border: "1px dashed #CBD5E1" }}>
            No pending user payment verification requests. All requests verified!
          </div>
        ) : (
          <div style={{ display: "grid", gap: "14px" }}>
            {pendingMessages.filter((m) => m.status === "pending").map((msg) => (
              <div
                key={msg.id}
                style={{
                  background: "#FFFBEB",
                  border: "1px solid #FCD34D",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 850, color: "#0F172A" }}>
                    {msg.userName || "User"}{" "}
                    <span style={{ fontSize: "12px", color: "#2563EB", fontWeight: 700, textTransform: "capitalize", marginLeft: "6px" }}>
                      ({(msg.userRole || "customer").replace("_", " ")})
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px" }}>
                    Email: <b>{msg.userEmail || "N/A"}</b> · Payment Time: <b>{msg.paymentTime || "N/A"}</b>
                  </div>
                  <div style={{ fontSize: "13px", color: "#16A34A", fontWeight: 850, marginTop: "6px" }}>
                    Plan Chosen: {msg.planName} ({msg.billingCycle}) · Amount Paid: ₹{msg.amountPaid}
                  </div>
                  <div style={{ fontSize: "13px", color: "#0369A1", fontFamily: "monospace", marginTop: "4px" }}>
                    12-Digit UTR Ref #: <b style={{ background: "#E0F2FE", padding: "2px 8px", borderRadius: "6px", border: "1px solid #BAE6FD" }}>{msg.utr}</b>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => handleApproveMessage(msg.id)}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                      color: "#FFFFFF",
                      fontWeight: 850,
                      border: "none",
                      fontSize: "13px",
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(34,197,94,0.25)",
                    }}
                  >
                    ✓ Approve &amp; Activate Subscription
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRejectMessage(msg.id)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "12px",
                      background: "#FEE2E2",
                      border: "1px solid #FCA5A5",
                      color: "#DC2626",
                      fontWeight: 800,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters & Search & Export CSV */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search user, email, UTR, receipt..."
          style={{ flex: 1, minWidth: "240px", padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#0F172A", fontSize: "14px", outline: "none" }}
        />

        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#0F172A", fontSize: "13px" }}
        >
          <option value="all">All Plans</option>
          {Object.values(ALL_PLANS).map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#0F172A", fontSize: "13px" }}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="cancelled">Cancelled</option>
          <option value="expired">Expired</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "12px", border: "1px solid #CBD5E1", background: "#FFFFFF", color: "#0F172A", fontSize: "13px" }}
        >
          <option value="all">All Roles</option>
          <option value="customer">Customer</option>
          <option value="store_owner">Shop Owner</option>
        </select>

        <a
          href="/api/admin/subscriptions/export"
          download
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#FFFFFF",
            fontWeight: 800,
            fontSize: "13px",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            boxShadow: "0 2px 6px rgba(16,185,129,0.25)",
          }}
        >
          📥 Export CSV
        </a>
      </div>

      {/* FLOATING BULK ACTION TOOLBAR (Appears when 1+ selected) */}
      {selectedIds.length > 0 && (
        <div
          style={{
            background: "#EFF6FF",
            border: "2px solid #3B82F6",
            borderRadius: "16px",
            padding: "14px 20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            boxShadow: "0 10px 30px rgba(59,130,246,0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1E3A8A", fontWeight: 800, fontSize: "14px" }}>
            <span style={{ background: "#3B82F6", color: "#FFF", width: "26px", height: "26px", borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }}>
              {selectedIds.length}
            </span>
            <span>Subscriptions Selected</span>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {/* Bulk Upgrade */}
            <button
              type="button"
              onClick={() => setBulkActionModal({ action: "bulk_upgrade", targetPlanId: "starter", targetBillingCycle: "monthly" })}
              style={{ padding: "8px 14px", borderRadius: "10px", background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)", color: "#FFF", fontWeight: 800, border: "none", fontSize: "12px", cursor: "pointer" }}
            >
              ⚡ Bulk Upgrade Plan
            </button>

            {/* Bulk 7-Day Free Trial */}
            <button
              type="button"
              onClick={() => setBulkActionModal({ action: "bulk_trial", targetPlanId: "premium", days: 7 })}
              style={{ padding: "8px 14px", borderRadius: "10px", background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)", color: "#000", fontWeight: 900, border: "none", fontSize: "12px", cursor: "pointer" }}
            >
              🎁 Grant 7-Day Free Trial
            </button>

            {/* Bulk Deactivate */}
            <button
              type="button"
              onClick={() => setBulkActionModal({ action: "bulk_deactivate" })}
              style={{ padding: "8px 14px", borderRadius: "10px", background: "#FEF3C7", border: "1px solid #F59E0B", color: "#B45309", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
            >
              🚫 Bulk Deactivate
            </button>

            {/* Bulk Delete */}
            <button
              type="button"
              onClick={() => setBulkActionModal({ action: "bulk_delete" })}
              style={{ padding: "8px 14px", borderRadius: "10px", background: "#FEE2E2", border: "1px solid #EF4444", color: "#DC2626", fontWeight: 800, fontSize: "12px", cursor: "pointer" }}
            >
              🗑 Bulk Delete
            </button>

            {/* Deselect All */}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              style={{ padding: "8px 12px", borderRadius: "10px", background: "#FFFFFF", border: "1px solid #CBD5E1", color: "#475569", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Subscriptions Table */}
      {loading ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#64748B" }}>Loading subscriptions...</div>
      ) : subscriptions.length === 0 ? (
        <div style={{ padding: "30px", textAlign: "center", color: "#64748B", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>No matching subscriptions found.</div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "16px", border: "1px solid #E2E8F0", background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#FFFFFF" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", textAlign: "left", fontSize: "12px", color: "#475569", borderBottom: "2px solid #E2E8F0" }}>
                <th style={{ padding: "16px 14px", width: "40px", textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#3B82F6" }}
                  />
                </th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>Subscriber</th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>Role</th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>Plan</th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>Cycle</th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>Amount</th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>UTR / Receipt</th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>Expires</th>
                <th style={{ padding: "16px 16px", color: "#475569", fontWeight: 800 }}>Status</th>
                <th style={{ padding: "16px 16px", textAlign: "right", color: "#475569", fontWeight: 800 }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => {
                const isSelected = selectedIds.includes(sub.id);
                return (
                  <tr
                    key={sub.id}
                    style={{
                      borderBottom: "1px solid #F1F5F9",
                      fontSize: "13px",
                      background: isSelected ? "#EFF6FF" : "#FFFFFF",
                      transition: "background 0.2s ease",
                    }}
                  >
                    <td style={{ padding: "16px 14px", textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(sub.id)}
                        style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#3B82F6" }}
                      />
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <div style={{ fontWeight: 850, color: "#0F172A", fontSize: "14px" }}>{sub.userName || "User"}</div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>{sub.userEmail || "No Email"}</div>
                    </td>
                    <td style={{ padding: "16px 16px", textTransform: "capitalize", color: "#2563EB", fontWeight: 700 }}>
                      {(sub.userRole || "customer").replace("_", " ")}
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <span style={{ fontWeight: 900, color: "#16A34A", letterSpacing: "0.5px" }}>{getPlanConfig(sub.planId)?.name || sub.planId}</span>
                    </td>
                    <td style={{ padding: "16px 16px", textTransform: "capitalize", color: "#475569", fontWeight: 600 }}>
                      {sub.billingCycle}
                    </td>
                    <td style={{ padding: "16px 16px", fontWeight: 900, color: "#0F172A", fontSize: "14px" }}>
                      ₹{sub.amount}
                    </td>
                    <td style={{ padding: "16px 16px", fontFamily: "monospace", fontSize: "12px", color: "#0284C7", fontWeight: 600 }}>
                      {sub.receiptNumber || sub.utr || "N/A"}
                    </td>
                    <td style={{ padding: "16px 16px", color: "#475569", fontWeight: 600 }}>
                      {sub.expiresAt && !isNaN(Number(sub.expiresAt)) && Number(sub.expiresAt) > 0
                        ? new Date(Number(sub.expiresAt) * 1000).toLocaleDateString("en-IN")
                        : "Lifetime / Never"}
                    </td>
                    <td style={{ padding: "16px 16px" }}>
                      <span
                        style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 900,
                          letterSpacing: "0.5px",
                          background:
                            sub.status === "active"
                              ? "#DCFCE7"
                              : sub.status === "trial"
                              ? "#FEF3C7"
                              : "#FEE2E2",
                          color:
                            sub.status === "active"
                              ? "#15803D"
                              : sub.status === "trial"
                              ? "#B45309"
                              : "#B91C1C",
                          border:
                            sub.status === "active"
                              ? "1px solid #86EFAC"
                              : sub.status === "trial"
                              ? "1px solid #FCD34D"
                              : "1px solid #FCA5A5",
                        }}
                      >
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "16px 16px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
                        {/* Grant 7-Day Free Trial Button */}
                        <button
                          type="button"
                          onClick={() => setActionModal({ action: "grant_trial", subId: sub.id, userId: sub.userId, userName: sub.userName, targetPlanId: (sub.userRole || "customer") === "customer" ? "premium" : "starter", days: 7 })}
                          style={{ padding: "5px 10px", borderRadius: "6px", background: "#FEF3C7", border: "1px solid #FCD34D", color: "#B45309", fontSize: "11px", cursor: "pointer", fontWeight: 800 }}
                          title="Grant 7-Day Free Trial"
                        >
                          🎁 7D Trial
                        </button>

                        {/* Upgrade Plan Button */}
                        <button
                          type="button"
                          onClick={() => setActionModal({ action: "upgrade", subId: sub.id, userId: sub.userId, userName: sub.userName, targetPlanId: (sub.userRole || "customer") === "customer" ? "premium" : "pro" })}
                          style={{ padding: "5px 10px", borderRadius: "6px", background: "#DCFCE7", border: "1px solid #86EFAC", color: "#15803D", fontSize: "11px", cursor: "pointer", fontWeight: 800 }}
                          title="Upgrade Plan"
                        >
                          ⚡ Upgrade
                        </button>

                        {sub.status === "active" && (
                          <>
                            <button
                              type="button"
                              onClick={() => setActionModal({ action: "cancel", subId: sub.id })}
                              style={{ padding: "5px 10px", borderRadius: "6px", background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#475569", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
                            >
                              Deactivate
                            </button>
                            <button
                              type="button"
                              onClick={() => setActionModal({ action: "refund", subId: sub.id })}
                              style={{ padding: "5px 10px", borderRadius: "6px", background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
                            >
                              Refund
                            </button>
                          </>
                        )}

                        {/* Delete Single Record */}
                        <button
                          type="button"
                          onClick={() => setActionModal({ action: "delete", subId: sub.id })}
                          style={{ padding: "5px 8px", borderRadius: "6px", background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#DC2626", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
                          title="Delete Subscription Record"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* SINGLE ACTION MODAL */}
      {actionModal && (
        <div className="modalLayer" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setActionModal(null)}>
          <div style={{ maxWidth: "460px", width: "90%", background: "#FFFFFF", borderRadius: "20px", padding: "28px", margin: "auto", color: "#0F172A", border: "1px solid #E2E8F0", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 850, textTransform: "capitalize", color: "#0F172A" }}>
              {actionModal.action === "grant_trial" ? "🎁 Grant 7-Day Free Trial" : actionModal.action === "upgrade" ? "⚡ Upgrade Plan" : `Confirm Admin Action: ${actionModal.action}`}
            </h3>

            {actionModal.action === "grant_trial" && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 12px" }}>
                  Granting a 7-day free trial will activate premium features instantly for <b>{actionModal.userName || "this user"}</b>.
                </p>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#D97706" }}>
                  Select Plan for 7-Day Free Trial:
                </label>
                <select
                  value={actionModal.targetPlanId || "premium"}
                  onChange={(e) => setActionModal({ ...actionModal, targetPlanId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 600 }}
                >
                  <optgroup label="Customer Plans">
                    {Object.values(CUSTOMER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Shop Owner Plans">
                    {Object.values(SHOP_OWNER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {actionModal.action === "upgrade" && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 12px" }}>
                  Upgrade plan for <b>{actionModal.userName || "this user"}</b>:
                </p>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#16A34A" }}>
                  Select Target Plan:
                </label>
                <select
                  value={actionModal.targetPlanId || "pro"}
                  onChange={(e) => setActionModal({ ...actionModal, targetPlanId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}
                >
                  <optgroup label="Customer Plans">
                    {Object.values(CUSTOMER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Shop Owner Plans">
                    {Object.values(SHOP_OWNER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>

                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#334155" }}>
                  Billing Cycle:
                </label>
                <select
                  value={actionModal.targetBillingCycle || "monthly"}
                  onChange={(e) => setActionModal({ ...actionModal, targetBillingCycle: e.target.value as "monthly" | "yearly" })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 600 }}
                >
                  <option value="monthly">Monthly Billing</option>
                  <option value="yearly">Yearly Billing (2 Months Free)</option>
                </select>
              </div>
            )}

            {actionModal.action !== "grant_trial" && actionModal.action !== "upgrade" && (
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px" }}>
                Are you sure you want to execute <b>{actionModal.action}</b> on this subscription? This will update user access immediately.
              </p>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={handleExecuteSingleAction}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  background: actionModal.action === "grant_trial" ? "#D97706" : actionModal.action === "delete" ? "#DC2626" : "#16A34A",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {busy ? "Executing..." : "Confirm Action"}
              </button>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                style={{ padding: "12px 18px", borderRadius: "10px", background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155", fontWeight: 600, cursor: "pointer" }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK ACTION CONFIRMATION MODAL */}
      {bulkActionModal && (
        <div className="modalLayer" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setBulkActionModal(null)}>
          <div style={{ maxWidth: "480px", width: "90%", background: "#FFFFFF", borderRadius: "20px", padding: "28px", margin: "auto", color: "#0F172A", border: "2px solid #2563EB", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "20px", fontWeight: 850, color: "#1D4ED8" }}>
              Execute Bulk Action ({selectedIds.length} Selected)
            </h3>

            {bulkActionModal.action === "bulk_trial" && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 12px" }}>
                  Grant a <b>7-Day Free Trial</b> to all <b>{selectedIds.length} selected subscribers</b>.
                </p>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#D97706" }}>
                  Target Plan for Trial:
                </label>
                <select
                  value={bulkActionModal.targetPlanId || "premium"}
                  onChange={(e) => setBulkActionModal({ ...bulkActionModal, targetPlanId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 600 }}
                >
                  <optgroup label="Customer Plans">
                    {Object.values(CUSTOMER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Shop Owner Plans">
                    {Object.values(SHOP_OWNER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            )}

            {bulkActionModal.action === "bulk_upgrade" && (
              <div style={{ marginBottom: "20px" }}>
                <p style={{ color: "#475569", fontSize: "14px", margin: "0 0 12px" }}>
                  Upgrade all <b>{selectedIds.length} selected subscribers</b> immediately:
                </p>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#16A34A" }}>
                  Target Plan:
                </label>
                <select
                  value={bulkActionModal.targetPlanId || "starter"}
                  onChange={(e) => setBulkActionModal({ ...bulkActionModal, targetPlanId: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", marginBottom: "12px", fontSize: "14px", fontWeight: 600 }}
                >
                  <optgroup label="Customer Plans">
                    {Object.values(CUSTOMER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Shop Owner Plans">
                    {Object.values(SHOP_OWNER_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>

                <label style={{ display: "block", fontSize: "13px", fontWeight: 700, marginBottom: "6px", color: "#334155" }}>
                  Billing Cycle:
                </label>
                <select
                  value={bulkActionModal.targetBillingCycle || "monthly"}
                  onChange={(e) => setBulkActionModal({ ...bulkActionModal, targetBillingCycle: e.target.value as "monthly" | "yearly" })}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", background: "#F8FAFC", color: "#0F172A", border: "1px solid #CBD5E1", fontSize: "14px", fontWeight: 600 }}
                >
                  <option value="monthly">Monthly Billing</option>
                  <option value="yearly">Yearly Billing (2 Months Free)</option>
                </select>
              </div>
            )}

            {bulkActionModal.action === "bulk_deactivate" && (
              <p style={{ color: "#475569", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px" }}>
                Are you sure you want to <b>deactivate</b> all <b>{selectedIds.length} selected subscriptions</b>?
              </p>
            )}

            {bulkActionModal.action === "bulk_delete" && (
              <p style={{ color: "#DC2626", fontSize: "14px", lineHeight: 1.5, margin: "0 0 24px" }}>
                ⚠️ Are you sure you want to <b>PERMANENTLY DELETE</b> all <b>{selectedIds.length} selected subscription records</b>? This action cannot be undone.
              </p>
            )}

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={handleExecuteBulkAction}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "10px",
                  background: bulkActionModal.action === "bulk_delete" ? "#DC2626" : bulkActionModal.action === "bulk_trial" ? "#D97706" : "#16A34A",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {busy ? "Executing..." : `Confirm ${bulkActionModal.action.replace("bulk_", "").toUpperCase()}`}
              </button>
              <button
                type="button"
                onClick={() => setBulkActionModal(null)}
                style={{ padding: "12px 18px", borderRadius: "10px", background: "#F1F5F9", border: "1px solid #CBD5E1", color: "#334155", fontWeight: 600, cursor: "pointer" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
