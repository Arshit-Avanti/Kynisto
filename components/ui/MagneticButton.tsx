"use client";

import {
  ButtonHTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  decay: number;
}

export interface MagneticButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  magneticStrength?: number;
  enableSparks?: boolean;
  glowColor?: string;
}

export function MagneticButton({
  children,
  className = "",
  magneticStrength = 0.3,
  enableSparks = true,
  glowColor = "rgba(99, 102, 241, 0.35)",
  onClick,
  ...props
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [innerPosition, setInnerPosition] = useState({ x: 0, y: 0 });
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Spark Palette (indigo, cyan, violet, amber, white)
  const sparkColors = [
    "rgba(147, 197, 253, ", // Cyan/Blue
    "rgba(167, 139, 250, ", // Purple/Violet
    "rgba(244, 114, 182, ", // Pink
    "rgba(251, 191, 36, ",  // Amber/Gold
    "rgba(255, 255, 255, ", // Pure White
  ];

  const renderParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.shadowBlur = 6;
      ctx.shadowColor = `${p.color}0.8)`;
      ctx.fill();
      ctx.restore();
    }

    if (particles.length > 0) {
      animFrameIdRef.current = requestAnimationFrame(renderParticles);
    } else {
      animFrameIdRef.current = null;
    }
  }, []);

  const spawnSparks = useCallback(
    (x: number, y: number, count = 2) => {
      if (!enableSparks) return;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 1.6;
        const colorPrefix = sparkColors[Math.floor(Math.random() * sparkColors.length)];
        const maxAlpha = 0.7 + Math.random() * 0.3;

        particlesRef.current.push({
          id: Math.random(),
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1 + Math.random() * 2.2,
          alpha: maxAlpha,
          color: colorPrefix,
          decay: 0.02 + Math.random() * 0.03,
        });
      }

      if (!animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(renderParticles);
      }
    },
    [enableSparks, renderParticles]
  );

  useEffect(() => {
    const updateCanvasSize = () => {
      const button = buttonRef.current;
      const canvas = canvasRef.current;
      if (button && canvas) {
        const rect = button.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const handleMouseEnter = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const relX = event.clientX - rect.left;
      const relY = event.clientY - rect.top;
      spawnSparks(relX, relY, 4);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = event.clientX - centerX;
    const deltaY = event.clientY - centerY;

    // Pull button towards cursor based on magneticStrength
    const x = deltaX * magneticStrength;
    const y = deltaY * magneticStrength;

    // Inner parallax shift for interactive depth
    const innerX = deltaX * (magneticStrength * 0.35);
    const innerY = deltaY * (magneticStrength * 0.35);

    setPosition({ x, y });
    setInnerPosition({ x: innerX, y: innerY });

    // Calculate relative cursor position inside button
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    const percentX = (relX / rect.width) * 100;
    const percentY = (relY / rect.height) * 100;

    setGlowPos({ x: percentX, y: percentY, opacity: 1 });

    // Spawn trailing spark particles on hover move
    spawnSparks(relX, relY, 1);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smooth return to center with spring easing (cubic-bezier(0.34, 1.56, 0.64, 1))
    setPosition({ x: 0, y: 0 });
    setInnerPosition({ x: 0, y: 0 });
    setGlowPos((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);

    // Burst spark explosion on click
    spawnSparks(x, y, 12);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 650);

    onClick?.(event);
  };

  return (
    <button
      ref={buttonRef}
      className={`magneticButton relative overflow-hidden select-none ${className}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        transition: isHovered
          ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)"
          : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        willChange: "transform",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      {...props}
    >
      {/* Trailing Glowing Cursor Follow Effect */}
      <div
        className="magneticGlow absolute inset-0 pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 90px at ${glowPos.x}% ${glowPos.y}%, ${glowColor} 0%, transparent 80%)`,
          opacity: glowPos.opacity,
          borderRadius: "inherit",
        }}
        aria-hidden="true"
      />

      {/* Particle Spark Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
        aria-hidden="true"
      />

      {/* Inner Content with Parallax */}
      <span
        className="magneticContent relative z-20 inline-flex items-center justify-center gap-2 pointer-events-none"
        style={{
          transform: `translate3d(${innerPosition.x}px, ${innerPosition.y}px, 0)`,
          transition: isHovered
            ? "transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)"
            : "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          willChange: "transform",
        }}
      >
        {children}
      </span>

      {/* Click Ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="buttonRipple absolute pointer-events-none rounded-full bg-white/30 animate-ping-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            transform: "translate(-50%, -50%)",
            width: "120px",
            height: "120px",
          }}
          aria-hidden="true"
        />
      ))}
    </button>
  );
}
