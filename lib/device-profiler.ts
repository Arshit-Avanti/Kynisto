"use client";

/**
 * ⚡ Kynisto Adaptive Hardware & Battery Profiler
 * Detects device memory, CPU core concurrency, and network tier
 * to automatically engage TurboLite mode on budget phones (≤2GB RAM).
 */

export interface DeviceProfile {
  isLowEnd: boolean;
  isLowMemory: boolean;
  isSlowNetwork: boolean;
  isSaveData: boolean;
  cores: number;
  memoryGb: number;
}

let _currentProfile: DeviceProfile | null = null;

export function inspectDevice(): DeviceProfile {
  if (_currentProfile) return _currentProfile;

  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      isLowEnd: false,
      isLowMemory: false,
      isSlowNetwork: false,
      isSaveData: false,
      cores: 8,
      memoryGb: 8,
    };
  }

  const nav = navigator as any;
  const memoryGb = Number(nav.deviceMemory || 4);
  const cores = Number(nav.hardwareConcurrency || 4);
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

  const isSaveData = Boolean(conn?.saveData);
  const isSlowNetwork = Boolean(
    conn && (conn.effectiveType === "slow-2g" || conn.effectiveType === "2g" || conn.effectiveType === "3g")
  );
  const isLowMemory = memoryGb <= 2;
  const isLowEnd = isLowMemory || cores <= 4 || isSaveData || isSlowNetwork;

  _currentProfile = {
    isLowEnd,
    isLowMemory,
    isSlowNetwork,
    isSaveData,
    cores,
    memoryGb,
  };

  return _currentProfile;
}

/**
 * Automatically applies TurboLite hardware optimizations to DOM root
 */
export function applyDeviceOptimizations(): void {
  if (typeof document === "undefined") return;

  const profile = inspectDevice();
  const root = document.documentElement;

  if (profile.isLowEnd) {
    root.classList.add("turbo-lite");
  } else {
    root.classList.remove("turbo-lite");
  }
}

// Auto-run on client execution
if (typeof window !== "undefined") {
  applyDeviceOptimizations();
}
