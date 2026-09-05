"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

interface CredixInteractiveHeroFeaturesProps {
  query: string;
  setQuery: (q: string) => void;
}

export function CredixInteractiveHeroFeatures({ query, setQuery }: CredixInteractiveHeroFeaturesProps) {
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearchSubmit = (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const trimmed = query.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <div className="w-full relative overflow-hidden max-w-[100vw]">
      {/* 1. HERO SECTION (Perfect Horizontal & Vertical Viewport Centering) */}
      <section
        className="hero"
        id="top"
        style={{
          textAlign: "center",
          padding: isDesktop ? "88px 16px 36px 16px" : "148px 16px 36px 16px",
          minHeight: isDesktop ? "calc(100vh - 100px)" : "auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          position: "relative",
          justifyContent: "center",
          overflow: "visible",
          width: "100%",
          maxWidth: "100vw",
          background: "transparent",
        }}
      >
        <div
          className="heroCopy"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "820px",
            position: "relative",
            zIndex: 2,
            width: "100%",
            boxSizing: "border-box",
            background: "transparent",
            padding: "0 12px",
          }}
        >
          {/* Elegant 2-Line Hero Heading */}
          <h1 className="arise-on-scroll arise-delay-1 text-center mb-4 sm:mb-7 select-none px-2 max-w-full">
            <span className="block text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight leading-tight drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] break-words sm:whitespace-nowrap">
              Life is <span className="italic font-light">Smarter</span>
            </span>
            <span className="block text-3xl sm:text-5xl md:text-6xl font-serif text-white tracking-tight leading-tight mt-0.5 sm:mt-1.5 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)] break-words sm:whitespace-nowrap">
              with Kynisto
            </span>
          </h1>

          {/* Minimalist Neumorphic / Glassmorphic Capsule Search Bar */}
          <form
            className="searchBox heroSearchBox arise-on-scroll arise-delay-3 relative w-full max-w-xl mx-auto p-1.5 sm:p-2 rounded-full bg-slate-900/80 backdrop-blur-2xl border border-white/30 shadow-[0_16px_40px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center transition-all duration-300 hover:border-orange-400/50 focus-within:border-orange-500 focus-within:shadow-[0_16px_45px_rgba(255,122,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.9)] group mb-2 overflow-hidden"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            {/* Subtle Diagonal Specular Sheen */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-60" />

            <label className="sr-only" htmlFor="store-search">Search anything</label>

            {/* Left Embossed Circular Search Disc */}
            <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 shadow-[0_2px_6px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.15)] flex items-center justify-center text-slate-200 shrink-0 transition-transform group-focus-within:scale-105">
              <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-orange-400" />
            </div>

            {/* Subtle Vertical Divider */}
            <div className="relative z-10 w-[1.5px] h-5 sm:h-6 bg-white/20 mx-2 sm:mx-2.5 shrink-0" />

            {/* Clean Input Field */}
            <input
              id="store-search"
              className="relative z-10 flex-1 min-w-0 bg-transparent text-white placeholder:text-slate-300 text-xs sm:text-sm md:text-base px-1 py-1.5 outline-none font-medium"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stores, clinics, doctors, salons, services..."
            />

            {/* Right Vibrant Orange Circular Action Button */}
            <button
              className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/35 hover:shadow-lg hover:shadow-orange-500/55 active:scale-90 hover:scale-105 transition-all flex items-center justify-center shrink-0 cursor-pointer ml-1"
              type="submit"
              aria-label="Search"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white stroke-[2.5]" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
