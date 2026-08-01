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
    const url = `https://www.google.com/maps/dir/?api=1&destination=${store.coordinates.lat},${store.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handlePurchase = () => {
    if (membershipAmount < minAmount) {
      alert(`MINIMUM MEMBERSHIP AMOUNT IS ₹${minAmount}`);
      return;
    }
    alert(`PURCHASING MEMBERSHIP FOR ₹${membershipAmount}. STORE RECEIVES ₹${storeReceives}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-mono">
      <div 
        className="absolute inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-black border border-black dark:border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,1)] flex flex-col max-h-[90vh]">
        {/* Header Image */}
        <div className="relative h-48 sm:h-64 shrink-0 border-b border-black dark:border-white filter grayscale">
          <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white dark:bg-black border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute bottom-4 left-6 bg-white dark:bg-black border border-black dark:border-white px-3 py-1.5">
            <h2 className="text-lg font-bold uppercase tracking-widest text-black dark:text-white">{store.name}</h2>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto text-black dark:text-white">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-black dark:border-white">
            <div className="flex items-center text-sm uppercase tracking-wider">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {store.address} ({store.distanceKm} KM)
            </div>
            <button 
              onClick={handleDirections}
              className="flex items-center gap-2 border border-black dark:border-white px-3 py-1 text-xs uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Directions
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 mb-8 border-l border-t border-black dark:border-white">
            <div className="p-4 border-r border-b border-black dark:border-white text-center">
              <div className="text-[10px] uppercase tracking-widest mb-2">Rating</div>
              <div className="text-xl font-bold flex items-center justify-center gap-1">
                {store.rating.toFixed(1)}
              </div>
            </div>
            <div className="p-4 border-r border-b border-black dark:border-white text-center">
              <div className="text-[10px] uppercase tracking-widest mb-2">Wait Time</div>
              <div className="text-xl font-bold">{store.waitTimeMins}M</div>
            </div>
            <div className="p-4 border-r border-b border-black dark:border-white text-center">
              <div className="text-[10px] uppercase tracking-widest mb-2">Live Queue</div>
              <div className="text-xl font-bold">{store.customerCount}</div>
            </div>
            <div className="p-4 border-r border-b border-black dark:border-white text-center">
              <div className="text-[10px] uppercase tracking-widest mb-2">Distance</div>
              <div className="text-xl font-bold">{store.distanceKm}KM</div>
            </div>
          </div>
          
          {/* Membership Section */}
          <div className="border border-black dark:border-white p-6 relative">
            <div className="absolute -top-3 left-4 bg-white dark:bg-black px-2 text-[10px] uppercase tracking-widest border border-black dark:border-white">
              Membership
            </div>
            <p className="mb-6 text-sm">
              SUPPORT THIS STORE DIRECTLY AND GET PRIORITY ACCESS. 
              <span className="block mt-2 font-bold">
                MINIMUM ₹{minAmount} (INCLUDES MANDATORY ₹{commission} PLATFORM FEE)
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-[10px] uppercase tracking-widest mb-2">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold">₹</span>
                  <input 
                    type="number"
                    min={minAmount}
                    value={membershipAmount}
                    onChange={(e) => setMembershipAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-2 border border-black dark:border-white bg-transparent text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white text-lg font-bold"
                  />
                </div>
              </div>
              
              <button 
                onClick={handlePurchase}
                className="w-full sm:w-auto px-8 py-2.5 bg-black text-white dark:bg-white dark:text-black font-bold uppercase tracking-widest border border-black dark:border-white hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors"
              >
                Purchase
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-black dark:border-white flex justify-between text-[10px] uppercase tracking-widest">
              <span>STORE RECEIVES: <strong className="font-bold text-sm">₹{Math.max(0, storeReceives)}</strong></span>
              <span>PLATFORM FEE: <strong className="font-bold text-sm">₹{commission}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
