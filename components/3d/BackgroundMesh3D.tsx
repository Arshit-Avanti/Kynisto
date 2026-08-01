"use client";

import { useEffect, useRef } from "react";

export function BackgroundMesh3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const blobs = [
      { x: width * 0.2, y: height * 0.3, r: 350, vx: 0.4, vy: 0.3, color: "rgba(37, 99, 235, 0.06)" },
      { x: width * 0.8, y: height * 0.2, r: 400, vx: -0.3, vy: 0.4, color: "rgba(20, 184, 166, 0.04)" },
      { x: width * 0.5, y: height * 0.8, r: 450, vx: 0.2, vy: -0.3, color: "rgba(245, 158, 11, 0.03)" },
    ];

    let time = 0;

    const render = () => {
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

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="bgMeshContainer" aria-hidden="true" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} className="bgMeshCanvas" style={{ backgroundColor: 'transparent' }} />
      <div className="bgNoiseOverlay" />
    </div>
  );
}
