"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { MobileBottomNav } from "@/components/landing/MobileBottomNav";

interface ServiceItem {
  id: string;
  name: string;
  category: "home" | "beauty" | "repairs" | "education" | "more";
  rating: number;
  reviewCount: number;
  distanceKm: number;
  startingPrice: number;
  imageUrl: string;
  description: string;
  storeName: string;
  storePhone?: string;
  estimatedArrival?: string;
}

const POPULAR_SERVICES: ServiceItem[] = [
  {
    id: "srv-cleaning",
    name: "Home Cleaning",
    category: "home",
    rating: 4.7,
    reviewCount: 98,
    distanceKm: 0.8,
    startingPrice: 499,
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    description: "Full deep house cleaning, sanitization, floor scrubbing, and kitchen chimney degreasing.",
    storeName: "PristinePro Cleaners",
    storePhone: "+919876543210",
    estimatedArrival: "45 mins",
  },
  {
    id: "srv-ac",
    name: "AC Repair & Service",
    category: "repairs",
    rating: 4.6,
    reviewCount: 76,
    distanceKm: 1.2,
    startingPrice: 399,
    imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80",
    description: "Jet pump cleaning, gas leakage detection, coil inspection, and cooling optimization.",
    storeName: "CoolBreeze Climate Services",
    storePhone: "+919876543211",
    estimatedArrival: "30 mins",
  },
  {
    id: "srv-beauty",
    name: "Salon & Beauty",
    category: "beauty",
    rating: 4.8,
    reviewCount: 120,
    distanceKm: 0.6,
    startingPrice: 599,
    imageUrl: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=400&q=80",
    description: "Hydra facial, clean-up, hair spa, threading, and relaxing head massage at your doorstep.",
    storeName: "Glow & Radiance Salon",
    storePhone: "+919876543212",
    estimatedArrival: "40 mins",
  },
  {
    id: "srv-electrician",
    name: "Electrician",
    category: "repairs",
    rating: 4.5,
    reviewCount: 62,
    distanceKm: 1.4,
    startingPrice: 249,
    imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=400&q=80",
    description: "Switchboard fitting, fan installation, short circuit fix, MCB inspection, and earthing checks.",
    storeName: "VoltsPro Electricals",
    storePhone: "+919876543213",
    estimatedArrival: "25 mins",
  },
  {
    id: "srv-education",
    name: "Home Tutoring & Coding",
    category: "education",
    rating: 4.9,
    reviewCount: 45,
    distanceKm: 1.1,
    startingPrice: 699,
    imageUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=400&q=80",
    description: "One-on-one personalized tuition for STEM, Math, English, and Python programming.",
    storeName: "Kynisto Learn Academy",
    storePhone: "+919876543214",
    estimatedArrival: "Flexible",
  },
];

