"use client";

import { useEffect, useRef } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
}

export function VideoBackground({
  videoSrc = "/videos/drive-hero.mp4",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        video.muted = true;
        await video.play();
      } catch (err) {
        console.warn("Video background autoplay failed:", err);
      }
    };

    void playVideo();
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-[-1] bg-[#050507]">
      {/* High Performance Native Video Player */}
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
        className="absolute inset-0 w-full h-full object-cover opacity-85 scale-105 filter brightness-105 contrast-105 pointer-events-none"
        style={{
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
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

