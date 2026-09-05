"use client";

import { useEffect } from "react";
import { applyDeviceOptimizations } from "@/lib/device-profiler";

/**
 * ⚡ TurboCore Client Runtime
 * Runs adaptive hardware profiling and DOM tuning on mount.
 */
export function TurboCoreRuntime() {
  useEffect(() => {
    applyDeviceOptimizations();
  }, []);

  return null;
}
