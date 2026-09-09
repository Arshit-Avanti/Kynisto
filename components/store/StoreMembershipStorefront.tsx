"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/client-api";
import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
  ChevronRight,
} from "lucide-react";
import { UpiCheckoutModal } from "@/components/checkout/UpiCheckoutModal";

export function StoreMembershipStorefront({
  storeId,
  storeName,
}: {
  storeId: string;
  storeName: string;
}) {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasingPlan, setPurchasingPlan] = useState<any | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadPlans();
    // Prefill user info from session if available
    apiFetch<{ user?: any }>("/api/auth/me")
      .then((res) => {
        if (res?.user) {
          if (res.user.name) setCustomerName(res.user.name);
          if (res.user.email) setCustomerEmail(res.user.email);
        }
      })
      .catch(() => {});
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

  function handleOpenPaymentModal(plan: any) {
    setPurchasingPlan(plan);
    setError("");
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
          json: {
            storeId,
            planId: purchasingPlan.id,
            utr: `UPI-MEM-${Date.now().toString(36).toUpperCase()}`,
            customerName: customerName || "Customer",
            customerEmail: customerEmail || "",
          },
        }
      );
      const msg =
        res.reassuranceBanner ||
        res.message ||
        "Don't panic! The shop owner will verify your payment and activate your membership within 24 hours.";
      setToast(msg);
      setPurchasingPlan(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit payment verification.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return null;
  if (!plans.length) return null;

  return (
    <section className="mt-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl text-slate-900 overflow-x-clip">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Star className="w-5 h-5 fill-orange-500 text-orange-500" />
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {storeName} VIP Membership Plans
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Unlock exclusive VIP benefits, priority live queue, and store coupon loyalty rewards.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Includes Kynisto Premium</span>
        </div>
      </div>

      {toast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-2xl mb-5 font-bold text-xs sm:text-sm flex items-center gap-2.5 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3.5 rounded-2xl mb-5 font-bold text-xs sm:text-sm shadow-xs animate-in fade-in">
          {error}
        </div>
      )}

      {/* PLAN CARDS GRID (LIGHT MODE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="bg-white border-2 border-slate-200 hover:border-orange-500/80 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all duration-200"
          >
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-black text-slate-900 tracking-tight">
                  {plan.name}
                </span>
                <span
                  className="text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs"
                  style={{ background: plan.badgeColor || "#FF5722" }}
                >
                  {plan.durationDays} Days
                </span>
              </div>

              <div className="text-3xl font-black text-slate-900 mb-2">
                ₹{plan.price}{" "}
                <span className="text-xs text-slate-500 font-semibold">
                  / {plan.durationDays} days
                </span>
              </div>

              {plan.description && (
                <p className="text-xs text-slate-600 mb-4 leading-relaxed line-clamp-2">
                  {plan.description}
                </p>
              )}

              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 mb-4">
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>VIP Benefits Included</span>
                </div>
                <div className="text-xs text-slate-700 font-medium">
                  Kynisto Subscription, Priority Queue & Loyalty Rewards
                </div>
              </div>

              <ul className="space-y-2 mb-6">
                {Array.isArray(plan.benefits) &&
                  plan.benefits.map((b: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-700 flex items-start gap-2 leading-tight"
                    >
                      <Zap className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleOpenPaymentModal(plan)}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-3 px-4 rounded-xl text-sm shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Purchase VIP Membership</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* LIGHT-MODE MODERN UPI PAYMENT MODAL */}
      {purchasingPlan && (
        <UpiCheckoutModal
          isOpen={!!purchasingPlan}
          onClose={() => setPurchasingPlan(null)}
          title={`${storeName} VIP Pass`}
          orderId={`MEM-${purchasingPlan.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`}
          amount={purchasingPlan.price}
          merchantName={storeName}
          upiId={purchasingPlan.upiId || "store@upi"}
          itemDetails={[
            {
              name: `${purchasingPlan.name} (${purchasingPlan.durationDays} Days Pass)`,
              price: purchasingPlan.price,
              quantity: 1,
            },
          ]}
          onPaymentSuccess={handleConfirmSubmitPayment}
        />
      )}
    </section>
  );
}
export default StoreMembershipStorefront;
