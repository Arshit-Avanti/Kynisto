"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, Layers } from "lucide-react";

interface ScrollSyncedVideoBackgroundProps {
  desktopSrc?: string;
  mobileSrc?: string;
  overlayOpacity?: number;
}

const FLOW_VIDEOS = [
  { id: "flow-1", label: "Gemini Flow Horizon", src: "/videos/google-flow-7cc84028.mp4" },
  { id: "flow-2", label: "Google Kinetic Stream", src: "/videos/google-flow-38057267.mp4" },
  { id: "cyber-1", label: "Cyber Highway", src: "/videos/drive-hero.mp4" },
];

export function ScrollSyncedVideoBackground({
  desktopSrc = "/videos/google-flow-7cc84028.mp4",
  mobileSrc = "/videos/google-flow-38057267.mp4",
  overlayOpacity = 0.55,
}: ScrollSyncedVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeVideo, setActiveVideo] = useState(desktopSrc);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && activeVideo === desktopSrc) {
        setActiveVideo(mobileSrc);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile, { passive: true });
    return () => window.removeEventListener("resize", checkMobile);
  }, [desktopSrc, mobileSrc, activeVideo]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;

    const onLoadedMetadata = () => {
      setIsReady(true);
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);

    let animationFrameId: number;
    let targetTime = 0;
    let currentTime = 0;
    let lastScrollY = window.scrollY;
    let isScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const handleScrollEvent = () => {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 150);
    };

    window.addEventListener("scroll", handleScrollEvent, { passive: true });

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
      window.removeEventListener("scroll", handleScrollEvent);
      clearTimeout(scrollTimeout);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, [activeVideo]);

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
        key={activeVideo}
        src={activeVideo}
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
          filter: "brightness(1.04) contrast(1.02) saturate(1.15)",
        }}
      />

      {/* Clean Light Mode Adaptive Frosted Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, rgba(248, 250, 252, 0.72) 0%, rgba(248, 250, 252, 0.48) 40%, rgba(248, 250, 252, 0.84) 100%)`,
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
        }}
      />

      {/* Subtle Gemini Flow Holographic Aura */}
      <div
        style={{
          position: "absolute",
          top: "-10vw",
          left: "50%",
          transform: "translateX(-50%)",
          width: "60vw",
          height: "30vw",
          background: "radial-gradient(ellipse at center, rgba(2, 132, 199, 0.12) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
    </div>
  );
}
