"use client";

import { useEffect, useState } from "react";
import { audioEngine } from "@/lib/audio-engine";

declare global {
  interface Window {
    __kynisto_modal_active?: boolean;
  }
}

export function AudioPermissionModal() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Strict guard: Never show in iframes (AdSense preview / embedded views), headless browsers, or bots
    const isFramed = window.self !== window.top;
    const isAutomated = Boolean((navigator as any).webdriver);
    const isBot = /bot|googlebot|crawler|spider|robot|crawling|mediapartners|adsbot|lighthouse|headlesschrome/i.test(navigator.userAgent);
    const isPreview = window.location.search.includes("preview") || window.location.search.includes("google") || window.location.search.includes("debug");

    if (isFramed || isAutomated || isBot || isPreview) return;

    const permission = localStorage.getItem("kynisto_audio_permission_v1");
    if (!permission) {
      // First-time user -> Show prompt after short delay
      const timer = setTimeout(() => {
        window.__kynisto_modal_active = true;
        setShowPrompt(true);
      }, 700);
      return () => clearTimeout(timer);
    } else if (permission === "granted") {
      void audioEngine.forceUnlockAndPlayAll();
    } else {
      audioEngine.setMuted(true);
    }
  }, []);

  const handleAllowAudio = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kynisto_audio_permission_v1", "granted");
      window.__kynisto_modal_active = false;
      window.dispatchEvent(new CustomEvent("kynisto:modal_closed", { detail: "audio" }));
    }
    void audioEngine.forceUnlockAndPlayAll();
    setShowPrompt(false);
  };

  const handleMuteAudio = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kynisto_audio_permission_v1", "denied");
      window.__kynisto_modal_active = false;
      window.dispatchEvent(new CustomEvent("kynisto:modal_closed", { detail: "audio" }));
    }
    audioEngine.setMuted(true);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Audio Experience Permission Prompt"
      style={{
        position: "fixed",
        bottom: "82px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        width: "min(420px, 92vw)",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "20px",
        padding: "18px 20px",
        boxShadow: "0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.06)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "slideUpAudioPrompt 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style jsx>{`
        @keyframes slideUpAudioPrompt {
          from {
            opacity: 0;
            transform: translate(-50%, 25px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>

      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
        <div
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
            display: "grid",
            placeItems: "center",
            fontSize: "20px",
            flexShrink: 0,
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
          }}
        >
          🔊
        </div>

        <div style={{ flex: 1 }}>
          <h4
            style={{
              margin: "0 0 4px",
              fontSize: "15px",
              fontWeight: 800,
              color: "#0F172A",
              WebkitTextFillColor: "#0F172A",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            Enable Immersive Audio?
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              color: "#475569",
              WebkitTextFillColor: "#475569",
              lineHeight: 1.45,
              fontWeight: 500,
            }}
          >
            Enjoy store ambiance sounds, voice guidance, and real-time clinic queue chimes.
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button
              type="button"
              onClick={handleAllowAudio}
              style={{
                flex: 1,
                padding: "9px 16px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                fontWeight: 700,
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 3px 10px rgba(37, 99, 235, 0.3)",
                transition: "all 0.15s ease",
              }}
            >
              🔊 Allow Audio
            </button>

            <button
              type="button"
              onClick={handleMuteAudio}
              style={{
                padding: "9px 14px",
                borderRadius: "10px",
                background: "#F1F5F9",
                border: "1px solid #E2E8F0",
                color: "#475569",
                WebkitTextFillColor: "#475569",
                fontWeight: 600,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Keep Muted
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
