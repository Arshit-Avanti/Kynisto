"use client";

import React, { useEffect, useRef } from "react";
import createGlobe from "cobe";

export function CobeGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let rafId = 0;
    let phi = 0;

    const init = () => {
      const side = canvas.offsetWidth || 360;
      if (side === 0 || globe) return;

      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

      try {
        globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: side * 2,
          height: side * 2,
          phi: 0,
          theta: 0.25,
          dark: 1,
          diffuse: 1.2,
          mapSamples: 16000,
          mapBrightness: 6,
          baseColor: [0.15, 0.2, 0.35],
          markerColor: [1, 0.48, 0],
          glowColor: [0.1, 0.5, 0.9],
          markers: [
            { location: [28.6139, 77.2090], size: 0.08 }, // Delhi / India
            { location: [19.0760, 72.8777], size: 0.07 }, // Mumbai
            { location: [12.9716, 77.5946], size: 0.07 }, // Bangalore
            { location: [37.7749, -122.4194], size: 0.05 }, // SF
            { location: [51.5074, -0.1278], size: 0.05 }, // London
            { location: [1.3521, 103.8198], size: 0.06 }, // Singapore
            { location: [35.6762, 139.6503], size: 0.05 }, // Tokyo
          ],
          onRender: (state) => {
            state.phi = phi;
            phi += 0.006;
          },
        });
      } catch (err) {
        console.warn("WebGL / Cobe globe initialization skipped:", err);
      }
    };

    let ro: ResizeObserver | null = null;
    if (canvas.offsetWidth > 0) {
      init();
    } else if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width && entries[0]?.contentRect.width > 0) {
          ro?.disconnect();
          ro = null;
          init();
        }
      });
      ro.observe(canvas);
    } else {
      init();
    }

    return () => {
      ro?.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      if (globe) {
        try {
          globe.destroy();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className || ""}`}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "400px",
          aspectRatio: "1/1",
          contain: "layout paint size",
        }}
      />
    </div>
  );
}
