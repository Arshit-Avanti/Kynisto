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
        className="kynistoMark flex items-center justify-center relative rounded-xl h-10 overflow-hidden transition-transform hover:scale-105 duration-300"
      >
        <img src="/logo.png" alt="Kynisto Logo" className="h-10 w-auto object-contain rounded-xl" />
      </div>
      {showTagline && (
        <span className="flex flex-col justify-center leading-none">
          <small className="text-[#FF8A00] text-[9px] font-bold tracking-wider uppercase drop-shadow-[0_0_5px_rgba(255,138,0,0.8)]">Everything Around You, Smarter.</small>
        </span>
      )}
    </span>
  );
}
