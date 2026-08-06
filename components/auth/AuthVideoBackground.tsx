"use client";

import { useEffect, useRef, useState } from "react";
import { audioEngine } from "@/lib/audio-engine";

export function AuthVideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showPhoto, setShowPhoto] = useState(false);
  const playCountRef = useRef(0);
  const hasEndedCurrentLoopRef = useRef(false);
  const showPhotoRef = useRef(false);
  const unregisterVideoRef = useRef<(() => void) | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset loop tracking on mount
    playCountRef.current = 0;
    hasEndedCurrentLoopRef.current = false;
    showPhotoRef.current = false;
    setShowPhoto(false);

    // Set muted = true initially for Android WebView & Chrome Mobile Autoplay Compliance
    video.muted = true;
    video.currentTime = 0;

    // Register with audio engine
    unregisterVideoRef.current = audioEngine.registerVideoElement(video);

    const unsubscribe = audioEngine.subscribe((muted) => {
      if (videoRef.current && !showPhotoRef.current) {
        videoRef.current.muted = muted;
        if (!muted) videoRef.current.volume = 1.0;
      }
    });

    // Attempt video playback (Muted autoplay works 100% on Android WebView & Mobile APKs)
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Autoplay started successfully
          // Unmute if user has interacted or audio engine permits
          if (!audioEngine.isMuted()) {
            video.muted = false;
            video.volume = 1.0;
          }
        })
        .catch((err) => {
          console.warn("Android/Mobile Autoplay policy caught, attempting muted retry:", err);
          video.muted = true;
          video.play().catch(() => {
            // Fallback to photo if video cannot be played
            setShowPhoto(true);
            showPhotoRef.current = true;
          });
        });
    }

    // Safety fallback timer: if video stalls or fails to play on Android WebView within 12 seconds per loop, switch to photo
    fallbackTimerRef.current = setTimeout(() => {
      if (playCountRef.current === 0 && !showPhotoRef.current) {
        console.warn("Video stall timeout, switching to hero photo.");
        setShowPhoto(true);
        showPhotoRef.current = true;
      }
    }, 15000);

    // Visibility & IntersectionObserver tracking for zero-lag background performance
    let isIntersecting = true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;

    const syncPlaybackState = () => {
      const vid = videoRef.current;
      if (!vid || showPhotoRef.current) return;
      const shouldPlay = isIntersecting && isTabVisible && (typeof document === "undefined" || !document.hidden);
      if (shouldPlay) {
        if (vid.paused && playCountRef.current < 2) {
          vid.play().catch(() => {});
        }
      } else {
        if (!vid.paused) {
          vid.pause();
        }
      }
    };

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = entry ? entry.isIntersecting : true;
          syncPlaybackState();
        },
        { threshold: 0.05 }
      );
      observer.observe(video);
    }

    const handleVisibilityChange = () => {
      isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
      syncPlaybackState();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      unsubscribe();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (observer) {
        observer.disconnect();
      }
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (unregisterVideoRef.current) {
        unregisterVideoRef.current();
        unregisterVideoRef.current = null;
      }
    };
  }, []);

  const handleEnded = () => {
    if (showPhotoRef.current) return;

    playCountRef.current += 1;
    console.log(`Video Loop completed: ${playCountRef.current} of 2`);

    if (playCountRef.current >= 2) {
      // Completed exactly 2 plays -> Switch to Photo
      setShowPhoto(true);
      showPhotoRef.current = true;

      if (unregisterVideoRef.current) {
        unregisterVideoRef.current();
        unregisterVideoRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.muted = true;
      }
      audioEngine.setMuted(true);
    } else if (videoRef.current) {
      // Loop 1 finished -> Replay for Loop 2
      hasEndedCurrentLoopRef.current = false;
      videoRef.current.currentTime = 0;
      const replayPromise = videoRef.current.play();
      if (replayPromise !== undefined) {
        replayPromise.catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {
              setShowPhoto(true);
              showPhotoRef.current = true;
            });
          }
        });
      }
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || showPhotoRef.current || !video.duration) return;

    // Detect loop end 0.3s before actual duration end for smooth cross-browser transition
    if (video.currentTime >= video.duration - 0.3 && !hasEndedCurrentLoopRef.current) {
      hasEndedCurrentLoopRef.current = true;
      handleEnded();
    }
  };

  const handleVideoError = () => {
    console.warn("Video playback error on Android/APK, falling back to photo.");
    setShowPhoto(true);
    showPhotoRef.current = true;
  };

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", background: "#000" }}>
      {/* Background Photo - Displays after video finishes 2 loops or on video error */}
      <img
        src="/JGGL.jpg"
        alt="Kynisto Hero"
        onError={(e) => {
          // Fallback to absolute Worker CDN URL if relative path fails
          (e.target as HTMLImageElement).src = "https://kynisto.nxt-arshit.workers.dev/JGGL.jpg";
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 25%",
          zIndex: 1,
          opacity: showPhoto ? 1 : 0,
          transition: "opacity 1s ease-in-out",
          filter: "none",
          transform: "translateZ(0)",
          imageRendering: "crisp-edges",
          WebkitFontSmoothing: "antialiased",
        }}
      />

      {/* Video Element - Mobile & Android APK Autoplay Compliant */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        // @ts-expect-error - Webkit & Android X5 WebView inline attributes
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        preload="auto"
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        className="authStoryVideo"
        aria-label="Google Flow Video Background"
        style={{
          pointerEvents: "none",
          zIndex: 2,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center 25%",
          opacity: showPhoto ? 0 : 1,
          transition: "opacity 1s ease-in-out",
          filter: "none",
          transform: "translateZ(0)",
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          imageRendering: "crisp-edges",
        }}
      >
        <source src="/videos/google-flow-7cc84028.mp4" type="video/mp4" />
        <source src="/videos/login-bg.mp4" type="video/mp4" />
        <source
          src="https://labs.google/fx/api/og-video/shared/7cc84028-5f5d-4f7a-832d-370eff8a3abc"
          type="video/mp4"
        />
      </video>
    </div>
  );
}
