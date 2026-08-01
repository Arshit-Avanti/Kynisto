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
      alert(`Minimum membership amount is ₹${minAmount}`);
      return;
    }
    alert(`Purchasing membership for ₹${membershipAmount}. Store receives ₹${storeReceives}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Image */}
        <div className="relative h-48 sm:h-64 shrink-0">
          <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full transition-colors backdrop-blur-md"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="absolute bottom-4 left-6 right-6 flex justify-between items-end">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">{store.name}</h2>
              <div className="flex items-center text-gray-200 text-sm">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {store.address} ({store.distanceKm} km)
              </div>
            </div>
            
            <button 
              onClick={handleDirections}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Directions
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Rating</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-1">
                {store.rating} <span className="text-yellow-400 text-lg">★</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Wait Time</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{store.waitTimeMins}m</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Live Queue</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{store.customerCount}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl text-center border border-gray-100 dark:border-gray-700">
              <div className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Distance</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{store.distanceKm}km</div>
            </div>
          </div>
          
          {/* Membership Section */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Get Store Membership</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
              Support this store directly and get priority access. 
              <span className="block mt-1 font-medium text-indigo-600 dark:text-indigo-400">
                Minimum ₹{minAmount} (includes mandatory ₹{commission} Kynisto commission)
              </span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">₹</span>
                  <input 
                    type="number"
                    min={minAmount}
                    value={membershipAmount}
                    onChange={(e) => setMembershipAmount(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-lg font-medium"
                  />
                </div>
              </div>
              
              <button 
                onClick={handlePurchase}
                className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Purchase
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-800/50 flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Store receives: <strong className="text-gray-900 dark:text-white">₹{Math.max(0, storeReceives)}</strong></span>
              <span className="text-gray-600 dark:text-gray-400">Kynisto commission: <strong className="text-gray-900 dark:text-white">₹{commission}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
