"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { Crown, Users, CheckCircle2, XCircle, Clock, ShieldCheck, Search, Filter, Trash, RefreshCw, AlertCircle, Store } from "lucide-react";

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
    </div>
  );
}
