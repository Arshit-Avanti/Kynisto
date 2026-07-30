'use client';

import React, { useState, useEffect } from 'react';
import { Gift, Wallet, Award, Download, Clock, Store, Crown, Loader2, CheckCircle2 } from 'lucide-react';

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
  storeName: string;
  type: string;
  validUntil: string;
  isKynistoPremium: boolean;
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

export default function KynistoWalletView() {
  const [activeTab, setActiveTab] = useState<'kynisto' | 'loyalty' | 'memberships'>('kynisto');
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemResult, setRedeemResult] = useState<{reward?: string; coupon?: string; error?: string} | null>(null);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const res = await fetch('/api/wallet');
      if (res.ok) {
        const data = await res.json();
        setWalletData(data);
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
      const res = await fetch('/api/wallet/redeem-points', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRedeemResult({ reward: data.reward });
        // Optimistic update
        setWalletData((prev) => prev ? {
          ...prev,
          kynistoPoints: {
            ...prev.kynistoPoints,
            total: prev.kynistoPoints.total - 1000,
            progress: (prev.kynistoPoints.progress - 1000 + 1000) % 1000, // naive adjustment
            history: [
              { id: Date.now().toString(), date: new Date().toISOString().split('T')[0], description: `Redeemed for ${data.reward}`, points: -1000, type: 'redeemed' },
              ...prev.kynistoPoints.history
            ]
          }
        } : prev);
      } else {
        setRedeemResult({ error: data.error || 'Failed to redeem' });
      }
    } catch (error) {
      setRedeemResult({ error: 'An error occurred' });
    } finally {
      setRedeeming(false);
    }
  };

  const handleRedeemLoyalty = async (storeId: string) => {
    setRedeeming(true);
    setRedeemResult(null);
    try {
      const res = await fetch('/api/wallet/redeem-loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId }),
      });
      const data = await res.json();
      if (data.success) {
        setRedeemResult({ coupon: data.couponCode });
        // Optimistic update for loyalty
        setWalletData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            loyaltyPoints: prev.loyaltyPoints.map(p => 
              p.storeId === storeId ? { ...p, points: p.points - 1000, progress: (p.progress - 1000 + 1000) % 1000, canRedeemDiscount: (p.points - 1000) >= 1000 } : p
            )
          };
        });
      } else {
        setRedeemResult({ error: data.error || 'Failed to redeem' });
      }
    } catch (error) {
      setRedeemResult({ error: 'An error occurred' });
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!walletData) {
    return <div className="text-center p-8 text-red-500">Failed to load wallet</div>;
  }

  const { kynistoPoints, loyaltyPoints, memberships } = walletData;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Glassmorphic Header */}
      <div className="overflow-hidden rounded-3xl bg-white/10 dark:bg-black/20 p-6 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-4 shadow-lg text-white">
            <Wallet className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">My Wallet</h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Manage points, loyalty, and memberships</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto rounded-2xl bg-white/5 dark:bg-black/10 p-2 backdrop-blur-lg border border-white/10 shadow-inner">
        {[
          { id: 'kynisto', label: 'Kynisto Points', icon: Award },
          { id: 'loyalty', label: 'Store Loyalty', icon: Store },
          { id: 'memberships', label: 'Memberships', icon: Crown },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); setRedeemResult(null); }}
            className={`flex flex-1 items-center justify-center space-x-2 rounded-xl py-3 px-4 text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-white/10 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white'
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
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Progress Card */}
            <div className="rounded-3xl bg-white/10 dark:bg-black/20 p-6 sm:p-8 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Total Balance</h2>
                    <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                      {kynistoPoints.total.toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 text-right">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-bold text-gray-900 dark:text-white">{kynistoPoints.progress}</span> / 1000 to next reward
                    </p>
                    <button
                      onClick={handleRedeemKynistoPoints}
                      disabled={kynistoPoints.total < 1000 || redeeming}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-indigo-500/25 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                      {redeeming ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gift className="mr-2 h-4 w-4" />}
                      Redeem 1000 Pts
                    </button>
                  </div>
                </div>

                <div className="h-4 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-inner">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out relative"
                    style={{ width: `${(kynistoPoints.progress / 1000) * 100}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Redeem Result */}
            {redeemResult && (
              <div className={`rounded-2xl p-4 backdrop-blur-md border ${redeemResult.error ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300'} flex items-center shadow-md animate-in zoom-in-95`}>
                {redeemResult.error ? null : <CheckCircle2 className="mr-3 h-5 w-5" />}
                <p className="font-semibold">{redeemResult.error || `Success! You received: ${redeemResult.reward}`}</p>
              </div>
            )}

            {/* History */}
            <div className="rounded-3xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
              <div className="border-b border-gray-200/20 dark:border-gray-800/50 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h3>
              </div>
              <div className="divide-y divide-gray-200/20 dark:divide-gray-800/50">
                {kynistoPoints.history.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`rounded-full p-2 ${tx.type === 'earned' ? 'bg-green-500/10 text-green-500' : 'bg-indigo-500/10 text-indigo-500'}`}>
                        {tx.type === 'earned' ? <Award className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{tx.description}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tx.date}</p>
                      </div>
                    </div>
                    <div className={`font-bold ${tx.type === 'earned' ? 'text-green-500' : 'text-gray-900 dark:text-white'}`}>
                      {tx.type === 'earned' ? '+' : ''}{tx.points}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Loyalty Points Tab */}
        {activeTab === 'loyalty' && (
          <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {redeemResult?.coupon && (
              <div className="col-span-full rounded-2xl p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 flex flex-col items-center shadow-md justify-center py-6">
                <CheckCircle2 className="h-8 w-8 mb-2" />
                <p className="font-bold text-lg text-center">Discount Coupon Unlocked!</p>
                <div className="mt-3 rounded-lg bg-green-500/20 px-4 py-2 font-mono text-xl font-black tracking-wider">
                  {redeemResult.coupon}
                </div>
              </div>
            )}
            {redeemResult?.error && (
              <div className="col-span-full rounded-2xl p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 font-semibold shadow-md">
                {redeemResult.error}
              </div>
            )}

            {loyaltyPoints.map((store) => (
              <div key={store.storeId} className="group rounded-3xl bg-white/10 dark:bg-black/20 p-6 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <img src={store.logoUrl} alt={store.storeName} className="h-12 w-12 rounded-full border-2 border-white/20 shadow-sm" />
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{store.storeName}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                        <Clock className="mr-1 h-3 w-3" /> Last visit: {store.lastVisit}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{store.points}</div>
                    <div className="text-xs font-medium text-indigo-500">Points</div>
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <span>{store.progress} / 1000</span>
                    <span>₹100 Off</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden shadow-inner">
                    <div 
                      className="h-full rounded-full bg-indigo-500 transition-all duration-1000"
                      style={{ width: `${(store.progress / 1000) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => handleRedeemLoyalty(store.storeId)}
                  disabled={!store.canRedeemDiscount || redeeming}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50
                    ${store.canRedeemDiscount 
                      ? 'bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 focus:ring-gray-900 dark:focus:ring-white' 
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed'
                    }"
                  style={{
                    backgroundColor: store.canRedeemDiscount ? undefined : 'rgba(156, 163, 175, 0.2)'
                  }}
                >
                  {redeeming ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : store.canRedeemDiscount ? 'Claim ₹100 Discount' : 'Earn more points'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Memberships Tab */}
        {activeTab === 'memberships' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Active Memberships */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 pl-2 border-l-4 border-indigo-500">Active Memberships</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {memberships.active.map((membership) => (
                  <div key={membership.id} className="relative overflow-hidden rounded-3xl bg-white/10 dark:bg-black/20 p-6 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg">
                    {membership.isKynistoPremium && (
                      <div className="absolute top-0 right-0 rounded-bl-2xl bg-gradient-to-r from-yellow-400 to-amber-600 px-4 py-1.5 shadow-md">
                        <span className="flex items-center text-xs font-bold text-white tracking-wider">
                          <Crown className="mr-1 h-3 w-3" /> PREMIUM
                        </span>
                      </div>
                    )}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-black text-xl text-gray-900 dark:text-white">{membership.storeName}</h3>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{membership.type} Plan</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200/20 dark:border-gray-800/50 pt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Valid until</p>
                        <p className="font-semibold text-gray-900 dark:text-white">{membership.validUntil}</p>
                      </div>
                      <a href={membership.invoiceUrl} className="flex items-center rounded-lg bg-white/10 hover:bg-white/20 dark:bg-white/5 dark:hover:bg-white/10 px-3 py-2 text-sm font-medium text-gray-900 dark:text-white transition-colors">
                        <Download className="mr-2 h-4 w-4" /> Invoice
                      </a>
                    </div>
                  </div>
                ))}
                {memberships.active.length === 0 && (
                  <p className="text-gray-500 p-4">No active memberships.</p>
                )}
              </div>
            </div>

            {/* Expired Memberships */}
            {memberships.expired.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-4 pl-2 border-l-4 border-gray-300 dark:border-gray-700">Expired</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {memberships.expired.map((membership) => (
                    <div key={membership.id} className="rounded-3xl bg-gray-50/50 dark:bg-gray-900/50 p-6 backdrop-blur-md border border-gray-200 dark:border-gray-800 opacity-75 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-700 dark:text-gray-300">{membership.storeName}</h3>
                          <p className="text-sm font-medium text-gray-500">{membership.type} Plan</p>
                        </div>
                        <span className="rounded-full bg-red-100 dark:bg-red-900/30 px-2.5 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                          Expired
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800 pt-4">
                        <div>
                          <p className="text-xs text-gray-500">Expired on</p>
                          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{membership.validUntil}</p>
                        </div>
                        <button className="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
                          Renew
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
