'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Wallet, Award, Download, Clock, Store, Crown, Loader2, CheckCircle2, Star, Sparkles } from 'lucide-react';
import { apiFetch } from '@/lib/client-api';

interface KynistoPointsHistory {
  id: string;
  date: string;
  description: string;
  points: number;
  type: 'earned' | 'redeemed';
}

interface LoyaltyPoint {
  storeId: string;
  storeName: string;
  logoUrl: string;
  points: number;
  progress: number;
  lastVisit: string;
  canRedeemDiscount: boolean;
}

interface Membership {
  id: string;
  storeId: string;
  storeName: string;
  type: string;
  validUntil: string;
  isKynistoPremium: boolean;
  pricePaid?: number;
  benefits?: string[];
  invoiceUrl: string;
}

interface WalletData {
  kynistoPoints: {
    total: number;
    progress: number;
    history: KynistoPointsHistory[];
  };
  loyaltyPoints: LoyaltyPoint[];
  memberships: {
    active: Membership[];
    expired: Membership[];
  };
}

const defaultWalletData: WalletData = {
  kynistoPoints: { total: 0, progress: 0, history: [] },
  loyaltyPoints: [],
  memberships: { active: [], expired: [] },
};

const AnimatedNumber = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Smooth lerp inertial tracking easing (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.floor(easeProgress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    window.requestAnimationFrame(step);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
};

const ProgressRing = ({ progress, max = 1000 }: { progress: number, max?: number }) => {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / max) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="transform -rotate-90 w-[72px] h-[72px]">
        <circle cx="36" cy="36" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200 dark:text-gray-800" />
        <circle 
          cx="36" 
          cy="36" 
          r={radius} 
          stroke="currentColor" 
          strokeWidth="6" 
          fill="transparent" 
          strokeDasharray={circumference} 
          strokeDashoffset={strokeDashoffset} 
          className="text-indigo-600 dark:text-indigo-400 transition-all duration-0 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xs font-black text-black dark:text-white">{Math.round((progress/max)*100)}%</span>
      </div>
    </div>
  );
};

