"use client";

import { useEffect, useRef } from "react";

export function BackgroundMesh3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrameId = 0;
    let isVisible = true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const handleVisibilityChange = () => {
      isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
      if (isTabVisible && isVisible && !animationFrameId) {
        render();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    const blobs = [
      { x: width * 0.2, y: height * 0.3, r: 350, vx: 0.4, vy: 0.3, color: "rgba(37, 99, 235, 0.06)" },
      { x: width * 0.8, y: height * 0.2, r: 400, vx: -0.3, vy: 0.4, color: "rgba(20, 184, 166, 0.04)" },
      { x: width * 0.5, y: height * 0.8, r: 450, vx: 0.2, vy: -0.3, color: "rgba(245, 158, 11, 0.03)" },
    ];

    let time = 0;

    const render = () => {
      if (!isVisible || !isTabVisible || (typeof document !== "undefined" && document.hidden)) {
        animationFrameId = 0;
        return;
      }
      animationFrameId = requestAnimationFrame(render);
      time += 0.005;

      context.clearRect(0, 0, width, height);

      // Render smooth glowing radial blobs
      blobs.forEach((blob, i) => {
        blob.x += Math.sin(time + i) * blob.vx * 2;
        blob.y += Math.cos(time * 0.8 + i) * blob.vy * 2;

        const gradient = context.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.r,
        );
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(248, 250, 252, 0)");

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(blob.x, blob.y, blob.r, 0, Math.PI * 2);
        context.fill();
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible && isTabVisible && !animationFrameId) {
            render();
          }
        });
      },
      { threshold: 0.01 }
    );
    observer.observe(canvas);

    render();

    return () => {
      observer.disconnect();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="bgMeshContainer" aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none', transform: 'translateZ(0)' }}>
      <canvas ref={canvasRef} className="bgMeshCanvas" style={{ backgroundColor: 'transparent', transform: 'translateZ(0)', willChange: 'transform' }} />
      <div className="bgNoiseOverlay" />
    </div>
  );
}
