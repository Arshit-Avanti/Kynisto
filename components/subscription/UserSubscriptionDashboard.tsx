"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PlanConfig, getPlanConfig } from "@/lib/subscriptions";
import { MagneticButton } from "@/components/ui/MagneticButton";

interface SubscriptionData {
  id: string;
  planId: string;
  userRole: "customer" | "store_owner";
  billingCycle: "monthly" | "yearly";
  amount: number;
  status: string;
  autoRenew: boolean;
  startsAt: number;
  expiresAt: number;
  cancelledAt?: number;
  receiptNumber?: string;
  isExpired: boolean;
}

interface Transaction {
  id: string;
  planId: string;
  billingCycle: string;
  amount: number;
  paymentMethod: string;
  upiId: string;
  utr?: string;
  status: string;
  receiptNumber: string;
  createdAt: number;
}

export function UserSubscriptionDashboard() {
  const [subData, setSubData] = useState<{
    subscription: SubscriptionData;
    plan: PlanConfig;
    transactions: Transaction[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingAutoRenew, setTogglingAutoRenew] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

  // Live countdown state
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const fetchSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscriptions/me");
      if (!res.ok) throw new Error("Failed to load subscription status.");
      const data = await res.json();
      setSubData(data);
    } catch (err: any) {
      setError(err.message || "Error loading subscription.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Live countdown timer calculation
  useEffect(() => {
    if (!subData?.subscription?.expiresAt) return;

    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = subData.subscription.expiresAt - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = Math.floor(diff % 60);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [subData]);

  const handleToggleAutoRenew = async () => {
    setTogglingAutoRenew(true);
    try {
      const res = await fetch("/api/subscriptions/toggle-auto-renew", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchSubscription();
    } catch (err: any) {
      alert(err.message || "Could not toggle auto-renew.");
    } finally {
      setTogglingAutoRenew(false);
    }
  };

  const handleCancelSub = async () => {
    if (!confirm("Are you sure you want to cancel your auto-renewing subscription? You will retain access until the current period expires.")) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/subscriptions/cancel", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fetchSubscription();
    } catch (err: any) {
      alert(err.message || "Could not cancel subscription.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted, #94A3B8)" }}>
        Loading your subscription status...
      </div>
    );
  }

  if (error || !subData) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#EF4444" }}>
        ⚠️ {error || "Unable to load subscription information."}
      </div>
    );
  }

  const { subscription: sub, plan, transactions } = subData;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px 0" }}>
      {/* Active Plan Card */}
      <div
        className="argusCard argusHoverGlow"
        style={{
          borderRadius: "24px",
          padding: "32px",
          background: "linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(10,10,10,0.95) 100%)",
          border: "2px solid #22C55E",
          marginBottom: "32px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#22C55E", letterSpacing: "1.5px" }}>
              CURRENT ACTIVE PLAN
            </span>
            <h2 style={{ fontSize: "36px", fontWeight: 900, margin: "6px 0" }}>
              Kynisto {plan.name}
            </h2>
            <p style={{ color: "var(--muted, #94A3B8)", fontSize: "14px", margin: 0 }}>
              {plan.description}
            </p>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "28px", fontWeight: 900 }}>
              ₹{sub.billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly}
              <span style={{ fontSize: "14px", color: "var(--muted, #94A3B8)", fontWeight: 500 }}>
                /{sub.billingCycle === "yearly" ? "year" : "month"}
              </span>
            </div>
            <span
              style={{
                display: "inline-block",
                marginTop: "6px",
                padding: "4px 12px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 800,
                background: sub.status === "active" ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                color: sub.status === "active" ? "#22C55E" : "#EF4444",
                border: `1px solid ${sub.status === "active" ? "#22C55E" : "#EF4444"}`,
              }}
            >
              ● {sub.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Live Expiration Countdown */}
        {sub.expiresAt && sub.planId !== "free" && sub.planId !== "starter" && (
          <div
            style={{
              marginTop: "24px",
              padding: "20px",
              borderRadius: "16px",
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <strong style={{ fontSize: "14px", color: "var(--primary-text, #FFF)" }}>
                Subscription Expiry Countdown
              </strong>
              <div style={{ fontSize: "12px", color: "var(--muted, #94A3B8)", marginTop: "2px" }}>
                Valid until {new Date(sub.expiresAt * 1000).toLocaleDateString()}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", textAlign: "center" }}>
              {[
                { label: "DAYS", val: countdown.days },
                { label: "HOURS", val: countdown.hours },
                { label: "MINS", val: countdown.minutes },
                { label: "SECS", val: countdown.seconds },
              ].map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.06)", padding: "8px 12px", borderRadius: "10px", minWidth: "60px" }}>
                  <div style={{ fontSize: "20px", fontWeight: 900, color: "#22C55E" }}>{item.val}</div>
                  <div style={{ fontSize: "9px", color: "var(--muted, #94A3B8)", fontWeight: 700 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Auto Renew & Actions */}
        <div style={{ marginTop: "28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "14px", fontWeight: 700 }}>Auto-Renew Subscription</span>
            <button
              type="button"
              onClick={handleToggleAutoRenew}
              disabled={togglingAutoRenew}
              style={{
                width: "48px",
                height: "26px",
                borderRadius: "16px",
                background: sub.autoRenew ? "#22C55E" : "#334155",
                border: "none",
                padding: "3px",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "#FFF",
                  transform: sub.autoRenew ? "translateX(22px)" : "translateX(0)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>
          </div>

          <div style={{ display: "flex", gap: "12px" }}>
            <Link href={`/pricing?role=${plan.role}`}>
              <MagneticButton
                style={{
                  padding: "10px 20px",
                  borderRadius: "12px",
                  background: "#22C55E",
                  color: "#000",
                  fontWeight: 800,
                  fontSize: "13px",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Change / Upgrade Plan →
              </MagneticButton>
            </Link>

            {sub.status === "active" && sub.planId !== "free" && sub.planId !== "starter" && (
              <button
                type="button"
                onClick={handleCancelSub}
                disabled={cancelling}
                style={{
                  padding: "10px 16px",
                  borderRadius: "12px",
                  background: "transparent",
                  border: "1px solid #EF4444",
                  color: "#EF4444",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Cancel Subscription
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Features Grid */}
      <div style={{ marginBottom: "32px" }}>
        <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>Active Features Included</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
          {plan.features.map((feat, i) => (
            <div
              key={i}
              style={{
                background: "var(--argus-card, rgba(10,10,10,0.7))",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
              }}
            >
              <span style={{ color: "#22C55E", fontWeight: 900 }}>✓</span>
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription & Payment History Table */}
      <div>
        <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>Payment & Subscription History</h3>
        {transactions.length === 0 ? (
          <div style={{ color: "var(--muted, #94A3B8)", fontSize: "14px", padding: "20px 0" }}>
            No payment transactions recorded yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "var(--argus-card, rgba(10,10,10,0.85))", borderRadius: "16px" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.05)", textAlign: "left", fontSize: "13px", color: "var(--muted, #94A3B8)" }}>
                  <th style={{ padding: "14px 16px" }}>Date</th>
                  <th style={{ padding: "14px 16px" }}>Plan</th>
                  <th style={{ padding: "14px 16px" }}>Amount</th>
                  <th style={{ padding: "14px 16px" }}>Method</th>
                  <th style={{ padding: "14px 16px" }}>Receipt #</th>
                  <th style={{ padding: "14px 16px" }}>Status</th>
                  <th style={{ padding: "14px 16px", textAlign: "right" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn) => (
                  <tr key={txn.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "14px" }}>
                    <td style={{ padding: "14px 16px" }}>{new Date(txn.createdAt * 1000).toLocaleDateString()}</td>
                    <td style={{ padding: "14px 16px", fontWeight: 700 }}>{getPlanConfig(txn.planId).name}</td>
                    <td style={{ padding: "14px 16px" }}>₹{txn.amount}</td>
                    <td style={{ padding: "14px 16px", textTransform: "uppercase" }}>{txn.paymentMethod}</td>
                    <td style={{ padding: "14px 16px", fontFamily: "monospace" }}>{txn.receiptNumber}</td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ color: txn.status === "completed" ? "#22C55E" : "#EF4444", fontWeight: 700 }}>
                        {txn.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedReceipt(txn)}
                        style={{
                          background: "rgba(34,197,94,0.15)",
                          border: "1px solid #22C55E",
                          color: "#22C55E",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        📄 Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <div className="modalLayer" role="presentation" onMouseDown={(e) => e.currentTarget === e.target && setSelectedReceipt(null)}>
          <div
            style={{
              maxWidth: "480px",
              width: "90%",
              background: "#FFFFFF",
              color: "#000000",
              borderRadius: "20px",
              padding: "32px",
              margin: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ textAlign: "center", borderBottom: "2px dashed #CBD5E1", paddingBottom: "20px", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, color: "#0F172A" }}>KYNISTO</h2>
              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>Official Subscription Receipt</div>
              <div style={{ fontSize: "14px", fontWeight: 800, color: "#22C55E", marginTop: "8px" }}>
                Receipt #{selectedReceipt.receiptNumber}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Date:</span><b>{new Date(selectedReceipt.createdAt * 1000).toLocaleString()}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Plan:</span><b>Kynisto {getPlanConfig(selectedReceipt.planId).name}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Billing Cycle:</span><b>{selectedReceipt.billingCycle.toUpperCase()}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Payment Method:</span><b>UPI ({selectedReceipt.upiId})</b></div>
              {selectedReceipt.utr && <div style={{ display: "flex", justifyContent: "space-between" }}><span>UTR #:</span><b>{selectedReceipt.utr}</b></div>}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #E2E8F0", paddingTop: "10px", fontSize: "16px" }}><span>Total Paid:</span><b style={{ color: "#22C55E" }}>₹{selectedReceipt.amount}</b></div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: "12px", borderRadius: "10px", background: "#0F172A", color: "#FFF", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                🖨 Print / Download PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                style={{ padding: "12px 20px", borderRadius: "10px", background: "#E2E8F0", color: "#0F172A", fontWeight: 700, border: "none", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
