import React, { useState } from 'react';
import StoreDetailModal from './StoreDetailModal';

export interface Store {
  id: string;
  name: string;
  image: string;
  rating: number;
  customerCount: number;
  waitTimeMins: number;
  distanceKm: number;
  address: string;
  coordinates: { lat: number; lng: number };
  slug?: string;
  isOpen?: boolean;
  open?: boolean;
  walkTimeMins?: number;
  walk?: string;
  menuUrl?: string;
  category?: string;
  phone?: string;
  locationVerified?: boolean;
  latitude?: number;
  longitude?: number;
}

interface StoreCard3DProps {
  store: Store;
}

export default function StoreCard3D({ store }: StoreCard3DProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    const lat = (store as Record<string, unknown>).latitude as number | undefined ?? store.coordinates?.lat;
    const lng = (store as Record<string, unknown>).longitude as number | undefined ?? store.coordinates?.lng;
    const destination = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(store.address || store.name);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleViewStore = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (store.slug) {
      window.location.href = `/stores/${store.slug}`;
    } else {
      setIsModalOpen(true);
    }
  };

  const handleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (store.menuUrl) {
      window.open(store.menuUrl, '_blank', 'noopener,noreferrer');
    } else if (store.slug) {
      window.location.href = `/stores/${store.slug}#catalog`;
    } else {
      setIsModalOpen(true);
    }
  };

  const isOpen = store.isOpen !== undefined ? store.isOpen : (store.open !== undefined ? store.open : true);
  const ratingValue = Number((store.rating ?? 4.8).toFixed(1));
  const distanceValue = Number((store.distanceKm ?? 1.2).toFixed(1));
  const walkTimeValue = store.walkTimeMins
    ? `${store.walkTimeMins}m walk`
    : (store.walk
        ? store.walk
        : `${Math.max(2, Math.round(distanceValue * 13))}m walk`);

  return (
    <>
      <div 
        className="w-full max-w-sm cursor-pointer font-sans group [perspective:1000px]"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.15)] rounded-2xl">
          
          <div className="relative w-full min-h-[390px] h-[390px] transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            
            {/* FRONT FACE */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-slate-900/85 dark:bg-black/70 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] flex flex-col text-white overflow-hidden">
              {/* Image Container */}
              <div className="relative h-44 w-full shrink-0 overflow-hidden">
                <img 
                  src={store.image} 
                  alt={store.name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
                
                {/* Floating Top Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-lg border border-white/25 flex items-center gap-1 shadow-sm">
                    <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {store.waitTimeMins}M
                  </span>
                  <span className="bg-black/60 backdrop-blur-md text-white text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-lg border border-white/25 flex items-center gap-1 shadow-sm">
                    <svg className="w-3 h-3 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {store.customerCount}
                  </span>
                </div>
                
                {/* Favorite Button */}
                <button 
                  type="button"
                  onClick={toggleFavorite}
                  className="absolute top-2.5 right-2.5 p-2 bg-black/50 hover:bg-black/75 active:scale-90 backdrop-blur-md border border-white/25 rounded-full shadow-sm text-white transition-all min-w-[36px] min-h-[36px] flex items-center justify-center"
                  aria-label="Toggle favorite"
                >
                  <svg className={`w-4 h-4 ${isFavorite ? 'fill-current text-rose-500' : 'text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <h3 className="text-base font-bold tracking-tight text-white truncate" title={store.name}>
                      {store.name}
                    </h3>
                  </div>

                  {store.address && (
                    <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
                      <svg className="w-3 h-3 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {store.address}
                    </p>
                  )}

                  {/* Neatly Aligned Mobile Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 my-2.5">
                    {/* Open/Closed Badge */}
                    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm shrink-0 ${
                      isOpen 
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                        : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                      {isOpen ? 'Open' : 'Closed'}
                    </span>

                    {/* Rating Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 backdrop-blur-sm shrink-0">
                      <svg className="w-3 h-3 text-amber-400 fill-current" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {ratingValue.toFixed(1)}
                    </span>

                    {/* Distance Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 backdrop-blur-sm shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {distanceValue} km
                    </span>

                    {/* Walk Time Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 backdrop-blur-sm shrink-0">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {walkTimeValue}
                    </span>
                  </div>
                </div>

                {/* Touch-Friendly Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/10 mt-auto">
                  <button
                    type="button"
                    onClick={handleViewStore}
                    className="min-h-[44px] px-2 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-md shadow-orange-500/25"
                  >
                    <span>Store</span>
                    <span className="text-[10px]">➔</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDirections}
                    className="min-h-[44px] px-2 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-300 border border-sky-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    <span>Route</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleMenu}
                    className="min-h-[44px] px-2 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 active:scale-95 text-purple-300 border border-purple-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                    <span>Menu</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BACK FACE */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-slate-900/95 dark:bg-black/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] flex flex-col p-4 sm:p-5 text-white justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-3">
                  <h3 className="text-base sm:text-lg font-bold tracking-tight truncate pr-2">{store.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isOpen ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}>
                    {isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Distance</span>
                    <span className="text-sm font-bold text-white">{distanceValue} KM</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Walk Time</span>
                    <span className="text-sm font-bold text-white">{walkTimeValue}</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Wait Time</span>
                    <span className="text-sm font-bold text-white">{store.waitTimeMins} MIN</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-0.5">Live Queue</span>
                    <span className="text-sm font-bold text-white">{store.customerCount}</span>
                  </div>
                </div>
              </div>
              
              {/* Back Face Touch-Friendly CTA Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 mt-auto">
                <button 
                  type="button"
                  onClick={handleViewStore}
                  className="min-h-[44px] px-2 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-95 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all shadow-md shadow-orange-500/25"
                >
                  <span>Store</span>
                  <span className="text-[10px]">➔</span>
                </button>

                <button 
                  type="button"
                  onClick={handleDirections}
                  className="min-h-[44px] px-2 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 active:scale-95 text-sky-300 border border-sky-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>Route</span>
                </button>

                <button 
                  type="button"
                  onClick={handleMenu}
                  className="min-h-[44px] px-2 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 active:scale-95 text-purple-300 border border-purple-500/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  </svg>
                  <span>Menu</span>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <StoreDetailModal 
        store={store} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

