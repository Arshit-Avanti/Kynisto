"use client";

import { useState, useEffect, type FormEvent } from "react";
import { apiFetch } from "@/lib/client-api";
import { CheckCircle2, Plus, Trash, QrCode, CreditCard, ShieldCheck, UserCheck, XCircle, Clock, Gift, Tag, Upload } from "lucide-react";

export function OwnerMembershipEditor({ storeId }: { storeId: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, [storeId]);

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [plansRes, purchasesRes, catalogRes] = await Promise.allSettled([
        apiFetch<{ plans: any[] }>(`/api/owner/memberships?storeId=${storeId}`),
        apiFetch<{ purchases: any[] }>(`/api/owner/memberships/purchases?storeId=${storeId}`),
        apiFetch<{ items: any[] }>(`/api/owner/catalog?storeId=${storeId}`)
      ]);

      if (plansRes.status === "fulfilled" && Array.isArray(plansRes.value?.plans)) {
        setPlans(plansRes.value.plans);
      } else {
        setPlans([]);
      }

      if (purchasesRes.status === "fulfilled" && Array.isArray(purchasesRes.value?.purchases)) {
        setPurchases(purchasesRes.value.purchases);
      } else {
        setPurchases([]);
      }

      if (catalogRes.status === "fulfilled" && Array.isArray(catalogRes.value?.items)) {
        setCoupons(catalogRes.value.items.filter((i: any) => i.type === "coupon" || i.category === "coupon"));
      } else {
        setCoupons([]);
      }
    } catch (e) {
      console.warn("Failed to load membership data", e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this membership plan?")) return;
    try {
      await apiFetch(`/api/owner/memberships/${id}`, { method: "DELETE", json: { storeId } });
      setToast("Membership plan deleted successfully");
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete plan");
    }
  }

  async function handleApprovePurchase(purchaseId: string, action: "accept" | "reject") {
    setActionId(purchaseId);
    setError("");
    try {
      const res = await apiFetch<{ success: boolean; message: string }>(`/api/owner/memberships/purchases`, {
        method: "POST",
        json: { purchaseId, action }
      });
      setToast(res.message || (action === "accept" ? "Membership accepted & activated!" : "Membership request rejected."));
      loadData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to process membership approval.");
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div style={{ padding: "24px", color: "#94A3B8", textAlign: "center" }}>Loading membership system & pending requests...</div>;

  const pendingPurchases = purchases.filter((p) => p.status === "pending_verification");
  const activePurchases = purchases.filter((p) => p.status === "active");

  return (
    <div className="portalGrid">
      {error && <p className="authError">{error}</p>}
      {toast && <div className="portalToast"><CheckCircle2 size={18} /> {toast}</div>}

      {/* PENDING MEMBER APPROVALS SECTION */}
      <section className="portalCard full" style={{ border: "2px solid #6366F1", background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.9) 100%)", borderRadius: "16px", padding: "20px" }}>
        <div className="portalCardHeader" style={{ marginBottom: "16px" }}>
          <h2 style={{ color: "#818CF8", display: "flex", alignItems: "center", gap: "10px", fontSize: "20px" }}>
            <UserCheck size={22} /> Pending Customer Member Approvals
            {pendingPurchases.length > 0 && (
              <span style={{ background: "#EF4444", color: "#FFF", fontSize: "12px", fontWeight: 900, padding: "2px 10px", borderRadius: "12px" }}>
                {pendingPurchases.length} PENDING
              </span>
            )}
          </h2>
          <small style={{ color: "#94A3B8" }}>Verify payment UTRs submitted by customers and activate their memberships with 1-click.</small>
        </div>

        {pendingPurchases.length === 0 ? (
          <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "12px", textAlign: "center", color: "#94A3B8", fontSize: "14px" }}>
            No pending customer membership purchase requests right now.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {pendingPurchases.map((p) => (
              <div key={p.id} style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(129, 140, 248, 0.4)", borderRadius: "14px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontWeight: 800, color: "#FFFFFF", fontSize: "16px" }}>{p.planName}</span>
                    <span style={{ background: "rgba(234, 179, 8, 0.2)", color: "#FACC15", border: "1px solid rgba(234, 179, 8, 0.4)", fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> Pending Verification
                    </span>
                  </div>

                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#4ADE80", marginBottom: "6px" }}>
                    ₹{p.amountPaid}
                  </div>

                  {/* EXACT PAYMENT DATE & TIME FOR SHOP OWNER */}
                  <div style={{ fontSize: "12px", color: "#CBD5E1", marginBottom: "8px", background: "rgba(99, 102, 241, 0.2)", border: "1px solid rgba(129, 140, 248, 0.3)", padding: "6px 10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={14} style={{ color: "#818CF8" }} />
                    <span>Paid Date & Time: <b style={{ color: "#FFF" }}>{p.createdAt ? new Date(p.createdAt * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Recently"}</b></span>
                  </div>

                  <div style={{ fontSize: "13px", color: "#CBD5E1", marginBottom: "8px" }}>
                    <b>Customer Name:</b> {p.customerName} <br />
                    <span style={{ fontSize: "12px", color: "#94A3B8" }}><b>Email:</b> {p.customerEmail || "No Email Provided"}</span>
                  </div>

                  <div style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(255, 255, 255, 0.1)", padding: "8px 12px", borderRadius: "8px", marginBottom: "14px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 800, color: "#818CF8", textTransform: "uppercase" }}>Payment UTR / Reference</div>
                    <div style={{ fontSize: "14px", fontWeight: 900, color: "#FFF", fontFamily: "monospace", marginTop: "2px" }}>
                      {p.utr || "Direct Payment Request (No UTR)"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    disabled={actionId === p.id}
                    onClick={() => handleApprovePurchase(p.id, "accept")}
                    style={{ flex: 1, background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFF", border: "none", padding: "10px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}
                  >
                    {actionId === p.id ? "Activating..." : "Accept & Activate"}
                  </button>
                  <button
                    type="button"
                    disabled={actionId === p.id}
                    onClick={() => handleApprovePurchase(p.id, "reject")}
                    style={{ background: "rgba(239,68,68,0.2)", color: "#F87171", border: "1px solid rgba(239,68,68,0.4)", padding: "10px 14px", borderRadius: "10px", fontWeight: 800, cursor: "pointer", fontSize: "13px" }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ACTIVE & APPROVED STORE VIP MEMBERS SECTION */}
      {activePurchases.length > 0 && (
        <section className="portalCard full" style={{ background: "rgba(15, 23, 42, 0.8)", border: "1px solid rgba(16, 185, 129, 0.4)", borderRadius: "16px", padding: "20px" }}>
          <div className="portalCardHeader" style={{ marginBottom: "16px" }}>
            <h2 style={{ color: "#4ADE80", display: "flex", alignItems: "center", gap: "10px", fontSize: "18px" }}>
              <CheckCircle2 size={20} /> Active VIP Store Members ({activePurchases.length})
            </h2>
            <small style={{ color: "#94A3B8" }}>Customers currently enjoying VIP privileges at your store.</small>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
            {activePurchases.map((m) => (
              <div key={m.id} style={{ background: "rgba(30, 41, 59, 0.6)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "12px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontWeight: 800, color: "#FFF", fontSize: "15px" }}>{m.planName}</span>
                  <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#4ADE80", border: "1px solid rgba(16, 185, 129, 0.4)", fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "6px" }}>
                    ACTIVE
                  </span>
                </div>
                <div style={{ fontSize: "13px", color: "#CBD5E1", marginBottom: "6px" }}>
                  <b>Member:</b> {m.customerName} ({m.customerEmail || "No Email"})
                </div>
                <div style={{ fontSize: "11px", color: "#94A3B8", display: "flex", flexDirection: "column", gap: "3px", background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "6px" }}>
                  <div><b>Payment Date & Time:</b> {m.createdAt ? new Date(m.createdAt * 1000).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A"}</div>
                  <div><b>UTR Ref:</b> <code style={{ color: "#818CF8" }}>{m.utr || "Direct Approval"}</code></div>
                  {m.expiresAt && <div><b>Expires On:</b> <span style={{ color: "#FACC15" }}>{new Date(m.expiresAt * 1000).toLocaleDateStyle("en-IN")}</span></div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CREATE / EDIT MEMBERSHIP PLAN SECTION */}
      <section className="portalCard">
        <div className="portalCardHeader">
          <h2>Create / Edit Membership Plan</h2>
          <small>Offer VIP subscriptions, UPI payments, and coupon loyalty rewards to your customers.</small>
        </div>
        <MembershipForm 
          storeId={storeId} 
          plan={editingPlan} 
          coupons={coupons}
          onSuccess={(msg) => {
            setToast(msg);
            setEditingPlan(null);
            loadData();
          }} 
          onError={setError} 
          onCancel={() => setEditingPlan(null)}
        />
      </section>

      {/* CURRENT MEMBERSHIP PLANS LIST SECTION */}
      <section className="portalCard">
        <div className="portalCardHeader">
          <h2>Current Membership Plans</h2>
          <small>{plans.length} active plans published</small>
        </div>
        {plans.map((p) => (
          <div className="catalogLine" key={p.id} style={{ flexDirection: "column", alignItems: "flex-start", gap: "10px", padding: "14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
              <div>
                <b style={{ fontSize: "16px", color: "#FFF" }}>{p.name}</b>
                <span style={{ marginLeft: "8px", background: p.badgeColor || "#FF5722", color: "#FFF", fontSize: "11px", fontWeight: 800, padding: "2px 8px", borderRadius: "10px" }}>
                  ₹{p.price} / {p.durationDays} days
                </span>
              </div>
              <div className="tableActions">
                <button onClick={() => setEditingPlan(p)}>Edit</button>
                <button onClick={() => handleDelete(p.id)} style={{ color: "#EF4444" }}>Delete</button>
              </div>
            </div>

            {p.upiId && (
              <div style={{ fontSize: "12px", color: "#818CF8", display: "flex", alignItems: "center", gap: "6px" }}>
                <CreditCard size={14} /> UPI ID: <b>{p.upiId}</b>
              </div>
            )}

            {p.qrCodeUrl && (
              <div style={{ fontSize: "12px", color: "#4ADE80", display: "flex", alignItems: "center", gap: "6px" }}>
                <QrCode size={14} /> QR Code Payment Photo Configured
              </div>
            )}

            {Array.isArray(p.linkedCouponIds) && p.linkedCouponIds.length > 0 && (
              <div style={{ fontSize: "12px", color: "#FBBF24", display: "flex", alignItems: "center", gap: "6px" }}>
                <Gift size={14} /> {p.linkedCouponIds.length} Loyalty Coupon Rewards Linked
              </div>
            )}
          </div>
        ))}
        {plans.length === 0 && <p className="profileEmpty">No membership plans published yet. Create one on the left!</p>}
      </section>
    </div>
  );
}

function MembershipForm({
  storeId, plan, coupons, onSuccess, onError, onCancel
}: {
  storeId: string; plan?: any; coupons: any[]; onSuccess: (msg: string) => void; onError: (msg: string) => void; onCancel: () => void;
}) {
  const [price, setPrice] = useState<number | "">(plan?.price ?? "");
  const [benefits, setBenefits] = useState<string[]>(plan?.benefits ?? [""]);
  const [upiId, setUpiId] = useState<string>(plan?.upiId ?? "");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(plan?.qrCodeUrl ?? "");
  const [uploadingQr, setUploadingQr] = useState(false);
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>(plan?.linkedCouponIds ?? []);
  const [commissionAcknowledged, setCommissionAcknowledged] = useState(false);

  useEffect(() => {
    setPrice(plan?.price ?? "");
    setBenefits(plan?.benefits?.length ? plan.benefits : [""]);
    setUpiId(plan?.upiId ?? "");
    setQrCodeUrl(plan?.qrCodeUrl ?? "");
    setSelectedCoupons(plan?.linkedCouponIds ?? []);
    setCommissionAcknowledged(false);
  }, [plan]);

  const priceNum = typeof price === "number" ? price : parseFloat(price as string);
  const isPriceValid = !isNaN(priceNum) && priceNum >= 80;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingQr(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("storeId", storeId);
      const res = await apiFetch<{ url?: string; mediaUrl?: string }>("/api/media", { method: "POST", body: fd });
      if (res?.url || res?.mediaUrl) {
        setQrCodeUrl(res.url || res.mediaUrl || "");
      }
    } catch (err) {
      console.warn("Upload failed", err);
    } finally {
      setUploadingQr(false);
    }
  }

  function toggleCoupon(couponId: string) {
    if (selectedCoupons.includes(couponId)) {
      setSelectedCoupons(selectedCoupons.filter((c) => c !== couponId));
    } else {
      setSelectedCoupons([...selectedCoupons, couponId]);
    }
  }

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
      benefits: benefits.filter((b) => b.trim() !== ""),
      upiId,
      qrCodeUrl,
      linkedCouponIds: selectedCoupons,
      commissionAcknowledged
    };

    try {
      if (plan?.id) {
        await apiFetch(`/api/owner/memberships/${plan.id}`, { method: "PATCH", json: data });
        onSuccess("Membership plan updated successfully!");
      } else {
        await apiFetch("/api/owner/memberships", { method: "POST", json: data });
        onSuccess("Membership plan published successfully!");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to save membership plan.");
    }
  }

  return (
    <form className="portalForm" onSubmit={onSubmit}>
      <label className="full">Plan Name <input name="name" defaultValue={plan?.name} required placeholder="e.g. VIP Gold Membership" /></label>
      
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
          <span style={{ color: "#EF4444", fontSize: "0.85rem", marginTop: "4px", display: "block" }}>
            Minimum membership price is ₹80.
          </span>
        )}
      </label>
      
      <label>Duration (Days) <input name="durationDays" type="number" min="1" defaultValue={plan?.durationDays ?? 30} required /></label>
      
      <label className="full">Description <textarea name="description" defaultValue={plan?.description} required placeholder="Describe exclusive VIP perks for customers..." /></label>

      {/* UPI ID & PAYMENT QR CODE PHOTO INPUTS */}
      <label>
        UPI ID (For Customer Scan & Pay)
        <input 
          type="text" 
          name="upiId"
          value={upiId} 
          onChange={(e) => setUpiId(e.target.value)} 
          placeholder="e.g. yourname@upi"
        />
      </label>

      <label>
        Payment QR Code Photo
        <div style={{ display: "flex", gap: "8px" }}>
          <input 
            type="text" 
            name="qrCodeUrl"
            value={qrCodeUrl} 
            onChange={(e) => setQrCodeUrl(e.target.value)} 
            placeholder="QR Photo URL or Upload"
            style={{ flex: 1 }}
          />
          <label className="portalButton secondary" style={{ margin: 0, padding: "8px 12px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", fontSize: "12px", whiteSpace: "nowrap" }}>
            <Upload size={14} /> {uploadingQr ? "Uploading..." : "Upload QR"}
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: "none" }} />
          </label>
        </div>
      </label>

      {qrCodeUrl && (
        <div className="full" style={{ background: "rgba(74, 222, 128, 0.1)", border: "1px solid rgba(74, 222, 128, 0.3)", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={qrCodeUrl} alt="UPI Payment QR Code" style={{ width: "60px", height: "60px", objectFit: "contain", borderRadius: "6px", background: "#FFF" }} />
          <div style={{ fontSize: "12px", color: "#4ADE80", fontWeight: 700 }}>
            ✓ Payment QR Code photo attached & ready for customers
          </div>
        </div>
      )}

      {/* STORE COUPONS LOYALTY REWARDS LINKING */}
      <div className="full" style={{ background: "rgba(251, 191, 36, 0.08)", padding: "16px", borderRadius: "12px", border: "1px solid rgba(251, 191, 36, 0.3)", display: "flex", flexDirection: "column", gap: "10px" }}>
        <h4 style={{ margin: 0, color: "#FBBF24", display: "flex", alignItems: "center", gap: "8px" }}>
          <Gift size={18} /> Store Coupons as Loyalty Rewards
        </h4>
        <p style={{ margin: 0, fontSize: "12px", color: "#CBD5E1" }}>
          Select store coupons from your store catalog. When a customer purchases & gets activated on this plan, these coupons automatically unlock in their wallet as loyalty rewards!
        </p>

        {coupons.length === 0 ? (
          <div style={{ fontSize: "12px", color: "#94A3B8" }}>No store coupons created yet in your catalog.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px", marginTop: "4px" }}>
            {coupons.map((c) => {
              const isChecked = selectedCoupons.includes(c.id);
              return (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", background: isChecked ? "rgba(251, 191, 36, 0.2)" : "rgba(255,255,255,0.05)", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", border: isChecked ? "1px solid #FBBF24" : "1px solid transparent" }}>
                  <input type="checkbox" checked={isChecked} onChange={() => toggleCoupon(c.id)} style={{ width: "auto" }} />
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#FFF" }}>{c.title || c.name}</span>
                </label>
              );
            })}
          </div>
        )}
      </div>
      
      <label>Badge Color <input name="badgeColor" type="color" defaultValue={plan?.badgeColor ?? "#FF5722"} /></label>
      <label>Plan Icon <input name="planIcon" defaultValue={plan?.planIcon ?? "star"} /></label>
      
      <label>Active Status
        <select name="isActive" defaultValue={plan?.isActive === false ? "false" : "true"}>
          <option value="true">Active (Published)</option>
          <option value="false">Inactive (Draft)</option>
        </select>
      </label>
      
      <label>Max Members <input name="maxMembers" type="number" min="1" defaultValue={plan?.maxMembers ?? ""} placeholder="Leave blank for unlimited" /></label>
      
      <label className="full">Terms & Conditions <textarea name="termsAndConditions" defaultValue={plan?.termsAndConditions} /></label>

      <div className="full" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <strong>Benefits List</strong>
        {benefits.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: "0.5rem" }}>
            <input 
              value={b} 
              onChange={(e) => {
                const newB = [...benefits];
                newB[i] = e.target.value;
                setBenefits(newB);
              }} 
              placeholder="E.g. 10% off all orders + Priority Live Queue" 
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

      <div className="full" style={{ background: "rgba(239, 68, 68, 0.1)", padding: "1rem", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.3)", marginTop: "1rem" }}>
        <h4 style={{ margin: "0 0 0.5rem 0", color: "#F87171" }}>Kynisto Commission Policy</h4>
        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#FCA5A5" }}>
          For every membership sold, a fixed commission of ₹50 is deducted by Kynisto platform.
        </p>
        {isPriceValid && (
          <p style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: "bold", color: "#4ADE80" }}>
            Breakdown: Customer Pays (₹{priceNum}) - Kynisto Fee (₹50) = You Receive (₹{priceNum - 50})
          </p>
        )}
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, color: "#FCA5A5", fontWeight: 600 }}>
          <input 
            type="checkbox" 
            checked={commissionAcknowledged} 
            onChange={(e) => setCommissionAcknowledged(e.target.checked)} 
            required 
            style={{ width: "auto", margin: 0 }}
          />
          I understand and acknowledge the Kynisto commission policy.
        </label>
      </div>

      <div className="formActions full" style={{ marginTop: "1rem", gap: "1rem" }}>
        <button 
          className="portalButton" 
          type="submit" 
          disabled={!commissionAcknowledged || !isPriceValid}
          style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)", color: "#FFF", padding: "12px 24px", fontSize: "15px", fontWeight: 800 }}
        >
          {plan ? "Save Changes" : "Publish Membership Plan"}
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
