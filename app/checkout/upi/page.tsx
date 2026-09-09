"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  QrCode,
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Sparkles,
  RefreshCw,
  X,
  ChevronRight,
  Info,
  Tag,
  Zap,
  Clock,
  Crown,
  Store,
} from "lucide-react";

import {
  defaultPaymentConfig,
  createUPILink,
  triggerUPIApp,
  cancelActiveUPILaunch,
  isMobileDevice,
  isAndroid,
  UPIPaymentConfig,
} from "@/lib/upi-payment";

// Vector brand logos for authentic Indian fintech look (Light Mode Optimized)
function FamPayLogo({ className = "w-11 h-11" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-500 flex items-center justify-center text-slate-950 font-black italic shadow-xs select-none shrink-0`}
    >
      <span className="text-[13px] tracking-tight transform -skew-x-6 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
        Fam
      </span>
    </div>
  );
}

function PhonePeLogo({ className = "w-11 h-11" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-[#5F259F] flex items-center justify-center text-white font-bold shadow-xs select-none shrink-0`}
    >
      <span className="text-base leading-none">पे</span>
    </div>
  );
}

function PaytmLogo({ className = "w-11 h-11" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-[#002970] flex items-center justify-center text-white font-black shadow-xs select-none px-1 shrink-0`}
    >
      <span className="text-xs tracking-tighter text-[#00BAF2]">
        Pay<span className="text-white">tm</span>
      </span>
    </div>
  );
}

function GooglePayLogo({ className = "w-11 h-11" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-2 select-none shrink-0`}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <path
          fill="#4285F4"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#34A853"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        />
        <path
          fill="#EA4335"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
    </div>
  );
}

function UpiGenericLogo({ className = "w-11 h-11" }: { className?: string }) {
  return (
    <div
      className={`${className} rounded-2xl bg-white border border-slate-200 flex items-center justify-center p-2 shadow-xs shrink-0`}
    >
      <svg viewBox="0 0 32 32" className="w-full h-full">
        <path d="M8 22L15 10H21L14 22H8Z" fill="#097939" />
        <path d="M17 22L24 10H27L20 22H17Z" fill="#ED7524" />
      </svg>
    </div>
  );
}

// Order Presets for Grocery, Subscription, and Store Owner Membership
type OrderType = "grocery" | "subscription" | "membership";

interface OrderPreset {
  id: OrderType;
  label: string;
  tabTitle: string;
  orderId: string;
  merchantName: string;
  amount: number;
  totalSavings: number;
  deliveryEstimate: string;
  items: {
    name: string;
    detail: string;
    price: number;
    mrp: number;
    color: string;
  }[];
  billDetails: {
    itemTotal: number;
    deliveryFee: string;
    handling: number;
    gst: number;
  };
  note: string;
}

const ORDER_PRESETS: Record<OrderType, OrderPreset> = {
  grocery: {
    id: "grocery",
    label: "Grocery Basket (3 Items)",
    tabTitle: "Grocery Basket",
    orderId: "KYN-1024",
    merchantName: "Kynisto Daily Mart",
    amount: 499,
    totalSavings: 74,
    deliveryEstimate: "15 – 25 Minutes (Express)",
    items: [
      {
        name: "Aashirvaad Atta",
        detail: "Superior MP Sharbati (5kg)",
        price: 250,
        mrp: 290,
        color: "bg-orange-500",
      },
      {
        name: "Fortune Oil",
        detail: "Sunlite Refined Sunflower (1L)",
        price: 149,
        mrp: 175,
        color: "bg-amber-500",
      },
      {
        name: "Amul Milk",
        detail: "Taaza Fresh Toned (2L Pouch)",
        price: 100,
        mrp: 108,
        color: "bg-blue-500",
      },
    ],
    billDetails: {
      itemTotal: 499,
      deliveryFee: "FREE",
      handling: 0,
      gst: 0,
    },
    note: "Kynisto Order #KYN-1024",
  },
  subscription: {
    id: "subscription",
    label: "Kynisto Pro Plan (Monthly)",
    tabTitle: "Pro Subscription",
    orderId: "KYN-SUB-499",
    merchantName: "Kynisto Club",
    amount: 499,
    totalSavings: 300,
    deliveryEstimate: "Instant Digital Activation (30 Days)",
    items: [
      {
        name: "Unlimited Free Express Deliveries",
        detail: "Zero delivery fee on all neighborhood orders",
        price: 299,
        mrp: 499,
        color: "bg-indigo-500",
      },
      {
        name: "5% In-Store Wallet Cashback",
        detail: "Auto-credited on every merchant purchase",
        price: 100,
        mrp: 150,
        color: "bg-emerald-500",
      },
      {
        name: "VIP 24/7 Priority Concierge & Queue Bypass",
        detail: "Instant live clinic and store priority token",
        price: 100,
        mrp: 150,
        color: "bg-purple-500",
      },
    ],
    billDetails: {
      itemTotal: 499,
      deliveryFee: "FREE",
      handling: 0,
      gst: 0,
    },
    note: "Kynisto Pro Subscription #KYN-SUB-499",
  },
  membership: {
    id: "membership",
    label: "Store Owner VIP Membership (Customer)",
    tabTitle: "Store VIP Pass",
    orderId: "KYN-MEM-499",
    merchantName: "Kynisto Partner Merchant",
    amount: 499,
    totalSavings: 525,
    deliveryEstimate: "Instant Annual Customer Activation (365 Days)",
    items: [
      {
        name: "Annual Neighborhood Store VIP Pass",
        detail: "Exclusive customer loyalty member privileges",
        price: 349,
        mrp: 699,
        color: "bg-rose-500",
      },
      {
        name: "Flat 10% In-Store Bill Waiver",
        detail: "Direct discount on all counter checkouts",
        price: 75,
        mrp: 150,
        color: "bg-amber-500",
      },
      {
        name: "Complimentary Merchant Local Delivery",
        detail: "Store-to-door direct express dispatch",
        price: 75,
        mrp: 150,
        color: "bg-blue-500",
      },
    ],
    billDetails: {
      itemTotal: 499,
      deliveryFee: "FREE",
      handling: 0,
      gst: 0,
    },
    note: "Kynisto Store VIP Membership #KYN-MEM-499",
  },
};

export default function UpiCheckoutPrototype() {
  const [copied, setCopied] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<
    "ready" | "opening" | "confirming" | "success"
  >("ready");
  const [showQrModal, setShowQrModal] = useState(false);
  const [orderType, setOrderType] = useState<OrderType>("grocery");

  const confirmTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active configuration based on selected preset
  const activePreset = ORDER_PRESETS[orderType];
  const paymentConfig: UPIPaymentConfig = {
    ...defaultPaymentConfig,
    orderId: activePreset.orderId,
    merchantName: activePreset.merchantName,
    amount: activePreset.amount,
    note: activePreset.note,
  };

  // Check URL query parameters for subscription/membership deep-links on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get("type")?.toLowerCase();
      const planParam = params.get("plan")?.toLowerCase();

      if (typeParam === "subscription" || planParam === "subscription" || planParam === "pro") {
        setOrderType("subscription");
      } else if (
        typeParam === "membership" ||
        planParam === "membership" ||
        typeParam === "store" ||
        planParam === "store_owner"
      ) {
        setOrderType("membership");
      }
    }

    return () => {
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
      cancelActiveUPILaunch();
    };
  }, []);

  // Dynamic URI construction
  const genericUpiLink = createUPILink("generic", paymentConfig);
  const activeTargetLink = createUPILink(
    selectedApp || "generic",
    paymentConfig,
    "auto"
  );
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(
    genericUpiLink
  )}`;

  // Handle Copy UPI ID
  const copyUPI = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(paymentConfig.upiId);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  // Trigger UPI App Payment using bulletproof engine
  const handleOpenUPIPayment = (appKey: string) => {
    setSelectedApp(appKey);
    setPaymentState("opening");

    // Launch with automatic Android Intent package targeting & desktop/timeout fallback
    const result = triggerUPIApp(appKey, paymentConfig, () => {
      // Fallback callback: if app fails to open or is on desktop browser
      setShowQrModal(true);
    });

    // If on desktop browser without native mobile intents, automatically open QR modal
    if (!result.isMobile) {
      setShowQrModal(true);
    }

    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }
    confirmTimerRef.current = setTimeout(() => {
      setPaymentState("confirming");
    }, 2800);
  };

  const handleSimulatedSuccess = () => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }
    setPaymentState("success");
    setShowQrModal(false);
  };

  const handleTryAgain = () => {
    if (confirmTimerRef.current) {
      clearTimeout(confirmTimerRef.current);
    }
    cancelActiveUPILaunch();
    setPaymentState("ready");
    setSelectedApp(null);
  };

  const appDisplayName = (key: string | null) => {
    switch (key) {
      case "fampay":
        return "FamPay";
      case "phonepe":
        return "PhonePe";
      case "paytm":
        return "Paytm";
      case "gpay":
        return "Google Pay";
      case "generic":
        return "UPI App";
      default:
        return key ? key.toUpperCase() : "UPI App";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-blue-600 selection:text-white pb-20 overflow-x-clip">
      {/* Top Banner: Localhost Prototype Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
              title="Return Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-xs shadow-xs">
                K
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-slate-900 block leading-tight">
                  Kynisto Checkout
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Instant UPI Payment Gateway
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1.5" />
              UPI Prototype
            </span>
            <span className="text-xs font-mono font-medium text-slate-500 hidden sm:inline">
              #{activePreset.orderId}
            </span>
          </div>
        </div>
      </header>

      {/* Main Checkout Canvas */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-8">
        {paymentState === "success" ? (
          /* =========================================================================
           * 4. SUCCESS SCREEN (Light Mode Clean Emerald Card)
           * ========================================================================= */
          <div className="max-w-lg mx-auto bg-white border border-emerald-200 rounded-3xl p-6 sm:p-9 text-center shadow-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/25 mb-5 relative">
              <CheckCircle2 className="w-10 h-10 text-white stroke-[2.5]" />
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-25" />
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              Payment Confirmed
            </span>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mb-2">
              {orderType === "grocery"
                ? "Order Placed Successfully 🎉"
                : orderType === "subscription"
                ? "Subscription Activated 🎉"
                : "VIP Membership Confirmed 🎉"}
            </h1>
            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
              {orderType === "grocery"
                ? "Your grocery order has been dispatched to Kynisto Daily Mart. The merchant is packing your fresh items right now."
                : orderType === "subscription"
                ? "Your Kynisto Pro Subscription is active. Enjoy unlimited free deliveries and 5% store cashback."
                : "Your Store Owner Customer Membership has been credited. Show your VIP QR at the store counter for 10% instant discount."}
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-left space-y-3 mb-6">
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Order Reference</span>
                <span className="font-mono font-bold text-slate-900">
                  #{activePreset.orderId}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Amount Paid</span>
                <span className="font-extrabold text-emerald-700 text-base">
                  ₹{activePreset.amount}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500">
                <span>Payment Method</span>
                <span className="inline-flex items-center space-x-1 font-semibold text-slate-800">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  <span>UPI ({appDisplayName(selectedApp)})</span>
                </span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-200 pt-2.5">
                <span className="flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Delivery / Activation</span>
                </span>
                <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  {activePreset.deliveryEstimate}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleTryAgain}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                <span>Test Another UPI App</span>
              </button>
              <Link
                href="/"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
              >
                <span>Continue Shopping</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* =========================================================================
           * 1, 2, 3: CHECKOUT GRID (Ready, Opening, Confirming)
           * ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Order Summary & Interactive Model Selector */}
            <div className="lg:col-span-5 space-y-5">
              {/* Order Type Segmented Controls (Grocery vs Subscription vs Membership) */}
              <div className="bg-slate-200/70 p-1.5 rounded-2xl flex items-center gap-1 text-xs font-bold text-slate-600 shadow-inner">
                <button
                  onClick={() => setOrderType("grocery")}
                  className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    orderType === "grocery"
                      ? "bg-white text-slate-900 shadow-xs font-black"
                      : "hover:text-slate-900 text-slate-500"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Grocery</span>
                </button>
                <button
                  onClick={() => setOrderType("subscription")}
                  className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    orderType === "subscription"
                      ? "bg-white text-slate-900 shadow-xs font-black"
                      : "hover:text-slate-900 text-slate-500"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  <span>Kynisto Pro</span>
                </button>
                <button
                  onClick={() => setOrderType("membership")}
                  className={`flex-1 py-2 px-2.5 rounded-xl transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    orderType === "membership"
                      ? "bg-white text-slate-900 shadow-xs font-black"
                      : "hover:text-slate-900 text-slate-500"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-rose-500" />
                  <span>Store VIP</span>
                </button>
              </div>

              {/* Order Basket Card (Light Mode Blinkit Style) */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      {orderType === "grocery" ? (
                        <ShoppingBag className="w-5 h-5" />
                      ) : orderType === "subscription" ? (
                        <Crown className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Store className="w-5 h-5 text-rose-600" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900 text-sm">
                        {activePreset.label}
                      </h2>
                      <p className="text-xs text-slate-500">
                        Merchant: {activePreset.merchantName}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/80 flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                    <span>{orderType === "grocery" ? "15m Express" : "Instant"}</span>
                  </span>
                </div>

                {/* Items List with MRP & Savings */}
                <div className="space-y-3 mb-5 text-sm">
                  {activePreset.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 rounded-xl hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 mr-2">
                        <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                        <div>
                          <span className="font-semibold text-slate-900 block leading-tight text-xs sm:text-sm">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.detail}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-900 block text-xs sm:text-sm">
                          ₹{item.price}
                        </span>
                        <span className="text-[10px] text-slate-400 line-through">
                          ₹{item.mrp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Savings Banner */}
                <div className="mb-4 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Your Total Savings</span>
                  </div>
                  <span className="font-bold">₹{activePreset.totalSavings} Saved</span>
                </div>

                {/* Bill Breakdown */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Item Total</span>
                    <span className="text-slate-800 font-medium">₹{activePreset.amount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Delivery / Processing</span>
                    <span className="text-emerald-700 font-bold uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded-md text-[11px]">
                      {activePreset.billDetails.deliveryFee}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Handling & Packaging</span>
                    <span className="text-slate-500">₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>GST (Included)</span>
                    <span className="text-slate-500">₹0.00</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 flex justify-between items-center text-sm">
                    <div>
                      <span className="font-extrabold text-slate-900 block">
                        Total Payable
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Inclusive of all taxes
                      </span>
                    </div>
                    <span className="font-black text-2xl text-slate-900 tracking-tight">
                      ₹{activePreset.amount}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-2 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    100% Secure NPCI UPI Encrypted Gateway. Zero card/bank data saved.
                  </span>
                </div>
              </div>

              {/* Desktop Direct QR Preview */}
              <div className="hidden lg:block bg-white border border-slate-200/90 rounded-3xl p-5 text-center shadow-sm">
                <div className="flex items-center justify-center space-x-2 text-xs font-bold text-slate-800 mb-3">
                  <QrCode className="w-4 h-4 text-blue-600" />
                  <span>Scan to Pay from Smartphone</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl inline-block border border-slate-200 shadow-xs mx-auto relative group">
                  <img
                    src={qrCodeUrl}
                    alt="UPI Payment QR Code"
                    className="w-44 h-44 object-contain rounded-xl bg-white p-1"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/75 text-white text-xs font-bold rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Scan with any UPI App
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-3">
                  Open GPay, PhonePe, Paytm, FamPay or Cred to scan
                </p>
              </div>
            </div>

            {/* Right Column: Premium "Pay with UPI" App Selector */}
            <div className="lg:col-span-7 space-y-5">
              {paymentState === "opening" ? (
                /* -------------------------------------------------------------
                 * STATE 2: OPENING APP LOADING STATE (Light Mode)
                 * ------------------------------------------------------------- */
                <div className="bg-white border border-blue-200 rounded-3xl p-7 sm:p-9 text-center shadow-lg animate-in fade-in duration-200">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center relative">
                    <Smartphone className="w-8 h-8 text-blue-600 animate-bounce" />
                    <div className="absolute inset-0 rounded-2xl bg-blue-200/50 animate-ping" />
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 mb-1">
                    Opening {appDisplayName(selectedApp)}...
                  </h3>
                  <p className="text-slate-600 text-xs sm:text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                    Launching your registered UPI payment client with pre-filled payee details for{" "}
                    <strong className="text-slate-900 font-extrabold">
                      ₹{activePreset.amount}
                    </strong>
                    . Please authorize the payment in your app.
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <a
                      href={activeTargetLink}
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                    >
                      <span>Tap to Launch {appDisplayName(selectedApp)}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={genericUpiLink}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                      title="Open universal UPI chooser"
                    >
                      <span>Open in Any UPI App</span>
                    </a>
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer border border-blue-200"
                    >
                      Show QR Code
                    </button>
                    <button
                      onClick={() => setPaymentState("confirming")}
                      className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Confirm Manually
                    </button>
                  </div>
                </div>
              ) : paymentState === "confirming" ? (
                /* -------------------------------------------------------------
                 * STATE 3: RETURN FROM PAYMENT / CONFIRMATION MODAL (Light Mode)
                 * ------------------------------------------------------------- */
                <div className="bg-white border border-amber-200 rounded-3xl p-6 sm:p-8 shadow-lg animate-in fade-in duration-200">
                  <div className="flex items-start space-x-3.5 mb-4">
                    <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 shrink-0">
                      <Info className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        Did you complete the payment?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 mt-1">
                        Please confirm once ₹{activePreset.amount} has been successfully authorized in your UPI app.
                      </p>
                    </div>
                  </div>

                  {/* Prototype Label */}
                  <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 mb-6 flex items-start space-x-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      <strong>Prototype confirmation:</strong> In production, a payment gateway webhook (e.g. PhonePe / Razorpay) automatically verifies NPCI settlement in real-time.
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSimulatedSuccess}
                      className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Payment Successful</span>
                    </button>
                    <button
                      onClick={handleTryAgain}
                      className="py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition cursor-pointer"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : (
                /* -------------------------------------------------------------
                 * STATE 1: READY TO PAY - PREMIUM UPI APP OPTIONS (Light Mode)
                 * ------------------------------------------------------------- */
                <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-shadow space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
                        <span>Pay with UPI</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                          Zero Fee • Instant
                        </span>
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500">
                      Select your preferred UPI app to open pre-filled payment of ₹{activePreset.amount}
                    </p>
                  </div>

                  {/* Payment App Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* 1. FamPay */}
                    <button
                      onClick={() => handleOpenUPIPayment("fampay")}
                      className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-orange-400 hover:bg-orange-50/40 hover:shadow-xs transition-all duration-200 group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-3.5">
                        <FamPayLogo className="w-11 h-11" />
                        <div>
                          <span className="block font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition">
                            FamPay (FamApp)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Teen & Gen-Z UPI
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>

                    {/* 2. PhonePe */}
                    <button
                      onClick={() => handleOpenUPIPayment("phonepe")}
                      className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#5F259F] hover:bg-purple-50/40 hover:shadow-xs transition-all duration-200 group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-3.5">
                        <PhonePeLogo className="w-11 h-11" />
                        <div>
                          <span className="block font-extrabold text-sm text-slate-900 group-hover:text-[#5F259F] transition">
                            PhonePe
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Fast & Direct Bank Pay
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#5F259F] group-hover:translate-x-0.5 transition shrink-0" />
                    </button>

                    {/* 3. Paytm */}
                    <button
                      onClick={() => handleOpenUPIPayment("paytm")}
                      className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#00BAF2] hover:bg-sky-50/40 hover:shadow-xs transition-all duration-200 group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-3.5">
                        <PaytmLogo className="w-11 h-11" />
                        <div>
                          <span className="block font-extrabold text-sm text-slate-900 group-hover:text-[#002970] transition">
                            Paytm UPI
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Wallet & Bank UPI
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#002970] group-hover:translate-x-0.5 transition shrink-0" />
                    </button>

                    {/* 4. Google Pay */}
                    <button
                      onClick={() => handleOpenUPIPayment("gpay")}
                      className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-xs transition-all duration-200 group flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center space-x-3.5">
                        <GooglePayLogo className="w-11 h-11" />
                        <div>
                          <span className="block font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition">
                            Google Pay (GPay)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Official Google UPI
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>

                    {/* 5. Other UPI Apps */}
                    <button
                      onClick={() => handleOpenUPIPayment("generic")}
                      className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 hover:shadow-xs transition-all duration-200 group flex items-center justify-between cursor-pointer sm:col-span-2"
                    >
                      <div className="flex items-center space-x-3.5">
                        <UpiGenericLogo className="w-11 h-11" />
                        <div>
                          <span className="block font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition">
                            Other UPI Apps (Cred, BHIM, Amazon Pay)
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Choose from any UPI app installed on your smartphone
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md hidden sm:inline">
                          All Apps
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition shrink-0" />
                      </div>
                    </button>
                  </div>

                  {/* 6. Scan QR Code & 7. Copy UPI ID */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* Scan QR Modal Trigger */}
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="p-3.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200/80 text-blue-700 text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                    >
                      <QrCode className="w-4 h-4 text-blue-600" />
                      <span>Scan Dynamic QR Code</span>
                    </button>

                    {/* Copy UPI Box */}
                    <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="truncate mr-2">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                          VPA / UPI ID
                        </span>
                        <span className="font-mono font-semibold text-slate-800 select-all">
                          {paymentConfig.upiId}
                        </span>
                      </div>
                      <button
                        onClick={copyUPI}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold transition-all shrink-0 flex items-center space-x-1 cursor-pointer shadow-xs"
                        title="Copy VPA"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Toast Notification */}
                  {copied && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs text-center font-bold animate-in fade-in slide-in-from-top-1 duration-150">
                      ✓ UPI ID copied to clipboard! Paste it into your payment app.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
       * DYNAMIC QR CODE MODAL (Light Mode Polished)
       * ========================================================================= */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">
                K
              </div>
              <span className="font-extrabold text-sm text-slate-900">
                Kynisto Merchant Pay
              </span>
            </div>

            <h3 className="text-lg font-black text-slate-900 mb-0.5">
              Scan with any UPI App
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Google Pay, PhonePe, Paytm, FamPay, BHIM & more
            </p>

            {/* QR Image Box */}
            <div className="bg-slate-50 p-4 rounded-2xl inline-block border border-slate-200 shadow-xs mx-auto mb-4 relative">
              <img
                src={qrCodeUrl}
                alt="Dynamic UPI QR Code"
                className="w-56 h-56 object-contain rounded-xl bg-white p-1"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs mb-4 text-left space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Payee:</span>
                <span className="text-slate-900 font-semibold">
                  {paymentConfig.merchantName}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <span className="text-emerald-700 font-bold">
                  ₹{paymentConfig.amount}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>UPI ID:</span>
                <span className="font-mono text-slate-800 text-[11px]">
                  {paymentConfig.upiId}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSimulatedSuccess}
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs"
              >
                Simulate Payment Done
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
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
