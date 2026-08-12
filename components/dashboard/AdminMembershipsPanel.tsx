"use client";

import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/client-api";
import { Crown, Users, CheckCircle2, XCircle, Clock, ShieldCheck, Search, Filter, Trash, RefreshCw, AlertCircle, Store, Calendar, Download, BarChart3 } from "lucide-react";

export function AdminMembershipsPanel() {
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // Per-store member view
  const [activeTab, setActiveTab] = useState<"all" | "store">("all");
  const [selectedStoreId, setSelectedStoreId] = useState("");
  const [storeMembers, setStoreMembers] = useState<any[]>([]);
  const [storeMembersLoading, setStoreMembersLoading] = useState(false);
  const [storeMemberSearch, setStoreMemberSearch] = useState("");

  // Unique stores derived from plans
  const storeList = Array.from(
    new Map(plans.map((p) => [p.store_id, { id: p.store_id, name: p.store_name || p.store_id }])).values()
  );

  useEffect(() => {
    loadMemberships();
  }, [query, statusFilter]);

  async function loadMemberships() {
    setLoading(true);
    setError("");
    try {
      const search = new URLSearchParams();
      if (query) search.set("query", query);
      if (statusFilter) search.set("status", statusFilter);

      const res = await apiFetch<{
        purchases: any[];
        stats: any;
        plans: any[];
      }>(`/api/admin/memberships?${search.toString()}`);

      setPurchases(res?.purchases ?? []);
      setStats(res?.stats ?? {});
      setPlans(res?.plans ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cross-store memberships dataset.");
    } finally {
      setLoading(false);
    }
  }

  async function loadStoreMembers(storeId: string) {
    if (!storeId) { setStoreMembers([]); return; }
    setStoreMembersLoading(true);
    try {
      const res = await apiFetch<{ purchases: any[] }>(`/api/admin/memberships?storeId=${storeId}&limit=200`);
      setStoreMembers(res?.purchases ?? []);
    } catch {
      setStoreMembers([]);
    } finally {
      setStoreMembersLoading(false);
    }
  }

  function exportStoreCsv() {
    if (!storeMembers.length) return;
    const rows = [
      ["Customer Name", "Email", "Plan", "Amount Paid", "UTR", "Status", "Starts At", "Expires At", "Days Remaining"].join(","),
      ...storeMembers.map((m) => {
        const now = Math.floor(Date.now() / 1000);
        const daysLeft = m.expiresAt ? Math.max(0, Math.ceil((m.expiresAt - now) / 86400)) : "N/A";
        return [
          `"${m.customerName}"`, `"${m.customerEmail}"`, `"${m.planName}"`,
          m.amountPaid, `"${m.utr || ""}"`, m.status,
          m.startsAt ? new Date(m.startsAt * 1000).toLocaleDateString("en-IN") : "",
          m.expiresAt ? new Date(m.expiresAt * 1000).toLocaleDateString("en-IN") : "",
          daysLeft,
        ].join(",");
      }),
    ].join("\n");
    const blob = new Blob([rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `members-${selectedStoreId}-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }


  async function handleAction(purchaseId: string, action: "accept" | "reject" | "revoke" | "delete") {
    setActionId(purchaseId);
    setError("");
    try {
      let rejectionReason = "";
      if (action === "revoke" || action === "reject") {
        rejectionReason = window.prompt("Reason for cancellation / rejection (displayed to user):", "Action taken by Administrator.") || "Action taken by Administrator";
      } else if (action === "delete") {
        if (!window.confirm("Permanently delete this customer membership record?")) {
          setActionId(null);
          return;
        }
      }

      const res = await apiFetch<{ success: boolean; message: string }>("/api/admin/memberships", {
        method: "POST",
        json: { purchaseId, action, rejectionReason }
      });

      setToast(res.message || "Membership updated.");
      loadMemberships();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionId(null);
    }
  }

  if (loading && purchases.length === 0) {
    return <div style={{ padding: "30px", color: "#94A3B8", textAlign: "center" }}>Loading platform cross-store memberships data...</div>;
  }

  // --- per-store helper ---
  const now = Math.floor(Date.now() / 1000);
  const filteredStoreMembers = storeMemberSearch
    ? storeMembers.filter((m) =>
        m.customerName?.toLowerCase().includes(storeMemberSearch.toLowerCase()) ||
        m.customerEmail?.toLowerCase().includes(storeMemberSearch.toLowerCase()) ||
        m.planName?.toLowerCase().includes(storeMemberSearch.toLowerCase())
      )
    : storeMembers;
  const selectedStoreName = storeList.find((s) => s.id === selectedStoreId)?.name ?? selectedStoreId;
  const storeActiveCount = storeMembers.filter((m) => m.status === "active").length;
  const storeRevenue = storeMembers.filter((m) => m.status === "active").reduce((s, m) => s + (m.amountPaid || 0), 0);
  const storeAvgPaid = storeActiveCount > 0 ? (storeRevenue / storeActiveCount).toFixed(0) : 0;

  function DaysLeftPill({ expiresAt }: { expiresAt: number | null }) {
    if (!expiresAt) return <span style={{ color: "#94A3B8", fontSize: "11px" }}>—</span>;
    const days = Math.ceil((expiresAt - now) / 86400);
    if (days < 0) return <span style={{ background: "rgba(239,68,68,0.2)", color: "#F87171", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>EXPIRED</span>;
    if (days <= 7) return <span style={{ background: "rgba(234,179,8,0.2)", color: "#FACC15", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>{days}d left</span>;
    return <span style={{ background: "rgba(16,185,129,0.2)", color: "#4ADE80", padding: "2px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: 800 }}>{days}d left</span>;
  }


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#4ADE80", padding: "12px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} /> {toast}
        </div>
      )}
      {error && (
        <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #EF4444", color: "#F87171", padding: "12px 16px", borderRadius: "10px", fontWeight: 800, fontSize: "14px" }}>
          {error}
        </div>
      )}

      {/* TAB SWITCHER */}
      <div style={{ display: "flex", gap: "8px", background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "6px" }}>
        {(["all", "store"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setActiveTab(t)}
            style={{
              flex: 1, padding: "10px", borderRadius: "10px", fontWeight: 800, fontSize: "13px", cursor: "pointer", border: "none",
              background: activeTab === t ? "rgba(99,102,241,0.25)" : "transparent",
              color: activeTab === t ? "#818CF8" : "#94A3B8",
              transition: "all 0.2s"
            }}
          >
            {t === "all" ? "🌐 All Memberships" : "🏪 Store Member View"}
          </button>
        ))}
      </div>


      {/* ========= ALL MEMBERSHIPS TAB ========= */}
      {activeTab === "all" && (
        <>

      {/* METRICS STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Total Platform Membership Sales</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#818CF8", marginTop: "4px" }}>{stats.totalPurchases || 0}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Active Platform VIP Members</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#4ADE80", marginTop: "4px" }}>{stats.activeMembers || 0}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Pending Verification Requests</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#FBBF24", marginTop: "4px" }}>{stats.pendingVerifications || 0}</div>
        </div>
        <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(236,72,153,0.3)", borderRadius: "14px", padding: "16px" }}>
          <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>Gross Membership GMV</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#F472B6", marginTop: "4px" }}>₹{stats.totalVolume || 0}</div>
        </div>
      </div>

      {/* SEARCH TOOLBAR */}
      <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", padding: "14px 18px", borderRadius: "14px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: "220px", position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer name, email, plan name, store, or UTR..."
            style={{ width: "100%", background: "#1E293B", border: "1px solid #475569", color: "#FFF", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ background: "#1E293B", border: "1px solid #475569", color: "#FFF", padding: "10px", borderRadius: "8px", fontSize: "13px" }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active VIP Members</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="rejected">Rejected</option>
          <option value="cancelled_by_owner">Cancelled / Revoked</option>
        </select>

        <button type="button" onClick={loadMemberships} className="portalButton secondary" style={{ margin: 0, padding: "10px 14px" }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* CROSS-STORE CUSTOMER MEMBERSHIPS TABLE */}
      <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Crown size={20} style={{ color: "#FBBF24" }} /> All Store Customer Memberships ({purchases.length})
        </h3>

        {purchases.length === 0 ? (
          <div style={{ padding: "24px", color: "#94A3B8", textAlign: "center", fontSize: "14px" }}>No customer store memberships found matching your search.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#FFF" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94A3B8" }}>
                  <th style={{ padding: "10px" }}>Store Name</th>
                  <th style={{ padding: "10px" }}>Customer</th>
                  <th style={{ padding: "10px" }}>Plan Purchased</th>
                  <th style={{ padding: "10px" }}>Amount Paid</th>
                  <th style={{ padding: "10px" }}>UTR Ref</th>
                  <th style={{ padding: "10px" }}>Date & Time</th>
                  <th style={{ padding: "10px" }}>Status</th>
                  <th style={{ padding: "10px", textAlign: "right" }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={{ padding: "10px", fontWeight: 800, color: "#818CF8" }}>{p.storeName}</td>
                    <td style={{ padding: "10px" }}>
                      <b style={{ color: "#FFF" }}>{p.customerName}</b><br />
                      <span style={{ fontSize: "11px", color: "#94A3B8" }}>{p.customerEmail || "No Email"}</span>
                    </td>
                    <td style={{ padding: "10px", fontWeight: 800, color: "#FBBF24" }}>{p.planName}</td>
                    <td style={{ padding: "10px", fontWeight: 900, color: "#4ADE80" }}>₹{p.amountPaid}</td>
                    <td style={{ padding: "10px" }}><code style={{ color: "#CBD5E1" }}>{p.utr || "N/A"}</code></td>
                    <td style={{ padding: "10px", color: "#94A3B8" }}>{p.createdAt ? new Date(p.createdAt * 1000).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }) : "N/A"}</td>
                    <td style={{ padding: "10px" }}>
                      <span style={{
                        background: p.status === "active" ? "rgba(16,185,129,0.2)" : p.status === "pending_verification" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                        color: p.status === "active" ? "#4ADE80" : p.status === "pending_verification" ? "#FBBF24" : "#F87171",
                        padding: "3px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "10px", textTransform: "uppercase"
                      }}>
                        {p.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                        {p.status === "pending_verification" && (
                          <button
                            type="button"
                            disabled={actionId === p.id}
                            onClick={() => handleAction(p.id, "accept")}
                            style={{ background: "#10B981", color: "#FFF", border: "none", padding: "4px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                          >
                            Accept
                          </button>
                        )}
                        {p.status === "active" && (
                          <button
                            type="button"
                            disabled={actionId === p.id}
                            onClick={() => handleAction(p.id, "revoke")}
                            style={{ background: "rgba(239,68,68,0.2)", color: "#F87171", border: "1px solid rgba(239,68,68,0.4)", padding: "4px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                          >
                            Revoke
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={actionId === p.id}
                          onClick={() => handleAction(p.id, "delete")}
                          style={{ background: "rgba(255,255,255,0.1)", color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PLATFORM STORE MEMBERSHIP PLANS LIST */}
      <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Store size={20} style={{ color: "#818CF8" }} /> Published Store Membership Plans ({plans.length})
        </h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#FFF" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94A3B8" }}>
                <th style={{ padding: "8px" }}>Store</th>
                <th style={{ padding: "8px" }}>Plan Name</th>
                <th style={{ padding: "8px" }}>Price & Duration</th>
                <th style={{ padding: "8px" }}>Free Trial</th>
                <th style={{ padding: "8px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((pl) => (
                <tr key={pl.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "8px", fontWeight: 800, color: "#818CF8" }}>{pl.store_name || pl.store_id}</td>
                  <td style={{ padding: "8px", fontWeight: 800 }}>{pl.name}</td>
                  <td style={{ padding: "8px", color: "#4ADE80", fontWeight: 800 }}>₹{pl.price} / {pl.duration_days} days</td>
                  <td style={{ padding: "8px" }}>{pl.has_free_trial ? <span style={{ color: "#818CF8", fontWeight: 800 }}>⚡ {pl.free_trial_days || 7} Days Free</span> : "No"}</td>
                  <td style={{ padding: "8px" }}>
                    <span style={{ background: pl.is_active ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: pl.is_active ? "#4ADE80" : "#F87171", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800 }}>
                      {pl.is_active ? "PUBLISHED" : "DRAFT"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* end all-memberships tab */}
      </>
      )}

      {/* ========= STORE MEMBER VIEW TAB ========= */}
      {activeTab === "store" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Store selector */}
          <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px 20px", borderRadius: "14px", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
            <Store size={18} style={{ color: "#818CF8", flexShrink: 0 }} />
            <select
              value={selectedStoreId}
              onChange={(e) => { setSelectedStoreId(e.target.value); void loadStoreMembers(e.target.value); }}
              style={{ flex: 1, minWidth: "220px", background: "#1E293B", border: "1px solid #475569", color: "#FFF", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}
            >
              <option value="">— Select a Store —</option>
              {storeList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            {selectedStoreId && (
              <>
                <input
                  type="text"
                  value={storeMemberSearch}
                  onChange={(e) => setStoreMemberSearch(e.target.value)}
                  placeholder="Search member name, email, plan..."
                  style={{ flex: 2, minWidth: "200px", background: "#1E293B", border: "1px solid #475569", color: "#FFF", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}
                />
                <button
                  type="button"
                  onClick={exportStoreCsv}
                  style={{ background: "rgba(16,185,129,0.15)", color: "#4ADE80", border: "1px solid rgba(16,185,129,0.4)", padding: "10px 16px", borderRadius: "8px", fontWeight: 800, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Download size={14} /> Export CSV
                </button>
              </>
            )}
          </div>

          {selectedStoreId && !storeMembersLoading && (
            <>
              {/* Store stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
                {[
                  { label: "Total Members", value: storeMembers.length, color: "#818CF8" },
                  { label: "Active VIP", value: storeActiveCount, color: "#4ADE80" },
                  { label: "Gross Revenue", value: `₹${storeRevenue.toLocaleString("en-IN")}`, color: "#F472B6" },
                  { label: "Avg. Paid", value: `₹${storeAvgPaid}`, color: "#FBBF24" },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px", padding: "14px" }}>
                    <div style={{ fontSize: "11px", color: "#94A3B8", textTransform: "uppercase", fontWeight: 800 }}>{stat.label}</div>
                    <div style={{ fontSize: "22px", fontWeight: 900, color: stat.color, marginTop: "4px" }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Member table */}
              <div style={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "18px", padding: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#FFF", margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <BarChart3 size={18} style={{ color: "#818CF8" }} /> Members of {selectedStoreName} ({filteredStoreMembers.length})
                </h3>
                {filteredStoreMembers.length === 0 ? (
                  <div style={{ padding: "24px", color: "#94A3B8", textAlign: "center" }}>No members found.</div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", color: "#FFF" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", textAlign: "left", color: "#94A3B8" }}>
                          <th style={{ padding: "10px" }}>Customer</th>
                          <th style={{ padding: "10px" }}>Plan</th>
                          <th style={{ padding: "10px" }}>Paid</th>
                          <th style={{ padding: "10px" }}>UTR</th>
                          <th style={{ padding: "10px" }}>Joined</th>
                          <th style={{ padding: "10px" }}>Expires</th>
                          <th style={{ padding: "10px" }}>Days Left</th>
                          <th style={{ padding: "10px" }}>Status</th>
                          <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStoreMembers.map((m) => (
                          <tr key={m.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <td style={{ padding: "10px" }}>
                              <b style={{ color: "#FFF" }}>{m.customerName}</b><br />
                              <span style={{ fontSize: "11px", color: "#94A3B8" }}>{m.customerEmail || "No email"}</span>
                            </td>
                            <td style={{ padding: "10px", fontWeight: 800, color: "#FBBF24" }}>{m.planName}</td>
                            <td style={{ padding: "10px", fontWeight: 900, color: "#4ADE80" }}>₹{m.amountPaid}</td>
                            <td style={{ padding: "10px" }}><code style={{ color: "#CBD5E1" }}>{m.utr || "N/A"}</code></td>
                            <td style={{ padding: "10px", color: "#94A3B8", fontSize: "11px" }}>
                              {m.startsAt ? new Date(m.startsAt * 1000).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td style={{ padding: "10px", color: "#94A3B8", fontSize: "11px" }}>
                              {m.expiresAt ? new Date(m.expiresAt * 1000).toLocaleDateString("en-IN") : "—"}
                            </td>
                            <td style={{ padding: "10px" }}><DaysLeftPill expiresAt={m.expiresAt} /></td>
                            <td style={{ padding: "10px" }}>
                              <span style={{
                                background: m.status === "active" ? "rgba(16,185,129,0.2)" : m.status === "pending_verification" ? "rgba(245,158,11,0.2)" : "rgba(239,68,68,0.2)",
                                color: m.status === "active" ? "#4ADE80" : m.status === "pending_verification" ? "#FBBF24" : "#F87171",
                                padding: "3px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "10px", textTransform: "uppercase"
                              }}>
                                {m.status}
                              </span>
                            </td>
                            <td style={{ padding: "10px", textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                {m.status === "active" && (
                                  <button
                                    type="button"
                                    disabled={actionId === m.id}
                                    onClick={() => void handleAction(m.id, "revoke")}
                                    style={{ background: "rgba(239,68,68,0.2)", color: "#F87171", border: "1px solid rgba(239,68,68,0.4)", padding: "4px 8px", borderRadius: "6px", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
                                  >
                                    Revoke
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={actionId === m.id}
                                  onClick={() => void handleAction(m.id, "delete")}
                                  style={{ background: "rgba(255,255,255,0.1)", color: "#CBD5E1", border: "1px solid rgba(255,255,255,0.2)", padding: "4px 8px", borderRadius: "6px", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {storeMembersLoading && (
            <div style={{ padding: "30px", color: "#94A3B8", textAlign: "center" }}>Loading store members...</div>
          )}

          {!selectedStoreId && (
            <div style={{ padding: "40px", color: "#64748B", textAlign: "center", background: "rgba(15,23,42,0.5)", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Store size={40} style={{ opacity: 0.4, marginBottom: "12px" }} />
              <p style={{ margin: 0 }}>Select a store above to see its VIP members, expiry countdown, and revenue stats.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
