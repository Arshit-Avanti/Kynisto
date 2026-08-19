"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useRef } from "react";
import { KynistoLogo } from "@/components/brand/KynistoLogo";
import { VideoBackground } from "@/components/media/VideoBackground";
import { ShaderCanvas } from "@/components/ui/ShaderCanvas";
import { apiFetch } from "@/lib/client-api";
import { getSupabaseBrowserClient, syncSupabaseAccessCookie } from "@/lib/supabase-browser";
import { WelcomeRewardModal } from "@/components/subscription/WelcomeRewardModal";
import { SubscriptionExpiryBanner } from "@/components/subscription/SubscriptionExpiryBanner";
import { EfferdFeatures6 } from "@/components/blocks/features-6";
import { EfferdFooter3 } from "@/components/blocks/footer-3";

type Category = {
  name: string;
  icon: string;
  tone: string;
  storeCount?: number;
};

type Store = {
  id: string | number;
  slug?: string;
  name: string;
  category: string;
  icon: string;
  address: string;
  shortAddress: string;
  rating: number;
  reviews: number;
  distance: number;
  walk: string;
  open: boolean;
  hours: string;
  tone: string;
  services: string[];
};


const Icons = {
  Search: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Location: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>,
  Star: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Heart: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Clock: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>,
  ArrowRight: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>,
  Sliders: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  GitHub: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>,
  YouTube: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  Twitter: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
};

