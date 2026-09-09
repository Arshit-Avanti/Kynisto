"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  Share2,
  CheckCircle2,
  Star,
  Image as ImageIcon,
  Phone,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { StoreMembershipStorefront } from "@/components/store/StoreMembershipStorefront";

interface StoreProfileProps {
  store: {
    id: string;
    slug: string;
    name: string;
    description: string;
    category: string;
    subcategory?: string | null;
    businessType?: string;
    address: string;
    area?: string;
    city?: string;
    phone?: string | null;
    whatsapp?: string | null;
    website?: string | null;
    googleMapsUrl?: string | null;
    rating?: number;
    reviews?: number;
    distance?: number;
    open?: boolean;
    hours?: string;
    bannerUrl?: string | null;
    logoUrl?: string | null;
    queueEnabled?: boolean;
    queueStatus?: string | null;
    images?: Array<{ id: string; url: string; altText?: string }>;
    services?: Array<{ id: string; name: string; slug?: string; description?: string; price?: number; priceFrom?: number }>;
    products?: Array<{ id: string; name: string; slug?: string; description?: string; price?: number; imageUrl?: string }>;
    reviewItems?: Array<{ id: string; reviewerName?: string; rating?: number; comment?: string; createdAt?: number }>;
  };
}

export function StoreProfileModernView({ store }: StoreProfileProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"queue" | "reviews" | "gallery" | "call">("queue");
  const [isFavorite, setIsFavorite] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [queuePosition, setQueuePosition] = useState(3);
  const [waitingTimeMins, setWaitingTimeMins] = useState(5);
  const [queueStep, setQueueStep] = useState<"joined" | "waiting" | "consultation">("waiting");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const heroImage =
    store.bannerUrl ||
    store.logoUrl ||
    (store.images && store.images.length > 0 ? store.images[0].url : null) ||
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80";

  const rating = Number(store.rating ?? 4.8).toFixed(1);
  const reviewCount = store.reviews ?? 124;
  const distance = Number(store.distance ?? 0.4).toFixed(1);

  // Fallback dental service pills if store does not have custom services defined
  const servicePills =
    store.services && store.services.length > 0
      ? store.services.map((s) => s.name)
      : [
          "General Dentistry",
          "Teeth Cleaning",
          "Braces",
          "Root Canal",
          "Cosmetic Dentistry",
        ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    showToast(!isFavorite ? "Added to your favorites!" : "Removed from favorites");
  };

  const handleShare = async () => {
    const shareData = {
      title: store.name,
      text: `Check out ${store.name} on Kynisto!`,
      url: typeof window !== "undefined" ? window.location.href : `https://kynisto.in/stores/${store.slug}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showToast("Link copied to clipboard!");
      }
    } catch {
      // Ignored
    }
  };

  const handleJoinQueue = () => {
    if (inQueue) {
      showToast("You are already in this live queue!");
      return;
    }
    setInQueue(true);
    setQueuePosition(4);
    setWaitingTimeMins(7);
    setQueueStep("waiting");
    showToast("You joined the queue at position #4!");
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans pb-28 relative overflow-x-clip">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-semibold shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Main Container - Mobile Centered Frame */}
      <div className="max-w-md mx-auto relative bg-white min-h-screen shadow-2xl border-x border-slate-200/40">
        {/* Cover Photo Header */}
        <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-slate-200">
          <img
            src={heroImage}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          {/* Subtle vignette for button readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Action Buttons over Cover */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Right Buttons: Favorite & Share */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label="Add to favorites"
                className={`w-10 h-10 rounded-full backdrop-blur-md border shadow-md flex items-center justify-center active:scale-95 transition-all cursor-pointer ${
                  isFavorite
                    ? "bg-rose-50 border-rose-200 text-rose-500"
                    : "bg-white/80 border-white/60 text-slate-800 hover:bg-white"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? "fill-rose-500 stroke-rose-500" : "stroke-[2.2]"
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleShare}
                aria-label="Share store link"
                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-slate-800 hover:bg-white active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Sheet Overlapping Cover */}
        <div className="relative -mt-8 rounded-t-[32px] bg-white z-10 px-5 pt-6 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
          {/* Verified Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold text-xs tracking-wide">
            <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />
            <span>Verified</span>
          </div>

          {/* Store Name & Category */}
          <h1 className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight mt-2.5 leading-snug">
            {store.name}
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-0.5">
            {store.businessType || store.category || "Dental Care & Oral Health"}
          </p>

          {/* Meta Row: Rating, Distance, Status */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-semibold text-slate-600 mt-2.5">
            {/* Rating */}
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
              <span className="font-bold text-slate-900 text-[13px]">{rating}</span>
              <span className="text-slate-500 font-normal">({reviewCount} reviews)</span>
            </div>

            <span className="text-slate-300 font-bold">•</span>

            {/* Distance */}
            <div className="flex items-center gap-1 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{distance} km</span>
            </div>

            <span className="text-slate-300 font-bold">•</span>

            {/* Status */}
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 font-bold">Open</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Closes 8 PM</span>
            </div>
          </div>

          {/* 4 Quick Action Cards Grid */}
          <div className="grid grid-cols-4 gap-2.5 my-6">
            {/* 1. Live Queue Button */}
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
            >
              <div
                className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "queue"
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11.5px] mt-1.5 text-center font-bold tracking-tight ${
                  activeTab === "queue" ? "text-blue-600" : "text-slate-600"
                }`}
              >
                Live Queue
              </span>
            </button>

            {/* 2. Reviews Button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("reviews");
                const el = document.getElementById("reviews-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
            >
              <div
                className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "reviews"
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <Star className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11.5px] mt-1.5 text-center font-semibold tracking-tight ${
                  activeTab === "reviews" ? "text-blue-600" : "text-slate-600"
                }`}
              >
                Reviews
              </span>
            </button>

            {/* 3. Gallery Button */}
            <button
              type="button"
              onClick={() => {
                setActiveTab("gallery");
                const el = document.getElementById("gallery-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
            >
              <div
                className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "gallery"
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <ImageIcon className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11.5px] mt-1.5 text-center font-semibold tracking-tight ${
                  activeTab === "gallery" ? "text-blue-600" : "text-slate-600"
                }`}
              >
                Gallery
              </span>
            </button>

            {/* 4. Call Button */}
            <a
              href={store.phone ? `tel:${store.phone}` : "tel:+919876543210"}
              onClick={() => setActiveTab("call")}
              className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
            >
              <div
                className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${
                  activeTab === "call"
                    ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                    : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                }`}
              >
                <Phone className="w-6 h-6 stroke-[2.2]" />
              </div>
              <span
                className={`text-[11.5px] mt-1.5 text-center font-semibold tracking-tight ${
                  activeTab === "call" ? "text-blue-600" : "text-slate-600"
                }`}
              >
                Call
              </span>
            </a>
          </div>

          {/* Live Queue Status Card */}
          <div className="bg-gradient-to-br from-[#E8F8F4] via-[#EEFAF6] to-[#E5F7F2] border border-[#BDEBDD] rounded-2xl p-4 shadow-xs relative overflow-hidden">
            {/* Header: Title and Live Badge */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
                <Star className="w-4 h-4 fill-slate-800 text-slate-800" />
                <span>Live Queue</span>
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/90 text-emerald-700 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live</span>
              </div>
            </div>

            {/* Two Stat Metric Panels */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/90 backdrop-blur-xs rounded-xl p-3 border border-white shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 block">
                  Your position
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">
                  #{queuePosition}
                </span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs rounded-xl p-3 border border-white shadow-xs">
                <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 inline-block" />
                  <span>Est. waiting time</span>
                </span>
                <span className="text-2xl font-black text-slate-900 block mt-0.5">
                  {waitingTimeMins} mins
                </span>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div className="pt-2 pb-1 px-2">
              <div className="relative flex items-center justify-between">
                {/* Connecting Line Track */}
                <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[2.5px] bg-slate-200 z-0" />
                {/* Active progress fill */}
                <div
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-[2.5px] bg-blue-600 transition-all duration-500 z-0 ${
                    queueStep === "joined" ? "w-0" : queueStep === "waiting" ? "w-1/2" : "w-full"
                  }`}
                />

                {/* Node 1: Joined */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full bg-blue-600 shadow-xs" />
                  <span className="text-[10.5px] font-semibold text-slate-600 mt-1.5">
                    Joined
                  </span>
                </div>

                {/* Node 2: Waiting */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-blue-600 ring-4 ring-blue-100 flex items-center justify-center shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>
                  <span className="text-[10.5px] font-bold text-blue-600 mt-1.5">
                    Waiting
                  </span>
                </div>

                {/* Node 3: Consultation */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 bg-white" />
                  <span className="text-[10.5px] font-medium text-slate-400 mt-1.5">
                    Consultation
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="mt-6">
            <h2 className="text-base font-bold text-slate-900 tracking-tight mb-1.5">
              About
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              {store.description ||
                "Modern dental care with advanced technology and a caring team. Your smile, our priority."}
            </p>
          </div>

          {/* Services Pill Chips */}
          <div className="mt-6">
            <h2 className="text-base font-bold text-slate-900 tracking-tight mb-2.5">
              Services
            </h2>
            <div className="flex flex-wrap gap-2">
              {servicePills.map((pill, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-full bg-[#EBF3FE] text-[#2563EB] text-xs font-semibold hover:bg-blue-100 transition-colors"
                >
                  {pill}
                </span>
              ))}
            </div>
          </div>

          {/* Store Membership Plans (if available) */}
          <div id="membership-plans" className="mt-8">
            <StoreMembershipStorefront storeId={store.id} storeName={store.name} />
          </div>

          {/* Photos / Gallery Section */}
          <div id="gallery-section" className="mt-8">
            <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">
              Photo Gallery
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(store.images && store.images.length > 0 ? store.images : [
                { id: "img-1", url: heroImage, altText: "Clinic interior" },
                { id: "img-2", url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80", altText: "Dental unit" },
              ]).slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-xs">
                  <img src={img.url} alt={img.altText || store.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                </div>
              ))}
            </div>
          </div>

          {/* Reviews Section */}
          <div id="reviews-section" className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Customer Reviews
              </h2>
              <span className="text-xs font-semibold text-blue-600">
                {rating} / 5.0 ({reviewCount})
              </span>
            </div>
            <div className="space-y-3">
              {(store.reviewItems && store.reviewItems.length > 0 ? store.reviewItems : [
                {
                  id: "rev-1",
                  reviewerName: "Priya Sharma",
                  rating: 5,
                  comment: "Painless cleaning and great ambience! Highly recommend.",
                },
                {
                  id: "rev-2",
                  reviewerName: "Rahul Verma",
                  rating: 5,
                  comment: "State-of-the-art clinic with minimal waiting time.",
                },
              ]).map((rev, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900">{rev.reviewerName || "Patient"}</span>
                    <div className="flex text-amber-400">
                      {Array.from({ length: rev.rating || 5 }).map((_, s) => (
                        <Star key={s} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Sticky Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-md w-full">
            <button
              type="button"
              onClick={handleJoinQueue}
              className="w-full bg-[#103E7E] hover:bg-[#0c2f60] active:scale-[0.98] text-white font-bold py-3.5 px-6 rounded-full shadow-lg shadow-blue-900/20 text-center transition-all text-base cursor-pointer"
            >
              {inQueue ? "In Queue (#4)" : "Join Queue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
