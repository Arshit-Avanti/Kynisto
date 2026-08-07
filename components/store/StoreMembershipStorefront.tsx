"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { CheckCircle2, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";

export function StoreMembershipStorefront({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPlans();
  }, [storeId]);

  async function loadPlans() {
    try {
      const res = await apiFetch<{ plans: any[] }>(`/api/memberships?storeId=${storeId}`);
      setPlans(res.plans ?? []);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(plan: any) {
    if (!window.confirm(`Confirm purchase of ${plan.name} for ₹${plan.price}?`)) return;
    setPurchasingId(plan.id);
    setError("");
    try {
      await apiFetch("/api/memberships/purchase", {
        method: "POST",
        json: { storeId, planId: plan.id },
      });
      setToast(`Successfully subscribed to ${plan.name}! Includes Kynisto Premium.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete purchase.");
    } finally {
      setPurchasingId(null);
    }
  }

  if (loading) return null;
  if (!plans.length) return null;

  return (
    <section className="portalCard" style={{ marginTop: "24px", background: "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,41,59,0.95) 100%)", border: "1px solid rgba(255, 87, 34, 0.4)", borderRadius: "16px", padding: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
            <Star style={{ color: "#FF5722" }} /> {storeName} Membership Plans
          </h3>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>Unlock exclusive VIP benefits, priority queuing, and discounts.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, rgba(255,87,34,0.2) 0%, rgba(229,57,53,0.2) 100%)", border: "1px solid rgba(255,87,34,0.4)", padding: "6px 14px", borderRadius: "20px" }}>
          <Sparkles size={14} style={{ color: "#FF8A00" }} />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF8A00" }}>Includes Kynisto Premium</span>
        </div>
      </div>

      {toast && <div className="portalToast" style={{ background: "#10B981", color: "#FFFFFF", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontWeight: 700 }}><CheckCircle2 size={18} /> {toast}</div>}
      {error && <div className="authError" style={{ color: "#EF4444", marginBottom: "16px", fontWeight: 700 }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
        {plans.map((plan) => (
          <div
            key={plan.id}
            style={{
              background: "rgba(30, 41, 59, 0.8)",
              border: `2px solid ${plan.badgeColor || "#FF5722"}`,
              borderRadius: "14px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: `0 8px 24px ${plan.badgeColor || "#FF5722"}22`,
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "18px", fontWeight: 800, color: "#FFFFFF" }}>{plan.name}</span>
                <span style={{ background: plan.badgeColor || "#FF5722", color: "#FFFFFF", fontSize: "11px", fontWeight: 800, padding: "3px 10px", borderRadius: "12px" }}>
                  {plan.durationDays} Days
                </span>
              </div>

              <div style={{ fontSize: "28px", fontWeight: 900, color: "#FFFFFF", marginBottom: "12px" }}>
                ₹{plan.price} <span style={{ fontSize: "13px", color: "#94A3B8", fontWeight: 600 }}>/ {plan.durationDays} days</span>
              </div>

              {plan.description && <p style={{ fontSize: "13px", color: "#CBD5E1", marginBottom: "16px" }}>{plan.description}</p>}

              <div style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "10px", padding: "10px 12px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 800, color: "#10B981", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShieldCheck size={14} /> Bonus Included
                </div>
                <div style={{ fontSize: "12px", color: "#FFFFFF", fontWeight: 700, marginTop: "2px" }}>
                  Kynisto Subscription & Points Rewards
                </div>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                {Array.isArray(plan.benefits) && plan.benefits.map((b: string, idx: number) => (
                  <li key={idx} style={{ fontSize: "13px", color: "#F8FAFC", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Zap size={14} style={{ color: "#FF8A00", flexShrink: 0 }} />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              disabled={purchasingId === plan.id}
              onClick={() => handlePurchase(plan)}
              style={{
                width: "100%",
                background: `linear-gradient(135deg, ${plan.badgeColor || "#FF5722"} 0%, #E53935 100%)`,
                color: "#FFFFFF",
                border: "none",
                padding: "12px",
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "14px",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(255, 87, 34, 0.3)",
              }}
            >
              {purchasingId === plan.id ? "Processing..." : "Purchase Membership"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
