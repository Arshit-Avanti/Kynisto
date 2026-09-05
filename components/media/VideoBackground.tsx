"use client";

import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
  mobileVideoSrc?: string;
}

export function VideoBackground({
  videoSrc = "/videos/hero-flow.mp4",
  mobileVideoSrc = "/videos/hero-flow-mobile.mp4",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(true); // Default true on SSR to avoid heavy video spin-up

  useEffect(() => {
    // Detect mobile device, Android WebView (APK), iOS, or touch device
    const checkMobile = () => {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "";
      const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
      const isSmallScreen = typeof window !== "undefined" && window.innerWidth < 1024;
      const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|wv|Cordova|Capacitor/i.test(ua);
      setIsMobile(isSmallScreen || isMobileUA || isTouch);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const playVideo = () => {
      if (video.paused) {
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => {});
        });
      }
    };

    video.addEventListener("loadeddata", playVideo);
    video.addEventListener("canplay", playVideo);
    video.addEventListener("pause", playVideo);

    playVideo();

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
  }, [isMobile]);

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
        backgroundImage: "url('/images/hero-flow-poster.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center center",
        backgroundColor: "#0284c7",
      }}
    >
      {/* High Performance Native Video Player on Desktop Only: 0% CPU on mobile/APKs */}
      {!isMobile && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          poster="/images/hero-flow-poster.webp"
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
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="/videos/hero-flow-fast.mp4" type="video/mp4" />
          <source src="/videos/hero-flow.mp4" type="video/mp4" />
        </video>
      )}
    </div>
  );
}
