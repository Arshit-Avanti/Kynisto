"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Sparkles,
  Star,
  MapPin,
  Home,
  Flower2,
  Wrench,
  GraduationCap,
  MoreHorizontal,
  ArrowRight,
  X,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Store,
  MessageCircle,
} from "lucide-react";
import { MobileBottomNav } from "@/components/landing/MobileBottomNav";
import { apiFetch } from "@/lib/client-api";

interface ServiceItem {
  id: string;
  name: string;
  categoryName?: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  distanceKm?: number;
  startingPrice?: number | null;
  estimatedArrival?: string;
  imageUrl?: string | null;
  description?: string;
  storeId?: string;
  storeName?: string;
  storeSlug?: string;
  storePhone?: string | null;
  address?: string;
  area?: string;
  city?: string;
}

function getServiceImagePlaceholder(categoryName?: string): string {
  const cat = (categoryName || "").toLowerCase();
  if (cat.includes("clean") || cat.includes("home")) {
    return "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80";
  }
  if (cat.includes("repair") || cat.includes("ac") || cat.includes("electric")) {
    return "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80";
  }
  if (cat.includes("beauty") || cat.includes("salon") || cat.includes("spa")) {
    return "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=400&q=80";
  }
  if (cat.includes("edu") || cat.includes("tutor") || cat.includes("class")) {
    return "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80";
  }
  return "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=400&q=80";
}

