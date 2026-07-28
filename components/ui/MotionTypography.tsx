"use client";

import { useEffect, useRef, useState } from "react";

export function MotionHeading({
  text,
  tag = "h1",
  className = "",
}: {
  text: string;
  tag?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const words = text.split(" ");
  const Tag = tag;

  return (
    <Tag className={`motionHeading ${className}`}>
      {words.map((word, wIdx) => (
        <span key={wIdx} className="motionWord">
          {word.split("").map((char, cIdx) => (
            <span
              key={cIdx}
              className="motionChar"
              style={{ animationDelay: `${(wIdx * 5 + cIdx) * 0.03}s` }}
            >
              {char}
            </span>
          ))}
          &nbsp;
        </span>
      ))}
    </Tag>
  );
}

export function AnimatedCounter({
  target,
  suffix = "",
  duration = 1800,
}: {
  target: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    let startTime: number | null = null;
    let animationFrameId: number;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        const step = (timestamp: number) => {
          if (!startTime) startTime = timestamp;
          const progress = Math.min((timestamp - startTime) / duration, 1);
          // Ease-out cubic formula
          const current = Math.floor((1 - Math.pow(1 - progress, 3)) * target);
          setCount(current);

          if (progress < 1) {
            animationFrameId = requestAnimationFrame(step);
          }
        };

        animationFrameId = requestAnimationFrame(step);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, duration]);

  return (
    <span ref={counterRef} className="animatedCounter">
      {count}
      {suffix}
    </span>
  );
}
