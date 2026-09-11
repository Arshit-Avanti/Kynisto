"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, MapPin, Star, Clock, ChevronRight, Store, ShieldCheck, Phone, Filter } from "lucide-react";

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  categorySlug?: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  subcategory?: string | null;
  address: string;
  area?: string;
  city?: string;
  rating?: number;
  reviews?: number;
  distance?: number;
  open?: boolean;
  hours?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  phone?: string | null;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  color?: string | null;
}

interface StoreDirectoryViewProps {
  initialStores: StoreItem[];
  categories: CategoryItem[];
}

export function StoreDirectoryView({ initialStores, categories }: StoreDirectoryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [onlyOpen, setOnlyOpen] = useState(false);

  const filteredStores = useMemo(() => {
    return initialStores.filter((store) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        store.name?.toLowerCase().includes(q) ||
        store.category?.toLowerCase().includes(q) ||
        store.subcategory?.toLowerCase().includes(q) ||
        store.area?.toLowerCase().includes(q) ||
        store.city?.toLowerCase().includes(q) ||
        store.description?.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategory === "all" ||
        store.categorySlug === selectedCategory ||
        store.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesOpen = !onlyOpen || store.open === true;

      return matchesSearch && matchesCategory && matchesOpen;
    });
  }, [initialStores, searchQuery, selectedCategory, onlyOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-orange-100 selection:text-orange-900">
      {/* Top Header Hero */}
      <section className="bg-gradient-to-b from-white via-orange-50/20 to-slate-50 border-b border-slate-200/80 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold tracking-wide uppercase mb-3">
                <Store className="w-3.5 h-3.5 text-orange-600" />
                Verified Business Directory
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Local Stores &amp; Healthcare Clinics
              </h1>
              <p className="mt-2 text-slate-600 text-base max-w-2xl font-medium">
                Discover verified neighborhood stores, medical centers, family clinics, salons, and local professionals near you.
              </p>
            </div>

            {/* Search Input */}
            <div className="w-full md:w-80">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search stores, clinics, area..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 shadow-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                selectedCategory === "all"
                  ? "bg-orange-600 text-white shadow-orange-600/20"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              All Businesses ({initialStores.length})
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug || cat.name)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-1.5 ${
                  selectedCategory === cat.slug || selectedCategory === cat.name
                    ? "bg-orange-600 text-white shadow-orange-600/20"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {cat.icon && <span>{cat.icon}</span>}
                {cat.name}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setOnlyOpen(!onlyOpen)}
              className={`ml-auto px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                onlyOpen
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Open Now Only
            </button>
          </div>
        </div>
      </section>

      {/* Stores Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-slate-500">
            Showing <span className="text-slate-900 font-bold">{filteredStores.length}</span> verified business{filteredStores.length === 1 ? "" : "es"}
          </p>
        </div>

        {filteredStores.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8 max-w-md mx-auto shadow-sm">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No stores found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Try adjusting your search query or removing filters to see available businesses.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setOnlyOpen(false);
              }}
              className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store) => {
              const isOpen = store.open === true;
              return (
                <article
                  key={store.id}
                  className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-orange-300 transition-all duration-200 flex flex-col overflow-hidden"
                >
                  {/* Card Header Media */}
                  <div className="relative h-36 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                    {store.bannerUrl ? (
                      <img
                        src={store.bannerUrl}
                        alt={store.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
                        <span className="text-4xl select-none opacity-40">
                          {store.categoryIcon || "🏬"}
                        </span>
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold backdrop-blur-md shadow-sm ${
                          isOpen
                            ? "bg-emerald-500/90 text-white"
                            : "bg-slate-800/85 text-slate-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? "bg-white animate-pulse" : "bg-slate-400"}`} />
                        {isOpen ? "Open" : "Closed"}
                      </span>
                    </div>

                    {/* Category Pill */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 text-slate-800 backdrop-blur-md shadow-sm">
                        {store.category}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h2 className="text-base font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-1">
                          <Link href={`/stores/${store.slug}`}>
                            {store.name}
                          </Link>
                        </h2>
                        <ShieldCheck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" title="Verified by Kynisto" />
                      </div>

                      {store.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {store.description}
                        </p>
                      )}

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="line-clamp-1">{store.address || store.area || store.city || "Locality address verified"}</span>
                        </div>

                        {store.hours && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{store.hours}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-extrabold text-slate-800">
                          {Number(store.rating ?? 5).toFixed(1)}
                        </span>
                        {Number(store.reviews ?? 0) > 0 && (
                          <span className="text-[11px] text-slate-400">
                            ({store.reviews})
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/stores/${store.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors"
                      >
                        View Store
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