export default function KynistoWalletView() {
  const [activeTab, setActiveTab] = useState<'kynisto' | 'loyalty' | 'memberships'>('kynisto');
  const [walletData, setWalletData] = useState<WalletData>(defaultWalletData);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{reward?: string; coupon?: string; error?: string} | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const data = await apiFetch<WalletData>('/api/wallet');
      if (data && typeof data === 'object') {
        setWalletData({
          kynistoPoints: data.kynistoPoints || defaultWalletData.kynistoPoints,
          loyaltyPoints: Array.isArray(data.loyaltyPoints) ? data.loyaltyPoints : [],
          memberships: {
            active: Array.isArray(data.memberships?.active) ? data.memberships.active : [],
            expired: Array.isArray(data.memberships?.expired) ? data.memberships.expired : [],
          },
        });
      }
    } catch (error) {
      console.error('Failed to fetch wallet data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemKynistoPoints = async () => {
    if (!walletData || walletData.kynistoPoints.total < 1000) return;
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const data = await apiFetch<any>('/api/wallet/redeem-points', { method: 'POST' });
      if (data && data.success) {
        setRedeemResult({ reward: data.reward });
        await fetchWalletData();
      } else {
        setRedeemResult({ error: data?.error || 'Failed to redeem' });
      }
    } catch (error) {
      setRedeemResult({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setRedeeming(false);
    }
  };

  const handleRedeemLoyalty = async (storeId: string) => {
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const data = await apiFetch<any>('/api/wallet/redeem-loyalty', {
        method: 'POST',
        json: { storeId },
      });
      if (data && data.success) {
        setRedeemResult({ coupon: data.couponCode });
        await fetchWalletData();
      } else {
        setRedeemResult({ error: data?.error || 'Failed to redeem' });
      }
    } catch (error) {
      setRedeemResult({ error: error instanceof Error ? error.message : 'An error occurred' });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
      </div>
    );
  }

  const { kynistoPoints, loyaltyPoints, memberships } = walletData;

  return (
    <div className="mx-auto max-w-4xl space-y-6 relative">
      {/* Soft Ambient Radial Backlight Glow */}
      <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center overflow-hidden">
        <div className="w-[120vw] h-[120vw] bg-[radial-gradient(ellipse_at_center,_rgba(99,102,241,0.25)_0%,_rgba(168,85,247,0.15)_30%,_transparent_70%)] blur-[120px]" />
      </div>

      {/* Header */}
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-black p-6 border border-gray-200 dark:border-gray-800 shadow-[0_0_40px_rgba(99,102,241,0.15)] relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.15)_0%,_rgba(168,85,247,0.08)_50%,_transparent_80%)] blur-[80px] pointer-events-none" />
        <div className="flex items-center space-x-4 relative z-10">
          <div className="rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 p-4 shadow-lg text-white">
            <Wallet className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">My Wallet</h1>
            <p className="text-gray-700 dark:text-gray-300 font-bold">Manage points, loyalty, and memberships</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto rounded-2xl bg-white dark:bg-black p-2 border border-gray-200 dark:border-gray-800 shadow-sm">
        {[
          { id: 'kynisto', label: 'Kynisto Points', icon: Award },
          { id: 'loyalty', label: 'Store Loyalty', icon: Store },
          { id: 'memberships', label: 'Memberships', icon: Crown },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setRedeemResult(null); }}
            className={`flex flex-1 items-center justify-center space-x-2 rounded-xl py-3 px-4 text-sm font-extrabold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-md'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Kynisto Points Tab */}
        {activeTab === 'kynisto' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Progress Card */}
            <div className="rounded-3xl bg-white dark:bg-black p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8">
                  <div>
                    <h2 className="text-xl font-extrabold text-black dark:text-white mb-2">Total Balance</h2>
                    <div className="text-6xl font-black text-black dark:text-white">
                      <AnimatedNumber value={kynistoPoints.total} />
                    </div>
                  </div>
                  
                  <div className="mt-6 sm:mt-0 text-left sm:text-right">
                    <p className="text-sm font-bold text-black dark:text-white mb-3">
                      <span className="text-black dark:text-white">{kynistoPoints.progress}</span> / 1000 to next reward
                    </p>
                    <button
                      onClick={handleRedeemKynistoPoints}
                      disabled={kynistoPoints.total < 1000 || redeeming}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {redeeming ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Gift className="mr-2 h-5 w-5" />}
                      Redeem 1000 Pts
                    </button>
                  </div>
                </div>

                <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-inner relative">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_0_25px_rgba(99,102,241,0.8)]"
                    style={{ width: `${(kynistoPoints.progress / 1000) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Redeem Result Celebration */}
            {redeemResult && (
              <div className={`rounded-3xl p-6 border shadow-xl flex items-center gap-4 animate-in zoom-in-95 ${
                redeemResult.error 
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200' 
                  : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800/50 text-green-900 dark:text-green-200 relative overflow-hidden'
              }`}>
                {!redeemResult.error && (
                  <div className="absolute inset-0 pointer-events-none flex justify-around opacity-50">
                    <Sparkles className="h-16 w-16 text-yellow-400 animate-pulse" />
                    <Sparkles className="h-16 w-16 text-indigo-400 animate-pulse delay-150" />
                  </div>
                )}
                <div className="relative z-10 flex items-center w-full">
                  {redeemResult.error ? <AlertTriangle className="mr-3 h-8 w-8" /> : <CheckCircle2 className="mr-3 h-8 w-8 text-green-600 dark:text-green-400" />}
                  <div className="flex-1">
                    <h3 className="font-extrabold text-lg text-black dark:text-white">
                      {redeemResult.error ? 'Redemption Failed' : 'Reward Unlocked!'}
                    </h3>
                    <p className="font-semibold text-sm opacity-100 mt-1 text-black dark:text-white">
                      {redeemResult.error || `You have successfully received: ${redeemResult.reward}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            <div className="rounded-3xl bg-white dark:bg-black border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
              <div className="border-b border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Transaction History</h3>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {kynistoPoints.history.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`rounded-2xl p-3 shadow-sm ${tx.type === 'earned' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
                        {tx.type === 'earned' ? <Award className="h-6 w-6" /> : <Gift className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="font-extrabold text-gray-900 dark:text-white">{tx.description}</p>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-1">{tx.date}</p>
                      </div>
                    </div>
                    <div className={`text-xl font-black ${tx.type === 'earned' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                      {tx.type === 'earned' ? '+' : ''}{tx.points}
                    </div>
                  </div>
                ))}
                {kynistoPoints.history.length === 0 && (
                   <div className="p-8 text-center text-gray-600 dark:text-gray-400 font-semibold">No transactions yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loyalty Points Tab - Stacked Interactive Cards */}
        {activeTab === 'loyalty' && (
          <div className="animate-in fade-in duration-500 space-y-8 relative">
            
            {redeemResult?.coupon && (
              <div className="rounded-3xl p-8 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 text-green-900 dark:text-green-200 flex flex-col items-center shadow-xl mb-8 relative overflow-hidden">
                 <div className="absolute top-0 left-1/4 animate-bounce">
                    <Star className="text-yellow-400 w-12 h-12" fill="currentColor" />
                 </div>
                 <div className="absolute bottom-0 right-1/4 animate-bounce delay-100">
                    <Star className="text-yellow-400 w-8 h-8" fill="currentColor" />
                 </div>
                <CheckCircle2 className="h-12 w-12 mb-3 text-green-600 dark:text-green-400" />
                <p className="font-extrabold text-2xl text-center z-10 text-black dark:text-white">Discount Coupon Unlocked!</p>
                <div className="mt-4 rounded-xl bg-white dark:bg-black border-2 border-dashed border-green-400 px-6 py-3 font-mono text-3xl font-black tracking-widest shadow-inner z-10 text-black dark:text-white">
                  {redeemResult.coupon}
                </div>
              </div>
            )}
            
            {redeemResult?.error && (
              <div className="rounded-2xl p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-900 dark:text-red-200 font-bold shadow-md mb-8">
                {redeemResult.error}
              </div>
            )}

            {/* Stacked Cards Container */}
            <div className="relative pt-4 pb-[300px]">
              {loyaltyPoints.map((store, index) => {
                const isActive = activeCardIndex === index;
                const offset = index - activeCardIndex;
                const isVisible = offset >= 0 && offset < 3; // Show top 3 cards

                if (!isVisible && !isActive) return null;

                return (
                  <div 
                    key={store.storeId} 
                    onClick={() => setActiveCardIndex(index)}
                    className={`absolute w-full rounded-3xl p-6 md:p-8 border shadow-2xl transition-all duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-br from-gray-900 to-black text-white dark:from-white dark:to-gray-100 dark:text-black border-gray-700 dark:border-gray-300 z-30 transform-none' 
                        : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700'
                    }`}
                    style={{
                      top: isActive ? 0 : `${offset * 20 + 20}px`,
                      scale: isActive ? 1 : 1 - (offset * 0.05),
                      zIndex: 30 - offset,
                      opacity: isActive ? 1 : 1 - (offset * 0.2),
                    }}
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-4">
                        <img src={store.logoUrl} alt={store.storeName} className="h-16 w-16 rounded-2xl shadow-lg border-2 border-white dark:border-gray-800 bg-white" />
                        <div>
                          <h3 className={`font-black text-2xl ${isActive ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>{store.storeName}</h3>
                          <p className={`text-sm font-bold flex items-center mt-1 ${isActive ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                            <Clock className="mr-1.5 h-4 w-4" /> Last visit: {store.lastVisit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-black ${isActive ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                           {isActive ? <AnimatedNumber value={store.points} /> : store.points}
                        </div>
                        <div className={`text-sm font-extrabold mt-1 ${isActive ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>Points</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-6 mb-8">
                      <div className="flex-1">
                        <div className={`flex justify-between text-sm font-extrabold mb-3 ${isActive ? 'text-white dark:text-black' : 'text-black dark:text-white'}`}>
                          <span>{store.progress} / 1000 Pts</span>
                          <span>₹100 Off Reward</span>
                        </div>
                        <div className={`h-3 w-full rounded-full overflow-hidden shadow-inner ${isActive ? 'bg-gray-700 dark:bg-gray-300' : 'bg-gray-300 dark:bg-gray-700'}`}>
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] shadow-[0_0_25px_rgba(99,102,241,0.8)]"
                            style={{ width: `${(store.progress / 1000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* Progress Ring */}
                      <div className="flex-shrink-0">
                         <ProgressRing progress={store.progress} max={1000} />
                      </div>
                    </div>

                    {isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRedeemLoyalty(store.storeId); }}
                        disabled={!store.canRedeemDiscount || redeeming}
                        className={`w-full py-4 rounded-xl font-black text-lg transition-all shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed ${
                          store.canRedeemDiscount 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.02] dark:bg-indigo-500 dark:hover:bg-indigo-600' 
                            : 'bg-gray-800 text-gray-500 dark:bg-gray-200 dark:text-gray-500'
                        }`}
                      >
                        {redeeming ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : store.canRedeemDiscount ? 'Claim ₹100 Discount' : 'Earn more points to unlock'}
                      </button>
                    )}
                  </div>
                );
              })}
              {loyaltyPoints.length === 0 && (
                <div className="p-12 text-center bg-gray-50 dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
                  <Store className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white">No loyalty cards yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Memberships Tab */}
        {activeTab === 'memberships' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            
            {/* Active Memberships */}
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center">
                <Crown className="mr-3 h-6 w-6 text-indigo-600 dark:text-indigo-400" /> Active Memberships
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                {memberships.active.map((membership) => (
                  <div key={membership.id} className="relative overflow-hidden rounded-3xl bg-white dark:bg-black p-8 border border-gray-200 dark:border-gray-800 shadow-xl transition-transform hover:scale-[1.02]">
                    {membership.isKynistoPremium && (
                      <div className="absolute top-0 right-0 rounded-bl-3xl bg-gradient-to-r from-yellow-500 to-amber-600 px-6 py-2 shadow-lg">
                        <span className="flex items-center text-xs font-black text-white tracking-widest">
                          <Crown className="mr-1.5 h-4 w-4" /> PREMIUM
                        </span>
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-1 pr-24">{membership.storeName}</h3>
                      <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{membership.type} Plan</p>
                    </div>
                    
                    <div className="mt-8 flex items-end justify-between border-t border-gray-200 dark:border-gray-800 pt-6">
                      <div>
                        <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Valid until</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">{membership.validUntil}</p>
                      </div>
                      <a href={membership.invoiceUrl} className="flex items-center rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 px-4 py-2.5 text-sm font-extrabold text-gray-900 dark:text-white transition-colors">
                        <Download className="mr-2 h-4 w-4" /> Invoice
                      </a>
                    </div>
                  </div>
                ))}
                {memberships.active.length === 0 && (
                  <div className="col-span-full p-8 text-center rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                     <p className="text-lg font-bold text-gray-600 dark:text-gray-400">No active memberships.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Expired Memberships */}
            {memberships.expired.length > 0 && (
              <div>
                <h2 className="text-2xl font-black text-gray-500 dark:text-gray-400 mb-6 flex items-center">
                  <Clock className="mr-3 h-6 w-6" /> Expired
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {memberships.expired.map((membership) => (
                    <div key={membership.id} className="rounded-3xl bg-gray-50 dark:bg-gray-900/50 p-8 border border-gray-200 dark:border-gray-800 opacity-80 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="font-black text-xl text-gray-800 dark:text-gray-200">{membership.storeName}</h3>
                          <p className="text-sm font-bold text-gray-600 dark:text-gray-400 mt-1">{membership.type} Plan</p>
                        </div>
                        <span className="rounded-xl bg-red-100 dark:bg-red-900/30 px-3 py-1 text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-wider">
                          Expired
                        </span>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-6">
                        <div>
                          <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Expired on</p>
                          <p className="text-base font-black text-gray-700 dark:text-gray-300">{membership.validUntil}</p>
                        </div>
                        <button className="text-sm font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors uppercase tracking-wide">
                          Renew Plan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
