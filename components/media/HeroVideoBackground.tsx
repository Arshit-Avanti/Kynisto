"use client";

import { useEffect, useRef, useState } from "react";

interface HeroVideoBackgroundProps {
  videoSrc?: string;
  fallbackSrc?: string;
}

export function HeroVideoBackground({
  videoSrc = "/videos/hero-flow.mp4",
  fallbackSrc = "https://labs.google/fx/api/og-video/shared/88984ca4-9c38-4a35-a9ec-a6cf40d41099",
}: HeroVideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.defaultMuted = true;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;

    if (video.src !== videoSrc && !video.src.endsWith(videoSrc)) {
      video.src = videoSrc;
      video.load();
    }

    const handleLoaded = () => {
      setIsLoaded(true);
      video.play().catch(() => {
        video.muted = true;
        video.play().catch(() => {});
      });
    };

    video.addEventListener("loadeddata", handleLoaded);
    video.addEventListener("canplay", handleLoaded);
    video.addEventListener("playing", () => setIsLoaded(true));

    video.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });

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
      video.removeEventListener("loadeddata", handleLoaded);
      video.removeEventListener("canplay", handleLoaded);
      window.removeEventListener("touchstart", triggerPlay);
      window.removeEventListener("click", triggerPlay);
      window.removeEventListener("scroll", triggerPlay);
    };
  }, [videoSrc]);

  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 hero-scoped-video-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    >
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
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          transform: "scale(1.03) translateZ(0)",
          filter: "brightness(1.15) saturate(1.18)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          opacity: isLoaded ? 1 : 0.85,
          transition: "opacity 0.6s ease",
        }}
      >
        <source src={videoSrc} type="video/mp4" />
        <source src="/videos/google-flow-88984ca4.mp4" type="video/mp4" />
        <source src={fallbackSrc} type="video/mp4" />
      </video>
    </div>
  );
}
