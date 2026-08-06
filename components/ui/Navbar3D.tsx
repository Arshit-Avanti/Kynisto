"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo, startTransition } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { BackButton } from "@/components/ui/BackButton";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

interface Navbar3DProps {
  userRole: "admin" | "store_owner" | "customer" | null;
  savedCount: number;
  locationLabel?: string;
  onUseLocation?: () => void;
  onOpenCustomize?: () => void;
  mode?: "default" | "services";
}

export function Navbar3D({
  userRole,
  savedCount,
  locationLabel = "Your Locality",
  onUseLocation,
  onOpenCustomize,
  mode = "default",
}: Navbar3DProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const header = headerRef.current;
    let isIntersecting = true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
    let animFrameId: number | null = null;
    let targetRx = 0;
    let targetRy = 0;
    let currentRx = 0;
    let currentRy = 0;

    // Smooth animation loop for 3D tilt interpolation & position updating
    const updateLoop = () => {
      if (!isIntersecting || !isTabVisible || (typeof document !== "undefined" && document.hidden)) {
        stopAnimation();
        return;
      }

      const diffX = targetRx - currentRx;
      const diffY = targetRy - currentRy;

      if (Math.abs(diffX) > 0.005 || Math.abs(diffY) > 0.005) {
        currentRx += diffX * 0.12;
        currentRy += diffY * 0.12;
        setTilt({ rx: currentRx, ry: currentRy });
        animFrameId = requestAnimationFrame(updateLoop);
      } else {
        currentRx = targetRx;
        currentRy = targetRy;
        setTilt({ rx: currentRx, ry: currentRy });
        stopAnimation();
      }
    };

    const startAnimation = () => {
      if (animFrameId === null && isIntersecting && isTabVisible && (typeof document === "undefined" || !document.hidden)) {
        animFrameId = requestAnimationFrame(updateLoop);
      }
    };

    const stopAnimation = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    };

    // Scroll listener with RAF throttling to prevent UI lag
    let scrollTicking = false;
    const handleScroll = () => {
      if (!scrollTicking && isIntersecting && isTabVisible) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          scrollTicking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Mouse movement handler for interactive 3D perspective tilt
    const handleMouseMove = (e: MouseEvent) => {
      if (!header || isMobile || !isIntersecting || !isTabVisible) return;
      const rect = header.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      targetRx = (-mouseY / (rect.height / 2)) * 3; // -3 to 3 deg tilt
      targetRy = (mouseX / (rect.width / 2)) * 3;  // -3 to 3 deg tilt
      startAnimation();
    };

    const handleMouseLeave = () => {
      targetRx = 0;
      targetRy = 0;
      startAnimation();
    };

    if (header) {
      header.addEventListener("mousemove", handleMouseMove);
      header.addEventListener("mouseleave", handleMouseLeave);
    }

    // IntersectionObserver to pause RAF animations when Navbar3D is off-screen
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined" && header) {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = entry ? entry.isIntersecting : true;
          if (isIntersecting) {
            startAnimation();
          } else {
            stopAnimation();
          }
        },
        { threshold: 0.01 }
      );
      observer.observe(header);
    }

    // Tab visibility change listener
    const handleVisibilityChange = () => {
      isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
      if (isTabVisible) {
        startAnimation();
      } else {
        stopAnimation();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      if (header) {
        header.removeEventListener("mousemove", handleMouseMove);
        header.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (observer) {
        observer.disconnect();
      }
      stopAnimation();
    };
  }, [isMobile]);

  const isServicesMode = mode === "services";

  const handleFavoritesClick = useCallback(() => {
    if (userRole !== "customer" && userRole !== "admin") {
      window.location.assign("/login?returnTo=%2Faccount%3Ftab%3Dfavorites");
      return;
    }
    document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
  }, [userRole]);

  const handleToggleMobile = useCallback(() => {
    startTransition(() => {
      setMobileOpen((prev) => !prev);
    });
  }, []);

  const handleCloseMobile = useCallback(() => {
    startTransition(() => {
      setMobileOpen(false);
    });
  }, []);

  const desktopNav = useMemo(() => {
    if (isMobile) return null;
    return (
      <nav aria-label="Main Navigation" style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
        <Link href="/" style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s" }}>Homepage</Link>
        {!isServicesMode && <Link href="/products" style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s" }}>Products</Link>}
        {!isServicesMode && <Link href="/healthcare" style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s" }}>Healthcare</Link>}
        {!isServicesMode && <Link href="/services" style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s" }}>Services</Link>}
        {!isServicesMode && <Link href="/pricing" style={{ color: "#FF7A00", WebkitTextFillColor: "#FF7A00", textDecoration: "none", transition: "all 0.15s", fontWeight: 700 }}>Pricing &amp; Plans</Link>}
        
        <button
          type="button"
          onClick={handleFavoritesClick}
          style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, padding: 0 }}
        >
          <span aria-hidden="true" style={{ color: "#FF5722", marginRight: "4px" }}>♥</span>
          Saved <b style={{ background: "rgba(255, 87, 34, 0.25)", color: "#FF8A00", WebkitTextFillColor: "#FF8A00", border: "1px solid rgba(255, 138, 0, 0.4)", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", marginLeft: "4px" }}>{savedCount}</b>
        </button>

        {!isServicesMode && onOpenCustomize && (
          <button type="button" onClick={onOpenCustomize} style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, padding: 0 }}>
            <span aria-hidden="true" style={{ marginRight: "4px" }}>≡</span>
            Customize
          </button>
        )}
        <ThemeSwitcher size="sm" />
      </nav>
    );
  }, [isMobile, isServicesMode, savedCount, onOpenCustomize, handleFavoritesClick]);

  return (
    <header
      ref={headerRef}
      className={`floating-nav-container ${isScrolled ? "is-scrolled" : ""}`}
      style={{
        transform: `translateX(-50%) perspective(1000px) rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg) translateZ(0)`,
        transition: tilt.rx === 0 && tilt.ry === 0 ? "transform 0.4s ease-out, background 0.3s ease, box-shadow 0.3s ease" : "background 0.3s ease, box-shadow 0.3s ease",
        willChange: "transform",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <BackButton
          fallback="/"
          label="Return"
          style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer" }}
        />
        <Link href="/" aria-label="Kynisto Home" style={{ textDecoration: "none", display: "flex" }}>
          <KynistoLogo showTagline={false} />
        </Link>
        {!isServicesMode && onUseLocation && (
          <button
            type="button"
            aria-label="Use current location"
            onClick={onUseLocation}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 87, 34, 0.12)",
              border: "1px solid rgba(255, 87, 34, 0.35)",
              borderRadius: "12px",
              padding: "6px 12px",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5722", boxShadow: "0 0 10px #FF5722", display: "inline-block" }} aria-hidden="true" />
            <span style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", color: "#FF8A00", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Locality</span>
              <span style={{ fontSize: "13px", color: "#FFFFFF", fontWeight: 700, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>{locationLabel}</span>
            </span>
            <span aria-hidden="true" style={{ fontSize: "10px", color: "#FFFFFF" }}>⌄</span>
          </button>
        )}
      </div>

      {desktopNav}

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {!isMobile && (
          <Link
            href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"}
            style={{
              background: "linear-gradient(135deg, #FF5722 0%, #E53935 100%)",
              color: "white",
              padding: "10px 22px",
              borderRadius: "12px",
              border: "none",
              fontWeight: 700,
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(255, 87, 34, 0.4)",
              textDecoration: "none",
              display: "inline-block",
            }}
          >
            {userRole ? "Dashboard" : "Log in"}
          </Link>
        )}
        
        {isMobile && (
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={handleToggleMobile}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "26px", color: "#FFFFFF", padding: "4px" }}
          >
            ☰
          </button>
        )}
      </div>

      {isMobile && mobileOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "rgba(10, 15, 30, 0.98)", padding: "20px", display: "flex", flexDirection: "column", gap: "18px", borderBottom: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: "0 12px 35px rgba(0, 0, 0, 0.8)", backdropFilter: "blur(20px)" }}>
          <Link href="/" onClick={handleCloseMobile} style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "15px" }}>Homepage</Link>
          <Link href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"} onClick={handleCloseMobile} style={{ color: "#FFFFFF", textDecoration: "none", fontWeight: 700, fontSize: "16px" }}>
            {userRole ? "Dashboard" : "Log in"}
          </Link>
          <Link
            href={userRole === "customer" || userRole === "admin" ? "/account?tab=favorites" : "/login?returnTo=%2Faccount%3Ftab%3Dfavorites"}
            onClick={handleCloseMobile}
            style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "15px" }}
          >
            Saved ({savedCount})
          </Link>
        </div>
      )}
    </header>
  );
}