const modernCleanTechStyles = `
  .site {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif !important;
    background-color: transparent !important;
    background-image: none !important;
    background: transparent !important;
    color: #f8fafc !important;
  }
  
  /* Mode Dark Styles */
  .mode-dark .searchBox, .mode-dark .healthSearch, .mode-dark .productIntro form, .mode-dark .locationPill, .mode-dark .categoryTile, .mode-dark .storeCard, .mode-dark .advancedFilters input, .mode-dark .providerGrid article {
    border-radius: 16px !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
    color: var(--text-primary) !important;
    transform: translateZ(0) !important;
    will-change: transform, opacity !important;
    contain: layout style paint !important;
  }
  .mode-dark .categoryTile strong, .mode-dark .categoryTile b, .mode-dark .categoryTile span, .mode-dark .storeCard h3, .mode-dark .storeCard b, .mode-dark .storeCard p, .mode-dark .providerGrid h3 {
    color: var(--text-primary) !important;
    text-shadow: var(--text-shadow-strong, 0 1px 4px rgba(0,0,0,0.8)) !important;
  }
  .mode-dark .topbar a, .mode-dark .topbar button, .mode-dark .headerActions a, .mode-dark .headerActions button, .mode-dark .textButton, .mode-dark .accountButton, .mode-dark .savedButton {
    color: var(--text-primary) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
    text-shadow: var(--text-shadow-strong, 0 1px 4px rgba(0, 0, 0, 0.8)) !important;
    font-weight: 700 !important;
    font-size: 14px !important;
    transition: all 0.2s ease !important;
  }
  .mode-dark .sectionHeading h2, .mode-dark .sectionHeading h3, .mode-dark .hero h1, .mode-dark .hero p, .mode-dark h2, .mode-dark h3 {
    color: var(--text-primary) !important;
    text-shadow: var(--text-shadow-heavy, 0 2px 10px rgba(0,0,0,0.9)) !important;
  }
  .mode-dark .hero h1 {
    color: var(--text-primary) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
    text-shadow: none !important;
    filter: none !important;
  }

  /* Mode Light Styles (High Contrast Black Ink for Crisp Light Mode) */
  .mode-light .searchBox, .mode-light .healthSearch, .mode-light .productIntro form, .mode-light .locationPill, .mode-light .categoryTile, .mode-light .storeCard, .mode-light .advancedFilters input, .mode-light .providerGrid article {
    border-radius: 16px !important;
    border: 1px solid rgba(0, 0, 0, 0.15) !important;
    background: #ffffff !important;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05) !important;
    color: #0f172a !important;
    transform: translateZ(0) !important;
    will-change: transform, opacity !important;
    contain: layout style paint !important;
  }
  .mode-light .categoryTile strong, .mode-light .categoryTile b, .mode-light .categoryTile span, .mode-light .storeCard h3, .mode-light .storeCard b, .mode-light .storeCard p, .mode-light .providerGrid h3 {
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
    text-shadow: none !important;
  }
  /* Ensure ALL text is dark in light mode across the entire page, even after custom theme changes */
  .mode-light h1, .mode-light h2, .mode-light h3, .mode-light h4, .mode-light p,
  .mode-light span:not(.categoryArt):not(.brandMark span), .mode-light label,
  .mode-light .featureCard h3, .mode-light .featureCard p,
  .mode-light .highContrastText, .mode-light .marqueeTrack span,
  .mode-light .quickProof span, .mode-light .trustStrip p,
  .mode-light .sectionHeading h2, .mode-light .sectionHeading span,
  .mode-light .kicker, .mode-light .hero h1, .mode-light .hero p {
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
    text-shadow: none !important;
  }
  /* Popular Near You specified 5 texts -> pure white in all modes */
  .mode-light .placesSection .kicker,
  .mode-light .placesSection h2,
  .mode-light .placesSection #places-heading,
  .mode-light .emptyState h3,
  .mode-light .emptyState p {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9) !important;
  }
  /* FLOATING NAVIGATION BAR — UNIFIED (SAME IN LIGHT AND DARK MODE) */
  .floating-nav-container,
  .mode-light .floating-nav-container,
  .light-theme .floating-nav-container,
  .mode-dark .floating-nav-container,
  .dark-theme .floating-nav-container {
    background: rgba(10, 16, 30, 0.85) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    backdrop-filter: blur(16px) !important;
    -webkit-backdrop-filter: blur(16px) !important;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4) !important;
  }

  .floating-nav-container a,
  .floating-nav-container button,
  .mode-light .floating-nav-container a,
  .mode-light .floating-nav-container button {
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    font-weight: 700 !important;
    font-size: 14px !important;
  }

  .floating-nav-container nav a[href="/pricing"],
  .mode-light .floating-nav-container nav a[href="/pricing"] {
    color: #FF7A00 !important;
    -webkit-text-fill-color: #FF7A00 !important;
  }
  .mode-light .sectionHeading h2, .mode-light .sectionHeading h3, .mode-light .hero h1, .mode-light .hero p, .mode-light h2, .mode-light h3 {
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
    text-shadow: none !important;
  }
  /* Fix search input placeholder and text in light mode */
  .mode-light .searchBox input, .mode-light .healthSearch input, .mode-light .productIntro form input {
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
  }
  .mode-light .searchBox input::placeholder, .mode-light .productIntro form input::placeholder {
    color: rgba(0,0,0,0.4) !important;
    -webkit-text-fill-color: rgba(0,0,0,0.4) !important;
  }
  /* Fix nav/topbar invisible pill in light mode — force readable background + text */
  .mode-light .textButton, .mode-light .accountButton, .mode-light .savedButton {
    background: rgba(0, 0, 0, 0.06) !important;
    color: #0f172a !important;
    -webkit-text-fill-color: #0f172a !important;
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
  }
  .topbar a:hover, .topbar button:hover, .headerActions a:hover, .headerActions button:hover, .textButton:hover {
    color: #FF5722 !important;
    -webkit-text-fill-color: #FF5722 !important;
    text-shadow: 0 0 12px rgba(255, 87, 34, 0.6) !important;
  }
  .savedButton b {
    background: rgba(255, 87, 34, 0.25) !important;
    color: #FF8A00 !important;
    -webkit-text-fill-color: #FF8A00 !important;
    border: 1px solid rgba(255, 138, 0, 0.4) !important;
    padding: 2px 8px !important;
    border-radius: 10px !important;
    font-size: 12px !important;
    margin-left: 4px !important;
  }
  .categoryTile small {
    color: #FF8A00 !important;
    font-weight: 700 !important;
  }
  .hero h1 {
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif !important;
    font-weight: 850 !important;
    letter-spacing: -0.06em !important;
  }
  .searchBox input, .healthSearch input, .productIntro form input, .advancedFilters input {
    background: transparent !important;
    color: var(--text-primary) !important;
  }
  /* Dark mode search placeholder — white on dark */
  .mode-dark .searchBox input::placeholder, .mode-dark .productIntro form input::placeholder {
    color: rgba(255,255,255,0.55) !important;
    -webkit-text-fill-color: rgba(255,255,255,0.55) !important;
  }
  .searchBox:focus-within, .healthSearch:focus-within, .productIntro form:focus-within, .advancedFilters input:focus {
    border-color: #FF5722 !important;
    box-shadow: 0 0 18px rgba(255, 87, 34, 0.45) !important;
    outline: none !important;
  }
  .locationPill:hover, .categoryTile:hover {
    border-color: rgba(255, 87, 34, 0.5) !important;
    background: rgba(255, 255, 255, 0.12) !important;
  }
  .categoryTile {
    transition: all 0.3s ease, transform 0.2s ease !important;
  }
  .categoryTile[aria-pressed="true"], .careTypes button.active {
    background: rgba(255, 87, 34, 0.3) !important;
    color: #fff !important;
    border-color: #FF5722 !important;
    box-shadow: 0 0 20px rgba(255, 87, 34, 0.45) !important;
    transform: translateY(-2px) !important;
  }
  .categoryTile[aria-pressed="true"] svg, .careTypes button.active svg {
    stroke: #FF7A00 !important;
  }
  .storeCard {
    overflow: visible !important;
    transform-style: preserve-3d !important;
    transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.15s ease, border-color 0.15s ease !important;
    will-change: transform, box-shadow, border-color !important;
    position: relative !important;
  }
  .storeCard::before {
    content: '';
    position: absolute; inset: -2px; z-index: -1;
    border-radius: 18px;
    background: radial-gradient(circle at 50% 0%, rgba(255, 87, 34, 0.5), rgba(59, 130, 246, 0.3), transparent 75%);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
  }
  .storeCard:hover::before { opacity: 1; }
  .storeCard .storeVisual {
    border-top-left-radius: 16px !important;
    border-top-right-radius: 16px !important;
    overflow: hidden !important;
  }
  .storeCard > * {
    position: relative;
    z-index: 1;
    border-radius: inherit;
  }
  .storeCard:hover, .providerGrid article:hover {
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 87, 34, 0.3) !important;
    border-color: rgba(255, 87, 34, 0.8) !important;
    transform: perspective(1200px) rotateX(6deg) rotateY(-4deg) translateZ(20px) translateY(-10px) !important;
    z-index: 10;
  }
  .storeCard:hover .storeBody {
    transform: translateZ(30px);
  }
  .storeCard .storeBody {
    transition: transform 0.15s ease;
  }
  .mode-light .storeCard {
    background: rgba(255, 255, 255, 0.18) !important;
    border: 1px solid rgba(0, 0, 0, 0.12) !important;
    backdrop-filter: blur(14px) !important;
    -webkit-backdrop-filter: blur(14px) !important;
    box-shadow: 0 4px 15px rgba(0,0,0,0.05) !important;
  }
  .mode-light .storeCard h3, .mode-light .storeCard b, .mode-light .storeCard p, .mode-light .storeCard .storeMeta span, .mode-light .categoryLabel, .mode-light .rating {
    color: #111827 !important;
    text-shadow: none !important;
  }
  .mode-light .storeCard .address {
    color: #4B5563 !important;
  }
  .storeVisual, .providerTop, .productVisual {
    position: relative !important;
    background: rgba(0, 0, 0, 0.2) !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
    overflow: hidden !important;
  }
  .storeVisual img, .productVisual img {
    transition: transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
  }
  .storeCard:hover .storeVisual img, .storeCard:hover .productVisual img, article:hover .productVisual img {
    transform: scale(1.05) !important;
  }
  .statusBadge, .liveQueueBadge {
    border-radius: 4px !important;
    font-size: 0.75rem !important;
    font-weight: 600 !important;
    backdrop-filter: blur(8px) !important;
  }
  .statusBadge.isOpen {
    background: rgba(34, 197, 94, 0.2) !important;
    color: #86efac !important;
    border: 1px solid rgba(34, 197, 94, 0.3) !important;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.2) !important;
  }
  .statusBadge.isClosed {
    background: rgba(255, 255, 255, 0.1) !important;
    color: #94a3b8 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
  .distanceBadge {
    border-radius: 4px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #cbd5e1 !important;
    background: rgba(0, 0, 0, 0.5) !important;
    backdrop-filter: blur(4px) !important;
  }
  .categoryLabel {
    font-size: 0.75rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    color: #93c5fd !important;
    background: rgba(59, 130, 246, 0.15) !important;
    padding: 4px 8px !important;
    border-radius: 4px !important;
    font-weight: 700 !important;
    border: 1px solid rgba(59, 130, 246, 0.3) !important;
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.2) !important;
  }
  .detailsButton, .cardActions a, .providerActions a, .providerActions button {
    background: linear-gradient(135deg, #2563eb, #3b82f6) !important;
    color: white !important;
    border-radius: 6px !important;
    border: none !important;
    font-weight: 500 !important;
    box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4) !important;
    transition: all 0.3s ease !important;
  }
  .detailsButton:hover, .cardActions a:hover, .providerActions a:hover, .providerActions button:hover {
    background: linear-gradient(135deg, #1d4ed8, #2563eb) !important;
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6) !important;
    transform: translateY(-1px) !important;
  }
  .storeGlyph {
    font-size: 2rem !important;
    color: #94a3b8 !important;
  }
  .rating, .productRating {
    color: #fef08a !important;
    text-shadow: 0 0 8px rgba(253, 224, 71, 0.4) !important;
  }
  .productDiscovery article, .productGrid article {
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    background: rgba(255, 255, 255, 0.05) !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
    color: #f8fafc !important;
    overflow: hidden !important;
    transform: translateZ(0) !important;
    will-change: transform, opacity !important;
    contain: layout style paint !important;
  }
  .productGrid article:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4), 0 0 15px rgba(59, 130, 246, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
    transform: translateY(-6px) translateZ(0) !important;
  }
  .heroBrandCenter {
    display: flex;
    justify-content: center;
    margin-bottom: 12px;
  }
  .heroBrandCenter .kynistoLogo {
    transform: scale(1.15);
  }
  .heroBrandCenter .kynistoLogo b {
    font-family: 'Georgia', 'Times New Roman', serif !important;
    font-size: 26px !important;
    font-weight: 700 !important;
    background: linear-gradient(135deg, #ffffff 0%, #f0e6d3 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
    letter-spacing: 0.02em !important;
  }
  .heroTitleClassical {
    text-align: center !important;
    margin-left: auto !important;
    margin-right: auto !important;
  }
  .emptyState button {
    background: #FF5722 !important;
    color: #ffffff !important;
    box-shadow: 0 4px 15px rgba(255, 87, 34, 0.4) !important;
  }
  .emptyState button:hover {
    background: #E64A19 !important;
    box-shadow: 0 6px 20px rgba(255, 87, 34, 0.6) !important;
    transform: translateY(-2px) !important;
  }
  .searchSubmit:hover {
    box-shadow: 0 4px 15px rgba(255, 87, 34, 0.5) !important;
  }
  
  /* Ambient Mesh */
  .ambientMesh {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background-image: 
      radial-gradient(at 0% 0%, hsla(253,16%,7%,0.3) 0, transparent 50%), 
      radial-gradient(at 50% 0%, hsla(225,39%,30%,0.2) 0, transparent 50%), 
      radial-gradient(at 100% 0%, hsla(339,49%,30%,0.2) 0, transparent 50%);
    filter: blur(80px) saturate(150%); opacity: 0.25;
  }
  .mode-light .ambientMesh {
    background-image: 
      radial-gradient(at 0% 0%, hsla(253,16%,97%,1) 0, transparent 50%), 
      radial-gradient(at 50% 0%, hsla(225,39%,80%,1) 0, transparent 50%), 
      radial-gradient(at 100% 0%, hsla(339,49%,80%,1) 0, transparent 50%);
  }
  
  /* High Contrast Text Custom Properties */
  .mode-dark {
    --text-primary: #FFFFFF;
    --text-secondary: #E2E8F0;
    --text-shadow-strong: 0 1px 4px rgba(0,0,0,0.8);
    --text-shadow-heavy: 0 2px 10px rgba(0,0,0,0.9);
  }
  .mode-light {
    --text-primary: #000000;
    --text-secondary: #1A202C;
    --text-shadow-strong: none;
    --text-shadow-heavy: none;
  }
  .mode-light.site {
    background-color: transparent !important;
    background-image: none !important;
    color: #000000 !important;
  }
  
  /* Floating 3D Cards */
  .floatingCardsContainer {
    position: relative; height: 180px; width: 100%; display: flex; justify-content: center; align-items: center; gap: 20px; z-index: 2; margin: 30px 0 40px 0;
    perspective: 1500px;
    transform: translateZ(0);
    will-change: transform;
    contain: layout style;
  }
  .glassCard3D {
    position: relative;
    width: 200px; height: 130px;
    background: rgba(18, 18, 24, 0.8);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 20px;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    color: #FFFFFF;
    text-decoration: none;
    transform-style: preserve-3d;
    transition: transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.15s ease, border-color 0.15s ease;
    will-change: transform, box-shadow, border-color, opacity;
    transform: translateZ(0);
    contain: layout style paint;
  }
  .glassCard3D::before {
    content: '';
    position: absolute; inset: -2px; z-index: -1;
    border-radius: 22px;
    background: radial-gradient(circle at 50% 0%, rgba(255, 87, 34, 0.5), rgba(59, 130, 246, 0.3), transparent 75%);
    opacity: 0;
    transition: opacity 0.15s ease;
    pointer-events: none;
  }
  .mode-light .glassCard3D {
    background: rgba(255, 255, 255, 0.95);
    border: 1px solid rgba(0, 0, 0, 0.12);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
    color: #000000;
  }
  .glassCard3D svg { margin-bottom: 12px; opacity: 0.9; transform: translateZ(20px); transition: transform 0.15s ease; }
  .glassCard3D b { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; transform: translateZ(30px); transition: transform 0.15s ease; }
  
  .glassCard3D:hover::before { opacity: 1; }
  .glassCard3D:hover { 
    cursor: pointer; 
    border-color: rgba(255, 87, 34, 0.8) !important; 
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 87, 34, 0.3) !important;
    transform: perspective(1000px) rotateX(10deg) rotateY(-8deg) translateZ(30px) translateY(-12px);
    z-index: 10;
  }
  .glassCard3D:hover svg { transform: translateZ(40px) scale(1.1); }
  .highContrastText {
    color: var(--text-primary) !important;
    -webkit-text-fill-color: var(--text-primary) !important;
    text-shadow: none !important;
  }

  .heroSearchBox {
    width: 100%;
    max-width: 660px;
    margin: 20px auto 32px auto;
    padding: 8px;
    border-radius: 24px;
    transform: translateZ(20px);
    display: flex;
    align-items: center;
  }
  .heroSearchInput {
    font-size: 1.05rem;
    padding: 16px 12px;
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
  }
  .heroSearchButton {
    padding: 12px 28px;
    font-size: 1.05rem;
    border-radius: 16px;
  }
  .smartSearchChipsContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-wrap: wrap;
    max-width: 750px;
    margin: -12px auto 24px auto;
    font-size: 0.85rem;
  }
  .smartSearchPromptChip {
    padding: 4px 12px;
    font-size: 0.78rem;
    white-space: nowrap;
  }

  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .marqueeContainer {
    overflow: hidden;
    white-space: nowrap;
    position: relative;
    width: 100%;
    padding: 60px 0;
    mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
  }
  .marqueeTrack {
    display: inline-block;
    animation: marquee 40s linear infinite;
  }
  .marqueeTrack span {
    display: inline-block;
    padding: 0 40px;
    font-size: 1.6rem;
    font-weight: 800;
    color: var(--text-primary);
    opacity: 0.7;
    letter-spacing: -0.02em;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  }
  
  .featureGrid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 30px;
    max-width: 1200px;
    margin: 80px auto;
    padding: 0 20px;
  }
  .featureCard {
    background: rgba(13, 20, 36, 0.82) !important;
    border-radius: 24px !important;
    padding: 36px 30px !important;
    backdrop-filter: blur(18px) !important;
    -webkit-backdrop-filter: blur(18px) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.12), 0 14px 40px rgba(0, 0, 0, 0.35) !important;
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
    position: relative;
    overflow: hidden;
  }
  .mode-light .featureCard,
  .light-theme .featureCard {
    background: rgba(13, 20, 36, 0.82) !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
  }
  .featureCard:hover {
    transform: translateY(-6px) !important;
    background: rgba(18, 28, 50, 0.92) !important;
    border-color: rgba(59, 130, 246, 0.45) !important;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45), 0 0 25px rgba(59, 130, 246, 0.2) !important;
  }
  .mode-light .featureCard:hover {
    background: rgba(18, 28, 50, 0.92) !important;
    border-color: rgba(59, 130, 246, 0.45) !important;
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.45), 0 0 25px rgba(59, 130, 246, 0.2) !important;
  }
  .featureIconBadge {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    font-size: 24px;
  }
  .discoveryBadge {
    background: linear-gradient(135deg, rgba(255, 87, 34, 0.25), rgba(255, 87, 34, 0.08)) !important;
    border: 1px solid rgba(255, 87, 34, 0.4) !important;
    color: #FF7D47 !important;
    box-shadow: 0 0 22px rgba(255, 87, 34, 0.25) !important;
  }
  .queuesBadge {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.08)) !important;
    border: 1px solid rgba(59, 130, 246, 0.4) !important;
    color: #60A5FA !important;
    box-shadow: 0 0 22px rgba(59, 130, 246, 0.25) !important;
  }
  .loyaltyBadge {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(16, 185, 129, 0.08)) !important;
    border: 1px solid rgba(16, 185, 129, 0.4) !important;
    color: #34D399 !important;
    box-shadow: 0 0 22px rgba(16, 185, 129, 0.25) !important;
  }
  .featureHeadingDiscovery,
  .featureHeadingQueues,
  .featureHeadingLoyalty,
  .featureCard h3,
  .mode-light .featureCard h3 {
    font-size: 1.45rem !important;
    font-weight: 800 !important;
    letter-spacing: -0.02em !important;
    margin: 18px 0 10px 0 !important;
  }
  .featureHeadingDiscovery {
    color: #FFFFFF !important;
    background: linear-gradient(135deg, #FFFFFF 50%, #FFCCBC 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8)) !important;
  }
  .featureHeadingQueues {
    color: #FFFFFF !important;
    background: linear-gradient(135deg, #FFFFFF 50%, #BFDBFE 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8)) !important;
  }
  .featureHeadingLoyalty {
    color: #FFFFFF !important;
    background: linear-gradient(135deg, #FFFFFF 50%, #A7F3D0 100%) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8)) !important;
  }
  .featureText,
  .featureCard p,
  .mode-light .featureCard p {
    color: #CBD5E1 !important;
    -webkit-text-fill-color: #CBD5E1 !important;
    font-size: 0.95rem !important;
    line-height: 1.65 !important;
    font-weight: 450 !important;
    letter-spacing: 0.01em !important;
  }
  


  /* FLOATING GLASS NAVBAR LIGHT MODE & DARK MODE UNIFIED STYLES */
  .topbar,
  .mode-light .topbar,
  .mode-dark .topbar {
    background: rgba(12, 18, 30, 0.88) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
    color: #ffffff !important;
    transform: translateX(-50%) translateZ(0) !important;
    will-change: transform, opacity !important;
    contain: layout style paint !important;
  }

  .mode-light .topbar a,
  .mode-light .topbar button,
  .mode-light .topbar span,
  .mode-light .topbar strong,
  .mode-light .topbar b,
  .mode-light .topbar small,
  .mode-light .topbar div,
  .mode-light .headerActions a,
  .mode-light .headerActions button,
  .mode-light .headerActions span,
  .mode-light .headerActions b,
  .mode-dark .topbar a,
  .mode-dark .topbar button,
  .mode-dark .topbar span,
  .mode-dark .topbar strong,
  .mode-dark .topbar b,
  .mode-dark .topbar small,
  .mode-dark .topbar div,
  .mode-dark .headerActions a,
  .mode-dark .headerActions button,
  .mode-dark .headerActions span,
  .mode-dark .headerActions b {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4) !important;
  }

  /* Logo brand text inside floating topbar */
  .topbar .kynistoLogo b,
  .mode-light .topbar .kynistoLogo b,
  .mode-dark .topbar .kynistoLogo b {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    background: linear-gradient(90deg, #ffffff 0%, #f1f5f9 100%) !important;
    -webkit-background-clip: text !important;
    background-clip: text !important;
  }

  /* Tagline text inside floating topbar */
  .topbar .kynistoLogo small,
  .mode-light .topbar .kynistoLogo small,
  .mode-dark .topbar .kynistoLogo small {
    color: #ff8a00 !important;
    -webkit-text-fill-color: #ff8a00 !important;
  }

  /* Location pill inside floating topbar */
  .topbar .locationPill,
  .mode-light .topbar .locationPill,
  .mode-dark .topbar .locationPill {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2) !important;
  }

  .topbar .locationPill small,
  .mode-light .topbar .locationPill small,
  .mode-dark .topbar .locationPill small {
    color: #ff8a00 !important;
    -webkit-text-fill-color: #ff8a00 !important;
    font-size: 9px !important;
    font-weight: 800 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
  }

  .topbar .locationPill strong,
  .mode-light .topbar .locationPill strong,
  .mode-dark .topbar .locationPill strong {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    font-size: 13px !important;
    font-weight: 700 !important;
  }

  /* Saved Places button inside floating topbar */
  .topbar .savedButton,
  .mode-light .topbar .savedButton,
  .mode-dark .topbar .savedButton {
    background: rgba(255, 255, 255, 0.08) !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
  }

  .topbar .savedButton span,
  .mode-light .topbar .savedButton span,
  .mode-dark .topbar .savedButton span {
    color: #ff6b2b !important;
    -webkit-text-fill-color: #ff6b2b !important;
  }

  .topbar .savedButton b,
  .mode-light .topbar .savedButton b,
  .mode-dark .topbar .savedButton b {
    background: rgba(255, 87, 34, 0.25) !important;
    color: #ff8a00 !important;
    -webkit-text-fill-color: #ff8a00 !important;
    border: 1px solid rgba(255, 138, 0, 0.4) !important;
  }

  /* Customize button inside floating topbar */
  .topbar .customizeButton,
  .mode-light .topbar .customizeButton,
  .mode-dark .topbar .customizeButton {
    background: linear-gradient(135deg, #ff5722 0%, #e53935 100%) !important;
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    border: none !important;
    box-shadow: 0 4px 16px rgba(255, 87, 34, 0.4) !important;
  }

  /* HIGH CONTRAST FEATURE CARD STYLES */
  .featureCard,
  .mode-light .featureCard,
  .mode-dark .featureCard {
    background: rgba(12, 18, 30, 0.85) !important;
    border: 1px solid rgba(255, 255, 255, 0.16) !important;
    border-radius: 24px !important;
    padding: 36px 28px !important;
    backdrop-filter: blur(10px) !important;
    -webkit-backdrop-filter: blur(10px) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
    transform: translateZ(0) !important;
    will-change: transform, opacity !important;
    contain: layout style paint !important;
  }

  .featureCard h3,
  .mode-light .featureCard h3,
  .mode-dark .featureCard h3 {
    font-size: 1.5rem !important;
    font-weight: 800 !important;
    margin: 16px 0 10px 0 !important;
    color: #FFFFFF !important;
    -webkit-text-fill-color: #FFFFFF !important;
    text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
    letter-spacing: -0.02em !important;
  }

  .featureCard p,
  .mode-light .featureCard p,
  .mode-dark .featureCard p {
    color: #F1F5F9 !important;
    -webkit-text-fill-color: #F1F5F9 !important;
    line-height: 1.6 !important;
    font-size: 1.05rem !important;
    font-weight: 500 !important;
    margin: 0 !important;
    text-shadow: 0 1px 2px rgba(0,0,0,0.6) !important;
  }

  /* ==========================================================================
     MOBILE RESPONSIVE & HIGH CONTRAST AUDIT (max-width: 768px)
     ========================================================================== */
  @media (max-width: 768px) {
    /* Fixed Floating Topbar Header on Mobile */
    .topbar,
    .mode-light .topbar,
    .mode-dark .topbar {
      height: 60px !important;
      top: 10px !important;
      width: 94vw !important;
      padding: 0 14px !important;
      border-radius: 20px !important;
    }

    .topbarScrolled,
    .mode-light .topbarScrolled,
    .mode-dark .topbarScrolled {
      height: 56px !important;
      top: 8px !important;
    }

    /* Hide tagline on mobile brand logo so it fits in 60px header */
    .topbar .kynistoLogo small {
      display: none !important;
    }

    .topbar .kynistoLogo b {
      font-size: 20px !important;
    }

    /* Hero section responsiveness */
    .hero {
      padding: 80px 16px 40px 16px !important;
      text-align: center !important;
    }

    .heroTitleClassical,
    .hero h1 {
      font-size: clamp(2.1rem, 10.5vw, 3.6rem) !important;
      line-height: 1.1 !important;
      letter-spacing: -0.04em !important;
      white-space: nowrap !important;
      word-break: keep-all !important;
      overflow-wrap: normal !important;
      max-width: 100% !important;
    }

    .hero p {
      font-size: 1.1rem !important;
      margin-bottom: 24px !important;
    }

    /* Hero Floating Action Cards ("Loyalty Card", "Queue Ticket", "Dashboard") */
    .floatingCardsContainer {
      height: auto !important;
      display: flex !important;
      flex-direction: row !important;
      flex-wrap: nowrap !important;
      justify-content: space-between !important;
      align-items: stretch !important;
      gap: 6px !important;
      margin: 14px auto 18px auto !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 480px !important;
    }

    .glassCard3D {
      flex: 1 1 0% !important;
      min-width: 0 !important;
      max-width: 32.5% !important;
      height: 68px !important;
      padding: 8px 4px !important;
      border-radius: 14px !important;
      background: rgba(15, 23, 42, 0.82) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      display: flex !important;
      flex-direction: column !important;
      justify-content: center !important;
      align-items: center !important;
      gap: 3px !important;
    }

    .glassCard3D svg {
      margin-bottom: 2px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .glassCard3D b {
      font-size: 0.74rem !important;
      font-weight: 700 !important;
      line-height: 1.15 !important;
      text-align: center !important;
      white-space: nowrap !important;
      letter-spacing: -0.01em !important;
      color: #FFFFFF !important;
      -webkit-text-fill-color: #FFFFFF !important;
    }

    /* Search box on mobile */
    .searchBox,
    .heroSearchBox {
      width: 100% !important;
      max-width: 100% !important;
      margin: 10px auto 14px auto !important;
      padding: 4px 6px 4px 12px !important;
      border-radius: 16px !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
      box-sizing: border-box !important;
      background: rgba(15, 23, 42, 0.85) !important;
      border: 1px solid rgba(255, 255, 255, 0.18) !important;
    }

    .searchBox input,
    .heroSearchInput {
      flex: 1 1 auto !important;
      min-width: 0 !important;
      font-size: 0.85rem !important;
      padding: 8px 4px !important;
      overflow: hidden !important;
      text-overflow: ellipsis !important;
      white-space: nowrap !important;
    }

    .searchSubmit,
    .heroSearchButton {
      flex-shrink: 0 !important;
      padding: 8px 14px !important;
      font-size: 0.84rem !important;
      font-weight: 700 !important;
      border-radius: 12px !important;
      white-space: nowrap !important;
      min-width: 64px !important;
    }

    /* Smart search horizontal scrolling carousel on mobile */
    .smartSearchChipsContainer {
      display: flex !important;
      overflow-x: auto !important;
      flex-wrap: nowrap !important;
      gap: 6px !important;
      padding: 2px 2px 8px 2px !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto 12px auto !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
      justify-content: flex-start !important;
    }
    .smartSearchChipsContainer::-webkit-scrollbar {
      display: none !important;
    }
    .smartSearchPromptChip {
      flex-shrink: 0 !important;
      font-size: 0.72rem !important;
      padding: 4px 10px !important;
      border-radius: 99px !important;
      white-space: nowrap !important;
    }

    /* Feature Cards ("Universal Discovery", "Real-time Queues", "Unified Loyalty") */
    .featureGrid {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
      margin: 20px auto !important;
      padding: 0 !important;
    }

    .featureCard,
    .mode-light .featureCard,
    .mode-dark .featureCard {
      background: rgba(15, 23, 42, 0.82) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      padding: 14px 16px !important;
      border-radius: 16px !important;
      transform: translateZ(0) !important;
      will-change: transform, opacity !important;
      contain: layout style paint !important;
    }

    .featureIconBadge {
      width: 32px !important;
      height: 32px !important;
      border-radius: 8px !important;
      font-size: 14px !important;
    }

    .featureCard h3,
    .mode-light .featureCard h3,
    .mode-dark .featureCard h3 {
      font-size: 1.05rem !important;
      margin: 6px 0 4px 0 !important;
      font-weight: 800 !important;
      color: #FFFFFF !important;
      -webkit-text-fill-color: #FFFFFF !important;
    }

    .featureCard p,
    .mode-light .featureCard p,
    .mode-dark .featureCard p {
      font-size: 0.82rem !important;
      line-height: 1.4 !important;
      color: #94a3b8 !important;
      -webkit-text-fill-color: #94a3b8 !important;
      opacity: 1 !important;
    }

    /* Category Section on Mobile */
    .categorySection {
      margin-top: 24px !important;
      padding: 0 !important;
    }

    .sectionHeading.compactHeading {
      display: flex !important;
      justify-content: space-between !important;
      align-items: flex-end !important;
      margin-bottom: 10px !important;
    }

    .sectionHeading h2,
    #category-heading {
      font-size: 1.25rem !important;
      font-weight: 800 !important;
      margin: 2px 0 0 0 !important;
    }

    .resetLink {
      font-size: 0.72rem !important;
      padding: 4px 8px !important;
      border-radius: 6px !important;
      background: rgba(255, 255, 255, 0.08) !important;
    }

    .categoryGrid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 6px !important;
      width: 100% !important;
    }

    .categoryTile {
      padding: 8px 4px !important;
      border-radius: 12px !important;
      min-height: 76px !important;
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 3px !important;
      text-align: center !important;
      background: rgba(15, 23, 42, 0.75) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    .categoryArt {
      width: 28px !important;
      height: 28px !important;
      border-radius: 8px !important;
      font-size: 13px !important;
      margin-bottom: 2px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    .categoryTile span {
      font-size: 0.72rem !important;
      font-weight: 700 !important;
      line-height: 1.15 !important;
      color: #FFFFFF !important;
      -webkit-text-fill-color: #FFFFFF !important;
    }

    .categoryTile small {
      font-size: 0.62rem !important;
      color: #94a3b8 !important;
      opacity: 0.8 !important;
    }

    /* Trust Strip / Bottom Feature Cards */
    .efferdFeaturesBlock {
      display: grid !important;
      grid-template-columns: 1fr !important;
      gap: 8px !important;
      margin: 20px 0 !important;
    }

    .efferdFeatureCard {
      padding: 10px 12px !important;
      border-radius: 12px !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      background: rgba(15, 23, 42, 0.75) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
    }

    .efferdIconBadge {
      width: 32px !important;
      height: 32px !important;
      border-radius: 8px !important;
      flex-shrink: 0 !important;
    }

    .efferdFeatureContent p {
      font-size: 0.84rem !important;
      font-weight: 700 !important;
      margin: 0 !important;
      color: #FFFFFF !important;
    }

    .efferdFeatureContent small {
      font-size: 0.72rem !important;
      color: #94a3b8 !important;
      margin: 0 !important;
    }

    .storesGrid {
      grid-template-columns: 1fr !important;
      gap: 12px !important;
    }

    .storeCard {
      padding: 14px !important;
      border-radius: 16px !important;
    }

    .storeCard h3 {
      font-size: 1.1rem !important;
    }

    .storeCard p {
      font-size: 0.85rem !important;
      line-height: 1.4 !important;
      color: #F1F5F9 !important;
      -webkit-text-fill-color: #F1F5F9 !important;
    }
  }

  @media (max-width: 380px) {
    .heroTitleClassical,
    .hero h1 {
      font-size: 2.1rem !important;
    }
    .glassCard3D b {
      font-size: 0.7rem !important;
    }
    .categoryGrid {
      grid-template-columns: repeat(3, 1fr) !important;
      gap: 4px !important;
    }
    .categoryTile {
      padding: 6px 2px !important;
      min-height: 70px !important;
    }
  }
`;

