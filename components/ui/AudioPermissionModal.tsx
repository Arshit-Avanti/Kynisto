"use client";

import { useEffect, useState } from "react";
import { audioEngine } from "@/lib/audio-engine";

export function AudioPermissionModal() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already responded to audio permission prompt
    if (typeof window === "undefined" || window.self !== window.top) return;

    const isBot = /bot|googlebot|crawler|spider|robot|crawling|mediapartners|adsbot|lighthouse/i.test(navigator.userAgent);
    if (isBot) return;

    const permission = localStorage.getItem("kynisto_audio_permission_v1");
    if (!permission) {
      // First-time user on Windows or Android -> Show prompt after short delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 600);
      return () => clearTimeout(timer);
    } else if (permission === "granted") {
      // User previously granted permission -> Unlock audio engine
      void audioEngine.forceUnlockAndPlayAll();
    } else {
      audioEngine.setMuted(true);
    }
  }, []);

  const handleAllowAudio = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kynisto_audio_permission_v1", "granted");
    }
    void audioEngine.forceUnlockAndPlayAll();
    setShowPrompt(false);
  };

  const handleMuteAudio = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("kynisto_audio_permission_v1", "denied");
    }
    audioEngine.setMuted(true);
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 99999,
        width: "min(460px, 92vw)",
        background: "rgba(11, 23, 54, 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(36, 87, 255, 0.4)",
        borderRadius: "20px",
        padding: "20px 24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(36, 87, 255, 0.3)",
        color: "#FFFFFF",
        fontFamily: "system-ui, -apple-system, sans-serif",
        animation: "slideUpAudioPrompt 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <style jsx>{`
        @keyframes slideUpAudioPrompt {
          from {
            opacity: 0;
            transform: translate(-50%, 30px);
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
            background: "linear-gradient(135deg, #2457FF 0%, #00C6FF 100%)",
            display: "grid",
            placeItems: "center",
            fontSize: "20px",
            flexShrink: 0,
            boxShadow: "0 6px 16px rgba(36, 87, 255, 0.4)",
          }}
        >
          🔊
        </div>

        <div style={{ flex: 1 }}>
          <h4 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 850, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
            Enable Immersive Audio Access?
          </h4>
          <p style={{ margin: 0, fontSize: "12px", color: "#94A3B8", lineHeight: 1.45 }}>
            Kynisto features background story audio & real-time queue chimes on Android & Windows.
          </p>

          <div style={{ display: "flex", gap: "10px", marginTop: "14px" }}>
            <button
              type="button"
              onClick={handleAllowAudio}
              style={{
                flex: 1,
                padding: "10px 16px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2457FF 0%, #1640D6 100%)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "12px",
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(36, 87, 255, 0.4)",
                transition: "all 0.2s ease",
              }}
            >
              🔊 Allow Audio
            </button>

            <button
              type="button"
              onClick={handleMuteAudio}
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "#CBD5E1",
                fontWeight: 700,
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              🔇 Keep Muted
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
