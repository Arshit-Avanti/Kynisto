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

  return (
    <>
      <div 
        className="w-full max-w-sm cursor-pointer font-sans group [perspective:1000px]"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.15)] rounded-2xl">
          
          <div className="relative w-full h-[320px] transition-all duration-700 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            
            {/* FRONT FACE */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-white/40 dark:bg-black/40 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] flex flex-col text-black dark:text-white overflow-hidden">
              {/* Image Container */}
              <div className="relative h-48 w-full overflow-hidden">
                <img src={store.image} alt={store.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className="bg-white/30 dark:bg-black/40 backdrop-blur-md text-white text-xs font-bold tracking-wide px-2.5 py-1 rounded-lg border border-white/30 flex items-center gap-1.5 shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {store.waitTimeMins}M
                  </span>
                  <span className="bg-white/30 dark:bg-black/40 backdrop-blur-md text-white text-xs font-bold tracking-wide px-2.5 py-1 rounded-lg border border-white/30 flex items-center gap-1.5 shadow-sm">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {store.customerCount}
                  </span>
                </div>
                
                {/* Favorite Button */}
                <button 
                  onClick={toggleFavorite}
                  className="absolute top-3 right-3 p-2 bg-white/30 dark:bg-black/40 backdrop-blur-md border border-white/30 rounded-full shadow-sm hover:bg-white/50 dark:hover:bg-black/60 transition-all duration-300"
                >
                  <svg className={`w-4 h-4 text-white ${isFavorite ? 'fill-current text-red-500' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold tracking-tight truncate pr-2">{store.name}</h3>
                  <div className="flex items-center gap-1 text-sm font-bold bg-black/5 dark:bg-white/10 px-2 py-1 rounded-md">
                    <svg className="w-3.5 h-3.5 text-yellow-500 fill-current" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {store.rating.toFixed(1)}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm font-medium pt-4 mt-2 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5 text-black/70 dark:text-white/70">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {store.distanceKm} km away
                  </div>
                </div>
              </div>
            </div>

            {/* BACK FACE */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white/40 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] flex flex-col p-6 text-black dark:text-white">
              <h3 className="text-xl font-bold tracking-tight mb-4 border-b border-black/10 dark:border-white/10 pb-3 truncate">{store.name}</h3>
              
              <div className="flex-1 flex flex-col justify-center gap-5">
                <div className="flex justify-between items-center bg-white/30 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Distance</span>
                  <span className="text-base font-bold">{store.distanceKm} KM</span>
                </div>
                <div className="flex justify-between items-center bg-white/30 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Wait Time</span>
                  <span className="text-base font-bold">{store.waitTimeMins} MIN</span>
                </div>
                <div className="flex justify-between items-center bg-white/30 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Live Queue</span>
                  <span className="text-base font-bold">{store.customerCount}</span>
                </div>
                <div className="flex justify-between items-center bg-white/30 dark:bg-white/5 p-3 rounded-xl border border-white/40 dark:border-white/10">
                  <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Rating</span>
                  <span className="text-base font-bold flex items-center gap-1">
                    {store.rating.toFixed(1)}
                    <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </span>
                </div>
              </div>
              
              <button className="w-full mt-4 bg-black/90 dark:bg-white/90 text-white dark:text-black font-bold uppercase tracking-wider py-3 rounded-xl hover:bg-black dark:hover:bg-white transition-all shadow-md hover:shadow-lg backdrop-blur-md">
                View Store
              </button>
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
