"use client";

import { useState, useEffect, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { CheckCircle2, Plus, Trash } from "lucide-react";

export function OwnerMembershipEditor({ storeId }: { storeId: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editingPlan, setEditingPlan] = useState<any>(null);

  useEffect(() => {
    loadPlans();
  }, [storeId]);

  async function loadPlans() {
    setLoading(true);
    try {
      const res = await apiFetch<{ plans: any[] }>(`/api/owner/memberships?storeId=${storeId}`);
      setPlans(res.plans);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this membership plan?")) return;
    try {
      await apiFetch(`/api/owner/memberships/${id}`, { method: "DELETE", json: { storeId } });
      setToast("Membership plan deleted");
      loadPlans();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete plan");
    }
  }

  if (loading) return <div>Loading membership plans...</div>;

  return (
    <div className="portalGrid">
      {error && <p className="authError">{error}</p>}
      {toast && <div className="portalToast"><CheckCircle2 size={18} /> {toast}</div>}

      <section className="portalCard">
        <div className="portalCardHeader">
          <h2>Create / Edit Membership Plan</h2>
          <small>Offer subscriptions to your customers</small>
        </div>
        <MembershipForm 
          storeId={storeId} 
          plan={editingPlan} 
          onSuccess={(msg) => {
            setToast(msg);
            setEditingPlan(null);
            loadPlans();
          }} 
          onError={setError} 
          onCancel={() => setEditingPlan(null)}
        />
      </section>

      <section className="portalCard">
        <div className="portalCardHeader">
          <h2>Current Membership Plans</h2>
          <small>{plans.length} plans</small>
        </div>
        {plans.map((p) => (
          <div className="catalogLine" key={p.id}>
            <p>
              <b>{p.name}</b>
              <small>₹{p.price} / {p.durationDays} days</small>
            </p>
            <div className="tableActions">
              <button onClick={() => setEditingPlan(p)}>Edit</button>
              <button onClick={() => handleDelete(p.id)}>Delete</button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <p className="profileEmpty">No membership plans created yet.</p>}
      </section>
    </div>
  );
}

function MembershipForm({ storeId, plan, onSuccess, onError, onCancel }: { storeId: string; plan?: any; onSuccess: (msg: string) => void; onError: (msg: string) => void; onCancel: () => void }) {
  const [price, setPrice] = useState<number | "">(plan?.price ?? "");
  const [benefits, setBenefits] = useState<string[]>(plan?.benefits ?? [""]);
  const [commissionAcknowledged, setCommissionAcknowledged] = useState(false);

  // Reset form when plan changes
  useEffect(() => {
    setPrice(plan?.price ?? "");
    setBenefits(plan?.benefits?.length ? plan.benefits : [""]);
    setCommissionAcknowledged(false);
  }, [plan]);

  const priceNum = typeof price === "number" ? price : parseFloat(price as string);
  const isPriceValid = !isNaN(priceNum) && priceNum >= 80;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!commissionAcknowledged) return;
    if (!isPriceValid) return;

    const fd = new FormData(e.currentTarget);
    const data = {
      storeId,
      name: fd.get("name"),
      price: priceNum,
      durationDays: Number(fd.get("durationDays")),
      description: fd.get("description"),
      badgeColor: fd.get("badgeColor"),
      planIcon: fd.get("planIcon"),
      isActive: fd.get("isActive") === "true",
      maxMembers: fd.get("maxMembers") ? Number(fd.get("maxMembers")) : null,
      termsAndConditions: fd.get("termsAndConditions"),
      benefits: benefits.filter(b => b.trim() !== ""),
      commissionAcknowledged
    };

    try {
      if (plan?.id) {
        await apiFetch(`/api/owner/memberships/${plan.id}`, { method: "PATCH", json: data });
        onSuccess("Membership plan updated");
      } else {
        await apiFetch("/api/owner/memberships", { method: "POST", json: data });
        onSuccess("Membership plan created");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save plan");
    }
  }

  return (
    <form className="portalForm" onSubmit={onSubmit}>
      <label className="full">Plan Name <input name="name" defaultValue={plan?.name} required /></label>
      
      <label>
        Price (₹) 
        <input 
          name="price" 
          type="number" 
          step="0.01" 
          value={price} 
          onChange={(e) => setPrice(e.target.value)} 
          required 
        />
        {price !== "" && !isPriceValid && (
          <span style={{ color: "red", fontSize: "0.85rem", marginTop: "4px", display: "block" }}>
            Minimum membership price is ₹80.
          </span>
        )}
      </label>
      
      <label>Duration (Days) <input name="durationDays" type="number" min="1" defaultValue={plan?.durationDays ?? 30} required /></label>
      
      <label className="full">Description <textarea name="description" defaultValue={plan?.description} required /></label>
      
      <label>Badge Color <input name="badgeColor" type="color" defaultValue={plan?.badgeColor ?? "#FF5722"} /></label>
      <label>Plan Icon <input name="planIcon" defaultValue={plan?.planIcon ?? "star"} /></label>
      
      <label>Active Status
        <select name="isActive" defaultValue={plan?.isActive === false ? "false" : "true"}>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </label>
      
      <label>Max Members <input name="maxMembers" type="number" min="1" defaultValue={plan?.maxMembers ?? ""} placeholder="Leave blank for unlimited" /></label>
      
      <label className="full">Terms & Conditions <textarea name="termsAndConditions" defaultValue={plan?.termsAndConditions} /></label>

      <div className="full" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <strong>Benefits</strong>
        {benefits.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              value={b} 
              onChange={(e) => {
                const newB = [...benefits];
                newB[i] = e.target.value;
                setBenefits(newB);
              }} 
              placeholder="E.g. 10% off all orders" 
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="portalButton secondary" 
              onClick={() => {
                const newB = [...benefits];
                newB.splice(i, 1);
                setBenefits(newB);
              }}
            >
              <Trash size={16} />
            </button>
          </div>
        ))}
        <button 
          type="button" 
          className="portalButton secondary" 
          style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "0.5rem" }} 
          onClick={() => setBenefits([...benefits, ""])}
        >
          <Plus size={16} /> Add Benefit
        </button>
      </div>

      <div className="full" style={{ background: "#fef2f2", padding: "1rem", borderRadius: "8px", border: "1px solid #fecaca", marginTop: "1rem" }}>
        <h4 style={{ margin: "0 0 0.5rem 0", color: "#991b1b" }}>Kynisto Commission Policy</h4>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#7f1d1d" }}>
          For every membership sold, a fixed commission of ₹50 is deducted by Kynisto.
        </p>
        {isPriceValid && (
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: "bold", color: "#7f1d1d" }}>
            Breakdown: Price (₹{priceNum}) - Commission (₹50) = You receive (₹{priceNum - 50})
          </p>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "#991b1b", fontWeight: 600 }}>
          <input 
            type="checkbox" 
            checked={commissionAcknowledged} 
            onChange={(e) => setCommissionAcknowledged(e.target.checked)} 
            required 
            style={{ width: "auto", margin: 0 }}
          />
          I understand the Kynisto commission policy.
        </label>
      </div>

      <div className="formActions full" style={{ marginTop: "1rem", gap: "1rem" }}>
        <button 
          className="portalButton" 
          type="submit" 
          disabled={!commissionAcknowledged || !isPriceValid}
        >
          {plan ? "Save Changes" : "Publish Plan"}
        </button>
        {plan && (
          <button type="button" className="portalButton secondary" onClick={onCancel}>
            Cancel Edit
          </button>
        )}
      </div>
    </form>
  );
}
