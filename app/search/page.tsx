"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar3D } from "@/components/landing/Navbar3D";
import { 
  Search, 
  MapPin, 
  Star, 
  Stethoscope, 
  ShoppingBag, 
  Wrench, 
  Package, 
  Phone, 
  ArrowRight, 
  Clock, 
  Sparkles,
  ChevronRight,
  X,
  SlidersHorizontal
} from "lucide-react";

interface DoctorItem {
  id: string;
  name: string;
  specialization?: string;
  fee?: number;
}

interface HealthcareResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  businessType: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  logoUrl?: string;
  rating: number;
  reviews: number;
  distance: number;
  providerType?: string;
  emergencyAvailable?: boolean;
  queueEnabled?: boolean;
  queueStatus?: string;
  queueOpeningTime?: string;
  queueClosingTime?: string;
  currentToken?: number;
  waitingCount?: number;
  doctors: DoctorItem[];
}

interface StoreResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  businessType: string;
  category: string;
  icon?: string;
  color?: string;
  address: string;
  phone?: string;
  logoUrl?: string;
  bannerUrl?: string;
  rating: number;
  reviews: number;
  distance: number;
}

interface ServiceResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  priceFrom?: number;
  durationMinutes?: number;
  estimatedArrival?: string;
  imageUrl?: string;
  storeId: string;
  storeName: string;
  storeArea: string;
  storeRating?: number;
  distance: number;
}

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  storeId: string;
  storeName: string;
  storeArea: string;
  distance: number;
}

interface RecommendedResult {
  id: string;
  name: string;
  slug: string;
  category: string;
  icon?: string;
  color?: string;
  module?: string;
  address: string;
  rating: number;
  distance: number;
}

interface SearchResponse {
  ok: boolean;
  query: string;
  parsedIntent?: {
    cleanedTokens?: string[];
    minRating?: number;
    maxPrice?: number;
    maxDistanceKm?: number;
    sortBy?: string;
    openNow?: boolean;
  };
  counts: {
    all: number;
    healthcare: number;
    stores: number;
    services: number;
    products: number;
    recommended: number;
  };
  healthcare: HealthcareResult[];
  stores: StoreResult[];
  services: ServiceResult[];
  products: ProductResult[];
  recommended: RecommendedResult[];
}

