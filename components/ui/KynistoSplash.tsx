"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * KynistoSplash — Animated splash/loading screen with the Kynisto logo,
 * expanding concentric pulse rings, and a shimmer effect.
 * Displays on first load and fades away after animation completes.
 */
export function KynistoSplash({ onComplete }: { onComplete?: () => void }) {
  const [phase, setPhase] = useState<"visible" | "fading" | "hidden">("visible");

  const handleComplete = useCallback(() => {
    setPhase("fading");
    const timer = setTimeout(() => {
      setPhase("hidden");
      onComplete?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    // Auto-dismiss after 2.4s
    const timer = setTimeout(handleComplete, 2400);
    return () => clearTimeout(timer);
  }, [handleComplete]);

  if (phase === "hidden") return null;

  return (
    <div
      className="kynistoSplashOverlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-color, #000000)",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      {/* Background subtle gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(34,197,94,0.08) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Pulse rings */}
      <div className="splashPulseContainer" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="splashPulseRing"
            style={{
              animationDelay: `${i * 0.35}s`,
            }}
          />
        ))}
      </div>

      {/* Logo & text */}
      <div
        className="splashContent"
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          animation: "splashLogoEntry 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      >
        {/* Kynisto Logo Mark */}
        <div
          className="splashLogoMark"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "24px",
            background: "linear-gradient(135deg, #22C55E 0%, #16A34A 50%, #F59E0B 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 60px rgba(34, 197, 94, 0.4), 0 0 120px rgba(34, 197, 94, 0.15)",
            animation: "splashGlow 2s ease-in-out infinite",
          }}
        >
          <span
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: "#FFFFFF",
              textShadow: "0 2px 12px rgba(0,0,0,0.3)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            K
          </span>
        </div>

        {/* Brand name with shimmer */}
        <div className="splashBrandName">
          <span
            style={{
              fontSize: "28px",
              fontWeight: 800,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "var(--primary-text, #FFFFFF)",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            KYNISTO
          </span>
          <div className="splashShimmer" aria-hidden="true" />
        </div>

        <span
          style={{
            fontSize: "13px",
            letterSpacing: "1.5px",
            color: "var(--muted, #94A3B8)",
            textTransform: "uppercase",
            fontWeight: 500,
            opacity: 0,
            animation: "splashTaglineEntry 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards",
          }}
        >
          Everything Around You, Smarter
        </span>
      </div>

      <style>{`
        .splashPulseContainer {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .splashPulseRing {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid rgba(34, 197, 94, 0.25);
          width: 120px;
          height: 120px;
          animation: splashPulse 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes splashPulse {
          0% {
            width: 80px;
            height: 80px;
            opacity: 0.6;
            border-color: rgba(34, 197, 94, 0.4);
          }
          100% {
            width: 400px;
            height: 400px;
            opacity: 0;
            border-color: rgba(245, 158, 11, 0.1);
          }
        }

        @keyframes splashLogoEntry {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes splashGlow {
          0%, 100% {
            box-shadow: 0 0 40px rgba(34, 197, 94, 0.35), 0 0 80px rgba(34, 197, 94, 0.1);
          }
          50% {
            box-shadow: 0 0 60px rgba(34, 197, 94, 0.5), 0 0 120px rgba(245, 158, 11, 0.2);
          }
        }

        @keyframes splashTaglineEntry {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 0.7;
            transform: translateY(0);
          }
        }

        .splashBrandName {
          position: relative;
          overflow: hidden;
        }

        .splashShimmer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg,
            transparent 30%,
            rgba(255, 255, 255, 0.25) 50%,
            transparent 70%
          );
          animation: splashShimmerSlide 2s ease-in-out infinite;
        }

        @keyframes splashShimmerSlide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
