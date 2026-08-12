"use client";

import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  mobileVideoSrc?: string;
}

export function VideoBackground({
  videoSrc = "/videos/drive-hero.mp4",
  mobileVideoSrc = "/videos/mobile-9-16-hero.mp4",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    if (!video) return;

    let isIntersecting = true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;

    const syncVideoPlayback = async () => {
      if (!video) return;
      const shouldPlay = isIntersecting && isTabVisible && (typeof document === "undefined" || !document.hidden);
      if (shouldPlay) {
        if (video.paused) {
          try {
            video.muted = true;
            await video.play();
          } catch (err) {
            console.warn("Video background playback resume failed:", err);
          }
        }
      } else {
        if (!video.paused) {
          video.pause();
        }
      }
    };

    let observer: IntersectionObserver | null = null;
    const target = container || video;
    if (typeof IntersectionObserver !== "undefined" && target) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = entry ? entry.isIntersecting : true;
          void syncVideoPlayback();
        },
        { threshold: 0.05 }
      );
      observer.observe(target);
    }

    const handleVisibilityChange = () => {
      isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
      void syncVideoPlayback();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    void syncVideoPlayback();

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
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
        backgroundColor: "#050507",
      }}
    >
      {/* High Performance Native Video Player (Optimized for 9:16 Vertical Mobile & Full-Page Coverage) */}
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
        className="absolute inset-0 w-full h-full object-cover opacity-90 scale-105 filter brightness-105 contrast-105 pointer-events-none mobile-9-16-video-player"
        style={{
          width: "100%",
          height: "100%",
          minWidth: "100vw",
          minHeight: "100dvh",
          objectFit: "cover",
          objectPosition: "center top",
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {/* Dedicated 9:16 Mobile Video Source (Google Drive Video Source for Mobile Only) */}
        <source src={mobileVideoSrc} media="(max-width: 768px)" type="video/mp4" />
        <source src={videoSrc} type="video/mp4" />
        {videoSrc !== "/videos/drive-hero.mp4" && (
          <source src="/videos/drive-hero.mp4" type="video/mp4" />
        )}
        <source src="/videos/kynisto-hero.mp4" type="video/mp4" />
      </video>

      {/* Soft gradient overlay for optimal readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />
    </div>
  );
}

