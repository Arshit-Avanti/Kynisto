"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import { CheckCircle2, ShieldCheck, Sparkles, Star, Zap, QrCode, CreditCard, Clock, Copy, Check } from "lucide-react";

export function StoreMembershipStorefront({ storeId, storeName }: { storeId: string; storeName: string }) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState<any | null>(null);
  const [utr, setUtr] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minute countdown timer
  const [toast, setToast] = useState("");
  const [reassuranceMessage, setReassuranceMessage] = useState("");
  const [error, setError] = useState("");
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  useEffect(() => {
    loadPlans();
  }, [storeId]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (purchasingPlan && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [purchasingPlan, timeLeft]);

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

  function handleOpenPaymentModal(plan: any) {
    setPurchasingPlan(plan);
    setUtr("");
    setError("");
    setReassuranceMessage("");
    setCopiedUpi(false);
    setTimeLeft(600); // Reset to 10 mins
    setCurrentTimeStr(new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }));
  }

  function handleCopyUpi(upiText: string) {
    if (!upiText) return;
    navigator.clipboard.writeText(upiText);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  }

  async function handleConfirmSubmitPayment() {
    if (!purchasingPlan) return;
    setIsSubmitting(true);
    setError("");
    try {
      const res = await apiFetch<{ success: boolean; reassuranceBanner?: string; message?: string }>(
        "/api/memberships/purchase",
        {
          method: "POST",
          json: { storeId, planId: purchasingPlan.id, utr },
        }
      );
      const msg = res.reassuranceBanner || res.message || "Don't panic! The shop owner will verify your payment and activate your membership within 24 hours.";
      setReassuranceMessage(msg);
      setToast(msg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit payment verification.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formattedTime = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  if (loading) return null;
  if (!plans.length) return null;

  return (
    <section
      className="portalCard"
      style={{
        marginTop: "24px",
        background: "linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.98) 100%)",
        border: "1px solid rgba(255, 87, 34, 0.4)",
        borderRadius: "16px",
        padding: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#FFFFFF", display: "flex", alignItems: "center", gap: "8px" }}>
            <Star style={{ color: "#FF5722" }} /> {storeName} VIP Membership Plans
          </h3>
          <p style={{ fontSize: "13px", color: "#94A3B8", marginTop: "4px" }}>
            Unlock exclusive VIP benefits, priority live queue, and store coupon loyalty rewards.
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "linear-gradient(135deg, rgba(255,87,34,0.2) 0%, rgba(229,57,53,0.2) 100%)", border: "1px solid rgba(255,87,34,0.4)", padding: "6px 14px", borderRadius: "20px" }}>
          <Sparkles size={14} style={{ color: "#FF8A00" }} />
          <span style={{ fontSize: "12px", fontWeight: 800, color: "#FF8A00" }}>Includes Kynisto Premium</span>
        </div>
      </div>

      {toast && (
        <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10B981", color: "#4ADE80", padding: "14px 18px", borderRadius: "12px", marginBottom: "18px", fontWeight: 800, fontSize: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
          <CheckCircle2 size={20} /> {toast}
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #EF4444", color: "#F87171", padding: "14px 18px", borderRadius: "12px", marginBottom: "18px", fontWeight: 800, fontSize: "14px" }}>
          {error}
        </div>
      )}

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
                  <ShieldCheck size={14} /> VIP Benefits Included
                </div>
                <div style={{ fontSize: "12px", color: "#FFFFFF", fontWeight: 700, marginTop: "2px" }}>
                  Kynisto Subscription, Priority Queue & Loyalty Rewards
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
              onClick={() => handleOpenPaymentModal(plan)}
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
              Purchase VIP Membership
            </button>
          </div>
        ))}
      </div>

      {/* CUSTOMER PAYMENT MODAL WITH QR CODE, UPI ID, COUNTDOWN TIMER & TIMESTAMP */}
      {purchasingPlan && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#0F172A", border: "2px solid #6366F1", borderRadius: "20px", padding: "24px", maxWidth: "480px", width: "100%", color: "#FFF", boxShadow: "0 20px 50px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#818CF8", margin: 0 }}>
                Scan & Pay: {purchasingPlan.name}
              </h3>
              <button onClick={() => setPurchasingPlan(null)} style={{ background: "none", border: "none", color: "#94A3B8", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>

            {/* PAYMENT SESSION TIMER & TIMESTAMP */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(99, 102, 241, 0.15)", border: "1px solid rgba(99, 102, 241, 0.3)", padding: "10px 14px", borderRadius: "10px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#94A3B8", display: "flex", alignItems: "center", gap: "6px" }}>
                <Clock size={14} style={{ color: "#818CF8" }} />
                <span>Time: <b>{currentTimeStr}</b></span>
              </div>
              <div style={{ fontSize: "13px", fontWeight: 900, color: timeLeft < 120 ? "#EF4444" : "#FACC15", background: "rgba(0,0,0,0.4)", padding: "4px 10px", borderRadius: "8px", fontFamily: "monospace" }}>
                Session: {formattedTime}
              </div>
            </div>

            {/* REASSURANCE BANNER */}
            <div style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(16,185,129,0.2) 100%)", border: "1px solid #10B981", borderRadius: "12px", padding: "14px", marginBottom: "18px" }}>
              <div style={{ fontSize: "13px", fontWeight: 800, color: "#4ADE80", display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} /> Don't panic! The shop owner will verify your payment and activate your membership within 24 hours.
              </div>
            </div>

            {/* SCANNABLE QR CODE & UPI ID */}
            <div style={{ textAlign: "center", background: "rgba(30,41,59,0.9)", border: "1px solid rgba(255,255,255,0.1)", padding: "16px", borderRadius: "14px", marginBottom: "18px" }}>
              <div style={{ fontSize: "26px", fontWeight: 900, color: "#4ADE80", marginBottom: "8px" }}>
                ₹{purchasingPlan.price}
              </div>

              {/* QR CODE PHOTO */}
              <div style={{ margin: "12px 0" }}>
                <img
                  src={purchasingPlan.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${purchasingPlan.upiId || "store@upi"}&pn=${storeName}&am=${purchasingPlan.price}`)}`}
                  alt="Shop Owner Payment QR Code"
                  style={{ width: "190px", height: "190px", margin: "0 auto", objectFit: "contain", borderRadius: "12px", border: "2px solid #6366F1", background: "#FFF", padding: "8px" }}
                />
                <p style={{ fontSize: "12px", color: "#CBD5E1", marginTop: "8px", fontWeight: 700 }}>
                  Scan QR photo using Google Pay, PhonePe, Paytm or any UPI App
                </p>
              </div>

              {/* UPI ID WITH COPY BUTTON */}
              {purchasingPlan.upiId ? (
                <div style={{ background: "rgba(99,102,241,0.2)", border: "1px solid #6366F1", padding: "10px 14px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "12px" }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "10px", color: "#94A3B8", fontWeight: 800, textTransform: "uppercase" }}>Shop Owner UPI ID</div>
                    <div style={{ fontSize: "15px", fontWeight: 900, color: "#FFF", fontFamily: "monospace" }}>{purchasingPlan.upiId}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyUpi(purchasingPlan.upiId)}
                    style={{ background: "#6366F1", color: "#FFF", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    {copiedUpi ? <Check size={14} /> : <Copy size={14} />}
                    {copiedUpi ? "Copied!" : "Copy UPI"}
                  </button>
                </div>
              ) : (
                <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "10px", fontSize: "13px", color: "#94A3B8" }}>
                  Direct UPI Transfer Available
                </div>
              )}
            </div>

            {/* UTR INPUT */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ fontSize: "12px", fontWeight: 800, color: "#CBD5E1", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Enter Payment UTR / Transaction Ref No.
              </label>
              <input
                type="text"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="12-digit UTR or Transaction ID (e.g. 423819203912)"
                style={{ width: "100%", background: "#1E293B", border: "1px solid #475569", color: "#FFF", padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: 700 }}
              />
            </div>

            <button
              type="button"
              disabled={isSubmitting || reassuranceMessage !== ""}
              onClick={handleConfirmSubmitPayment}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                color: "#FFFFFF",
                border: "none",
                padding: "14px",
                borderRadius: "12px",
                fontWeight: 900,
                fontSize: "15px",
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(16, 185, 129, 0.4)",
              }}
            >
              {isSubmitting ? "Submitting Payment Proof..." : reassuranceMessage !== "" ? "Payment Verification Submitted!" : "Submit Payment & Request Activation"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
