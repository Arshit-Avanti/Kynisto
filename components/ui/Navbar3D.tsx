"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { BackButton } from "@/components/ui/BackButton";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

interface Navbar3DProps {
  userRole: "admin" | "store_owner" | "customer" | null;
  savedCount: number;
  locationLabel: string;
  onUseLocation: () => void;
  onOpenCustomize: () => void;
}

export function Navbar3D({
  userRole,
  savedCount,
  locationLabel,
  onUseLocation,
  onOpenCustomize,
}: Navbar3DProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(1280px, calc(100% - 32px))",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 24px",
        background: "rgba(15, 17, 26, 0.78)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        borderRadius: "9999px",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.45), 0 0 20px rgba(139, 92, 246, 0.15)",
        transition: "all 0.3s ease",
      }}
    >
      {/* Left Section: Back button & Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <BackButton
          fallback="/"
          label="Back"
          style={{
            fontSize: "12px",
            fontWeight: 700,
            padding: "8px 14px",
            borderRadius: "14px",
            background: "rgba(255, 255, 255, 0.08)",
            color: "#FFFFFF",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
            transition: "all 0.2s ease",
          }}
        />
        <Link href="/" aria-label="Kynisto Home" style={{ textDecoration: "none", display: "flex" }}>
          <KynistoLogo showTagline />
        </Link>
      </div>

      {/* Center Section: Smart Locality Search Pill */}
      {!isMobile && (
        <button
          type="button"
          aria-label="Use current location"
          onClick={onUseLocation}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1.5px solid rgba(255, 87, 34, 0.4)",
            boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.5), 0 0 16px rgba(255, 87, 34, 0.25)",
            borderRadius: "9999px",
            padding: "6px 18px",
            cursor: "pointer",
            textAlign: "left",
            transition: "all 0.22s ease",
          }}
        >
          <span
            style={{
              width: "9px",
              height: "9px",
              borderRadius: "50%",
              background: "#FF5722",
              boxShadow: "0 0 12px #FF5722, 0 0 4px #FF8A00",
              display: "inline-block",
            }}
            aria-hidden="true"
          />
          <span style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontSize: "9.5px",
                color: "#FF8A00",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 800,
              }}
            >
              Your Locality
            </span>
            <span
              style={{
                fontSize: "12.5px",
                color: "#FFFFFF",
                fontWeight: 700,
                letterSpacing: "-0.01em",
              }}
            >
              {locationLabel}
            </span>
          </span>
          <span aria-hidden="true" style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.7)", marginLeft: "4px" }}>
            ⌄
          </span>
        </button>
      )}

      {/* Right Section: Navigation Links & Action Buttons */}
      {!isMobile && (
        <nav
          aria-label="Main Navigation"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Link
            href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"}
            style={{
              color: "#FFFFFF",
              textDecoration: "none",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 750,
              fontSize: "12.5px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "8px 14px",
              borderRadius: "9999px",
              transition: "all 0.2s ease",
              background: "transparent",
            }}
          >
            {userRole === "admin" ? "Admin Panel" : userRole === "store_owner" ? "Owner Dashboard" : userRole === "customer" ? "My Account" : "Admin Panel"}
          </Link>
          <Link
            href="/products"
            style={{
              color: "#FFFFFF",
              textDecoration: "none",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 750,
              fontSize: "12.5px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "8px 14px",
              borderRadius: "9999px",
              transition: "all 0.2s ease",
            }}
          >
            Products
          </Link>
          <Link
            href="/healthcare"
            style={{
              color: "#FFFFFF",
              textDecoration: "none",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 750,
              fontSize: "12.5px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "8px 14px",
              borderRadius: "9999px",
              transition: "all 0.2s ease",
            }}
          >
            Healthcare
          </Link>

          {/* Premium "Saved" Heart Button */}
          <button
            type="button"
            onClick={() => {
              if (userRole !== "customer" && userRole !== "admin") {
                window.location.assign("/login?returnTo=%2Faccount%3Ftab%3Dfavorites");
                return;
              }
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "14px",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
              transition: "all 0.2s ease",
            }}
          >
            <span aria-hidden="true" style={{ color: "#FF5722", fontSize: "14px" }}>
              ♥
            </span>
            Saved
            <b
              style={{
                background: "rgba(255, 87, 34, 0.25)",
                color: "#FF8A00",
                border: "1px solid rgba(255, 138, 0, 0.4)",
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "11px",
                marginLeft: "2px",
              }}
            >
              {savedCount}
            </b>
          </button>

          {/* Premium "Customize" Button */}
          <button
            type="button"
            onClick={onOpenCustomize}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#FFFFFF",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "14px",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
              boxShadow: "0 8px 20px rgba(0, 0, 0, 0.25)",
              transition: "all 0.2s ease",
            }}
          >
            <span aria-hidden="true" style={{ fontSize: "14px" }}>
              ☷
            </span>
            Customize
          </button>

          <ThemeSwitcher size="sm" />
        </nav>
      )}

      {/* Dashboard CTA Button (or Mobile menu button) */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {!isMobile && (
          <Link
            href={userRole ? "/dashboard" : "/login"}
            style={{
              background: "linear-gradient(135deg, #FF5722 0%, #E53935 100%)",
              color: "white",
              padding: "9px 20px",
              borderRadius: "9999px",
              border: "none",
              fontWeight: 750,
              fontSize: "13px",
              letterSpacing: "0.02em",
              cursor: "pointer",
              boxShadow: "0 4px 18px rgba(255, 87, 34, 0.45)",
              textDecoration: "none",
              display: "inline-block",
              transition: "all 0.2s ease",
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
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "22px",
              color: "#FFFFFF",
              padding: "6px 12px",
            }}
          >
            ☰
          </button>
        )}
      </div>

      {/* Mobile Drawer */}
      {isMobile && mobileOpen && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            left: 0,
            right: 0,
            background: "rgba(15, 17, 26, 0.96)",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            borderRadius: "24px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 16px 45px rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(24px)",
          }}
        >
          <button
            type="button"
            onClick={onUseLocation}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1.5px solid rgba(255, 87, 34, 0.4)",
              borderRadius: "14px",
              padding: "10px 16px",
              color: "#FFFFFF",
              textAlign: "left",
            }}
          >
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF5722" }} />
            <span style={{ fontSize: "13px", fontWeight: 700 }}>{locationLabel}</span>
          </button>
          <Link href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"} onClick={() => setMobileOpen(false)} style={{ color: "#FFFFFF", textDecoration: "none", fontWeight: 750, fontSize: "15px" }}>
            {userRole === "admin" ? "Admin Panel" : userRole === "store_owner" ? "Owner Dashboard" : userRole === "customer" ? "My Account" : "Log in"}
          </Link>
          <Link href="/products" onClick={() => setMobileOpen(false)} style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "15px" }}>Products</Link>
          <Link href="/healthcare" onClick={() => setMobileOpen(false)} style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "15px" }}>Healthcare</Link>
          <Link
            href={userRole === "customer" || userRole === "admin" ? "/account?tab=favorites" : "/login?returnTo=%2Faccount%3Ftab%3Dfavorites"}
            onClick={() => setMobileOpen(false)}
            style={{ color: "#FFFFFF", textDecoration: "none", fontSize: "15px" }}
          >
            Saved places ({savedCount})
          </Link>
          <button type="button" onClick={() => { setMobileOpen(false); onOpenCustomize(); }} style={{ background: "none", border: "none", color: "#FF8A00", textAlign: "left", padding: 0, fontSize: "15px", fontWeight: 700, cursor: "pointer" }}>
            Customize Appearance
          </button>
        </div>
      )}
    </header>
  );
}
