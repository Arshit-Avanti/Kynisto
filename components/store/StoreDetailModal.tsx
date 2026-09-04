import React, { useState } from 'react';
import { Store } from './StoreCard3D';

interface StoreDetailModalProps {
  store: Store;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoreDetailModal({ store, isOpen, onClose }: StoreDetailModalProps) {
  const [membershipAmount, setMembershipAmount] = useState<number>(80);
  const minAmount = 80;
  const commission = 50;
  const storeReceives = membershipAmount - commission;

  if (!isOpen) return null;

  const handleDirections = () => {
    // Use GPS coordinates if available — works even for shops not on Google Maps
    const lat = (store as unknown as Record<string, unknown>).latitude as number | undefined;
    const lng = (store as unknown as Record<string, unknown>).longitude as number | undefined;
    const url = (lat && lng)
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const locationVerified = Boolean((store as unknown as Record<string, unknown>).locationVerified);
  const storeLat = ((store as unknown as Record<string, unknown>).latitude as number | undefined) ?? store.coordinates.lat;
  const storeLng = ((store as unknown as Record<string, unknown>).longitude as number | undefined) ?? store.coordinates.lng;

  const handlePurchase = () => {
    if (membershipAmount < minAmount) {
      alert(`MINIMUM MEMBERSHIP AMOUNT IS ₹${minAmount}`);
      return;
    }
    alert(`PURCHASING MEMBERSHIP FOR ₹${membershipAmount}. STORE RECEIVES ₹${storeReceives}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans [perspective:1000px]">
      <div 
        className="absolute inset-0 bg-white/30 dark:bg-black/50 backdrop-blur-xl transition-opacity duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white/40 dark:bg-black/60 backdrop-blur-2xl border border-white/50 dark:border-white/20 rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] flex flex-col max-h-[90vh] overflow-hidden transition-all transform scale-100 duration-300">
        {/* Header Image */}
        <div className="relative h-56 sm:h-72 shrink-0 group">
          <img src={store.image} alt={store.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2.5 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/30 rounded-full text-white transition-all duration-300 hover:scale-110"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">{store.name}</h2>
            <div className="flex items-center text-sm font-medium text-white/90 mt-2">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {store.address} ({store.distanceKm} km away)
            </div>
            {locationVerified && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 bg-green-500/20 border border-green-500/40 text-green-300 text-xs font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  📍 Verified Location
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto text-black dark:text-white">
          <div className="flex justify-between items-center mb-8">
            <div className="grid grid-cols-4 gap-4 flex-1">
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Rating</div>
                <div className="text-xl font-bold flex items-center justify-center gap-1">
                  {store.rating.toFixed(1)}
                  <svg className="w-4 h-4 text-yellow-500 fill-current" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Wait</div>
                <div className="text-xl font-bold">{store.waitTimeMins}m</div>
              </div>
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-4 text-center shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Queue</div>
                <div className="text-xl font-bold">{store.customerCount}</div>
              </div>
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl p-4 text-center shadow-sm flex flex-col items-center justify-center hover:bg-white/60 dark:hover:bg-white/10 transition-colors cursor-pointer" onClick={handleDirections}>
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {locationVerified ? '✅ Navigate' : 'Route'}
                </span>
                {locationVerified && (
                  <span className="text-[9px] text-green-500 font-semibold mt-0.5">GPS Verified</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Membership Section */}
          <div className="bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-white/50 dark:border-white/20 rounded-3xl p-6 relative shadow-inner">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-purple-500/20 text-purple-700 dark:text-purple-300 rounded-xl backdrop-blur-md border border-purple-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold tracking-tight">Priority Access</h3>
            </div>
            
            <p className="mb-6 text-sm opacity-80 leading-relaxed font-medium">
              Support this store directly and get priority access. 
              <br />
              <span className="text-xs opacity-75 mt-1 block">Minimum ₹{minAmount} (Includes mandatory ₹{commission} platform fee)</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-xs font-semibold uppercase tracking-wider opacity-70 mb-2">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xl opacity-60">₹</span>
                  <input 
                    type="number"
                    min={minAmount}
                    value={membershipAmount}
                    onChange={(e) => setMembershipAmount(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-3.5 bg-white/60 dark:bg-black/40 border border-white/50 dark:border-white/20 rounded-xl text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-xl font-bold transition-all shadow-sm backdrop-blur-md"
                  />
                </div>
              </div>
              
              <button 
                onClick={handlePurchase}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold tracking-wide rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5 border border-white/20"
              >
                Get Access
              </button>
            </div>
            
            <div className="mt-6 pt-5 border-t border-black/10 dark:border-white/10 flex justify-between items-center text-xs font-semibold uppercase tracking-wider opacity-80">
              <span>Store Receives: <strong className="font-bold text-sm text-purple-700 dark:text-purple-400">₹{Math.max(0, storeReceives)}</strong></span>
              <span>Platform Fee: <strong className="font-bold text-sm">₹{commission}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
