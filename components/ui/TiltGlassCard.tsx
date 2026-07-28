"use client";

import { ReactNode, useRef, useState, useCallback } from "react";

interface TiltGlassCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: string;
  /** Enable glassmorphism reflection streak */
  reflection?: boolean;
}

export function TiltGlassCard({
  children,
  className = "",
  maxTilt = 14,
  glowColor = "rgba(34, 197, 94, 0.35)",
  reflection = true,
}: TiltGlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState("");
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });
  const [reflectionPos, setReflectionPos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [depthShadow, setDepthShadow] = useState("");

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;

      // Directional depth shadow
      const shadowX = -rotateY * 1.5;
      const shadowY = rotateX * 1.5;

      setIsHovered(true);
      setTransformStyle(
        `perspective(1200px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.03, 1.03, 1.03) translateZ(8px)`
      );
      setGlowPos({ x: percentX, y: percentY, opacity: 1 });
      setReflectionPos({ x: percentX, y: percentY });
      setDepthShadow(
        `${shadowX.toFixed(1)}px ${shadowY.toFixed(1)}px 30px rgba(0, 0, 0, 0.35), 0 20px 60px rgba(0, 0, 0, 0.2)`
      );
    },
    [maxTilt]
  );

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTransformStyle(
      "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1) translateZ(0px)"
    );
    setGlowPos((prev) => ({ ...prev, opacity: 0 }));
    setDepthShadow("");
  }, []);

  return (
    <div
      ref={cardRef}
      className={`tiltGlassCard ${className}`}
      style={{
        position: "relative",
        transform: transformStyle,
        transition: isHovered
          ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)"
          : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.6s ease",
        willChange: "transform",
        transformStyle: "preserve-3d",
        boxShadow: depthShadow || "0 4px 20px rgba(0, 0, 0, 0.15)",
        borderRadius: "16px",
        overflow: "hidden",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cursor-follow glow */}
      <div
        className="tiltGlassGlow"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: `radial-gradient(circle at ${glowPos.x}% ${glowPos.y}%, ${glowColor} 0%, transparent 65%)`,
          opacity: glowPos.opacity,
          transition: "opacity 0.3s ease",
          borderRadius: "inherit",
        }}
        aria-hidden="true"
      />

      {/* Glassmorphism reflection streak */}
      {reflection && (
        <div
          className="tiltGlassReflection"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            pointerEvents: "none",
            background: `linear-gradient(${105 + (reflectionPos.x - 50) * 0.5}deg, transparent 30%, rgba(255, 255, 255, 0.08) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.08) 55%, transparent 70%)`,
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.3s ease",
            borderRadius: "inherit",
          }}
          aria-hidden="true"
        />
      )}

      {/* Luminous border */}
      <div
        className="tiltGlassBorder"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 3,
          pointerEvents: "none",
          borderRadius: "inherit",
          border: isHovered
            ? "1px solid rgba(34, 197, 94, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.08)",
          transition: "border-color 0.3s ease",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="tiltGlassContent" style={{ position: "relative", zIndex: 4 }}>
        {children}
      </div>
    </div>
  );
}
