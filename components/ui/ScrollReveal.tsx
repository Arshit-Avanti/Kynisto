"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Delay in ms before animation starts after intersection */
  delay?: number;
  /** Which direction to reveal from: "up" | "left" | "right" */
  direction?: "up" | "left" | "right";
  /** How much of the element must be visible (0-1) */
  threshold?: number;
}

export function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  threshold = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            const timer = setTimeout(() => setIsVisible(true), delay);
            return () => clearTimeout(timer);
          }
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold]);

  const hiddenTransform = {
    up: "translateY(60px) rotateX(8deg)",
    left: "translateX(-60px) rotateY(6deg)",
    right: "translateX(60px) rotateY(-6deg)",
  };

  return (
    <div
      ref={ref}
      className={`scrollRevealItem ${isVisible ? "scrollRevealed" : ""} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) rotateX(0deg) rotateY(0deg)" : hiddenTransform[direction],
        transition: `opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: "opacity, transform",
        transformStyle: "preserve-3d",
        perspective: "1200px",
      }}
    >
      {children}
    </div>
  );
}
