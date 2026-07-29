"use client";

import { useEffect, useRef, useState } from "react";

interface VideoBackgroundProps {
  videoSrc?: string;
}

export function VideoBackground({
  videoSrc = "https://assets.mixkit.co/videos/preview/mixkit-abstract-fast-lines-of-light-31464-large.mp4",
}: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playVideo = async () => {
      try {
        video.muted = true;
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Autoplay check:", err);
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

    if (!nextMuted) {
      try {
        video.volume = 0.8;
        await video.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio play failed:", err);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 w-screen h-screen overflow-hidden pointer-events-none z-[-1] bg-[#0b0a10]">
        {/* Dynamic Video Element */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen scale-105 filter brightness-110 contrast-125"
        >
          <source src={videoSrc} type="video/mp4" />
          <source src="https://assets.mixkit.co/videos/preview/mixkit-flowing-tunnel-of-colored-light-31460-large.mp4" type="video/mp4" />
        </video>
      </div>
    </>
  );
}