const categories: Category[] = [
  { name: "Salon", icon: "✂", tone: "coral" },
  { name: "Grocery", icon: "◒", tone: "green" },
  { name: "Clinic", icon: "+", tone: "blue" },
  { name: "Stationery", icon: "✎", tone: "yellow" },
  { name: "Pharmacy", icon: "✚", tone: "mint" },
  { name: "Bakery", icon: "♨", tone: "peach" },
  { name: "Repair", icon: "⚙", tone: "lilac" },
  { name: "Pet care", icon: "●", tone: "sky" },
  { name: "Fitness", icon: "↔", tone: "lime" },
  { name: "Café", icon: "☕", tone: "sand" },
];

const stores: Store[] = [
  {
    id: 1,
    name: "Glow & Go Salon",
    category: "Salon",
    icon: "✂",
    address: "B-42, Main Market Road, Your Locality, Loni, Ghaziabad",
    shortAddress: "Main Market Road",
    rating: 4.8,
    reviews: 214,
    distance: 0.4,
    walk: "5 min walk",
    open: true,
    hours: "Open until 8:30 PM",
    tone: "coral",
    services: ["Haircut", "Styling", "Facial"],
  },
  {
    id: 2,
    name: "FreshBasket Grocers",
    category: "Grocery",
    icon: "◒",
    address: "MM-18, Your Locality, Loni, Ghaziabad",
    shortAddress: "Main Market",
    rating: 4.6,
    reviews: 389,
    distance: 0.7,
    walk: "9 min walk",
    open: true,
    hours: "Open until 10:00 PM",
    tone: "green",
    services: ["Fresh produce", "Daily needs", "Delivery"],
  },
  {
    id: 3,
    name: "Aarogya Family Clinic",
    category: "Clinic",
    icon: "+",
    address: "C-215, Shiv Chowk Road, Your Locality, Loni, Ghaziabad",
    shortAddress: "Shiv Chowk Road",
    rating: 4.9,
    reviews: 156,
    distance: 0.9,
    walk: "12 min walk",
    open: true,
    hours: "Open until 7:00 PM",
    tone: "blue",
    services: ["General care", "Pediatrics", "Diagnostics"],
  },
  {
    id: 4,
    name: "Paper Trail Stationery",
    category: "Stationery",
    icon: "✎",
    address: "A-9, Mangal Bazaar Road, Your Locality, Loni, Ghaziabad",
    shortAddress: "Mangal Bazaar Road",
    rating: 4.7,
    reviews: 98,
    distance: 1.1,
    walk: "14 min walk",
    open: false,
    hours: "Opens tomorrow at 9:00 AM",
    tone: "yellow",
    services: ["School supplies", "Printing", "Art materials"],
  },
  {
    id: 5,
    name: "WellSpring Pharmacy",
    category: "Pharmacy",
    icon: "✚",
    address: "D-33, Main Market, Your Locality, Loni, Ghaziabad",
    shortAddress: "Main Market",
    rating: 4.7,
    reviews: 271,
    distance: 0.6,
    walk: "8 min walk",
    open: true,
    hours: "Open 24 hours",
    tone: "mint",
    services: ["Medicines", "Wellness", "Home delivery"],
  },
  {
    id: 6,
    name: "Oven & Crumb Bakery",
    category: "Bakery",
    icon: "♨",
    address: "B-66, 25 Foota Road, Your Locality, Loni, Ghaziabad",
    shortAddress: "25 Foota Road",
    rating: 4.8,
    reviews: 342,
    distance: 1.2,
    walk: "15 min walk",
    open: true,
    hours: "Open until 9:30 PM",
    tone: "peach",
    services: ["Fresh bread", "Cakes", "Coffee"],
  },
  {
    id: 7,
    name: "QuickFix Mobile Repair",
    category: "Repair",
    icon: "⚙",
    address: "A-401, Mangal Bazaar Road, Your Locality, Loni, Ghaziabad",
    shortAddress: "Mangal Bazaar Road",
    rating: 4.5,
    reviews: 124,
    distance: 1.4,
    walk: "18 min walk",
    open: true,
    hours: "Open until 8:00 PM",
    tone: "lilac",
    services: ["Phone repair", "Accessories", "Same-day service"],
  },
  {
    id: 8,
    name: "Paw & Whisker Pet Care",
    category: "Pet care",
    icon: "●",
    address: "C-25, Shani Bazaar Road, Your Locality, Loni, Ghaziabad",
    shortAddress: "Shani Bazaar Road",
    rating: 4.9,
    reviews: 181,
    distance: 1.6,
    walk: "20 min walk",
    open: false,
    hours: "Opens tomorrow at 8:30 AM",
    tone: "sky",
    services: ["Grooming", "Vet consult", "Pet supplies"],
  },
  {
    id: 9,
    name: "MoveWell Fitness Studio",
    category: "Fitness",
    icon: "↔",
    address: "D-77, Shiv Chowk Road, Your Locality, Loni, Ghaziabad",
    shortAddress: "Shiv Chowk Road",
    rating: 4.8,
    reviews: 205,
    distance: 1.0,
    walk: "13 min walk",
    open: true,
    hours: "Open until 10:00 PM",
    tone: "lime",
    services: ["Strength", "Yoga", "Personal training"],
  },
  {
    id: 10,
    name: "Third Place Café",
    category: "Café",
    icon: "☕",
    address: "MM-4, Main Market, Your Locality, Loni, Ghaziabad",
    shortAddress: "Main Market",
    rating: 4.6,
    reviews: 417,
    distance: 1.8,
    walk: "7 min ride",
    open: true,
    hours: "Open until 11:00 PM",
    tone: "sand",
    services: ["Coffee", "Quick bites", "Work-friendly"],
  },
];

