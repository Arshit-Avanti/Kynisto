"use client";

import { useEffect, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";

export function AdminWalletPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  
  const [settings, setSettings] = useState({
    pointEarningRate: 1,
    probabilityDistribution: "linear",
    fixedCommissionAmount: 50,
    minimumPlanPrice: 80,
    bundleToggleEnabled: true,
    rewardCatalog: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch<typeof settings>("/api/admin/wallet-settings");
        setSettings({ ...settings, ...data });
      } catch (e) {
        setError("Failed to load wallet settings.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    
    try {
      await apiFetch("/api/admin/wallet-settings", {
        method: "POST",
        json: settings,
      });
      setToast("Wallet settings updated successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="portalSkeleton"><span /><span /><span /></div>;

  return (
    <div className="portalGrid">
      <section className="portalCard">
        <div className="portalCardHeader">
          <h2>Wallet & Rewards Settings</h2>
          <small>Configure loyalty points and store membership parameters</small>
        </div>
        
        {error && <div className="authError">{error}</div>}
        {toast && <div className="portalToast">✓ {toast}</div>}

        <form className="portalForm" onSubmit={handleSubmit}>
          <label>
            Kynisto Point Earning Rate (%)
            <input 
              type="number" 
              step="0.1" 
              value={settings.pointEarningRate} 
              onChange={e => setSettings({...settings, pointEarningRate: Number(e.target.value)})} 
            />
          </label>
          
          <label>
            Reward Probability Distribution
            <select 
              value={settings.probabilityDistribution} 
              onChange={e => setSettings({...settings, probabilityDistribution: e.target.value})}
            >
              <option value="linear">Linear (Equal chances)</option>
              <option value="exponential">Exponential (Rare high rewards)</option>
              <option value="bell_curve">Bell Curve (Normal distribution)</option>
            </select>
          </label>

          <label>
            Fixed Commission Amount (₹)
            <input 
              type="number" 
              value={settings.fixedCommissionAmount} 
              onChange={e => setSettings({...settings, fixedCommissionAmount: Number(e.target.value)})} 
            />
          </label>

          <label>
            Minimum Plan Price (₹)
            <input 
              type="number" 
              value={settings.minimumPlanPrice} 
              onChange={e => setSettings({...settings, minimumPlanPrice: Number(e.target.value)})} 
            />
          </label>

          <label className="checkboxLabel">
            <input 
              type="checkbox" 
              checked={settings.bundleToggleEnabled} 
              onChange={e => setSettings({...settings, bundleToggleEnabled: e.target.checked})} 
            />
            Enable Kynisto Premium Bundle Integration
          </label>
          
          <label className="full">
            Reward Catalog (JSON Format)
            <textarea 
              rows={5} 
              value={settings.rewardCatalog} 
              onChange={e => setSettings({...settings, rewardCatalog: e.target.value})} 
              placeholder='[{"id": "reward1", "points": 100}]'
            />
          </label>

          <div className="formActions">
            <button className="portalButton" type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
