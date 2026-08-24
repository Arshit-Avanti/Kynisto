"use client";

import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  mobileVideoSrc?: string;
}

export function VideoBackground({
  videoSrc = "/videos/hero-flow.mp4",
  mobileVideoSrc = "/videos/hero-flow.mp4",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Modern Autoplay Compliance: defaultMuted and muted MUST be true for instant playback
    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const playVideo = () => {
      if (video.paused) {
        video.play().catch((err) => {
          console.warn("Video play retry:", err);
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplay", playVideo);
    video.addEventListener("pause", playVideo);

    // Initial play trigger
    playVideo();

    // User first interaction trigger (fallback for strict browser policies)
    const handleFirstInteraction = () => {
      playVideo();
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
    };

    window.addEventListener("touchstart", handleFirstInteraction, { passive: true });
    window.addEventListener("click", handleFirstInteraction, { passive: true });
    window.addEventListener("scroll", handleFirstInteraction, { passive: true });

    return () => {
      video.removeEventListener("loadeddata", playVideo);
      video.removeEventListener("canplay", playVideo);
      video.removeEventListener("pause", playVideo);
      window.removeEventListener("touchstart", handleFirstInteraction);
      window.removeEventListener("click", handleFirstInteraction);
      window.removeEventListener("scroll", handleFirstInteraction);
    };
  }, []);

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
      {/* High Performance Native Video Player (Optimized for Vertical Mobile & Full Desktop Coverage) */}
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
        className="absolute inset-0 w-full h-full object-cover opacity-100 scale-105 pointer-events-none mobile-9-16-video-player"
        style={{
          width: "100%",
          height: "100%",
          minWidth: "100vw",
          minHeight: "100dvh",
          objectFit: "cover",
          objectPosition: "center center",
          transform: "translateZ(0)",
          filter: "brightness(1.15) saturate(1.18)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {/* Dedicated 9:16 Mobile Video Source */}
        <source src={mobileVideoSrc} media="(max-width: 768px)" type="video/mp4" />
        <source src={videoSrc} type="video/mp4" />
        <source src="https://labs.google/fx/api/og-video/shared/88984ca4-9c38-4a35-a9ec-a6cf40d41099" type="video/mp4" />
        <source src="/videos/hero-flow.mp4" type="video/mp4" />
        <source src="/videos/drive-hero.mp4" type="video/mp4" />
        <source src="/videos/kynisto-hero.mp4" type="video/mp4" />
        <source src="/videos/background-hero.mp4" type="video/mp4" />
        <source src="/background-hero.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
