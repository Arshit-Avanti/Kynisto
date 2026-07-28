"use client";

import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  fallbackSrc?: string;
}

export function VideoBackground({
  videoSrc = "/videos/kynisto-hero.mp4",
  fallbackSrc = "https://labs.google/fx/api/og-video/shared/38057267-b41f-4b8a-86a0-131e8d6be890",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Autoplay blocked by browser policy:", err);
      }
    };

    playVideo();
  }, []);

  const toggleAudio = async () => {
    const video = videoRef.current;
    if (!video) return;

    const nextMuted = !isMuted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (nextMuted) return;

    try {
      video.volume = 0.85;
      await video.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn("Audio play failed:", err);
    }
  };

  return (
    <>
      {/* Full-Page Background Video Container - 100% Visible */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-[-1] bg-black">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-100 transition-opacity duration-1000"
          style={{ width: "100vw", height: "100vh", objectFit: "cover" }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src={fallbackSrc} type="video/mp4" />
        </video>

        {/* Subtle Vignette for High Text Contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/50" />
      </div>

      {/* Floating Audio/Music Toggle Controller */}
      <button
        type="button"
        onClick={toggleAudio}
        aria-label={isMuted ? "Unmute Background Music" : "Mute Background Music"}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/85 hover:bg-slate-900 border border-white/30 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer"
      >
        <span className="relative flex h-3 w-3">
          {!isMuted && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isMuted ? "bg-amber-400" : "bg-emerald-500"}`} />
        </span>
        <span className="text-xs font-semibold tracking-wide">
          {isMuted ? "🔊 Enable Music" : "🎵 Music On"}
        </span>
      </button>
    </>
  );
}