type TabType = "all" | "healthcare" | "stores" | "services" | "products" | "recommended";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SearchResponse | null>(null);

  const fetchResults = useCallback(async (searchQuery: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const json: SearchResponse = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResults(initialQuery);
  }, [initialQuery, fetchResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    fetchResults(trimmed);
  };

  const clearSearch = () => {
    setQuery("");
    router.push("/search");
    fetchResults("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-28 selection:bg-orange-500/20">
      {/* Top Navbar */}
      <Navbar3D />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32">
        {/* Search Header Form */}
        <div className="flex flex-col items-center text-center mb-8 max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4 font-cormorant">
            <span>Discover </span>
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent font-black">
              Healthcare, Shops &amp; Services
            </span>
          </h1>

          {/* Smart Light Search Input Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="w-full relative flex items-center gap-2 p-1.5 sm:p-2 rounded-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 hover:border-orange-400 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 transition-all duration-300"
          >
            <div className="pl-3.5 text-slate-400">
              <Search className="w-5 h-5 text-orange-500" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doctors, 5 star clinics, grocery, plumbers under 500..."
              className="flex-1 bg-transparent text-slate-900 placeholder:text-slate-400 text-sm sm:text-base outline-none px-2 py-1 font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-5 sm:px-7 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-orange-500/25 transition-all shrink-0 cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Smart AI Intent Tags Banner */}
          {data?.parsedIntent && (
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2 text-xs">
              {data.parsedIntent.minRating && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold shadow-xs">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>Rating: {data.parsedIntent.minRating}+ Stars</span>
                </span>
              )}
              {data.parsedIntent.maxPrice && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold shadow-xs">
                  <span>₹</span>
                  <span>Max Price: ₹{data.parsedIntent.maxPrice}</span>
                </span>
              )}
              {data.parsedIntent.maxDistanceKm && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 font-bold shadow-xs">
                  <MapPin className="w-3 h-3 text-sky-600" />
                  <span>Within {data.parsedIntent.maxDistanceKm} km</span>
                </span>
              )}
              {data.parsedIntent.sortBy === "nearest" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold shadow-xs">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>Sorted by Nearest</span>
                </span>
              )}
              {data.parsedIntent.openNow && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span>Open Now</span>
                </span>
              )}
            </div>
          )}

          {/* Active Query Breadcrumb */}
          {initialQuery && (
            <div className="mt-2.5 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
              <span>Showing results for:</span>
              <span className="font-bold text-orange-700 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                &ldquo;{initialQuery}&rdquo;
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-600 font-medium">{data?.counts.all || 0} total found</span>
            </div>
          )}
        </div>

        {/* Filter Tabs in Light Theme */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none border-b border-slate-200">
          {[
            { id: "all", label: `All (${data?.counts.all || 0})` },
            { id: "healthcare", label: `🏥 Healthcare & Doctors (${data?.counts.healthcare || 0})` },
            { id: "stores", label: `🛍️ Stores & Shops (${data?.counts.stores || 0})` },
            { id: "services", label: `⚡ Services (${data?.counts.services || 0})` },
            { id: "products", label: `📦 Products (${data?.counts.products || 0})` },
            { id: "recommended", label: `✨ Near Me (${data?.counts.recommended || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-orange-500 text-white shadow-md shadow-orange-500/25 border border-orange-500"
                  : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/90 shadow-sm"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 rounded-3xl bg-white border border-slate-200 p-5 flex flex-col justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-6 bg-slate-100 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="h-10 bg-slate-100 rounded-xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Results Container in Light Theme */}
        {!loading && data && (
          <div className="space-y-12">
            
            {/* 1. HEALTHCARE & DOCTORS SECTION */}
            {(activeTab === "all" || activeTab === "healthcare") && data.healthcare.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="text-emerald-600">🏥</span> Healthcare Clinics &amp; Doctors
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">{data.healthcare.length} clinics found</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.healthcare.map((clinic) => (
                    <div
                      key={clinic.id}
                      className="group/clinic p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-500/50 transition-all duration-300 shadow-md shadow-slate-100 hover:shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        {/* Status Badges */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {clinic.queueStatus === "open" ? "Live OPD Open" : "Clinic"}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            {clinic.distance} km away
                          </span>
                        </div>

                        {/* Clinic Title */}
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover/clinic:text-emerald-700 transition-colors mb-1.5">
                          {clinic.name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {clinic.description || clinic.address}
                        </p>

                        {/* Doctors List */}
                        {clinic.doctors && clinic.doctors.length > 0 && (
                          <div className="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                            <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                              Available Doctors
                            </div>
                            {clinic.doctors.slice(0, 2).map((doc) => (
                              <div key={doc.id} className="flex items-center justify-between text-xs">
                                <span className="font-bold text-emerald-800">👨‍⚕️ {doc.name}</span>
                                <span className="text-[11px] font-medium text-slate-500">{doc.specialization || "Consultant"}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Queue Telemetry */}
                        {clinic.queueEnabled && (
                          <div className="flex items-center justify-between text-xs py-2 px-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 mb-4 font-mono font-bold">
                            <span>Token #{String(clinic.currentToken || 0).padStart(2, "0")} Serving</span>
                            <span>{clinic.waitingCount || 0} Waiting</span>
                          </div>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                        <Link
                          href={`/healthcare?storeId=${encodeURIComponent(clinic.id)}&action=join`}
                          className="flex-1 text-center py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1"
                        >
                          <span>Join OPD Queue</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        {clinic.phone && (
                          <a
                            href={`tel:${clinic.phone}`}
                            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200"
                            aria-label="Call clinic"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. STORES & SHOPS SECTION */}
            {(activeTab === "all" || activeTab === "stores") && data.stores.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="text-orange-500">🛍️</span> Local Stores &amp; Shops
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">{data.stores.length} shops found</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.stores.map((store) => (
                    <Link
                      key={store.id}
                      href={`/stores/${store.slug}`}
                      className="group/store p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-orange-500/50 transition-all duration-300 shadow-md shadow-slate-100 hover:shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200 flex items-center gap-1">
                            <span>{store.icon || "🏪"}</span>
                            <span>{store.category || store.businessType}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-orange-500" />
                            {store.distance} km
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 group-hover/store:text-orange-600 transition-colors mb-1.5">
                          {store.name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {store.description || store.address}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4 font-medium">
                          <div className="flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span>{store.rating ? store.rating.toFixed(1) : "New"}</span>
                          </div>
                          <span>·</span>
                          <span>{store.reviews || 0} reviews</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-orange-600 group-hover/store:translate-x-1 transition-transform">
                        <span>Visit Store Page</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. HOME & LOCAL SERVICES SECTION */}
            {(activeTab === "all" || activeTab === "services") && data.services.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="text-sky-600">⚡</span> On-Demand Home Services
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">{data.services.length} services found</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {data.services.map((service) => (
                    <div
                      key={service.id}
                      className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 hover:border-sky-500/50 transition-all duration-300 shadow-md shadow-slate-100 hover:shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            {service.category}
                          </span>
                          <span className="text-[11px] text-amber-600 font-bold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.estimatedArrival || "30-60 min"}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900 mb-1.5">
                          {service.name}
                        </h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                          {service.description || `Provided by ${service.storeName} (${service.storeArea})`}
                        </p>

                        <div className="flex items-center justify-between text-xs py-2 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
                          <span className="text-slate-500 font-medium">Starting from</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            ₹{service.priceFrom || 199}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <Link
                          href={`/services`}
                          className="flex-1 text-center py-2.5 px-3 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-1"
                        >
                          <span>Book Dispatch</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. PRODUCTS SECTION */}
            {(activeTab === "all" || activeTab === "products") && data.products.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="text-purple-600">📦</span> Store Products &amp; Items
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">{data.products.length} products found</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.products.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-500/40 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mb-1">{product.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1 mb-2">At {product.storeName}</p>
                        <div className="text-sm font-black text-purple-700 mb-3">
                          ₹{product.price || 0}
                        </div>
                      </div>
                      <Link
                        href={`/products`}
                        className="w-full text-center py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors border border-slate-200"
                      >
                        View Product
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. RECOMMENDED NEAR ME SECTION */}
            {(activeTab === "all" || activeTab === "recommended") && data.recommended.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="text-amber-500">✨</span> Recommended Places Near You
                  </h2>
                  <span className="text-xs font-semibold text-slate-500">Top rated in your area</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {data.recommended.slice(0, 8).map((place) => (
                    <Link
                      key={place.id}
                      href={`/stores/${place.slug}`}
                      className="p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-amber-500/40 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group/rec"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                          <span className="font-semibold text-slate-700">{place.category}</span>
                          <span className="text-orange-600 font-bold">{place.distance} km</span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 group-hover/rec:text-amber-600 transition-colors mb-1.5">
                          {place.name}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-amber-600 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{place.rating ? place.rating.toFixed(1) : "Top Rated"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* EMPTY STATE */}
            {data.counts.all === 0 && (
              <div className="text-center py-16 px-4 rounded-3xl bg-white border border-slate-200 shadow-xl shadow-slate-100 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4 text-2xl border border-orange-200">
                  🔍
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">No matching results found</h3>
                <p className="text-sm text-slate-500 mb-6">
                  We couldn&apos;t find anything matching &ldquo;{query}&rdquo;. Try searching for popular categories below.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {["Dr. Clinic", "5 star clinic", "Dentist", "Electrician", "Salon", "Grocery", "AC Repair under 500"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setQuery(tag);
                        router.push(`/search?q=${encodeURIComponent(tag)}`);
                        fetchResults(tag);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-orange-500 hover:text-white text-xs font-semibold text-slate-700 transition-all cursor-pointer border border-slate-200"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="w-8 h-8 rounded-full border-3 border-orange-500 border-t-transparent animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