export function HomeServicesDiscovery() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Real services from database entered by shop owners
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const categories = [
    { id: "home", label: "Home Services", icon: Home },
    { id: "beauty", label: "Beauty & Wellness", icon: Flower2 },
    { id: "repairs", label: "Repairs & Maintenance", icon: Wrench },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "more", label: "More ...", icon: MoreHorizontal },
  ];

  // Fetch real services from API
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    const params = new URLSearchParams();
    if (selectedCategory && selectedCategory !== "all" && selectedCategory !== "more") {
      // Pass category filter
      const categoryObj = categories.find((c) => c.id === selectedCategory);
      if (categoryObj) {
        params.set("category", categoryObj.label);
      }
    }
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }

    apiFetch<{ ok: boolean; items: ServiceItem[] }>(`/api/services?${params.toString()}`)
      .then((res) => {
        if (!active) return;
        if (res?.ok && Array.isArray(res.items)) {
          setServicesList(res.items);
        } else {
          setServicesList([]);
        }
      })
      .catch(() => {
        if (active) setServicesList([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedCategory, searchQuery]);

  const displayedServices = useMemo(() => {
    return servicesList.filter((item) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;
      return (
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.storeName && item.storeName.toLowerCase().includes(query))
      );
    });
  }, [servicesList, searchQuery]);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-32 md:pb-16 relative overflow-x-clip">
      {/* Responsive Container: Fluid width with max-w-6xl for PC scale */}
      <div className="w-full max-w-6xl mx-auto md:px-6 lg:px-8">
        {/* Royal Blue Organic Hero Header */}
        <div className="relative bg-gradient-to-b from-[#1C5EB8] via-[#2170D4] to-[#2563EB] px-5 sm:px-8 pt-5 sm:pt-7 pb-12 sm:pb-16 overflow-hidden md:rounded-3xl md:mt-6 shadow-sm">
          {/* Subtle Abstract Wave Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-sky-300/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

          {/* Top Bar: Back, Title, Search */}
          <div className="relative z-10 flex items-center justify-between">
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Title */}
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide">
              Services
            </h1>

            {/* Search Toggle Button */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search services"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
            >
              <Search className="w-5 h-5 stroke-[2.2]" />
            </button>
          </div>

          {/* Collapsible Search Input */}
          {searchOpen && (
            <div className="relative z-10 mt-4 max-w-xl mx-auto animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cleaning, AC repair, salon, electrician..."
                  className="w-full bg-white/95 text-slate-900 placeholder:text-slate-400 px-4 py-3 pl-11 rounded-full text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
                  autoFocus
                />
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hero Typography */}
          <div className="relative z-10 mt-6 sm:mt-8 mb-2 sm:mb-4">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              Professional Services
              <br />
              for Everyday Needs
            </h2>
            <p className="text-blue-100/90 text-xs sm:text-sm lg:text-base mt-2 font-medium">
              Trusted services from verified local businesses.
            </p>
          </div>
        </div>

        {/* Curved White Sheet Overlapping Blue Hero */}
        <div className="relative -mt-6 rounded-t-[32px] md:rounded-3xl bg-white z-10 px-5 sm:px-8 pt-6 sm:pt-8 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:border md:border-slate-100 min-h-[500px]">
          {/* 5-Item Category Selector */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-4 md:gap-6 text-center pb-2">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
                >
                  <div
                    className={`w-13 h-13 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl md:rounded-3xl flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-[#1E62C6] text-white shadow-md shadow-blue-500/30"
                        : "bg-slate-50 border border-slate-100/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${isActive ? "text-white stroke-[2.2]" : "stroke-[1.8]"}`} />
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs md:text-sm mt-1.5 leading-tight text-center ${
                      isActive
                        ? "text-blue-600 font-bold underline decoration-2 underline-offset-4"
                        : "text-slate-600 font-medium"
                    }`}
                  >
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Services Section */}
          <div className="mt-8 sm:mt-10">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Available Services
                </h3>
                {selectedCategory !== "home" && selectedCategory !== "all" && (
                  <span className="text-xs text-blue-600 font-semibold">
                    Category: {categories.find((c) => c.id === selectedCategory)?.label}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory("all");
                  setSearchQuery("");
                }}
                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>View all</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Loading Skeleton */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-3 bg-slate-200 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Responsive Service Cards Grid: 1 column on mobile, 2 columns on tablet, 3 columns on PC */}
            {!isLoading && displayedServices.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
                {displayedServices.map((service) => {
                  const img = service.imageUrl || getServiceImagePlaceholder(service.categoryName);
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-100/90 shadow-xs hover:shadow-md hover:border-blue-200 transition-all cursor-pointer active:scale-[0.99] group"
                    >
                      {/* Left: Thumbnail and Info */}
                      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                        <img
                          src={img}
                          alt={service.name}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover shadow-xs shrink-0 border border-slate-100"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate group-hover:text-blue-600 transition-colors">
                            {service.name}
                          </h4>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {service.storeName || "Verified Provider"}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <span className="text-xs font-semibold text-blue-600">
                              {service.startingPrice ? `Starts at ₹${service.startingPrice}` : "Contact for Price"}
                            </span>
                            {service.estimatedArrival && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="text-[11px] text-slate-400">{service.estimatedArrival}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Chevron */}
                      <div className="pl-2">
                        <ChevronRight className="w-5 h-5 text-blue-600 stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State - Real & Honest */}
            {!isLoading && displayedServices.length === 0 && (
              <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Store className="w-10 h-10 text-slate-400 mx-auto mb-2 stroke-[1.5]" />
                <h4 className="text-sm font-bold text-slate-800">
                  No services listed in this category yet
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Services are added directly by verified local shop owners and professionals in your area.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/stores"
                    className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-bold text-xs hover:bg-blue-100 transition-colors"
                  >
                    Browse Local Stores
                  </Link>
                  <Link
                    href="/owner"
                    className="px-4 py-2 rounded-full bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                  >
                    List Your Services
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Promo Banner: "Need something else?" */}
          <div className="bg-gradient-to-r from-[#103975] via-[#164D9A] to-[#1E62C6] text-white p-4 sm:p-6 rounded-2xl mt-8 relative overflow-hidden shadow-lg shadow-blue-950/20 flex items-center justify-between">
            <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3.5 relative z-10">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-blue-100" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm sm:text-base tracking-tight leading-tight">
                  Need something else?
                </h4>
                <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 font-medium">
                  Explore verified shops and clinics near you.
                </p>
              </div>
            </div>

            <Link
              href="/stores"
              aria-label="Explore more stores"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white flex items-center justify-center relative z-10 shrink-0 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            </Link>
          </div>
        </div>

        {/* Quick Booking & Service Modal */}
        {selectedService && (
          <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-[28px] sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src={selectedService.imageUrl || getServiceImagePlaceholder(selectedService.categoryName)}
                  alt={selectedService.name}
                  className="w-16 h-16 rounded-xl object-cover shadow-xs border border-slate-100"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedService.name}
                  </h3>
                  {selectedService.storeSlug ? (
                    <Link
                      href={`/stores/${selectedService.storeSlug}`}
                      className="text-xs text-blue-600 hover:underline font-semibold block mt-0.5"
                    >
                      By {selectedService.storeName || "Verified Provider"} →
                    </Link>
                  ) : (
                    <p className="text-xs text-slate-500 mt-0.5">
                      By {selectedService.storeName || "Verified Provider"}
                    </p>
                  )}
                  {selectedService.area && (
                    <p className="text-[11px] text-slate-400">
                      {selectedService.area}, {selectedService.city}
                    </p>
                  )}
                </div>
              </div>

              {selectedService.description && (
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                  {selectedService.description}
                </p>
              )}

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 mb-5">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Starting from</span>
                  <span className="text-xl font-black text-blue-700">
                    {selectedService.startingPrice ? `₹${selectedService.startingPrice}` : "Custom Quote"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Est. Arrival</span>
                  <span className="text-xs font-bold text-slate-800">
                    {selectedService.estimatedArrival || "30–60 mins"}
                  </span>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-900 text-base">Booking Inquired!</h4>
                  <p className="text-xs text-slate-500 mt-1">Reference: {bookingSuccess}</p>
                  <p className="text-xs text-slate-600 mt-2">
                    A professional from {selectedService.storeName || "the store"} has received your request.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSuccess(null);
                      setSelectedService(null);
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <a
                    href={`tel:${selectedService.storePhone || "+919876543210"}`}
                    className="flex-1 py-3 px-4 rounded-full border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Store</span>
                  </a>
                  {selectedService.storeSlug ? (
                    <Link
                      href={`/stores/${selectedService.storeSlug}`}
                      className="flex-1 py-3 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 transition-all"
                    >
                      <span>View Profile</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const id = `KS-SERV-${Math.floor(100000 + Math.random() * 900000)}`;
                        setBookingSuccess(id);
                      }}
                      className="flex-1 py-3 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>Book Service</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Dock (Visible on mobile, hidden on desktop md:hidden) */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
