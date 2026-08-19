"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo, startTransition } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { BackButton } from "@/components/ui/BackButton";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

import { RoleSwitcherButton } from "@/components/auth/RoleSwitcherButton";

interface Navbar3DProps {
  userRole: "admin" | "store_owner" | "customer" | null;
  savedCount: number;
  locationLabel?: string;
  onUseLocation?: () => void;
  onOpenCustomize?: () => void;
  mode?: "default" | "services" | "pricing";
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

    // Smooth animation loop for 3D tilt interpolation directly on DOM element for lag-free performance (<20ms)
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
        if (headerRef.current) {
          headerRef.current.style.transform = `translateX(-50%) perspective(1000px) rotateX(${currentRx.toFixed(2)}deg) rotateY(${currentRy.toFixed(2)}deg) translateZ(0)`;
        }
        animFrameId = requestAnimationFrame(updateLoop);
      } else {
        currentRx = targetRx;
        currentRy = targetRy;
        if (headerRef.current) {
          headerRef.current.style.transform = `translateX(-50%) perspective(1000px) rotateX(${currentRx.toFixed(2)}deg) rotateY(${currentRy.toFixed(2)}deg) translateZ(0)`;
        }
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
  const isPricingMode = mode === "pricing";
  const isRestrictedMode = isServicesMode || isPricingMode;

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
    const navColor = "#FFFFFF";
    return (
      <nav aria-label="Main Navigation" style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", fontWeight: 700, color: navColor }}>
        <Link href="/" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Homepage</Link>
        {!isRestrictedMode && <Link href="/products" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Products</Link>}
        {!isRestrictedMode && <Link href="/healthcare" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Healthcare</Link>}
        {!isRestrictedMode && <Link href="/services" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Services</Link>}
        {!isRestrictedMode && <Link href="/pricing" style={{ color: "#FF7A00", WebkitTextFillColor: "#FF7A00", textDecoration: "none", transition: "all 0.15s", fontWeight: 700 }}>👑 Kynisto Membership</Link>}
        
        {(!isPricingMode) && (
          <button
            type="button"
            onClick={handleFavoritesClick}
            style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, padding: 0 }}
          >
            <span aria-hidden="true" style={{ color: "#FF5722", marginRight: "4px" }}>♥</span>
            Saved <b style={{ background: "rgba(255, 87, 34, 0.25)", color: "#FF8A00", WebkitTextFillColor: "#FF8A00", border: "1px solid rgba(255, 138, 0, 0.4)", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", marginLeft: "4px" }}>{savedCount}</b>
          </button>
        )}

        {!isRestrictedMode && onOpenCustomize && (
          <button type="button" onClick={onOpenCustomize} style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, padding: 0 }}>
            <span aria-hidden="true" style={{ marginRight: "4px" }}>≡</span>
            Customize
          </button>
        )}
        <ThemeSwitcher size="sm" />
      </nav>
    );
  }, [isMobile, isRestrictedMode, isPricingMode, savedCount, onOpenCustomize, handleFavoritesClick]);

  return (
    <header
      ref={headerRef}
      className={`floating-nav-container ${isScrolled ? "is-scrolled" : ""}`}
      style={{
        transform: "translateX(-50%) perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)",
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
        {!isRestrictedMode && onUseLocation && (
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

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {!isMobile && userRole && (
          <RoleSwitcherButton currentRole={userRole} />
        )}
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
            {userRole === "admin" ? "Admin Panel" : userRole === "store_owner" ? "Owner Dashboard" : userRole === "customer" ? "My Account" : "Log in"}
          </Link>
        )}
        
        {isMobile && (
          <button
            type="button"
            className="mobileNavBtn"
            aria-label="Open Kynisto navigation"
            aria-expanded={mobileOpen}
            onClick={handleToggleMobile}
            style={{
              position: "relative",
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: "4px",
              width: "42px",
              height: "42px",
              padding: "8px",
              background: "rgba(255, 255, 255, 0.12)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "12px",
              cursor: "pointer",
              color: "#FFFFFF",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
              pointerEvents: "auto",
            }}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <>
                <span style={{ width: "18px", height: "2px", background: "#FFFFFF", borderRadius: "2px", display: "block" }} />
                <span style={{ width: "18px", height: "2px", background: "#FFFFFF", borderRadius: "2px", display: "block" }} />
                <span style={{ width: "18px", height: "2px", background: "#FFFFFF", borderRadius: "2px", display: "block" }} />
              </>
            )}
          </button>
        )}
      </div>

      {isMobile && mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
          className="mobileNavDrawer"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 99999,
            background: "rgba(10, 15, 30, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            display: "flex",
            flexDirection: "column",
            padding: "20px 20px 32px 20px",
            overflowY: "auto",
            boxSizing: "border-box",
            color: "#FFFFFF",
            WebkitTextFillColor: "#FFFFFF",
          }}
        >
          {/* Header row inside mobile drawer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <Link href="/" onClick={handleCloseMobile} style={{ textDecoration: "none", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              <KynistoLogo showTagline={false} />
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={handleCloseMobile}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Locality Selector Pill in Drawer */}
          {onUseLocation && (
            <button
              type="button"
              onClick={() => {
                onUseLocation();
                handleCloseMobile();
              }}
              className="drawerCard"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, rgba(255, 87, 34, 0.16) 0%, rgba(255, 138, 0, 0.12) 100%)",
                border: "1px solid rgba(255, 87, 34, 0.4)",
                borderRadius: "16px",
                padding: "12px 16px",
                marginBottom: "20px",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5722", boxShadow: "0 0 10px #FF5722", display: "inline-block" }} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "10px", color: "#FF8A00", WebkitTextFillColor: "#FF8A00", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Locality</span>
                  <span style={{ fontSize: "14px", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", fontWeight: 700 }}>{locationLabel}</span>
                </div>
              </div>
              <span style={{ fontSize: "13px", color: "#FF5722", WebkitTextFillColor: "#FF5722", fontWeight: 700 }}>Change 📍</span>
            </button>
          )}

          {/* Navigation Links list */}
          <nav style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            <Link
              href="/"
              onClick={handleCloseMobile}
              className="drawerCard drawerLink"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Homepage</span>
              <span style={{ opacity: 0.5, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>→</span>
            </Link>

            <Link
              href="/products"
              onClick={handleCloseMobile}
              className="drawerCard drawerLink"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Products</span>
              <span style={{ opacity: 0.5, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>→</span>
            </Link>

            <Link
              href="/healthcare"
              onClick={handleCloseMobile}
              className="drawerCard drawerLink"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Healthcare</span>
              <span style={{ opacity: 0.5, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>→</span>
            </Link>

            <Link
              href="/services"
              onClick={handleCloseMobile}
              className="drawerCard drawerLink"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Services</span>
              <span style={{ opacity: 0.5, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>→</span>
            </Link>

            <Link
              href="/pricing"
              onClick={handleCloseMobile}
              className="drawerCard drawerLink"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 122, 0, 0.12)",
                border: "1px solid rgba(255, 122, 0, 0.4)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>👑 Kynisto Membership</span>
              <span>⚡</span>
            </Link>

            <Link
              href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"}
              onClick={handleCloseMobile}
              className="drawerCard drawerLink"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #FF5722 0%, #E53935 100%)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 700,
                boxShadow: "0 4px 16px rgba(255, 87, 34, 0.4)",
                marginTop: "6px",
              }}
            >
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                {userRole === "admin" ? "Admin Panel" : userRole === "store_owner" ? "Owner Dashboard" : userRole === "customer" ? "My Account" : "Dashboard / Log in"}
              </span>
              <span>👤</span>
            </Link>

            {userRole && (
              <div style={{ margin: "4px 0" }}>
                <RoleSwitcherButton currentRole={userRole} style={{ width: "100%", justifyContent: "center" }} />
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                handleFavoritesClick();
                handleCloseMobile();
              }}
              className="drawerCard drawerLink"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                <span style={{ color: "#FF5722", WebkitTextFillColor: "#FF5722" }}>♥</span> Saved Places
              </span>
              <b style={{ background: "rgba(255, 87, 34, 0.25)", color: "#FF8A00", WebkitTextFillColor: "#FF8A00", border: "1px solid rgba(255, 138, 0, 0.4)", padding: "2px 10px", borderRadius: "12px", fontSize: "12px" }}>
                {savedCount}
              </b>
            </button>

            {onOpenCustomize && (
              <button
                type="button"
                onClick={() => {
                  onOpenCustomize();
                  handleCloseMobile();
                }}
                className="drawerCard drawerLink"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#FFFFFF",
                  WebkitTextFillColor: "#FFFFFF",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                }}
              >
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Customize Appearance</span>
                <span>⚙️</span>
              </button>
            )}
          </nav>

          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.7)", WebkitTextFillColor: "rgba(255, 255, 255, 0.7)" }}>Kynisto 2.0</span>
            <ThemeSwitcher size="sm" />
          </div>
        </div>
      )}
    </header>
  );
}
