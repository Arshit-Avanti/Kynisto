"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";

/**
 * CinematicTransition — Wraps page content with Apple-style fluid morph transitions.
 * Elements smoothly fade and translate between route changes.
 */

interface CinematicTransitionProps {
  children: ReactNode;
  /** Unique key tied to the current route/page */
  routeKey?: string;
}

export function CinematicTransition({
  children,
  routeKey = "default",
}: CinematicTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentKey, setCurrentKey] = useState(routeKey);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (routeKey !== currentKey) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setCurrentKey(routeKey);
        setDisplayChildren(children);
        setIsTransitioning(false);
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setDisplayChildren(children);
    }
  }, [routeKey, children, currentKey]);

  return (
    <div
      className="cinematicTransitionWrap"
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning
          ? "translateY(12px) scale(0.995)"
          : "translateY(0) scale(1)",
        transition:
          "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        willChange: "opacity, transform",
      }}
    >
      {displayChildren}
    </div>
  );
}

/**
 * CinematicLoader — Used as a legacy wrapper, now delegates to KynistoSplash
 */
export function CinematicLoader({ onComplete }: { onComplete?: () => void }) {
  useEffect(() => {
    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  return null;
}
