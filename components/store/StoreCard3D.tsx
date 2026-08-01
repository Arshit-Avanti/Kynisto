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
        className="w-full max-w-sm cursor-pointer font-mono group"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="relative w-full bg-white dark:bg-black border border-black dark:border-white transition-all duration-300 hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:hover:shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
          {/* Image Container */}
          <div className="relative h-48 w-full border-b border-black dark:border-white overflow-hidden filter grayscale group-hover:grayscale-0 transition-all duration-500">
            <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className="bg-white dark:bg-black text-black dark:text-white text-[10px] uppercase tracking-wider px-2 py-0.5 border border-black dark:border-white flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {store.waitTimeMins}M
              </span>
              <span className="bg-white dark:bg-black text-black dark:text-white text-[10px] uppercase tracking-wider px-2 py-0.5 border border-black dark:border-white flex items-center gap-1.5">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {store.customerCount}
              </span>
            </div>
            
            {/* Favorite Button */}
            <button 
              onClick={toggleFavorite}
              className="absolute top-3 right-3 p-1.5 bg-white dark:bg-black border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              <svg className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          <div className="p-4 bg-white dark:bg-black text-black dark:text-white">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold uppercase tracking-tight truncate pr-2">{store.name}</h3>
              <div className="flex items-center gap-1 text-xs">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {store.rating.toFixed(1)}
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs border-t border-black dark:border-white pt-3">
              <div className="flex items-center gap-1.5 uppercase tracking-wider">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {store.distanceKm} KM
              </div>
              <span className="uppercase text-[10px] tracking-widest border border-black dark:border-white px-2 py-1 group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black transition-colors">
                View
              </span>
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
