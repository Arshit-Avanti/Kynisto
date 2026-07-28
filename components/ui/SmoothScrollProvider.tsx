"use client";

import { ReactNode, useEffect, useState } from "react";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    // IntersectionObserver for scroll-reveal sections
    const revealElements = document.querySelectorAll(".scrollReveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
    );

    revealElements.forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="smoothScrollContainer">
      <div
        style={{
          width: `${scrollProgress}%`,
          position: "fixed",
          top: 0,
          left: 0,
          height: "3px",
          backgroundColor: "#2563EB",
          zIndex: 9999,
          transition: "width 0.1s"
        }}
        aria-hidden="true"
      />
      {children}
    </div>
  );
}
