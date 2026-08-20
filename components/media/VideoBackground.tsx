"use client";

import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  mobileVideoSrc?: string;
}

export function VideoBackground({
  videoSrc = "/videos/kynisto-hero.mp4",
  mobileVideoSrc = "/videos/kynisto-hero.mp4",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Detect mobile viewport
    const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;
    const activeSrc = isMobile ? (mobileVideoSrc || "/videos/kynisto-hero.mp4") : videoSrc;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;

    // Direct src assignment ensures instant decoding without source-tag stalling
    if (video.src !== activeSrc && !video.src.endsWith(activeSrc)) {
      video.src = activeSrc;
      video.load();
    }

    const playVideo = () => {
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    };

    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplay", playVideo);

    // Force play immediately
    playVideo();

    // Fallback user interaction triggers
    const triggerPlay = () => {
      if (video.paused) {
        video.play().catch(() => {});
      }
      window.removeEventListener("touchstart", triggerPlay);
      window.removeEventListener("click", triggerPlay);
      window.removeEventListener("scroll", triggerPlay);
    };

    window.addEventListener("touchstart", triggerPlay, { passive: true });
    window.addEventListener("click", triggerPlay, { passive: true });
    window.addEventListener("scroll", triggerPlay, { passive: true });

    return () => {
      video.removeEventListener("loadeddata", playVideo);
      video.removeEventListener("canplay", playVideo);
      window.removeEventListener("touchstart", triggerPlay);
      window.removeEventListener("click", triggerPlay);
      window.removeEventListener("scroll", triggerPlay);
    };
  }, [videoSrc, mobileVideoSrc]);

  return (
    <div
      className="fixed inset-0 w-full h-full min-h-[100dvh] overflow-hidden pointer-events-none z-[-1] mobile-9-16-video-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        minHeight: "100dvh",
        zIndex: -1,
        pointerEvents: "none",
        background: "transparent",
        backgroundColor: "transparent",
      }}
    >
      {/* High-Resolution Live Cinematic Video Wallpaper (100% Exposed & Fully Visible) */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        // @ts-expect-error - Webkit & Android X5 WebView inline attributes
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none mobile-9-16-video-player"
        style={{
          width: "100%",
          height: "100%",
          minWidth: "100vw",
          minHeight: "100dvh",
          objectFit: "cover",
          objectPosition: "center center",
          transform: "scale(1.02) translateZ(0)",
          filter: "brightness(1.15) contrast(1.05) saturate(1.1)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          opacity: 1,
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        <source src="/videos/kynisto-hero.mp4" type="video/mp4" />
        <source src="/videos/google-flow-38057267.mp4" type="video/mp4" />
        <source src="/videos/google-flow-7cc84028.mp4" type="video/mp4" />
      </video>

      {/* Crystal-clear minimal overlay — zero dark solid screen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, transparent 50%, rgba(0,0,0,0.12) 100%)",
        }}
      />
    </div>
  );
}
