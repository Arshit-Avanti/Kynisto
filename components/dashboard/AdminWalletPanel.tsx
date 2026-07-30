"use client";

import { useState, useEffect, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { CheckCircle2, ShieldAlert, Sparkles, Wallet, Coins, Percent } from "lucide-react";

export function AdminWalletPanel() {
  const [settings, setSettings] = useState({
    pointEarningRate: 1,
    probabilityDistribution: "linear",
    fixedCommissionAmount: 50,
    minimumPlanPrice: 80,
    bundleToggleEnabled: true,
    rewardCatalog: "Free Membership, Discount Coupon, Partner Offers, Gift Vouchers",
  });
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
        setSettings((prev) => ({ ...prev, ...res }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load wallet settings");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await apiFetch("/api/admin/wallet-settings", {
        method: "POST",
        json: settings,
      });
      setToast("Wallet & Membership settings saved successfully");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    }
  }

  if (loading) return <div>Loading Wallet Controls...</div>;

  return (
    <div className="portalGrid">
      {error && <p className="authError">{error}</p>}
      {toast && <div className="portalToast"><CheckCircle2 size={18} /> {toast}</div>}

      <section className="portalCard">
        <div className="portalCardHeader">
          <h2><Wallet className="inline-block mr-2" size={20} /> Kynisto Wallet & Commission Controls</h2>
          <small>Configure platform rewards, loyalty points, and fixed store membership commissions</small>
        </div>

        <form className="portalForm" onSubmit={handleSubmit}>
          <label>
            Fixed Kynisto Commission (₹)
            <input
              type="number"
              min={0}
              value={settings.fixedCommissionAmount}
              onChange={(e) => setSettings({ ...settings, fixedCommissionAmount: Number(e.target.value) })}
              required
            />
            <small style={{ color: "#94A3B8" }}>Fixed fee charged per membership plan sold (Default: ₹50)</small>
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
            <small style={{ color: "#94A3B8" }}>Floor price for store owners (Default: ₹80)</small>
          </label>

          <label>
            Kynisto Points Earning Rate Multiplier
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
            Reward Catalog & Partner Offers
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
            <b>Enable Automatic Kynisto Premium Bundle on Store Membership Purchase</b>
          </label>

          <div className="formActions">
            <button className="portalButton" type="submit">Save Admin Controls</button>
          </div>
        </form>
      </section>

      <section className="portalCard">
        <div className="portalCardHeader">
          <h2><Sparkles size={18} /> Platform Commission Summary</h2>
          <small>Live system metrics</small>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", padding: "12px 0" }}>
          <div style={{ background: "rgba(255,87,34,0.1)", border: "1px solid rgba(255,87,34,0.3)", padding: "16px", borderRadius: "12px" }}>
            <small style={{ color: "#FF8A00", fontWeight: 700 }}>Commission Rate</small>
            <h3 style={{ fontSize: "24px", color: "#FFFFFF", marginTop: "4px" }}>₹{settings.fixedCommissionAmount} / sale</h3>
          </div>
          <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", padding: "16px", borderRadius: "12px" }}>
            <small style={{ color: "#10B981", fontWeight: 700 }}>Min Plan Price</small>
            <h3 style={{ fontSize: "24px", color: "#FFFFFF", marginTop: "4px" }}>₹{settings.minimumPlanPrice}</h3>
          </div>
        </div>
      </section>
    </div>
  );
}