type SortMode = "all" | "open" | "nearest" | "rated" | "newest";
type Accent = "royal" | "navy" | "cyan";
type Density = "comfortable" | "compact";
type ThemeMode = "light" | "dark";

export default function Home() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("all");
  const [saved, setSaved] = useState<Array<string | number>>([]);
  const [catalogStores, setCatalogStores] = useState<Store[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<Category[]>(categories.filter((item) => !["Clinic", "Pharmacy", "Pet care"].includes(item.name)));
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPage, setNextPage] = useState(2);
  const [hasMore, setHasMore] = useState(false);
  const [userRole, setUserRole] = useState<"admin" | "store_owner" | "customer" | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [accent, setAccent] = useState<Accent>("royal");
  const [density, setDensity] = useState<Density>("comfortable");
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [areaFilter, setAreaFilter] = useState("");
  const [pinFilter, setPinFilter] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("");
  const [currentCoords, setCurrentCoords] = useState({ latitude: 28.7381, longitude: 77.2669 });
  const [locationLabel, setLocationLabel] = useState("Your Locality");
  const [customizing, setCustomizing] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [toast, setToast] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    let scrollTicking = false;
    const handleScroll = () => {
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          scrollTicking = false;
        });
      }
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("kynisto-preferences");
    if (!stored) return;
    try {
      const preferences = JSON.parse(stored) as {
        accent?: Accent;
        density?: Density;
        themeMode?: ThemeMode;
      };
      if (preferences.accent) setAccent(preferences.accent);
      if (preferences.density) setDensity(preferences.density);
      if (preferences.themeMode) setThemeMode(preferences.themeMode);
    } catch {
      window.localStorage.removeItem("kynisto-preferences");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSessionAndCategories() {
      try {
        const supabase = await getSupabaseBrowserClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          syncSupabaseAccessCookie(session);
        }
      } catch {
        // Continue if Supabase browser client fails to load or initialize
      }

      if (!active) return;

      try {
        const [categoryData, sessionData] = await Promise.all([
          apiFetch<{ items: Array<{ name: string; icon?: string; storeCount?: number }> }>("/api/categories"),
          apiFetch<{ user: { id: string; role: "admin" | "store_owner" | "customer" } | null }>("/api/auth/me"),
        ]);
        if (!active) return;
        const palette = ["coral", "green", "blue", "yellow", "mint", "peach", "lilac", "sky", "lime", "sand"];
        setCatalogCategories(categoryData.items.map((item, index) => ({
          name: item.name,
          icon: item.icon ?? "⌖",
          tone: palette[index % palette.length],
          storeCount: Number(item.storeCount ?? 0),
        })));
        setUserRole(sessionData.user?.role ?? null);
        setUserId(sessionData.user?.id ?? null);
        if (sessionData.user?.role === "customer" || sessionData.user?.role === "admin") {
          const favoriteData = await apiFetch<{ items: Array<{ storeId: string }> }>("/api/favorites");
          if (active) setSaved(favoriteData.items.map((item) => item.storeId));
        }
      } catch {
        // Fall back gracefully on request failure
      }
    }

    void loadSessionAndCategories();

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCatalogLoading(true);
      const parameters = new URLSearchParams({
        limit: "24",
        page: "1",
        lat: String(currentCoords.latitude),
        lng: String(currentCoords.longitude),
      });
      if (query.trim()) parameters.set("q", query.trim());
      if (category !== "All") parameters.set("category", category);
      if (areaFilter.trim()) parameters.set("area", areaFilter.trim());
      if (pinFilter.trim()) parameters.set("pin", pinFilter.trim());
      if (businessTypeFilter.trim()) parameters.set("type", businessTypeFilter.trim());
      if (sortMode === "open") parameters.set("openNow", "true");
      if (sortMode === "nearest") parameters.set("sort", "nearest");
      if (sortMode === "rated") parameters.set("sort", "rated");
      if (sortMode === "newest") parameters.set("sort", "newest");
      try {
        const response = await fetch(`/api/stores?${parameters}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Unable to load nearby stores.");
        const data = await response.json() as {
          items: Array<Store & { services?: string[] }>;
          pagination: { total: number; hasMore: boolean };
        };
        const seen = new Set<string | number>();
        const uniqueItems = data.items.filter((store) => {
          const key = store.id ?? store.slug;
          if (!key || seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setCatalogStores(uniqueItems.map((store) => ({ ...store, services: store.services ?? [] })));
        setCatalogTotal(data.pagination.total);
        setHasMore(data.pagination.hasMore);
        setNextPage(2);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          const fallbackStores = stores.filter((store) => !["Clinic", "Pharmacy", "Pet care"].includes(store.category));
          setCatalogStores(fallbackStores);
          setCatalogTotal(fallbackStores.length);
        }
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [areaFilter, businessTypeFilter, category, currentCoords, pinFilter, query, sortMode]);

  useEffect(() => {
    window.localStorage.setItem(
      "kynisto-preferences",
      JSON.stringify({ accent, density, themeMode }),
    );
  }, [accent, density, themeMode]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCustomizing(false);
      setSelectedStore(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const results = useMemo(() => {
    const seen = new Set<string | number>();
    const uniqueCatalog = catalogStores.filter((store) => {
      const key = store.id ?? store.slug;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const normalized = query.trim().toLowerCase();
    const filtered = uniqueCatalog.filter((store) => {
      const matchesCategory = category === "All" || store.category === category;
      const haystack = `${store.name} ${store.category} ${store.address} ${(store.services || []).join(" ")}`.toLowerCase();
      const matchesQuery = !normalized || haystack.includes(normalized);
      const matchesOpen = sortMode !== "open" || store.open;
      return matchesCategory && matchesQuery && matchesOpen;
    });

    if (sortMode === "nearest") {
      return [...filtered].sort((a, b) => a.distance - b.distance);
    }
    if (sortMode === "rated") {
      return [...filtered].sort((a, b) => b.rating - a.rating);
    }
    if (sortMode === "newest") {
      return [...filtered].sort((a, b) => ((b as any).createdAt ?? 0) - ((a as any).createdAt ?? 0));
    }
    return filtered;
  }, [catalogStores, category, query, sortMode]);

  const toggleSaved = async (store: Store) => {
    if (userRole !== "customer" && userRole !== "admin") {
      window.location.assign(`/login?returnTo=${encodeURIComponent(store.slug ? `/stores/${store.slug}` : "/")}`);
      return;
    }
    const isSaved = saved.includes(store.id);
    setSaved((current) =>
      isSaved ? current.filter((id) => id !== store.id) : [...current, store.id],
    );
    setToast(isSaved ? `${store.name} removed from saved` : `${store.name} saved`);
    try {
      await apiFetch("/api/favorites", {
        method: isSaved ? "DELETE" : "POST",
        json: { storeId: String(store.id) },
      });
    } catch (error) {
      setSaved((current) => isSaved ? [...current, store.id] : current.filter((id) => id !== store.id));
      setToast(error instanceof Error ? error.message : "Could not update saved places.");
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    const parameters = new URLSearchParams({
      limit: "24",
      page: String(nextPage),
      lat: String(currentCoords.latitude),
      lng: String(currentCoords.longitude),
    });
    if (query.trim()) parameters.set("q", query.trim());
    if (category !== "All") parameters.set("category", category);
    if (areaFilter.trim()) parameters.set("area", areaFilter.trim());
    if (pinFilter.trim()) parameters.set("pin", pinFilter.trim());
    if (businessTypeFilter.trim()) parameters.set("type", businessTypeFilter.trim());
    if (sortMode === "open") parameters.set("openNow", "true");
    if (["nearest", "rated", "newest"].includes(sortMode)) parameters.set("sort", sortMode);
    try {
      const data = await apiFetch<{
        items: Array<Store & { services?: string[] }>;
        pagination: { hasMore: boolean };
      }>(`/api/stores?${parameters}`);
      setCatalogStores((current) => {
        const existingKeys = new Set(current.map((s) => String(s.id ?? s.slug)));
        const newItems = data.items
          .filter((s) => !existingKeys.has(String(s.id ?? s.slug)))
          .map((store) => ({ ...store, services: store.services ?? [] }));
        return [...current, ...newItems];
      });
      setHasMore(data.pagination.hasMore);
      setNextPage((page) => page + 1);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Could not load more places.");
    } finally {
      setLoadingMore(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setToast("Location services are not supported on this device.");
      return;
    }
    setToast("Finding nearby businesses...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentCoords({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationLabel("Your current location");
        setSortMode("nearest");
        setToast("Showing businesses nearest to you.");
      },
      () => setToast("Location access was not enabled. Using Your Locality."),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const resetFilters = () => {
    setQuery("");
    setCategory("All");
    setSortMode("all");
    setAreaFilter("");
    setPinFilter("");
    setBusinessTypeFilter("");
  };

  return (
    <main className={`site theme-${accent} density-${density} mode-${themeMode}`}><style dangerouslySetInnerHTML={{ __html: modernCleanTechStyles }} />
      <SubscriptionExpiryBanner />
      <WelcomeRewardModal userRole={userRole} userId={userId} />
      <VideoBackground />
      <header className={`topbar ${isScrolled ? "topbarScrolled" : ""}`}>
        <a className="brand" href="#top" aria-label="Kynisto home"><KynistoLogo showTagline={false} /></a>

        <button className="locationPill" type="button" aria-label="Use current location" onClick={useCurrentLocation}>
          <span className="locationDot" aria-hidden="true" />
          <span>
            <small>Your locality</small>
            <strong>{locationLabel}</strong>
          </span>
          <span aria-hidden="true">⌄</span>
        </button>

        <div className="headerActions">
          <Link className="textButton accountButton" href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"}>
            {userRole === "admin" ? "Admin Panel" : userRole === "store_owner" ? "Owner Dashboard" : userRole === "customer" ? "My Account" : "Log in"}
          </Link>
          <Link className="textButton accountButton" href="/products">Products</Link>
          <Link className="textButton accountButton" href="/healthcare">Healthcare</Link>
          <Link className="textButton accountButton" href="/services">Services</Link>
          <button
            className="textButton savedButton"
            type="button"
            onClick={() => {
              if (userRole !== "customer" && userRole !== "admin") {
                window.location.assign("/login?returnTo=%2Faccount%3Ftab%3Dfavorites");
                return;
              }
              setCategory("All");
              setQuery("");
              setSortMode("all");
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
              setToast(saved.length ? `${saved.length} saved place${saved.length === 1 ? "" : "s"}` : "No saved places yet");
            }}
          >
            <Icons.Heart />
            Saved <b>{saved.length}</b>
          </button>
          <button className="customizeButton" type="button" onClick={() => setCustomizing(true)}>
            <span className="sliders" aria-hidden="true">☷</span>
            Customize
          </button>
          <div className="mobileNav" style={{ display: "inline-block" }}>
            <button
              type="button"
              className="mobileNavBtn"
              aria-label="Open Kynisto navigation"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
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
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.25)",
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
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation Drawer"
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
          }}
        >
          {/* Top header row inside mobile drawer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <Link href="/" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
              <KynistoLogo showTagline={false} />
            </Link>
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={() => setMobileOpen(false)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#FFFFFF",
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
          <button
            type="button"
            onClick={() => {
              useCurrentLocation();
              setMobileOpen(false);
            }}
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
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5722", boxShadow: "0 0 10px #FF5722", display: "inline-block" }} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "10px", color: "#FF8A00", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Locality</span>
                <span style={{ fontSize: "14px", color: "#FFFFFF", fontWeight: 700 }}>{locationLabel}</span>
              </div>
            </div>
            <span style={{ fontSize: "13px", color: "#FF5722", fontWeight: 700 }}>Change 📍</span>
          </button>

          {/* Navigation Links list */}
          <nav aria-label="Mobile navigation" style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span>Homepage</span>
              <span style={{ opacity: 0.5 }}>→</span>
            </Link>

            <Link
              href="/products"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span>Products</span>
              <span style={{ opacity: 0.5 }}>→</span>
            </Link>

            <Link
              href="/healthcare"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span>Healthcare</span>
              <span style={{ opacity: 0.5 }}>→</span>
            </Link>

            <Link
              href="/services"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 600,
              }}
            >
              <span>Services</span>
              <span style={{ opacity: 0.5 }}>→</span>
            </Link>

            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 122, 0, 0.12)",
                border: "1px solid rgba(255, 122, 0, 0.4)",
                color: "#FF7A00",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              <span>Pricing &amp; Plans</span>
              <span>⚡</span>
            </Link>

            <Link
              href={userRole ? (userRole === "admin" ? "/admin" : userRole === "store_owner" ? "/owner" : "/account") : "/login"}
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #FF5722 0%, #E53935 100%)",
                color: "#FFFFFF",
                textDecoration: "none",
                fontSize: "15px",
                fontWeight: 700,
                boxShadow: "0 4px 16px rgba(255, 87, 34, 0.4)",
                marginTop: "6px",
              }}
            >
              <span>
                {userRole === "admin" ? "Admin Panel" : userRole === "store_owner" ? "Owner Dashboard" : userRole === "customer" ? "My Account" : "Dashboard / Log in"}
              </span>
              <span>👤</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                if (userRole !== "customer" && userRole !== "admin") {
                  window.location.assign("/login?returnTo=%2Faccount%3Ftab%3Dfavorites");
                  return;
                }
                setCategory("All");
                setQuery("");
                setSortMode("all");
                document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
                setToast(saved.length ? `${saved.length} saved place${saved.length === 1 ? "" : "s"}` : "No saved places yet");
                setMobileOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#FF5722" }}>♥</span> Saved Places
              </span>
              <b style={{ background: "rgba(255, 87, 34, 0.25)", color: "#FF8A00", border: "1px solid rgba(255, 138, 0, 0.4)", padding: "2px 10px", borderRadius: "12px", fontSize: "12px" }}>
                {saved.length}
              </b>
            </button>

            <button
              type="button"
              onClick={() => {
                setCustomizing(true);
                setMobileOpen(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: "14px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#FFFFFF",
                fontSize: "15px",
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
              }}
            >
              <span>Customize Appearance</span>
              <span>⚙️</span>
            </button>

            {userRole && (
              <button
                type="button"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  marginTop: "6px",
                }}
                onClick={async () => {
                  await apiFetch("/api/auth/logout", { method: "POST" });
                  window.location.href = "/";
                }}
              >
                <span>Sign Out</span>
                <span>🚪</span>
              </button>
            )}
          </nav>
        </div>
      )}

      <section className="hero" id="top" style={{ textAlign: "center", padding: "120px 20px 40px 20px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", minHeight: "90vh", justifyContent: "center" }}>
        <div className="ambientMesh" />
        {/* Apple Ambient Aura Backlight */}
        <div style={{ position: "absolute", top: "15%", width: "600px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,87,34,0.15) 0%, rgba(120,119,198,0.1) 50%, transparent 75%)", filter: "blur(90px)", pointerEvents: "none", zIndex: 1 }} />

        <div className="heroCopy" style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "950px", position: "relative", zIndex: 2, width: "100%" }}>
          {/* Crystal Clear Pure White Hero Title: Kynisto */}
          <h1 className="highContrastText" style={{ 
            fontSize: "clamp(2.2rem, 10.5vw, 9rem)", 
            fontWeight: 850, 
            letterSpacing: "-0.06em", 
            lineHeight: 1, 
            margin: "0 0 20px 0", 
            whiteSpace: "nowrap",
            wordBreak: "keep-all",
            overflowWrap: "normal",
            maxWidth: "100%",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', system-ui, sans-serif"
          }}>
            Kynisto
          </h1>
          
          <p className="highContrastText" style={{ fontSize: "clamp(1.1rem, 3vw, 1.8rem)", fontWeight: 500, margin: "0 0 40px 0", opacity: 0.9, letterSpacing: "-0.01em" }}>
            The infrastructure of efficiency.
          </p>

          <div className="floatingCardsContainer" style={{ position: "relative", zIndex: 10, pointerEvents: "auto" }}>
            <Link href="/wallet" className="glassCard3D" style={{ cursor: "pointer", pointerEvents: "auto", position: "relative", zIndex: 10 }}>
              <Icons.Star />
              <b>Loyalty Card</b>
            </Link>
            <Link href="/healthcare" className="glassCard3D" style={{ cursor: "pointer", pointerEvents: "auto", position: "relative", zIndex: 10 }}>
              <Icons.Clock />
              <b>Live Queue &amp; Doctor Appt</b>
            </Link>
            <Link
              href="/dashboard"
              className="glassCard3D"
              style={{ cursor: "pointer", pointerEvents: "auto", position: "relative", zIndex: 10 }}
              onClick={(e) => {
                // Ensure instant navigation even if event bubbling is intercepted by 3D transform layers
                if (typeof window !== "undefined") {
                  window.location.href = "/dashboard";
                }
              }}
            >
              <Icons.Search />
              <b>Dashboard</b>
            </Link>
          </div>

          <form
            className="searchBox heroSearchBox"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <span className="searchIcon" aria-hidden="true" style={{ paddingLeft: "10px" }}><Icons.Search /></span>
            <label className="srOnly" htmlFor="store-search">Search nearby stores</label>
            <input
              id="store-search"
              className="heroSearchInput highContrastText"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try 'restaurant with dishes under 99' or 'cycle brake repair'..."
            />
            {query && (
              <button className="clearSearch highContrastText" type="button" aria-label="Clear search" onClick={() => setQuery("")}>×</button>
            )}
            <button className="searchSubmit heroSearchButton" type="submit">Search</button>
          </form>

          {/* Smart Conversational Search Suggestion Chips */}
          <div className="smartSearchChipsContainer" role="region" aria-label="Smart Search suggestions">
            <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600, flexShrink: 0, alignSelf: "center", paddingRight: "4px" }}>💡 Smart:</span>
            {[
              "Restaurant with dishes under 99",
              "Cycle brake repair under 50rs",
              "5 star clinic near me",
              "Home electrician near me",
            ].map((promptText) => (
              <button
                key={promptText}
                className="smartSearchPromptChip"
                type="button"
                onClick={() => {
                  setQuery(promptText);
                  document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.07)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  color: "#cbd5e1",
                  borderRadius: "20px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 87, 34, 0.18)";
                  e.currentTarget.style.borderColor = "#FF5722";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.color = "#cbd5e1";
                }}
              >
                {promptText}
              </button>
            ))}
          </div>

          <div className="quickProof" aria-label="Kynisto highlights" style={{ marginTop: "16px" }}>
            <span className="highContrastText"><b>100+</b> Places</span>
            <span className="highContrastText"><b>20</b> Categories</span>
            <span className="highContrastText"><b>Live</b> Status</span>
          </div>

          {/* Vertical Guide Line indicating scroll */}
          <div style={{ width: "2px", height: "80px", background: "linear-gradient(180deg, var(--text-primary) 0%, transparent 100%)", margin: "60px auto 0 auto", opacity: 0.3 }} />
        </div>
      </section>

      {/* Efferd Features Bento Grid above Category Section */}
      <EfferdFeatures6 />

      <section className="categorySection" aria-labelledby="category-heading">
        <div className="sectionHeading compactHeading">
          <div>
            <span className="kicker">Browse by need</span>
            <h2 id="category-heading">What are you looking for?</h2>
          </div>
          <button className="resetLink" type="button" onClick={resetFilters}>Reset filters <span aria-hidden="true">↗</span></button>
        </div>
        <div className="categoryGrid">
          {catalogCategories.map((item) => {
            const active = category === item.name;
            return (
              <button
                key={item.name}
                className={`categoryTile tone-${item.tone}`}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setCategory(active ? "All" : item.name);
                  document.getElementById("places")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <span className="categoryArt" aria-hidden="true"><i /><b>{item.icon}</b></span>
                <span>{item.name}</span>
                <small>{item.storeCount ?? catalogStores.filter((store) => store.category === item.name).length} nearby</small>
              </button>
            );
          })}
        </div>
      </section>



      {/* Places Section */}

      <section className="placesSection" id="places" aria-labelledby="places-heading">
        <div className="sectionHeading placesHeading">
          <div>
            <span className="kicker" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Handy places around you</span>
            <h2 id="places-heading" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{category === "All" ? "Popular near you" : `${category} near you`}</h2>
          </div>
          <div className="filterGroup" aria-label="Sort and filter stores">
            {([
              ["all", "All places"],
              ["open", "Open now"],
              ["nearest", "Nearest"],
              ["rated", "Top rated"],
              ["newest", "Newest"],
            ] as [SortMode, string][]).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={sortMode === value}
                onClick={() => setSortMode(value)}
              >
                {value === "open" && <span className="openDot" aria-hidden="true" />}
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="advancedFilters" aria-label="Detailed business filters">
          <label>
            <span>Area or neighbourhood</span>
            <input value={areaFilter} onChange={(event) => setAreaFilter(event.target.value)} placeholder="Search area..." />
          </label>
          <label>
            <span>PIN code</span>
            <input value={pinFilter} onChange={(event) => setPinFilter(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="201102" />
          </label>
          <label>
            <span>Business type</span>
            <input value={businessTypeFilter} onChange={(event) => setBusinessTypeFilter(event.target.value)} placeholder="Clinic, bakery, repair..." />
          </label>
        </div>

        <div className="sectionHeading" style={{ marginTop: "36px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <span className="kicker" style={{ color: "#FFFFFF", fontWeight: 700 }}>📍 Verified Local Services</span>
            <h2 className="highContrastText" style={{ fontSize: "1.8rem", fontWeight: 800, margin: "4px 0 0 0", color: "#FFFFFF" }}>Recommended Stores Nearby Me</h2>
          </div>
          <div className="resultsBar" style={{ margin: 0 }}>
            <span><b>{catalogTotal}</b> places found</span>
          </div>
        </div>

        {catalogLoading ? (
          <div className="storeGrid resultSkeleton" aria-label="Loading nearby businesses" aria-busy="true">
            {Array.from({ length: 6 }, (_, index) => <article className="storeCard" key={index}><span /><div><i /><i /><i /></div></article>)}
          </div>
        ) : results.length > 0 ? (
          <>
          <div className="storeGrid">
            {results.map((store) => (
              <article className="storeCard" key={store.id}>
                <button
                  type="button"
                  className={`storeVisual tone-${store.tone}`}
                  aria-label={`View ${store.name} details`}
                  onClick={() => setSelectedStore(store)}
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  {store.bannerUrl || store.logoUrl ? (
                    <img
                      src={store.bannerUrl || store.logoUrl}
                      alt={store.name}
                      loading="lazy"
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <>
                      <span className="visualPattern" aria-hidden="true" />
                      <span className="storeGlyph" aria-hidden="true">{store.icon}</span>
                    </>
                  )}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(11,15,23,0.7) 0%, transparent 70%)", pointerEvents: "none" }} />
                  <span className={`statusBadge ${store.open ? "isOpen" : "isClosed"}`}>{store.open ? "Open now" : "Closed"}</span>
                  <span className="distanceBadge">{store.distance.toFixed(1)} km</span>
                </button>
                <div className="storeBody">
                  <div className="storeTopline">
                    <span className="categoryLabel">{store.category}</span>
                    <span className="rating" aria-label={`${store.rating} out of 5 stars`}><span style={{display: "flex", alignItems: "center", gap: "2px"}}><Icons.Star /> <b>{store.rating}</b></span> ({store.reviews})</span>
                  </div>
                  <h3>{store.name}</h3>
                  <p className="address"><Icons.Location /> {store.address}</p>
                  <div className="storeMeta">
                    <span>{store.walk}</span>
                    <i aria-hidden="true" />
                    <span>{store.hours}</span>
                  </div>
                  <div className="cardActions">
                    {store.slug ? <Link className="detailsButton" href={`/stores/${store.slug}`}>View profile</Link> : <button className="detailsButton" type="button" onClick={() => setSelectedStore(store)}>View details</button>}
                    <button
                      className={`saveIcon ${saved.includes(store.id) ? "isSaved" : ""}`}
                      type="button"
                      aria-label={`${saved.includes(store.id) ? "Remove" : "Save"} ${store.name}`}
                      aria-pressed={saved.includes(store.id)}
                      onClick={() => void toggleSaved(store)}
                    >
                      <Icons.Heart />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {hasMore && (
            <div className="loadMoreRow">
              <button type="button" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? "Loading more places..." : "Show more nearby places"}
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="emptyState">
            <div aria-hidden="true">⌕</div>
            <h3 style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>No places match that search</h3>
            <p style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Try another service or clear your current filters.</p>
            <button type="button" onClick={resetFilters}>Show all nearby places</button>
          </div>
        )}
      </section>





      {/* Exact Location, Live Hours & Ratings, Saved Favorites features strip */}
      <section className="trustStrip efferdFeaturesBlock" aria-label="Why use Kynisto">
        <div className="efferdFeatureCard featureCardLocation">
          <div className="efferdIconBadge">
            <span className="radarPulse" />
            <Icons.Location />
          </div>
          <div className="efferdFeatureContent">
            <p><b>Exact Location</b></p>
            <small>Verified GPS &amp; local directions</small>
          </div>
        </div>

        <div className="efferdFeatureCard featureCardHours">
          <div className="efferdIconBadge">
            <span className="liveStatusDot" />
            <span aria-hidden="true" className="checkMark">✓</span>
          </div>
          <div className="efferdFeatureContent">
            <p><b>Live Hours &amp; Ratings</b></p>
            <small>Real-time open status &amp; reviews</small>
          </div>
        </div>

        <div className="efferdFeatureCard featureCardFavorites">
          <div className="efferdIconBadge">
            <span className="heartAura" />
            <Icons.Heart />
          </div>
          <div className="efferdFeatureContent">
            <p><b>Saved Favorites</b></p>
            <small>1-click access to saved places</small>
          </div>
        </div>
      </section>

      <EfferdFooter3 />

      {customizing && (
        <div className="modalLayer" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setCustomizing(false)}>
          <aside className="customizePanel" role="dialog" aria-modal="true" aria-labelledby="customize-title">
            <div className="modalHeader">
              <div><span className="kicker">Make it yours</span><h2 id="customize-title">Customize Kynisto</h2></div>
              <button type="button" className="closeButton" aria-label="Close customization" onClick={() => setCustomizing(false)}>×</button>
            </div>
            <p className="panelIntro">Your choices stay on this device.</p>

            <fieldset>
              <legend>Accent colour</legend>
              <div className="swatchRow">
                {([
                  ["royal", "Royal blue"],
                  ["navy", "Dark navy"],
                  ["cyan", "Cyan"],
                ] as [Accent, string][]).map(([value, label]) => (
                  <button key={value} className={`swatch swatch-${value}`} type="button" aria-pressed={accent === value} onClick={() => setAccent(value)}>
                    <i aria-hidden="true" /><span>{label}</span><b aria-hidden="true">✓</b>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Appearance</legend>
              <div className="densityRow themeModeRow">
                {([
                  ["light", "Light", "Warm cream and paper surfaces"],
                  ["dark", "Dark", "Low-glare evening browsing"],
                ] as [ThemeMode, string, string][]).map(([value, label, help]) => (
                  <button key={value} type="button" aria-pressed={themeMode === value} onClick={() => setThemeMode(value)}>
                    <span className={`themeModeIcon ${value}`} aria-hidden="true" />
                    <span><b>{label}</b><small>{help}</small></span>
                    <em aria-hidden="true">&#10003;</em>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Card spacing</legend>
              <div className="densityRow">
                {([
                  ["comfortable", "Comfortable", "Roomier cards and details"],
                  ["compact", "Compact", "See more places at once"],
                ] as [Density, string, string][]).map(([value, label, help]) => (
                  <button key={value} type="button" aria-pressed={density === value} onClick={() => setDensity(value)}>
                    <span className={`densityIcon densityIcon-${value}`} aria-hidden="true"><i /><i /><i /></span>
                    <span><b>{label}</b><small>{help}</small></span>
                    <em aria-hidden="true">✓</em>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="savedSummary"><Icons.Heart /><p><b>{saved.length} saved place{saved.length === 1 ? "" : "s"}</b><small>Signed-in favourites stay securely linked to your account.</small></p></div>
            <button className="doneButton" type="button" onClick={() => setCustomizing(false)}>Done</button>
          </aside>
        </div>
      )}

      {selectedStore && (
        <div className="modalLayer detailsLayer" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && setSelectedStore(null)}>
          <section className="detailModal" role="dialog" aria-modal="true" aria-labelledby="store-detail-title">
            <div className={`detailHero tone-${selectedStore.tone}`}>
              <span className="visualPattern" aria-hidden="true" />
              <span className="detailGlyph" aria-hidden="true">{selectedStore.icon}</span>
              <button type="button" className="closeButton lightClose" aria-label="Close store details" onClick={() => setSelectedStore(null)}>×</button>
              <span className={`statusBadge ${selectedStore.open ? "isOpen" : "isClosed"}`}>{selectedStore.open ? "Open now" : "Closed"}</span>
            </div>
            <div className="detailBody">
              <span className="categoryLabel">{selectedStore.category}</span>
              <h2 id="store-detail-title">{selectedStore.name}</h2>
              <div className="detailRating"><b>★ {selectedStore.rating}</b><span>{selectedStore.reviews} local reviews</span><i /> <span>{selectedStore.distance.toFixed(1)} km away</span></div>
              <div className="addressBlock"><Icons.Location /><p><small>Full address</small><b>{selectedStore.address}</b></p></div>
              <div className="hoursBlock"><Icons.Clock /><p><small>Today</small><b>{selectedStore.hours}</b></p></div>
              <div className="serviceTags">{selectedStore.services.map((service) => <span key={service}>{service}</span>)}</div>
              <div className="detailActions">
                {selectedStore.slug && <Link href={`/stores/${selectedStore.slug}`}>Full profile <span aria-hidden="true">→</span></Link>}
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStore.address)}`} target="_blank" rel="noreferrer">Get directions <span aria-hidden="true">↗</span></a>
                <button type="button" aria-pressed={saved.includes(selectedStore.id)} onClick={() => void toggleSaved(selectedStore)}>{saved.includes(selectedStore.id) ? <><Icons.Heart /> Saved</> : <><Icons.Heart /> Save place</>}</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="toast" role="status" aria-live="polite">✓ {toast}</div>}
    </main>
  );
}
