"use client";

import React, { useEffect, useRef, useState } from "react";
import createGlobe from "cobe";

export function CobeGlobe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  // Request user current location if allowed
  useEffect(() => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setUserLocation([lat, lon]);
          setLocationName("Your Location");
        },
        (err) => {
          // Graceful fallback if permission denied or unavailable
          console.log("Geolocation info:", err.message);
        },
        { timeout: 8000, enableHighAccuracy: false }
      );
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe> | null = null;
    let phi = 0;
    let width = 0;

    const onResize = () => {
      if (canvas) {
        width = canvas.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);

    // Build markers with user's current location at highest priority
    const markers: Array<{ location: [number, number]; size: number }> = [];

    if (userLocation) {
      // User's exact live location marker (radiant beacon)
      markers.push({ location: userLocation, size: 0.12 });
    }

    // Major global hub beacons highlighting country coordinates
    markers.push(
      { location: [28.6139, 77.2090], size: 0.08 },  // New Delhi, India
      { location: [19.0760, 72.8777], size: 0.07 },  // Mumbai, India
      { location: [12.9716, 77.5946], size: 0.07 },  // Bengaluru, India
      { location: [37.7749, -122.4194], size: 0.06 }, // San Francisco, USA
      { location: [40.7128, -74.0060], size: 0.06 },  // New York, USA
      { location: [51.5074, -0.1278], size: 0.06 },  // London, UK
      { location: [1.3521, 103.8198], size: 0.07 },  // Singapore
      { location: [35.6762, 139.6503], size: 0.06 }, // Tokyo, Japan
      { location: [25.2048, 55.2708], size: 0.06 },  // Dubai, UAE
      { location: [-33.8688, 151.2093], size: 0.06 } // Sydney, Australia
    );

    try {
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: (width || 360) * 2,
        height: (width || 360) * 2,
        phi: 0,
        theta: 0.25,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 24000,       // High-density country and continent outline resolution
        mapBrightness: 8.5,       // Illuminated high-contrast country contours
        baseColor: [0.35, 0.45, 0.7],  // Radiant country and continent outlines
        markerColor: [1, 0.45, 0.05], // Neon vibrant orange marker beacons
        glowColor: [0.12, 0.6, 1.0],  // Atmospheric cyan/blue aura
        markers,
        onRender: (state) => {
          if (pointerInteracting.current === null) {
            phi += 0.005;
          }
          state.phi = phi + pointerInteractionMovement.current;
          state.width = (canvas.offsetWidth || 360) * 2;
          state.height = (canvas.offsetWidth || 360) * 2;
        },
      });
    } catch (err) {
      console.warn("Cobe Globe 3D init:", err);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (globe) {
        try {
          globe.destroy();
        } catch {
          // ignore cleanup
        }
      }
    };
  }, [userLocation]);

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden select-none ${className || ""}`}
      style={{ width: "100%", height: "100%", minHeight: "260px" }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current = e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) canvasRef.current.style.cursor = "grab";
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.006;
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta * 0.006;
          }
        }}
        style={{
          width: "100%",
          height: "100%",
          maxWidth: "380px",
          aspectRatio: "1/1",
          cursor: "grab",
          contain: "layout paint size",
          touchAction: "none",
        }}
      />

      {/* Live Geolocation Badge */}
      {userLocation && (
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 12px",
            borderRadius: "20px",
            background: "rgba(10, 16, 30, 0.85)",
            border: "1px solid rgba(255, 122, 0, 0.5)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            boxShadow: "0 4px 16px rgba(255, 122, 0, 0.25)",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#FF7A00",
              boxShadow: "0 0 8px #FF7A00",
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 750,
              color: "#FFFFFF",
              WebkitTextFillColor: "#FFFFFF",
              letterSpacing: "0.02em",
            }}
          >
            {locationName || "Location Synced"} 📍
          </span>
        </div>
      )}
    </div>
  );
}