export function HomeServicesDiscovery() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("home");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  const categories = [
    { id: "home", label: "Home Services", icon: Home },
    { id: "beauty", label: "Beauty & Wellness", icon: Flower2 },
    { id: "repairs", label: "Repairs & Maintenance", icon: Wrench },
    { id: "education", label: "Education", icon: GraduationCap },
    { id: "more", label: "More ...", icon: MoreHorizontal },
  ];

  const displayedServices = useMemo(() => {
    return POPULAR_SERVICES.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ||
        selectedCategory === "more" ||
        item.category === selectedCategory;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.storeName.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans pb-32 relative overflow-x-clip">
      {/* Mobile-Centered Container */}
      <div className="max-w-md mx-auto relative bg-white min-h-screen shadow-2xl border-x border-slate-200/40">
        {/* Royal Blue Organic Hero Header */}
        <div className="relative bg-gradient-to-b from-[#1C5EB8] via-[#2170D4] to-[#2563EB] px-5 pt-5 pb-12 overflow-hidden">
          {/* Subtle Abstract Wave Glows */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-300/15 rounded-full blur-2xl pointer-events-none -ml-16 -mb-16" />

          {/* Top Bar: Back, Title, Search */}
          <div className="relative z-10 flex items-center justify-between">
            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Title */}
            <h1 className="text-lg font-bold text-white tracking-wide">
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
            <div className="relative z-10 mt-4 animate-in fade-in slide-in-from-top-2">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cleaning, AC repair, salon, electrician..."
                  className="w-full bg-white/95 text-slate-900 placeholder:text-slate-400 px-4 py-2.5 pl-10 rounded-full text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
                  autoFocus
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hero Typography */}
          <div className="relative z-10 mt-6 mb-2">
            <h2 className="text-2xl sm:text-[28px] font-black text-white leading-tight tracking-tight">
              Professional Services
              <br />
              for Everyday Needs
            </h2>
            <p className="text-blue-100/90 text-xs sm:text-sm mt-2 font-medium">
              Trusted services, at your convenience.
            </p>
          </div>
        </div>

        {/* Curved White Sheet Overlapping Blue Hero */}
        <div className="relative -mt-6 rounded-t-[32px] bg-white z-10 px-5 pt-6 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] min-h-[calc(100vh-230px)]">
          {/* 5-Item Category Selector */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 text-center pb-2">
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
                    className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-[#1E62C6] text-white shadow-md shadow-blue-500/30"
                        : "bg-slate-50 border border-slate-100/80 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? "text-white stroke-[2.2]" : "stroke-[1.8]"}`} />
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] mt-1.5 leading-tight text-center ${
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

          {/* Popular Services Section */}
          <div className="mt-7">
            {/* Header Row */}
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Popular Services
              </h3>
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer"
              >
                <span>See all</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>

            {/* List of 4 Sleek Horizontal Service Cards */}
            <div className="space-y-3">
              {displayedServices.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-100/90 shadow-xs hover:shadow-md hover:border-blue-100 transition-all cursor-pointer active:scale-[0.99] group"
                >
                  {/* Left: Thumbnail and Info */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={service.imageUrl}
                      alt={service.name}
                      className="w-16 h-16 rounded-xl object-cover shadow-xs shrink-0 border border-slate-100"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Star className="w-3.5 h-3.5 fill-blue-600 text-blue-600 shrink-0" />
                        <span className="font-bold text-slate-700">{service.rating}</span>
                        <span className="text-slate-400 font-normal">({service.reviewCount})</span>
                        <span className="text-slate-300">•</span>
                        <span>{service.distanceKm} km</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Chevron */}
                  <div className="pl-2">
                    <ChevronRight className="w-5 h-5 text-blue-600 stroke-[2.2] group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Promo Banner: "Need something else?" */}
          <div className="bg-gradient-to-r from-[#103975] to-[#1C5FB9] text-white p-4 rounded-2xl mt-6 relative overflow-hidden shadow-lg shadow-blue-950/20 flex items-center justify-between">
            {/* Background Light Glow */}
            <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-blue-300/20 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 relative z-10">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-blue-100" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm tracking-tight leading-tight">
                  Need something else?
                </h4>
                <p className="text-[11px] text-blue-200 mt-0.5 font-medium">
                  Explore more services near you.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectedCategory("all");
                setSearchOpen(true);
              }}
              aria-label="Explore more services"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white flex items-center justify-center relative z-10 shrink-0 cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Quick Booking Modal if Service is Clicked */}
        {selectedService && (
          <div className="fixed inset-0 z-[99999] bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-[28px] sm:rounded-2xl max-w-md w-full p-5 shadow-2xl relative max-h-[85vh] overflow-y-auto">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3.5 mb-4">
                <img
                  src={selectedService.imageUrl}
                  alt={selectedService.name}
                  className="w-16 h-16 rounded-xl object-cover shadow-xs border border-slate-100"
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selectedService.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    By {selectedService.storeName}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="font-bold">{selectedService.rating}</span>
                    <span className="text-slate-400">({selectedService.reviewCount} reviews)</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                {selectedService.description}
              </p>

              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100 mb-5">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Starting from</span>
                  <span className="text-xl font-black text-blue-700">₹{selectedService.startingPrice}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 font-medium block">Est. Arrival</span>
                  <span className="text-xs font-bold text-slate-800">{selectedService.estimatedArrival || "30 mins"}</span>
                </div>
              </div>

              {bookingSuccess ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-900 text-base">Booking Confirmed!</h4>
                  <p className="text-xs text-slate-500 mt-1">Booking ID: {bookingSuccess}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingSuccess(null);
                      setSelectedService(null);
                    }}
                    className="mt-4 px-6 py-2.5 rounded-full bg-slate-900 text-white font-bold text-xs"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex gap-2.5">
                  <a
                    href={`tel:${selectedService.storePhone || "+919876543210"}`}
                    className="flex-1 py-3 px-4 rounded-full border border-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Professional</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      const id = `KS-SERV-${Math.floor(100000 + Math.random() * 900000)}`;
                      setBookingSuccess(id);
                    }}
                    className="flex-1 py-3 px-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/25"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Service</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Dock */}
      <MobileBottomNav />
    </div>
  );
}
