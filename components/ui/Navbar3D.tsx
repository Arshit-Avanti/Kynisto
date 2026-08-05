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
      setIsMobile(window.innerWidth < 768);
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
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 28px",
        background: "rgba(20, 10, 12, 0.95)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 87, 34, 0.25)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.6)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <BackButton
          fallback="/"
          label="Back"
          style={{ fontSize: "12px", padding: "6px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.1)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.2)" }}
        />
        <Link href="/" aria-label="Kynisto Home" style={{ textDecoration: "none", display: "flex" }}>
          <KynistoLogo showTagline />
        </Link>
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
      </div>

      {!isMobile && (
        <nav aria-label="Main Navigation" style={{ display: "flex", alignItems: "center", gap: "28px", fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
          <Link href="/products" style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s" }}>Products</Link>
          <Link href="/healthcare" style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s" }}>Healthcare</Link>
          <Link href="/pricing" style={{ color: "#FF7A00", WebkitTextFillColor: "#FF7A00", textDecoration: "none", transition: "all 0.15s", fontWeight: 700 }}>Pricing & Plans</Link>
          <button
            type="button"
            onClick={() => {
              if (userRole !== "customer" && userRole !== "admin") {
                window.location.assign("/login?returnTo=%2Faccount%3Ftab%3Dfavorites");
                return;
              }
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, padding: 0 }}
          >
            <span aria-hidden="true" style={{ color: "#FF5722", marginRight: "4px" }}>♥</span>
            Saved <b style={{ background: "rgba(255, 87, 34, 0.25)", color: "#FF8A00", WebkitTextFillColor: "#FF8A00", border: "1px solid rgba(255, 138, 0, 0.4)", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", marginLeft: "4px" }}>{savedCount}</b>
          </button>
          <button type="button" onClick={onOpenCustomize} style={{ color: "var(--text-primary)", WebkitTextFillColor: "var(--text-primary)", textDecoration: "none", transition: "all 0.15s", background: "none", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 700, padding: 0 }}>
            <span aria-hidden="true" style={{ marginRight: "4px" }}>≡</span>
            Customize
          </button>
          <ThemeSwitcher size="sm" />
        </nav>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {!isMobile && (
          <Link
            href={userRole ? "/dashboard" : "/login"}
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
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "26px", color: "#FFFFFF", padding: "4px" }}
          >
            ☰
          </button>
        )}
      </div>

      {isMobile && mobileOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "rgba(10, 15, 30, 0.98)", padding: "20px", display: "flex", flexDirection: "column", gap: "18px", borderBottom: "1px solid rgba(255, 255, 255, 0.15)", boxShadow: "0 12px 35px rgba(0, 0, 0, 0.8)", backdropFilter: "blur(20px)" }}>
          <Link href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"} onClick={() => setMobileOpen(false)} style={{ color: "#FFFFFF", textDecoration: "none", fontWeight: 700, fontSize: "16px" }}>
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
          <button type="button" onClick={() => { setMobileOpen(false); onOpenCustomize(); }} style={{ background: "none", border: "none", color: "#00F0FF", textAlign: "left", padding: 0, fontSize: "15px", fontWeight: 600, cursor: "pointer" }}>
            Customize Appearance
          </button>
        </div>
      )}
    </header>
  );
}
