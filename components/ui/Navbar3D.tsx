"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback, useMemo, startTransition } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { BackButton } from "@/components/ui/BackButton";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";
import { RoleSwitcherButton } from "@/components/auth/RoleSwitcherButton";

export interface Navbar3DProps {
  userRole: "admin" | "store_owner" | "customer" | null;
  savedCount: number;
  locationLabel?: string;
  onUseLocation?: () => void;
  onOpenCustomize?: () => void;
  mode?: "default" | "services" | "pricing";
}

/* ==========================================================================
   DESKTOP NAVBAR COMPONENT — 3D Perspective Tilt & Full Wide Navigation
   ========================================================================== */
function DesktopNavbar({
  userRole,
  savedCount,
  locationLabel,
  onUseLocation,
  onOpenCustomize,
  mode,
}: Navbar3DProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let isIntersecting = true;
    let isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
    let animFrameId: number | null = null;
    let targetRx = 0;
    let targetRy = 0;
    let currentRx = 0;
    let currentRy = 0;

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

    const handleMouseMove = (e: MouseEvent) => {
      if (!header || !isIntersecting || !isTabVisible) return;
      const rect = header.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      targetRx = (-mouseY / (rect.height / 2)) * 3;
      targetRy = (mouseX / (rect.width / 2)) * 3;
      startAnimation();
    };

    const handleMouseLeave = () => {
      targetRx = 0;
      targetRy = 0;
      startAnimation();
    };

    header.addEventListener("mousemove", handleMouseMove);
    header.addEventListener("mouseleave", handleMouseLeave);

    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          isIntersecting = entry ? entry.isIntersecting : true;
          if (isIntersecting) startAnimation();
          else stopAnimation();
        },
        { threshold: 0.01 }
      );
      observer.observe(header);
    }

    const handleVisibilityChange = () => {
      isTabVisible = typeof document !== "undefined" ? !document.hidden : true;
      if (isTabVisible) startAnimation();
      else stopAnimation();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll);
      header.removeEventListener("mousemove", handleMouseMove);
      header.removeEventListener("mouseleave", handleMouseLeave);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (observer) observer.disconnect();
      stopAnimation();
    };
  }, []);

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

  const navColor = "#FFFFFF";

  return (
    <header
      ref={headerRef}
      className={`floating-nav-container desktopNavContainer ${isScrolled ? "is-scrolled" : ""}`}
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
              textAlign: "left",
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

      <nav aria-label="Desktop Navigation" style={{ display: "flex", alignItems: "center", gap: "24px", fontSize: "14px", fontWeight: 700, color: navColor }}>
        <Link href="/" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Homepage</Link>
        {!isRestrictedMode && <Link href="/products" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Products</Link>}
        {!isRestrictedMode && <Link href="/healthcare" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Healthcare</Link>}
        {!isRestrictedMode && <Link href="/services" style={{ color: navColor, WebkitTextFillColor: navColor, textDecoration: "none", transition: "all 0.15s" }}>Services</Link>}
        {!isRestrictedMode && <Link href="/pricing" style={{ color: "#FF7A00", WebkitTextFillColor: "#FF7A00", textDecoration: "none", transition: "all 0.15s", fontWeight: 700 }}>👑 Kynisto Membership</Link>}
        
        {!isPricingMode && (
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

      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {userRole && (
          <RoleSwitcherButton currentRole={userRole} />
        )}
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
      </div>
    </header>
  );
}

/* ==========================================================================
   MOBILE NAVBAR COMPONENT — Compact Top Header Bar + Full Drawer + Dock
   ========================================================================== */
function MobileNavbar({
  userRole,
  savedCount,
  locationLabel = "Your Locality",
  onUseLocation,
  onOpenCustomize,
  mode = "default",
}: Navbar3DProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let scrollTicking = false;
    const handleScroll = () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 15);
          scrollTicking = false;
        });
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const handleFavoritesClick = useCallback(() => {
    if (userRole !== "customer" && userRole !== "admin") {
      window.location.assign("/login?returnTo=%2Faccount%3Ftab%3Dfavorites");
      return;
    }
    handleCloseMobile();
    document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
  }, [userRole, handleCloseMobile]);

  return (
    <>
      {/* Top Floating App Bar on Mobile */}
      <header className={`mobileTopAppBar ${isScrolled ? "is-scrolled" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BackButton
            fallback="/"
            label=""
            style={{ width: "34px", height: "34px", padding: 0, borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          />
          <Link href="/" aria-label="Kynisto Home" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <KynistoLogo showTagline={false} />
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {onUseLocation && (
            <button
              type="button"
              aria-label="Current Locality"
              onClick={onUseLocation}
              className="mobileLocalityPill"
            >
              <span className="mobileLocalityDot" aria-hidden="true" />
              <span className="mobileLocalityText">{locationLabel}</span>
            </button>
          )}

          <button
            type="button"
            className="mobileSavedBadge"
            aria-label="Saved Places"
            onClick={handleFavoritesClick}
          >
            <span style={{ color: "#FF5722", fontSize: "13px" }}>♥</span>
            {savedCount > 0 && <span className="mobileSavedNum">{savedCount}</span>}
          </button>

          <button
            type="button"
            className="mobileMenuToggleBtn"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            onClick={handleToggleMobile}
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Full-Screen Glassmorphic Mobile Drawer */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Menu"
          className="mobileFullDrawer"
        >
          {/* Drawer Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <Link href="/" onClick={handleCloseMobile} style={{ textDecoration: "none" }}>
              <KynistoLogo showTagline={false} />
            </Link>
            <button
              type="button"
              aria-label="Close menu"
              onClick={handleCloseMobile}
              className="drawerCloseCircleBtn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          {/* Locality Switcher Card */}
          {onUseLocation && (
            <button
              type="button"
              onClick={() => {
                onUseLocation();
                handleCloseMobile();
              }}
              className="drawerLocalityCard"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="drawerDot" />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span className="drawerSubLabel">Current Locality</span>
                  <span className="drawerMainLabel">{locationLabel}</span>
                </div>
              </div>
              <span className="drawerChangeBtn">Change 📍</span>
            </button>
          )}

          {/* User Account / Login CTA Card */}
          <Link
            href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"}
            onClick={handleCloseMobile}
            className="drawerAccountCard"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span className="drawerAccountIcon">👤</span>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#FFFFFF" }}>
                  {userRole === "admin" ? "Admin Control Panel" : userRole === "store_owner" ? "Store Owner Workspace" : userRole === "customer" ? "Customer Account" : "Sign In / Register"}
                </span>
                <span style={{ fontSize: "12px", color: "rgba(255, 255, 255, 0.8)" }}>
                  {userRole ? "Tap to open your portal" : "Access orders, queue tickets & wallet"}
                </span>
              </div>
            </div>
            <span style={{ color: "#FFFFFF", fontSize: "16px" }}>→</span>
          </Link>

          {userRole && (
            <div style={{ margin: "10px 0" }}>
              <RoleSwitcherButton currentRole={userRole} style={{ width: "100%", justifyContent: "center" }} />
            </div>
          )}

          {/* Navigation Links Grid */}
          <nav className="drawerNavList">
            <Link href="/" onClick={handleCloseMobile} className="drawerNavItem">
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="drawerNavIcon">🏠</span>
                <span>Homepage</span>
              </span>
              <span className="drawerNavArrow">→</span>
            </Link>

            <Link href="/products" onClick={handleCloseMobile} className="drawerNavItem">
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="drawerNavIcon">🛍️</span>
                <span>Nearby Products</span>
              </span>
              <span className="drawerNavArrow">→</span>
            </Link>

            <Link href="/healthcare" onClick={handleCloseMobile} className="drawerNavItem">
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="drawerNavIcon">🏥</span>
                <span>Healthcare &amp; Clinics</span>
              </span>
              <span className="drawerNavArrow">→</span>
            </Link>

            <Link href="/services" onClick={handleCloseMobile} className="drawerNavItem">
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="drawerNavIcon">🛠️</span>
                <span>Local Services</span>
              </span>
              <span className="drawerNavArrow">→</span>
            </Link>

            <Link href="/pricing" onClick={handleCloseMobile} className="drawerNavItem drawerMembershipItem">
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="drawerNavIcon">👑</span>
                <span style={{ fontWeight: 800, color: "#FF8A00" }}>Kynisto Membership</span>
              </span>
              <span className="drawerVipBadge">VIP</span>
            </Link>

            <button
              type="button"
              onClick={handleFavoritesClick}
              className="drawerNavItem drawerButton"
            >
              <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span className="drawerNavIcon">❤️</span>
                <span>Saved Favorites</span>
              </span>
              <b className="drawerSavedCountBadge">{savedCount}</b>
            </button>

            {onOpenCustomize && (
              <button
                type="button"
                onClick={() => {
                  onOpenCustomize();
                  handleCloseMobile();
                }}
                className="drawerNavItem drawerButton"
              >
                <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span className="drawerNavIcon">🎨</span>
                  <span>Customize Theme</span>
                </span>
                <span className="drawerNavArrow">⚙️</span>
              </button>
            )}
          </nav>

          {/* Drawer Footer with Theme Switcher */}
          <div className="drawerFooter">
            <span style={{ fontSize: "12px", color: "#94A3B8" }}>Kynisto 2.0 • Mobile Suite</span>
            <ThemeSwitcher size="sm" />
          </div>
        </div>
      )}

      {/* Modern Floating Bottom App Dock for Fast Mobile Navigation */}
      <nav className="mobileBottomAppDock" aria-label="Mobile Bottom Navigation">
        <Link href="/" className="mobileDockTab activeTab" aria-label="Home">
          <span className="mobileDockIcon">🏠</span>
          <span className="mobileDockLabel">Home</span>
        </Link>
        <Link href="/products" className="mobileDockTab" aria-label="Products">
          <span className="mobileDockIcon">🛍️</span>
          <span className="mobileDockLabel">Products</span>
        </Link>
        <Link href="/healthcare" className="mobileDockTab" aria-label="Healthcare">
          <span className="mobileDockIcon">🏥</span>
          <span className="mobileDockLabel">Health</span>
        </Link>
        <Link href="/services" className="mobileDockTab" aria-label="Services">
          <span className="mobileDockIcon">🛠️</span>
          <span className="mobileDockLabel">Services</span>
        </Link>
        <Link
          href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"}
          className="mobileDockTab"
          aria-label="Account"
        >
          <span className="mobileDockIcon">👤</span>
          <span className="mobileDockLabel">{userRole ? "Portal" : "Login"}</span>
        </Link>
      </nav>
    </>
  );
}

/* ==========================================================================
   PRIMARY EXPORT — Renders DesktopNavbar on Desktop and MobileNavbar on Mobile
   ========================================================================== */
export function Navbar3D(props: Navbar3DProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile === null) {
    // Initial SSR / Hydration render: Render both with CSS visibility guards to prevent layout shift
    return (
      <>
        <div className="desktopOnlyNavWrapper">
          <DesktopNavbar {...props} />
        </div>
        <div className="mobileOnlyNavWrapper">
          <MobileNavbar {...props} />
        </div>
      </>
    );
  }

  return isMobile ? <MobileNavbar {...props} /> : <DesktopNavbar {...props} />;
}
