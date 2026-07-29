"use client";

import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  fallbackSrc?: string;
}

export function VideoBackground({
  videoSrc = "https://labs.google/fx/tools/flow/shared/video/38057267-b41f-4b8a-86a0-131e8d6be890",
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
        console.warn("Autoplay policy check:", err);
      }
    };

    void playVideo();
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
      {/* Full-Page Background Video Container with Google Labs Flow Video */}
      <div className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-[-1] bg-[#140A0C]">
        <iframe
          src="https://labs.google/fx/tools/flow/shared/video/38057267-b41f-4b8a-86a0-131e8d6be890?autoplay=1&muted=1&controls=0&loop=1"
          title="Google Flow Background Video"
          className="absolute inset-0 w-full h-full border-0 pointer-events-none scale-125 opacity-85"
          style={{ width: "100vw", height: "100vh", objectFit: "cover" }}
          allow="autoplay; fullscreen"
        />

        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
          style={{ width: "100vw", height: "100vh", objectFit: "cover" }}
        >
          <source src={fallbackSrc} type="video/mp4" />
          <source src={videoSrc} type="video/mp4" />
        </video>

        {/* Soft Ambient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#140A0C]/40 via-transparent to-[#140A0C]/70" />
      </div>

      {/* Floating Audio Toggle */}
      <button
        type="button"
        onClick={toggleAudio}
        aria-label={isMuted ? "Unmute Background Music" : "Mute Background Music"}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-900 border border-orange-500/40 text-white shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <span className="relative flex h-3 w-3">
          {!isMuted && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isMuted ? "bg-amber-400" : "bg-emerald-500"}`} />
        </span>
        <span className="text-xs font-semibold tracking-wide">
          {isMuted ? "🔊 Google Flow Audio" : "🎵 Music On"}
        </span>
      </button>
    </>
  );
}
