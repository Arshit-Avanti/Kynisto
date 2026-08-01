"use client";

import React, { useEffect, useRef } from "react";

export function ShaderCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    let time = 0;

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, width, height);

      // Create ambient fluid shader gradient blobs
      const x1 = width * 0.3 + Math.sin(time) * 120;
      const y1 = height * 0.2 + Math.cos(time * 0.8) * 100;
      const r1 = Math.min(width, height) * 0.5;

      const grad1 = ctx.createRadialGradient(x1, y1, 0, x1, y1, r1);
      const isDark = document.documentElement.classList.contains("mode-dark") || document.documentElement.classList.contains("dark-theme");

      if (isDark) {
        grad1.addColorStop(0, "rgba(255, 87, 34, 0.15)");
        grad1.addColorStop(0.5, "rgba(99, 102, 241, 0.08)");
        grad1.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        grad1.addColorStop(0, "rgba(255, 87, 34, 0.12)");
        grad1.addColorStop(0.5, "rgba(59, 130, 246, 0.08)");
        grad1.addColorStop(1, "rgba(248, 250, 252, 0)");
      }

      ctx.fillStyle = grad1;
      ctx.fillRect(0, 0, width, height);

      const x2 = width * 0.7 + Math.cos(time * 0.6) * 140;
      const y2 = height * 0.6 + Math.sin(time * 0.9) * 110;
      const r2 = Math.min(width, height) * 0.6;

      const grad2 = ctx.createRadialGradient(x2, y2, 0, x2, y2, r2);
      if (isDark) {
        grad2.addColorStop(0, "rgba(139, 92, 246, 0.12)");
        grad2.addColorStop(0.5, "rgba(236, 72, 153, 0.06)");
        grad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      } else {
        grad2.addColorStop(0, "rgba(99, 102, 241, 0.08)");
        grad2.addColorStop(0.5, "rgba(16, 185, 129, 0.06)");
        grad2.addColorStop(1, "rgba(248, 250, 252, 0)");
      }

      ctx.fillStyle = grad2;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-80"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}
