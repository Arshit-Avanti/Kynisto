import React from "react";

type KynistoLogoProps = {
  className?: string;
  showTagline?: boolean;
  variant?: "default" | "dark" | "gradient";
};

export function KynistoLogo({ className = "", showTagline = false, variant = "default" }: KynistoLogoProps) {
  return (
    <span className={`kynistoLogo inline-flex items-center gap-3 ${className}`.trim()} aria-label="Kynisto">
      <div 
        className="kynistoMark flex items-center justify-center relative rounded-xl w-10 h-10 overflow-hidden backdrop-blur-xl border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-transform hover:scale-105 duration-300"
        style={{ background: "rgba(255, 255, 255, 0.05)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] opacity-20" />
        <svg viewBox="0 0 40 40" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 relative z-10">
          <path d="M14 10v20M14 20l12-10M16 20l10 10" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <defs>
            <linearGradient id="logo-grad" x1="14" y1="10" x2="26" y2="30" gradientUnits="userSpaceOnUse">
              <stop stopColor="#3b82f6" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span className="flex flex-col justify-center leading-none">
        <b className="text-[22px] font-[850] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-[#F8FAFC] drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
          Kynisto
        </b>
        {showTagline && <small className="text-[#3b82f6] text-[9px] font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]">Everything Around You, Smarter.</small>}
      </span>
    </span>
  );
}
