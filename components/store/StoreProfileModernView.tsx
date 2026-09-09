"use client";

import React, { useState, useEffect } from "react";
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
  ExternalLink,
  MessageCircle,
  X,
  Plus,
  Navigation,
  Check,
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

  // Modals & Interactive States
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedServicePill, setSelectedServicePill] = useState<{ name: string; description?: string; price?: number } | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewerName, setNewReviewerName] = useState("");
  const [newComment, setNewComment] = useState("");
  const [reviewsList, setReviewsList] = useState<Array<{ id: string; reviewerName?: string; rating?: number; comment?: string }>>([]);

  const heroImage =
    store.bannerUrl ||
    store.logoUrl ||
    (store.images && store.images.length > 0 ? store.images[0].url : null) ||
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80";

  const rating = Number(store.rating ?? 4.8).toFixed(1);
  const reviewCount = store.reviews ?? 124;
  const distance = Number(store.distance ?? 0.4).toFixed(1);

  // Initialize reviews and favorites
  useEffect(() => {
    if (store.reviewItems && store.reviewItems.length > 0) {
      setReviewsList(store.reviewItems);
    } else {
      setReviewsList([
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
      ]);
    }

    try {
      const favs = JSON.parse(localStorage.getItem("kynisto_favorites") || "[]");
      if (Array.isArray(favs) && favs.includes(store.slug)) {
        setIsFavorite(true);
      }
    } catch {
      // Ignored
    }
  }, [store]);

  // Fallback service pills
  const servicePills =
    store.services && store.services.length > 0
      ? store.services
      : [
          { name: "General Dentistry", description: "Complete dental examination, consultation, and dental hygiene review.", price: 500 },
          { name: "Teeth Cleaning", description: "Ultrasonic tartar removal, scaling, and enamel polishing.", price: 800 },
          { name: "Braces", description: "Orthodontic alignment with metal, ceramic, or invisible aligners.", price: 15000 },
          { name: "Root Canal", description: "Painless single-sitting rotary endodontic therapy.", price: 2500 },
          { name: "Cosmetic Dentistry", description: "Teeth whitening, composite veneers, and smile design.", price: 3500 },
        ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/stores");
    }
  };

  const handleToggleFavorite = () => {
    const next = !isFavorite;
    setIsFavorite(next);
    try {
      const favs = JSON.parse(localStorage.getItem("kynisto_favorites") || "[]");
      const updated = next
        ? Array.from(new Set([...favs, store.slug]))
        : favs.filter((s: string) => s !== store.slug);
      localStorage.setItem("kynisto_favorites", JSON.stringify(updated));
    } catch {
      // Ignored
    }
    showToast(next ? "Saved to your favorites!" : "Removed from favorites");
  };

  const handleShare = async () => {
    const shareData = {
      title: store.name,
      text: `Check out ${store.name} on Kynisto!`,
      url: typeof window !== "undefined" ? window.location.href : `https://kynisto.in/stores/${store.slug}`,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
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
      setInQueue(false);
      setQueuePosition(3);
      setWaitingTimeMins(5);
      setQueueStep("waiting");
      showToast("You have left the queue.");
      return;
    }
    setInQueue(true);
    setQueuePosition(4);
    setWaitingTimeMins(7);
    setQueueStep("waiting");
    showToast("You joined the queue at position #4! We will notify you when it's your turn.");
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewerName.trim() || !newComment.trim()) {
      showToast("Please enter your name and comment.");
      return;
    }
    const newEntry = {
      id: `rev-${Date.now()}`,
      reviewerName: newReviewerName.trim(),
      rating: newRating,
      comment: newComment.trim(),
    };
    setReviewsList([newEntry, ...reviewsList]);
    setReviewModalOpen(false);
    setNewReviewerName("");
    setNewComment("");
    setNewRating(5);
    showToast("Thank you! Your review has been published.");
  };

  // Gallery photos
  const galleryPhotos =
    store.images && store.images.length > 0
      ? store.images
      : [
          { id: "img-1", url: heroImage, altText: "Clinic interior" },
          { id: "img-2", url: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80", altText: "Dental equipment" },
          { id: "img-3", url: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80", altText: "Treatment room" },
          { id: "img-4", url: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80", altText: "Consultation desk" },
        ];

  // Reusable Live Queue Card Component
  const LiveQueueCard = ({ isDesktop = false }: { isDesktop?: boolean }) => (
    <div className="bg-gradient-to-br from-[#E8F8F4] via-[#EEFAF6] to-[#E5F7F2] border border-[#BDEBDD] rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
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

      {/* Desktop Inline Join Queue Button */}
      {isDesktop && (
        <div className="mt-5 pt-3 border-t border-teal-100/60">
          <button
            type="button"
            onClick={handleJoinQueue}
            className={`w-full font-bold py-3 px-5 rounded-full text-center transition-all text-sm cursor-pointer shadow-md ${
              inQueue
                ? "bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100"
                : "bg-[#103E7E] hover:bg-[#0c2f60] active:scale-[0.98] text-white shadow-blue-900/20"
            }`}
          >
            {inQueue ? "Leave Queue" : "Join Queue"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/60 md:bg-slate-50 text-slate-900 font-sans pb-28 md:pb-16 relative overflow-x-clip">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-md text-white px-4 py-2.5 rounded-full text-xs font-semibold shadow-xl border border-white/20 animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* Responsive Main Shell: Mobile centered max-w-md, Desktop full max-w-6xl */}
      <div className="w-full max-w-md md:max-w-6xl mx-auto md:px-6 lg:px-8">
        {/* Cover Photo Header */}
        <div className="relative h-72 sm:h-80 md:h-96 lg:h-[400px] w-full overflow-hidden bg-slate-200 md:rounded-3xl md:mt-6 shadow-sm">
          <img
            src={heroImage}
            alt={store.name}
            className="w-full h-full object-cover"
          />
          {/* Subtle vignette for button readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30 pointer-events-none" />

          {/* Floating Action Buttons over Cover */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="w-10 h-10 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-slate-800 active:scale-95 transition-all cursor-pointer"
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
                    : "bg-white/85 border-white/60 text-slate-800 hover:bg-white"
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
                className="w-10 h-10 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-white/60 shadow-md flex items-center justify-center text-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                <Share2 className="w-5 h-5 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Sheet Overlapping Cover */}
        <div className="relative -mt-8 md:-mt-6 rounded-t-[32px] md:rounded-3xl bg-white z-10 px-5 sm:px-8 pt-6 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:border md:border-slate-100">
          {/* Desktop Responsive Two-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 md:gap-10">
            {/* Primary Column (Left 7/12 on desktop, full width on mobile) */}
            <div className="md:col-span-7 lg:col-span-8">
              {/* Verified Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold text-xs tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 fill-blue-600 text-white" />
                <span>Verified</span>
              </div>

              {/* Store Name & Category */}
              <h1 className="text-2xl sm:text-[28px] lg:text-3xl font-black text-slate-900 tracking-tight mt-2.5 leading-snug">
                {store.name}
              </h1>
              <p className="text-slate-500 font-medium text-sm sm:text-base mt-0.5">
                {store.businessType || store.category || "Dental Care & Oral Health"}
              </p>

              {/* Meta Row: Rating, Distance, Status */}
              <div className="flex items-center flex-wrap gap-2 text-xs sm:text-sm font-semibold text-slate-600 mt-2.5">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                  <span className="font-bold text-slate-900 text-[13px] sm:text-sm">{rating}</span>
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
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 my-6">
                {/* 1. Live Queue Button */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("queue");
                    const el = document.getElementById("mobile-queue-card");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="flex flex-col items-center group active:scale-95 transition-transform cursor-pointer"
                >
                  <div
                    className={`w-full aspect-square max-w-[80px] rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === "queue"
                        ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <Users className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11.5px] sm:text-xs mt-1.5 text-center font-bold tracking-tight ${
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
                    className={`w-full aspect-square max-w-[80px] rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === "reviews"
                        ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <Star className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11.5px] sm:text-xs mt-1.5 text-center font-semibold tracking-tight ${
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
                    className={`w-full aspect-square max-w-[80px] rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === "gallery"
                        ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <ImageIcon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11.5px] sm:text-xs mt-1.5 text-center font-semibold tracking-tight ${
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
                    className={`w-full aspect-square max-w-[80px] rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === "call"
                        ? "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/25"
                        : "bg-white border border-slate-100 text-slate-700 shadow-sm hover:bg-slate-50"
                    }`}
                  >
                    <Phone className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <span
                    className={`text-[11.5px] sm:text-xs mt-1.5 text-center font-semibold tracking-tight ${
                      activeTab === "call" ? "text-blue-600" : "text-slate-600"
                    }`}
                  >
                    Call
                  </span>
                </a>
              </div>

              {/* Mobile Live Queue Card (Hidden on Desktop because desktop displays sticky right sidebar) */}
              <div id="mobile-queue-card" className="md:hidden my-6">
                <LiveQueueCard />
              </div>

              {/* About Section */}
              <div className="mt-6 sm:mt-8">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-2">
                  About
                </h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                  {store.description ||
                    "Modern dental care with advanced technology and a caring team. Your smile, our priority."}
                </p>
              </div>

              {/* Services Pill Chips */}
              <div className="mt-6 sm:mt-8">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-2.5">
                  Services
                </h2>
                <div className="flex flex-wrap gap-2 sm:gap-2.5">
                  {servicePills.map((pill, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedServicePill(pill)}
                      className="px-3.5 py-1.5 rounded-full bg-[#EBF3FE] hover:bg-blue-100 text-[#2563EB] text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                    >
                      <span>{pill.name}</span>
                      {pill.price && <span className="text-[11px] font-normal opacity-75">· ₹{pill.price}</span>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Gallery Section */}
              <div id="gallery-section" className="mt-8 sm:mt-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    Photo Gallery
                  </h2>
                  <span className="text-xs text-slate-400 font-medium">Tap to view</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {galleryPhotos.slice(0, 4).map((img, i) => (
                    <div
                      key={i}
                      onClick={() => setLightboxImage(img.url)}
                      className="aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shadow-xs cursor-pointer group relative"
                    >
                      <img
                        src={img.url}
                        alt={img.altText || store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Reviews Section */}
              <div id="reviews-section" className="mt-8 sm:mt-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                      Customer Reviews
                    </h2>
                    <span className="text-xs font-semibold text-blue-600">
                      {rating} / 5.0 ({reviewsList.length} verified reviews)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Write Review</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900">
                          {rev.reviewerName || "Verified Patient"}
                        </span>
                        <div className="flex text-amber-400">
                          {Array.from({ length: rev.rating || 5 }).map((_, s) => (
                            <Star key={s} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-1">
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Store Membership Plans */}
              <div id="membership-plans" className="mt-8 sm:mt-10">
                <StoreMembershipStorefront storeId={store.id} storeName={store.name} />
              </div>
            </div>

            {/* Desktop Right Sidebar (Sticky on md/lg, hidden on mobile) */}
            <div className="hidden md:block md:col-span-5 lg:col-span-4">
              <div className="sticky top-6 space-y-5">
                {/* Desktop Live Queue Card */}
                <LiveQueueCard isDesktop={true} />

                {/* Location & Working Hours Card */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200/70 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-2.5">
                    Clinic Details & Timings
                  </h3>

                  {/* Hours */}
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Working Hours</span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {store.hours || "Open 09:00 AM – 08:00 PM (Mon–Sat)"}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Address</span>
                      <span className="text-xs text-slate-500 block mt-0.5 leading-snug">
                        {store.address || "Indiranagar, Bangalore, Karnataka"}
                      </span>
                    </div>
                  </div>

                  {/* Directions Button */}
                  <a
                    href={store.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(store.name + " " + store.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Get Directions</span>
                  </a>

                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={store.phone ? `tel:${store.phone}` : "tel:+919876543210"}
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Clinic</span>
                    </a>
                    <a
                      href={`https://wa.me/${(store.whatsapp || "919876543210").replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello, I am inquiring about appointment at " + store.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar (Hidden on Desktop) */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 z-50 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
          <div className="max-w-md w-full">
            <button
              type="button"
              onClick={handleJoinQueue}
              className={`w-full font-bold py-3.5 px-6 rounded-full shadow-lg text-center transition-all text-base cursor-pointer ${
                inQueue
                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20"
                  : "bg-[#103E7E] hover:bg-[#0c2f60] text-white shadow-blue-900/20 active:scale-[0.98]"
              }`}
            >
              {inQueue ? "Leave Queue (Position #4)" : "Join Queue"}
            </button>
          </div>
        </div>
      </div>

      {/* Service Details Modal */}
      {selectedServicePill && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedServicePill(null)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-900 pr-6">
              {selectedServicePill.name}
            </h3>

            {selectedServicePill.price && (
              <span className="text-xl font-black text-blue-600 block mt-1">
                ₹{selectedServicePill.price}
              </span>
            )}

            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              {selectedServicePill.description || "Professional service provided by experienced specialists at " + store.name}
            </p>

            <div className="mt-5 flex gap-2.5">
              <a
                href={store.phone ? `tel:${store.phone}` : "tel:+919876543210"}
                className="flex-1 py-2.5 px-4 rounded-full border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-50"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call to Inquire</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setSelectedServicePill(null);
                  handleJoinQueue();
                }}
                className="flex-1 py-2.5 px-4 rounded-full bg-[#103E7E] hover:bg-[#0c2f60] text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-blue-900/20 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Join Queue Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImage}
              alt="Full size preview"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1">
              Write a Review
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Share your experience with {store.name}
            </p>

            <form onSubmit={handleAddReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="cursor-pointer focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= newRating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={newReviewerName}
                  onChange={(e) => setNewReviewerName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              {/* Comment */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Review
                </label>
                <textarea
                  rows={3}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="How was your visit and treatment?"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#103E7E] hover:bg-[#0c2f60] text-white font-bold text-xs transition-all shadow-md shadow-blue-900/20 cursor-pointer"
              >
                Submit Verified Review
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
