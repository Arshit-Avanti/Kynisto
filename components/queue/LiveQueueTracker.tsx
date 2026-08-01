'use client';

import React, { useState, useEffect } from 'react';
import { Clock, MapPin, AlertCircle, XCircle, CheckCircle2, Navigation } from 'lucide-react';

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
  storeName: 'Kynisto Flagship Store',
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
    }, 15000); // move forward every 15s for demo
    return () => clearInterval(interval);
  }, [queueInfo.status, isCancelled]);

  const handleRunningLate = () => {
    setIsLate(true);
    // Usually would call API here
    setTimeout(() => setIsLate(false), 4000);
  };

  const handleNotComing = () => {
    setIsCancelled(true);
    setQueueInfo(prev => ({ ...prev, status: 'cancelled' }));
  };

  if (queueInfo.status === 'cancelled') {
    return (
      <div className="max-w-md mx-auto p-6 bg-white dark:bg-black rounded-3xl border border-red-200 dark:border-red-800/50 shadow-xl text-center">
        <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Queue Cancelled</h2>
        <p className="text-gray-700 dark:text-gray-300 font-bold mt-2">You have left the queue.</p>
      </div>
    );
  }

  if (queueInfo.status === 'ready') {
    return (
      <div className="max-w-md mx-auto p-6 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-200 dark:border-green-800/50 shadow-xl text-center animate-in zoom-in">
        <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 dark:text-green-400 mb-4 animate-bounce" />
        <h2 className="text-3xl font-black text-green-900 dark:text-green-100">It's your turn!</h2>
        <p className="text-green-800 dark:text-green-200 font-bold mt-2">Please head to the counter at {queueInfo.storeName}.</p>
      </div>
    );
  }

  const progressPercent = ((queueInfo.totalInQueue - queueInfo.currentPosition) / queueInfo.totalInQueue) * 100;

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-black rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <Clock className="w-24 h-24" />
        </div>
        <div className="relative z-10">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-widest text-white mb-4">
            Live Queue
          </span>
          <h2 className="text-2xl font-black text-white">{queueInfo.storeName}</h2>
          <p className="flex items-center text-indigo-100 font-bold mt-1 text-sm">
            <MapPin className="w-4 h-4 mr-1" /> {queueInfo.storeLocation}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <p className="text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Your Position</p>
            <div className="text-6xl font-black text-gray-900 dark:text-white mt-1">
              {queueInfo.currentPosition}
              <span className="text-2xl text-gray-400 dark:text-gray-500 font-bold ml-1">/ {queueInfo.totalInQueue}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Est. Wait</p>
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {queueInfo.estimatedWaitMinutes} <span className="text-lg">min</span>
            </div>
          </div>
        </div>

        {/* Timeline Progress */}
        <div className="relative mb-8 pt-4">
          <div className="h-4 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div 
            className="absolute top-0 -ml-3 transition-all duration-1000 ease-out"
            style={{ left: `${progressPercent}%` }}
          >
            <div className="bg-white dark:bg-gray-800 border-4 border-indigo-600 rounded-full w-6 h-6 shadow-lg" />
          </div>
        </div>

        {isLate && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-2xl flex items-center animate-in slide-in-from-bottom-2">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 mr-3 shrink-0" />
            <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
              We notified the store you're running late. Your spot is held for 10 more minutes.
            </p>
          </div>
        )}

        {/* Action Controls */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleRunningLate}
            disabled={isLate}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-900 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 transition-colors disabled:opacity-50 text-gray-900 dark:text-white"
          >
            <Navigation className="w-6 h-6 mb-2 text-indigo-600 dark:text-indigo-400" />
            <span className="font-extrabold text-sm">Running Late</span>
          </button>
          
          <button 
            onClick={handleNotComing}
            className="flex flex-col items-center justify-center p-4 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 transition-colors text-red-700 dark:text-red-400"
          >
            <XCircle className="w-6 h-6 mb-2" />
            <span className="font-extrabold text-sm">Not Coming</span>
          </button>
        </div>
      </div>
    </div>
  );
}
