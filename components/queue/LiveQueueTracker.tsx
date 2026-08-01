'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle, XCircle, CheckCircle2, Navigation, User, Phone, Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface QueuePosition {
  currentPosition: number;
  totalInQueue: number;
  estimatedWaitMinutes: number;
  status: 'waiting' | 'ready' | 'completed' | 'cancelled';
  storeName: string;
  storeLocation: string;
}

const mockQueue: QueuePosition = {
  currentPosition: 4,
  totalInQueue: 12,
  estimatedWaitMinutes: 15,
  status: 'waiting',
  storeName: 'City Hospital - Dr. Sharma',
  storeLocation: 'MG Road, Bangalore'
};

export default function LiveQueueTracker() {
  const [queueInfo, setQueueInfo] = useState<QueuePosition>(mockQueue);
  const [isLate, setIsLate] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);

  // Fake live movement
  useEffect(() => {
    if (queueInfo.status !== 'waiting' || isCancelled) return;
    const interval = setInterval(() => {
      setQueueInfo(prev => {
        if (prev.currentPosition <= 1) {
          return { ...prev, currentPosition: 0, estimatedWaitMinutes: 0, status: 'ready' };
        }
        return {
          ...prev,
          currentPosition: prev.currentPosition - 1,
          estimatedWaitMinutes: Math.max(0, prev.estimatedWaitMinutes - 4)
        };
      });
    }, 10000); // move forward every 10s for demo
    return () => clearInterval(interval);
  }, [queueInfo.status, isCancelled]);

  const handleRunningLate = () => {
    setIsLate(true);
    setTimeout(() => setIsLate(false), 5000);
  };

  const handleNotComing = () => {
    setIsCancelled(true);
    setQueueInfo(prev => ({ ...prev, status: 'cancelled' }));
  };

  if (queueInfo.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
        <XCircle className="w-24 h-24 text-red-500 mb-6" />
        <h2 className="text-4xl font-black text-gray-900 dark:text-white">Queue Cancelled</h2>
        <p className="text-xl text-gray-700 dark:text-gray-300 font-bold mt-4">You have left the queue.</p>
        <Link href="/" className="mt-8 px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black font-bold rounded-full">
          Return Home
        </Link>
      </div>
    );
  }

  if (queueInfo.status === 'ready') {
    return (
      <div className="min-h-screen bg-green-50 dark:bg-green-950 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in">
        <CheckCircle2 className="w-32 h-32 text-green-600 dark:text-green-400 mb-8 animate-bounce" />
        <h2 className="text-5xl font-black text-green-900 dark:text-green-100 mb-4">It's your turn!</h2>
        <p className="text-2xl text-green-800 dark:text-green-200 font-bold max-w-lg">
          Please head to the clinic room at {queueInfo.storeName}.
        </p>
      </div>
    );
  }

  const progressPercent = ((queueInfo.totalInQueue - queueInfo.currentPosition) / queueInfo.totalInQueue) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-indigo-900 text-white pb-24 pt-8 px-6 lg:px-12 relative shadow-lg">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-64 h-64" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col">
          <Link href="/" className="flex items-center text-indigo-100 hover:text-white font-bold mb-8 w-fit transition-colors">
             <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-sm font-black uppercase tracking-widest text-white mb-4 shadow-sm border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse" /> Live Status
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">{queueInfo.storeName}</h2>
              <p className="flex items-center text-indigo-100 font-medium mt-3 text-lg md:text-xl">
                <MapPin className="w-5 h-5 mr-2" /> {queueInfo.storeLocation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Lifted up over header */}
      <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20 pb-12">
        {/* Soft Ambient Radial Backlight Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.2)_0%,_transparent_60%)] blur-[80px] pointer-events-none -z-10" />
        
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.15)] border border-gray-100 dark:border-gray-800 p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)] blur-3xl pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 border-b border-gray-100 dark:border-gray-800 pb-12">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                 <User className="w-4 h-4 mr-2" /> Your Position
              </p>
              <div className="flex items-baseline">
                <span className="text-8xl md:text-9xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter">
                  {queueInfo.currentPosition}
                </span>
                <span className="text-3xl text-gray-400 dark:text-gray-500 font-bold ml-4 tabular-nums">
                  / {queueInfo.totalInQueue}
                </span>
              </div>
            </div>
            
            <div className="md:text-right flex flex-col md:items-end justify-center">
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 flex items-center md:justify-end">
                 <Clock className="w-4 h-4 mr-2" /> Estimated Wait
              </p>
              <div className="text-6xl md:text-7xl font-black text-indigo-600 dark:text-indigo-400 mt-1 flex items-baseline tabular-nums tracking-tighter">
                {queueInfo.estimatedWaitMinutes} <span className="text-2xl font-bold ml-3 text-indigo-400 dark:text-indigo-500">mins</span>
              </div>
            </div>
          </div>

          {/* Timeline Progress */}
          <div className="relative mb-12 pt-8 pb-4">
            <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
              <span>Start</span>
              <span>Your Turn</span>
            </div>
            <div className="h-6 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner relative">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-0 rounded-full relative overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.6)]"
                style={{ width: `${progressPercent}%` }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 animate-[shimmer_2s_infinite] -translate-x-full" />
              </div>
            </div>
            <div 
              className="absolute top-12 -ml-5 transition-all duration-0 flex flex-col items-center"
              style={{ left: `${progressPercent}%` }}
            >
              <div className="bg-white dark:bg-gray-900 border-4 border-indigo-600 rounded-full w-10 h-10 shadow-xl flex items-center justify-center relative z-10">
                 <span className="w-3 h-3 bg-indigo-600 rounded-full animate-ping absolute" />
                 <span className="w-3 h-3 bg-indigo-600 rounded-full relative z-10" />
              </div>
            </div>
          </div>

          {isLate && (
            <div className="mb-10 p-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-xl flex items-start animate-in slide-in-from-bottom-2 shadow-sm">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 mr-4 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-1">We notified the clinic</h4>
                <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                  Your spot will be held for 10 additional minutes. Please arrive as soon as possible.
                </p>
              </div>
            </div>
          )}

          {/* Action Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
            <button 
              onClick={handleRunningLate}
              disabled={isLate}
              className="group flex items-center justify-center p-6 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 transition-all disabled:opacity-50 text-gray-900 dark:text-white"
            >
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                <Navigation className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="font-extrabold text-lg">Running Late</span>
            </button>
            
            <button 
              onClick={handleNotComing}
              className="group flex items-center justify-center p-6 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 border-2 border-red-100 dark:border-red-900/30 transition-all text-red-700 dark:text-red-400"
            >
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
              </div>
              <span className="font-extrabold text-lg">Cancel Visit</span>
            </button>
          </div>

        </div>
        
        {/* Support Footer */}
        <div className="mt-8 text-center flex items-center justify-center space-x-6 text-gray-500 dark:text-gray-400 font-medium">
          <button className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Phone className="w-4 h-4 mr-2" /> Call Clinic
          </button>
          <span className="w-1 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <button className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            <Bell className="w-4 h-4 mr-2" /> Notification Settings
          </button>
        </div>
        
      </div>
      
      {/* Shimmer CSS */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
