"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollSyncedVideoBackgroundProps {
  desktopSrc?: string;
  mobileSrc?: string;
  overlayOpacity?: number;
}

export function ScrollSyncedVideoBackground({
  desktopSrc = "/videos/drive-hero.mp4",
  mobileSrc = "/videos/mobile-9-16-hero.mp4",
  overlayOpacity = 0.55,
}: ScrollSyncedVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check screen orientation / width for mobile video
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.pause();

    const onLoadedMetadata = () => {
      setIsReady(true);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);

    let animationFrameId: number;
    let targetTime = 0;
    let currentTime = 0;

    const updateScrollSync = () => {
      if (video.duration && !isNaN(video.duration)) {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const scrollRatio = Math.min(1, Math.max(0, scrollTop / maxScroll));

        targetTime = scrollRatio * video.duration;

        // Smooth Lerp damping for silky scrubbing
        currentTime += (targetTime - currentTime) * 0.12;

        if (Math.abs(video.currentTime - currentTime) > 0.02) {
          if ("fastSeek" in video && typeof (video as any).fastSeek === "function") {
            (video as any).fastSeek(currentTime);
          } else {
            video.currentTime = currentTime;
          }
        }
      }

      animationFrameId = requestAnimationFrame(updateScrollSync);
    };

    animationFrameId = requestAnimationFrame(updateScrollSync);

    return () => {
      cancelAnimationFrame(animationFrameId);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [isMobile]);

  return (
    <div
      className="scrollVideoBackgroundContainer"
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        backgroundColor: "#f8fafc",
      }}
    >
      <video
        ref={videoRef}
        src={isMobile ? mobileSrc : desktopSrc}
        preload="auto"
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          opacity: isReady ? 1 : 0,
          transition: "opacity 0.8s ease",
          filter: "brightness(1.05) contrast(1.02) saturate(1.1)",
        }}
      />

      {/* Clean Light Mode Adaptive Frosted Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(248, 250, 252, 0.72) 0%, rgba(248, 250, 252, 0.52) 40%, rgba(248, 250, 252, 0.82) 100%)`,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Subtle Cyan and Indigo Ambient Edge Glows */}
      <div
        style={{
          position: "absolute",
          top: "-10vw",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60vw",
          height: "30vw",
          background: "radial-gradient(ellipse at center, rgba(2, 132, 199, 0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}
