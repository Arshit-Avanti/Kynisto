"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CUSTOMER_PLANS,
  SHOP_OWNER_PLANS,
  UPI_PAYMENT_ID,
  PlanConfig,
} from "@/lib/subscriptions";
import { MagneticButton } from "@/components/ui/MagneticButton";

export function PricingSection({
  userRole = "customer",
  currentPlanId = "free",
}: {
  userRole?: "customer" | "store_owner" | "admin";
  currentPlanId?: string;
}) {
  const [activeRoleTab, setActiveRoleTab] = useState<"customer" | "store_owner">(
    userRole === "store_owner" ? "store_owner" : "customer"
  );
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  // Payment modal state
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [utrInput, setUtrInput] = useState("");
  const [subscriberName, setSubscriberName] = useState("");
  const [subscriberRole, setSubscriberRole] = useState<"customer" | "store_owner">("customer");
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [paymentTime, setPaymentTime] = useState("");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentState, setPaymentState] = useState<"idle" | "pending" | "success" | "failure">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [receiptNo, setReceiptNo] = useState("");
  const [pendingData, setPendingData] = useState<any>(null);

  const plans = activeRoleTab === "customer" ? CUSTOMER_PLANS : SHOP_OWNER_PLANS;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_PAYMENT_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubscribeClick = (plan: PlanConfig) => {
    const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
    if (price === 0) {
      processFreeSubscription(plan);
      return;
    }
    setSelectedPlan(plan);
    setFormStep(1);
    setPaymentState("idle");
    setUtrInput("");
    setSubscriberName("");
    setSubscriberEmail("");
    setSubscriberRole(plan.role === "store_owner" ? "store_owner" : "customer");
    setAmountPaid(price);
    setPaymentTime(new Date().toLocaleString());
    setErrorMessage("");
  };

  const processFreeSubscription = async (plan: PlanConfig) => {
    setIsVerifying(true);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          billingCycle,
          utr: "FREE_PLAN_GRANT",
          subscriberName: "Free User",
          subscriberRole: plan.role,
          subscriberEmail: "",
          paymentTime: new Date().toLocaleString(),
          amountPaid: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedPlan(plan);
      setPendingData(data.submittedData || null);
      setPaymentState("pending");
    } catch (err: any) {
      alert(err.message || "Failed to join free plan.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmitPaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!subscriberName.trim() || !subscriberEmail.trim()) {
      setErrorMessage("Name of user and Email Address are required. Please fill out all required fields.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingCycle,
          utr: "MANUAL_UPI_VERIFICATION",
          subscriberName: subscriberName.trim(),
          subscriberRole,
          subscriberEmail: subscriberEmail.trim(),
          paymentTime,
          amountPaid,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Subscription submission failed.");
      }

      setPendingData(data.submittedData || {
        subscriberName: subscriberName.trim(),
        subscriberRole,
        subscriberEmail: subscriberEmail.trim(),
        paymentTime,
        amountPaid,
        planName: selectedPlan.name,
        billingCycle,
        utr: "MANUAL_UPI_VERIFICATION",
      });
      setPaymentState("pending");
    } catch (err: any) {
      setErrorMessage(err.message || "Payment submission failed.");
      setPaymentState("failure");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="pricingSection" style={{ padding: "60px 20px", position: "relative" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span className="kicker" style={{ color: "#22C55E", fontWeight: 800, letterSpacing: "1.5px" }}>
            TRANSPARENT PRICING
          </span>
          <h1 style={{ color: "#FFFFFF", fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 850, margin: "12px 0" }}>
            Invest in your local experience.
          </h1>
          <p style={{ color: "#94A3B8", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Choose the perfect plan for your needs. Higher plans automatically inherit every feature of previous plans.
          </p>
        </div>

        {/* Role Quick Navigation Jump Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "32px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setActiveRoleTab("customer");
              document.getElementById("customer-plans")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "12px 28px",
              borderRadius: "16px",
              fontWeight: 800,
              fontSize: "14px",
              border: activeRoleTab === "customer" ? "2px solid #22C55E" : "1px solid rgba(255,255,255,0.15)",
              background: activeRoleTab === "customer" ? "rgba(34,197,94,0.15)" : "transparent",
              color: activeRoleTab === "customer" ? "#22C55E" : "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            👤 Customer Plans
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRoleTab("store_owner");
              document.getElementById("owner-plans")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "12px 28px",
              borderRadius: "16px",
              fontWeight: 800,
              fontSize: "14px",
              border: activeRoleTab === "store_owner" ? "2px solid #F59E0B" : "1px solid rgba(255,255,255,0.15)",
              background: activeRoleTab === "store_owner" ? "rgba(245,158,11,0.15)" : "transparent",
              color: activeRoleTab === "store_owner" ? "#F59E0B" : "#FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🏪 Shop Owner Plans
          </button>
        </div>

        {/* Billing Cycle Toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 700, color: billingCycle === "monthly" ? "#FFFFFF" : "#94A3B8" }}>
            Monthly Billing
          </span>
          <button
            type="button"
            onClick={() => setBillingCycle((b) => (b === "monthly" ? "yearly" : "monthly"))}
            style={{
              width: "60px",
              height: "32px",
              borderRadius: "20px",
              background: billingCycle === "yearly" ? "#22C55E" : "#334155",
              border: "none",
              padding: "4px",
              cursor: "pointer",
              position: "relative",
              transition: "background 0.3s ease",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "#FFF",
                transform: billingCycle === "yearly" ? "translateX(28px)" : "translateX(0)",
                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          </button>
          <span style={{ fontSize: "14px", fontWeight: 700, color: billingCycle === "yearly" ? "#22C55E" : "#94A3B8" }}>
            Yearly Billing
          </span>
          <span
            style={{
              background: "linear-gradient(135deg, #F59E0B 0%, #22C55E 100%)",
              color: "#000000",
              fontSize: "11px",
              fontWeight: 900,
              padding: "4px 10px",
              borderRadius: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            🔥 2 Months Free
          </span>
        </div>

        {/* SECTION 1: CUSTOMER SUBSCRIPTION PLANS */}
        <div id="customer-plans" style={{ marginBottom: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", borderBottom: "2px solid rgba(34,197,94,0.3)", paddingBottom: "12px" }}>
            <span style={{ fontSize: "28px" }}>👤</span>
            <div>
              <h2 style={{ color: "#22C55E", fontSize: "24px", fontWeight: 850, margin: 0 }}>
                CUSTOMER SUBSCRIPTION PLANS
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: "2px 0 0" }}>
                Ad-free VIP experience, priority queue access, and exclusive perks.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "24px",
            }}
          >
            {Object.values(CUSTOMER_PLANS).map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
              const periodLabel = plan.priceMonthly === 0 ? "" : billingCycle === "yearly" ? "/year" : "/month";

              return (
                <div
                  key={plan.id}
                  className="argusCard argusHoverGlow"
                  style={{
                    position: "relative",
                    borderRadius: "24px",
                    padding: "32px 24px",
                    background: plan.isPopular
                      ? "linear-gradient(180deg, rgba(34,197,94,0.18) 0%, rgba(15,23,42,0.98) 100%)"
                      : "rgba(15,23,42,0.92)",
                    border: plan.isPopular ? "2px solid #22C55E" : "1px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: plan.isPopular ? "0 10px 30px rgba(34,197,94,0.2)" : "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {plan.badge && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#22C55E",
                        color: "#000000",
                        fontSize: "11px",
                        fontWeight: 900,
                        padding: "4px 16px",
                        borderRadius: "20px",
                        letterSpacing: "1px",
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 850, margin: "0 0 8px" }}>
                      {plan.name}
                    </h3>
                    <p style={{ color: "#94A3B8", fontSize: "13px", minHeight: "40px", lineHeight: "1.4" }}>
                      {plan.description}
                    </p>

                    <div style={{ margin: "24px 0" }}>
                      <span style={{ color: "#FFFFFF", fontSize: "42px", fontWeight: 900, letterSpacing: "-1px" }}>
                        ₹{price}
                      </span>
                      <span style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 600, marginLeft: "4px" }}>
                        {periodLabel}
                      </span>
                      {billingCycle === "yearly" && plan.priceMonthly > 0 && (
                        <div style={{ fontSize: "12px", color: "#22C55E", fontWeight: 700, marginTop: "4px" }}>
                          Save ₹{plan.priceMonthly * 2} per year
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "20px" }}>
                      <strong style={{ fontSize: "12px", textTransform: "uppercase", color: "#22C55E", letterSpacing: "1px" }}>
                        What's Included:
                      </strong>
                      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {plan.features.map((feature, idx) => (
                          <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#F8FAFC" }}>
                            <span style={{ color: "#22C55E", fontWeight: 900, fontSize: "16px" }}>✓</span>
                            <span style={{ color: "#F8FAFC", fontWeight: 500 }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: "32px" }}>
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "14px",
                          background: "rgba(34,197,94,0.15)",
                          color: "#22C55E",
                          fontWeight: 800,
                          border: "1px solid #22C55E",
                          cursor: "default",
                        }}
                      >
                        ✓ Current Plan
                      </button>
                    ) : (
                      <MagneticButton
                        onClick={() => handleSubscribeClick(plan)}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "14px",
                          background: plan.isPopular
                            ? "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)"
                            : "linear-gradient(135deg, #334155 0%, #1E293B 100%)",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {plan.priceMonthly === 0 ? "Get Started Free" : `Subscribe ${plan.name}`}
                      </MagneticButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: BUSINESS OWNER SUBSCRIPTION PLANS */}
        <div id="owner-plans" style={{ marginBottom: "60px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", borderBottom: "2px solid rgba(245,158,11,0.3)", paddingBottom: "12px" }}>
            <span style={{ fontSize: "28px" }}>🏪</span>
            <div>
              <h2 style={{ color: "#F59E0B", fontSize: "24px", fontWeight: 850, margin: 0 }}>
                BUSINESS OWNER SUBSCRIPTION PLANS
              </h2>
              <p style={{ color: "#94A3B8", fontSize: "13px", margin: "2px 0 0" }}>
                Queue management, staff accounts, detailed analytics, and custom branding.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
              gap: "24px",
            }}
          >
            {Object.values(SHOP_OWNER_PLANS).map((plan) => {
              const isCurrent = currentPlanId === plan.id;
              const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;
              const periodLabel = plan.priceMonthly === 0 ? (plan.id === "enterprise" ? "Custom" : "") : billingCycle === "yearly" ? "/year" : "/month";

              return (
                <div
                  key={plan.id}
                  className="argusCard argusHoverGlow"
                  style={{
                    position: "relative",
                    borderRadius: "24px",
                    padding: "32px 24px",
                    background: plan.isPopular
                      ? "linear-gradient(180deg, rgba(245,158,11,0.18) 0%, rgba(15,23,42,0.98) 100%)"
                      : "rgba(15,23,42,0.92)",
                    border: plan.isPopular ? "2px solid #F59E0B" : "1px solid rgba(255,255,255,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: plan.isPopular ? "0 10px 30px rgba(245,158,11,0.2)" : "0 8px 24px rgba(0,0,0,0.4)",
                  }}
                >
                  {plan.badge && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-14px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: plan.isPopular ? "#F59E0B" : "#3B82F6",
                        color: "#000000",
                        fontSize: "11px",
                        fontWeight: 900,
                        padding: "4px 16px",
                        borderRadius: "20px",
                        letterSpacing: "1px",
                      }}
                    >
                      {plan.badge}
                    </div>
                  )}

                  <div>
                    <h3 style={{ color: "#FFFFFF", fontSize: "24px", fontWeight: 850, margin: "0 0 8px" }}>
                      {plan.name}
                    </h3>
                    <p style={{ color: "#94A3B8", fontSize: "13px", minHeight: "40px", lineHeight: "1.4" }}>
                      {plan.description}
                    </p>

                    <div style={{ margin: "24px 0" }}>
                      <span style={{ color: "#FFFFFF", fontSize: "42px", fontWeight: 900, letterSpacing: "-1px" }}>
                        {plan.id === "enterprise" ? "Contact Us" : `₹${price}`}
                      </span>
                      <span style={{ color: "#94A3B8", fontSize: "14px", fontWeight: 600, marginLeft: "4px" }}>
                        {periodLabel}
                      </span>
                      {billingCycle === "yearly" && plan.priceMonthly > 0 && (
                        <div style={{ fontSize: "12px", color: "#F59E0B", fontWeight: 700, marginTop: "4px" }}>
                          Save ₹{plan.priceMonthly * 2} per year
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: "20px" }}>
                      <strong style={{ fontSize: "12px", textTransform: "uppercase", color: "#F59E0B", letterSpacing: "1px" }}>
                        What's Included:
                      </strong>
                      <ul style={{ listStyle: "none", padding: 0, margin: "12px 0 0", display: "flex", flexDirection: "column", gap: "10px" }}>
                        {plan.features.map((feature, idx) => (
                          <li key={idx} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#F8FAFC" }}>
                            <span style={{ color: "#F59E0B", fontWeight: 900, fontSize: "16px" }}>✓</span>
                            <span style={{ color: "#F8FAFC", fontWeight: 500 }}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div style={{ marginTop: "32px" }}>
                    {isCurrent ? (
                      <button
                        type="button"
                        disabled
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "14px",
                          background: "rgba(245,158,11,0.15)",
                          color: "#F59E0B",
                          fontWeight: 800,
                          border: "1px solid #F59E0B",
                          cursor: "default",
                        }}
                      >
                        ✓ Current Plan
                      </button>
                    ) : (
                      <MagneticButton
                        onClick={() => handleSubscribeClick(plan)}
                        style={{
                          width: "100%",
                          padding: "14px",
                          borderRadius: "14px",
                          background: plan.isPopular
                            ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                            : "linear-gradient(135deg, #334155 0%, #1E293B 100%)",
                          color: "#FFFFFF",
                          fontWeight: 800,
                          border: "none",
                          cursor: "pointer",
                        }}
                      >
                        {plan.priceMonthly === 0 ? (plan.id === "enterprise" ? "Contact Sales" : "Get Started Free") : `Subscribe ${plan.name}`}
                      </MagneticButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature Comparison Matrix */}
        <div style={{ marginBottom: "60px" }}>
          <h2 style={{ color: "#FFFFFF", textAlign: "center", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>
            Full Feature Comparison Matrix
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "rgba(15,23,42,0.92)",
                borderRadius: "16px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)", textAlign: "left" }}>
                  <th style={{ padding: "16px 20px", color: "#22C55E", fontWeight: 800 }}>Feature</th>
                  {[...Object.values(CUSTOMER_PLANS), ...Object.values(SHOP_OWNER_PLANS)].map((plan) => (
                    <th key={`${plan.role}-${plan.id}`} style={{ padding: "16px 20px", textAlign: "center", color: "#FFFFFF", fontWeight: 800 }}>
                      {plan.name} ({plan.role === "customer" ? "Cust" : "Owner"})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set([...Object.values(CUSTOMER_PLANS), ...Object.values(SHOP_OWNER_PLANS)].flatMap((p) => p.features))).map((feat, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <td style={{ padding: "14px 20px", fontSize: "14px", color: "#F8FAFC" }}>{feat}</td>
                    {[...Object.values(CUSTOMER_PLANS), ...Object.values(SHOP_OWNER_PLANS)].map((plan) => {
                      const has = plan.features.includes(feat);
                      return (
                        <td key={`${plan.role}-${plan.id}`} style={{ padding: "14px 20px", textAlign: "center", fontSize: "16px" }}>
                          {has ? <span style={{ color: "#22C55E", fontWeight: 900 }}>✓</span> : <span style={{ color: "#64748B" }}>—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Accordion */}
        <div>
          <h2 style={{ color: "#FFFFFF", textAlign: "center", fontSize: "28px", fontWeight: 800, marginBottom: "24px" }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "800px", margin: "0 auto" }}>
            {[
              {
                q: "How does UPI payment verification work?",
                a: `Scan the QR code or pay to UPI ID ${UPI_PAYMENT_ID}, copy the 12-digit UTR reference number from your GPay/PhonePe/Paytm app, and paste it into the verification box. Your plan activates instantly upon confirmation.`,
              },
              {
                q: "What is the 2 Months Free offer on yearly plans?",
                a: "When you choose yearly billing, you pay for 10 months and receive 12 full months of access (16-17% savings).",
              },
              {
                q: "Does a higher plan inherit all lower plan features?",
                a: "Yes! Every higher tier plan automatically includes 100% of the features from previous tiers plus additional exclusive capabilities.",
              },
              {
                q: "Can I cancel or upgrade anytime?",
                a: "Yes, you can upgrade, downgrade, or cancel auto-renewal at any time from your Subscription Dashboard.",
              },
            ].map((faq, idx) => (
              <details
                key={idx}
                style={{
                  background: "rgba(15,23,42,0.92)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  cursor: "pointer",
                }}
              >
                <summary style={{ color: "#FFFFFF", fontWeight: 800, fontSize: "16px" }}>{faq.q}</summary>
                <p style={{ margin: "12px 0 0", color: "#94A3B8", lineHeight: 1.6, fontSize: "14px" }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* UPI PAYMENT MODAL */}
      {selectedPlan && (
        <div
          role="presentation"
          onMouseDown={(e) => e.currentTarget === e.target && setSelectedPlan(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999999,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            overflowY: "auto",
          }}
        >
          <div
            className="paymentModalCard argusGlass"
            style={{
              maxWidth: "480px",
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
              borderRadius: "24px",
              padding: "24px 20px",
              background: "var(--argus-card, rgba(15, 23, 42, 0.96))",
              border: "1px solid var(--argus-border, rgba(34, 197, 94, 0.4))",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              position: "relative",
              margin: "auto",
              boxSizing: "border-box",
            }}
          >
            <button
              type="button"
              className="closeButton"
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "transparent",
                border: "none",
                fontSize: "24px",
                color: "#94A3B8",
                cursor: "pointer",
              }}
              onClick={() => setSelectedPlan(null)}
            >
              ×
            </button>

            {paymentState === "pending" ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: "56px", marginBottom: "16px" }}>⏳</div>
                <h3 style={{ fontSize: "20px", fontWeight: 900, color: "#F59E0B", lineHeight: 1.4 }}>
                  DON'T PANIC, ADMIN WILL GIVE YOUR SUBSCRIPTION WITHIN 24 HOURS
                </h3>
                <p style={{ color: "#CBD5E1", fontSize: "14px", margin: "14px 0 20px", lineHeight: 1.5 }}>
                  Your payment verification request has been sent to the Kynisto Admin Dashboard. The Admin will verify your transaction and grant your subscription within 24 hours.
                </p>
                {pendingData && (
                  <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", padding: "18px", textAlign: "left", fontSize: "13px", color: "#FFF" }}>
                    <div style={{ fontWeight: 800, color: "#F59E0B", marginBottom: "10px", fontSize: "14px" }}>Submitted Payment Verification Details:</div>
                    <div style={{ margin: "6px 0" }}>Name of User: <b>{pendingData.subscriberName}</b></div>
                    <div style={{ margin: "6px 0" }}>User Role: <b style={{ textTransform: "capitalize", color: "#60A5FA" }}>{pendingData.subscriberRole?.replace("_", " ")}</b></div>
                    <div style={{ margin: "6px 0" }}>Email: <b>{pendingData.subscriberEmail}</b></div>
                    <div style={{ margin: "6px 0" }}>Plan Chosen: <b style={{ color: "#22C55E" }}>{pendingData.planName} ({pendingData.billingCycle})</b></div>
                    <div style={{ margin: "6px 0" }}>Amount Paid: <b>₹{pendingData.amountPaid}</b></div>
                    <div style={{ margin: "6px 0" }}>Payment Time: <b>{pendingData.paymentTime}</b></div>
                    <div style={{ margin: "10px 0 0", color: "#22C55E", fontWeight: 800, fontSize: "13px" }}>✓ Status: PENDING ADMIN VERIFICATION</div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  style={{ marginTop: "24px", width: "100%", padding: "14px", borderRadius: "14px", background: "#3B82F6", color: "#FFF", fontWeight: 800, border: "none", cursor: "pointer" }}
                >
                  Got it, Close Window
                </button>
              </div>
            ) : formStep === 1 ? (
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 850, margin: "0 0 6px", color: "#FFF" }}>
                  Subscribe to Kynisto {selectedPlan.name} (Step 1 of 2)
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 16px" }}>
                  Pay ₹{billingCycle === "yearly" ? selectedPlan.priceYearly : selectedPlan.priceMonthly} via UPI ({billingCycle})
                </p>

                {/* Step-by-Step Payment Instructions */}
                <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid #F59E0B", borderRadius: "14px", padding: "12px 14px", marginBottom: "16px", color: "#F59E0B" }}>
                  <strong style={{ display: "block", fontSize: "13px", fontWeight: 850, marginBottom: "6px", color: "#FFFFFF" }}>
                    📋 STEP-BY-STEP PAYMENT INSTRUCTIONS:
                  </strong>
                  <div style={{ fontSize: "11px", lineHeight: "1.5", color: "#CBD5E1" }}>
                    <div><b>1) GO TO YOUR UPI APP</b> (GPay, PhonePe, Paytm, BHIM)</div>
                    <div><b>2) SCAN QR CODE OR PAY BY SEARCH PASTE THE UPI ID YOU HAVE COPIED</b> (<code style={{ color: "#22C55E", fontWeight: 800 }}>{UPI_PAYMENT_ID}</code>)</div>
                    <div><b>3) ENTER VALID AMOUNT OF SUBSCRIPTION</b> (₹{amountPaid})</div>
                    <div><b>4) PAY THE AMOUNT</b></div>
                  </div>
                </div>

                {/* UPI ID & QR Code Box */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "16px",
                    padding: "14px",
                    textAlign: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ marginBottom: "8px" }}>
                    <img
                      src="/payment-qr.jpg"
                      alt="Kynisto Official UPI Payment QR Code"
                      style={{ width: "130px", height: "130px", borderRadius: "12px", background: "#FFF", padding: "4px", objectFit: "contain" }}
                    />
                  </div>

                  <div style={{ fontSize: "12px", color: "#94A3B8" }}>Official UPI ID:</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>
                    <strong style={{ fontSize: "15px", color: "#22C55E", fontFamily: "monospace" }}>{UPI_PAYMENT_ID}</strong>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      style={{
                        background: "rgba(34,197,94,0.2)",
                        border: "none",
                        color: "#22C55E",
                        padding: "4px 8px",
                        borderRadius: "8px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {copiedUpi ? "COPIED!" : "COPY"}
                    </button>
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <a
                      href={`upi://pay?pa=${UPI_PAYMENT_ID}&pn=Kynisto&am=${amountPaid}&tn=Kynisto+${selectedPlan.name}+Subscription`}
                      style={{
                        display: "inline-block",
                        background: "#22C55E",
                        color: "#000",
                        padding: "8px 16px",
                        borderRadius: "10px",
                        fontSize: "12px",
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                    >
                      Open UPI App (GPay/Paytm/PhonePe)
                    </a>
                  </div>
                </div>

                {/* STEP 1: NAME OF USER */}
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 800, marginBottom: "6px", color: "#FFF" }}>
                    1. Name of User <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    required
                    value={subscriberName}
                    onChange={(e) => {
                      setSubscriberName(e.target.value);
                      if (errorMessage) setErrorMessage("");
                    }}
                    placeholder="Enter your full name"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "12px",
                      border: "1px solid rgba(255,255,255,0.2)",
                      background: "rgba(0,0,0,0.5)",
                      color: "#FFF",
                      fontSize: "14px",
                    }}
                  />
                </div>

                {errorMessage && (
                  <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "14px", fontWeight: 700, background: "rgba(239,68,68,0.1)", padding: "10px 14px", borderRadius: "10px", border: "1px solid #EF4444" }}>
                    ⚠️ {errorMessage}
                  </div>
                )}

                <MagneticButton
                  type="button"
                  onClick={() => {
                    if (!subscriberName.trim()) {
                      setErrorMessage("Please enter Name of User before clicking Next.");
                      return;
                    }
                    setErrorMessage("");
                    setFormStep(2);
                  }}
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                    color: "#FFFFFF",
                    fontWeight: 850,
                    border: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                  }}
                >
                  Next Step →
                </MagneticButton>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <button
                    type="button"
                    onClick={() => setFormStep(1)}
                    style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#60A5FA", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                  >
                    ← Back to Step 1
                  </button>
                  <span style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 700 }}>Step 2 of 2</span>
                </div>

                <h3 style={{ fontSize: "20px", fontWeight: 850, margin: "0 0 6px", color: "#FFF" }}>
                  Fill Verification Details
                </h3>
                <p style={{ color: "#94A3B8", fontSize: "13px", margin: "0 0 20px" }}>
                  Submitting payment request for <b>{subscriberName}</b>
                </p>

                <form onSubmit={handleSubmitPaymentDetails}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px", color: "#FFF" }}>
                        2. Role <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <select
                        value={subscriberRole}
                        onChange={(e) => setSubscriberRole(e.target.value as "customer" | "store_owner")}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", background: "#1E293B", color: "#FFF", fontSize: "13px" }}
                      >
                        <option value="customer">Customer</option>
                        <option value="store_owner">Shop Owner</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px", color: "#FFF" }}>
                        3. Amount Paid <span style={{ color: "#EF4444" }}>*</span>
                      </label>
                      <input
                        required
                        type="number"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "#22C55E", fontWeight: 800, fontSize: "13px" }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px", color: "#FFF" }}>
                      4. Email Address <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      required
                      type="email"
                      value={subscriberEmail}
                      onChange={(e) => setSubscriberEmail(e.target.value)}
                      placeholder="Enter your email address"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "#FFF", fontSize: "13px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px", color: "#FFF" }}>
                      5. Payment Date & Time <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      required
                      value={paymentTime}
                      onChange={(e) => setPaymentTime(e.target.value)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(0,0,0,0.5)", color: "#CBD5E1", fontSize: "13px" }}
                    />
                  </div>

                  <div style={{ marginBottom: "18px" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 800, marginBottom: "4px", color: "#FFF" }}>
                      6. Plan Chosen
                    </label>
                    <div style={{ padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.1)", color: "#22C55E", fontWeight: 800, fontSize: "13px" }}>
                      Kynisto {selectedPlan.name} ({billingCycle})
                    </div>
                  </div>

                  {errorMessage && (
                    <div style={{ color: "#EF4444", fontSize: "13px", marginBottom: "14px", fontWeight: 700, background: "rgba(239,68,68,0.1)", padding: "10px 14px", borderRadius: "10px", border: "1px solid #EF4444" }}>
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  <MagneticButton
                    type="submit"
                    disabled={isVerifying}
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "14px",
                      background: "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                      color: "#FFFFFF",
                      fontWeight: 850,
                      border: "none",
                      cursor: "pointer",
                      opacity: isVerifying ? 0.7 : 1,
                    }}
                  >
                    {isVerifying ? "Submitting Payment Details..." : "Submit Payment Details to Admin →"}
                  </MagneticButton>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
