"use client";

import { useState, useEffect, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { CheckCircle2, Wallet, Sparkles, Tag, Plus, Trash2, ShieldCheck, Coins } from "lucide-react";

interface Coupon {
  code: string;
  discount: number;
  limit: number;
  used: number;
  active: boolean;
}

export function AdminWalletPanel() {
  const [settings, setSettings] = useState({
    pointEarningRate: 1,
    probabilityDistribution: "linear",
    fixedCommissionAmount: 50,
    minimumPlanPrice: 80,
    bundleToggleEnabled: true,
    rewardCatalog: "Kynisto Premium 1-Month Extension, ₹200 Store Voucher, Exclusive Pass, Priority Queue Upgrade",
    coupons: [
      { code: "KYNISTO100", discount: 100, limit: 50, used: 12, active: true },
      { code: "WELCOME50", discount: 50, limit: 100, used: 34, active: true },
    ] as Coupon[],
  });

  const [newCoupon, setNewCoupon] = useState({ code: "", discount: 50, limit: 100 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await apiFetch<any>("/api/admin/wallet-settings");
      if (res && typeof res === "object") {
        setSettings((prev) => ({
          ...prev,
          ...res,
          coupons: Array.isArray(res.coupons) ? res.coupons : prev.coupons,
        }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wallet settings");
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(updatedSettings: typeof settings) {
    setError("");
    try {
      await apiFetch("/api/admin/wallet-settings", {
        method: "POST",
        json: updatedSettings,
      });
      setSettings(updatedSettings);
      setToast("Settings saved successfully!");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    }
  }

  function handleAddCoupon(e: FormEvent) {
    e.preventDefault();
    if (!newCoupon.code.trim()) return;
    const code = newCoupon.code.trim().toUpperCase();
    if (settings.coupons.some((c) => c.code === code)) {
      setError(`Coupon code ${code} already exists.`);
      return;
    }
    const updated = {
      ...settings,
      coupons: [
        ...settings.coupons,
        { code, discount: Number(newCoupon.discount), limit: Number(newCoupon.limit), used: 0, active: true },
      ],
    };
    setNewCoupon({ code: "", discount: 50, limit: 100 });
    void saveSettings(updated);
  }

  function handleDeleteCoupon(code: string) {
    const updated = {
      ...settings,
      coupons: settings.coupons.filter((c) => c.code !== code),
    };
    void saveSettings(updated);
  }

  function handleToggleCoupon(code: string) {
    const updated = {
      ...settings,
      coupons: settings.coupons.map((c) => (c.code === code ? { ...c, active: !c.active } : c)),
    };
    void saveSettings(updated);
  }

  if (loading) return <div className="portalSkeleton"><span /><span /><span /></div>;

  return (
    <div className="portalGrid" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {error && <p className="authError" role="alert">{error}</p>}
      {toast && <div className="portalToast"><CheckCircle2 size={18} /> {toast}</div>}

      {/* 1. Wallet & Commission Controls */}
      <section className="portalCard">
        <div className="portalCardHeader">
          <h2><Wallet className="inline-block mr-2" size={20} /> Kynisto Wallet & Commission Controls</h2>
          <small>Configure platform rewards, loyalty points, and fixed store membership commissions</small>
        </div>

        <form className="portalForm" onSubmit={(e) => { e.preventDefault(); void saveSettings(settings); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <label>
              Fixed Kynisto Commission (₹)
              <input
                type="number"
                min={0}
                value={settings.fixedCommissionAmount}
                onChange={(e) => setSettings({ ...settings, fixedCommissionAmount: Number(e.target.value) })}
                required
              />
              <small style={{ color: "#94A3B8" }}>Fixed fee charged per store membership plan sold (Default: ₹50)</small>
            </label>

            <label>
              Minimum Membership Plan Price (₹)
              <input
                type="number"
                min={1}
                value={settings.minimumPlanPrice}
                onChange={(e) => setSettings({ ...settings, minimumPlanPrice: Number(e.target.value) })}
                required
              />
              <small style={{ color: "#94A3B8" }}>Minimum floor price for store owners (Default: ₹80)</small>
            </label>
          </div>

          <label>
            Kynisto Points Multiplier
            <input
              type="number"
              step="0.1"
              min={0.1}
              value={settings.pointEarningRate}
              onChange={(e) => setSettings({ ...settings, pointEarningRate: Number(e.target.value) })}
              required
            />
          </label>

          <label className="full">
            Random Platform Reward Items (Comma separated)
            <textarea
              rows={3}
              value={settings.rewardCatalog}
              onChange={(e) => setSettings({ ...settings, rewardCatalog: e.target.value })}
            />
          </label>

          <label className="full" style={{ display: "flex", alignItems: "center", gap: "10px", flexDirection: "row" }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={settings.bundleToggleEnabled}
              onChange={(e) => setSettings({ ...settings, bundleToggleEnabled: e.target.checked })}
            />
            <b>Enable Automatic Kynisto Premium Subscription Bundle on Store Membership Purchase</b>
          </label>

          <div className="formActions">
            <button className="portalButton" type="submit">Save Commission & Wallet Controls</button>
          </div>
        </form>
      </section>

      {/* 2. Admin Coupon & Discount Manager */}
      <section className="portalCard">
        <div className="portalCardHeader">
          <h2><Tag className="inline-block mr-2" size={20} /> Admin Coupon & Discount Controls</h2>
          <small>Create, limit, activate and delete discount coupons for Kynisto Points & memberships</small>
        </div>

        <form onSubmit={handleAddCoupon} style={{ display: "flex", gap: "12px", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap" }}>
          <label style={{ flex: 1 }}>
            <small style={{ color: "#cbd5e1", fontWeight: 600 }}>Coupon Code</small>
            <input
              placeholder="e.g. FESTIVE200"
              value={newCoupon.code}
              onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
              required
              style={{ textTransform: "uppercase" }}
            />
          </label>
          <label style={{ width: "130px" }}>
            <small style={{ color: "#cbd5e1", fontWeight: 600 }}>Discount (₹)</small>
            <input
              type="number"
              min={10}
              value={newCoupon.discount}
              onChange={(e) => setNewCoupon({ ...newCoupon, discount: Number(e.target.value) })}
              required
            />
          </label>
          <label style={{ width: "130px" }}>
            <small style={{ color: "#cbd5e1", fontWeight: 600 }}>Usage Limit</small>
            <input
              type="number"
              min={1}
              value={newCoupon.limit}
              onChange={(e) => setNewCoupon({ ...newCoupon, limit: Number(e.target.value) })}
              required
            />
          </label>
          <button className="portalButton" type="submit" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={16} /> Add Coupon
          </button>
        </form>

        <div className="workspaceList">
          {settings.coupons.map((coupon) => (
            <article key={coupon.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div>
                <b style={{ color: "#38bdf8", fontSize: "1.05rem" }}>{coupon.code}</b>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.9rem", color: "#cbd5e1" }}>
                  ₹{coupon.discount} Discount · {coupon.used} / {coupon.limit} Used
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => handleToggleCoupon(coupon.code)}
                  className={`statusPill ${coupon.active ? "active" : "disabled"}`}
                  style={{ cursor: "pointer" }}
                >
                  {coupon.active ? "Active" : "Disabled"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCoupon(coupon.code)}
                  style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", padding: "6px 12px", borderRadius: "8px", cursor: "pointer" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
          {settings.coupons.length === 0 && <p style={{ color: "#94a3b8", padding: "12px" }}>No coupons created yet.</p>}
        </div>
      </section>
    </div>
  );
}
