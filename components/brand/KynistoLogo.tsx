import React from "react";

type KynistoLogoProps = {
  className?: string;
  showTagline?: boolean;
  variant?: "default" | "dark" | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
};

export function KynistoLogo({ className = "", showTagline = false, size = "md" }: KynistoLogoProps) {
  const isLarge = size === "lg" || size === "xl";
  const iconDimensions = isLarge ? "w-14 h-14" : "w-12 h-12";
  const textDimensions = isLarge ? "text-[28px]" : "text-[24px]";

  return (
    <span className={`kynistoLogo inline-flex items-center gap-3.5 ${className}`.trim()} aria-label="Kynisto">
      {/* Large K Icon only from logo */}
      <div 
        className={`kynistoMark flex items-center justify-center relative rounded-2xl ${iconDimensions} overflow-hidden backdrop-blur-xl border border-[#FF5722]/40 shadow-[0_0_25px_rgba(255,87,34,0.45)] transition-transform hover:scale-105 duration-300 bg-[#0B0F17]`}
      >
        <img 
          src="/logo.png" 
          alt="Kynisto K" 
          className="h-[140%] w-auto max-w-none absolute -left-[20%] top-[-20%] object-contain"
        />
      </div>

      <span className="flex flex-col justify-center leading-none">
        <b className={`${textDimensions} font-[900] tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-[#F8FAFC] to-[#CBD5E1] drop-shadow-[0_0_10px_rgba(255,255,255,0.4)]`}>
          Kynisto
        </b>
        {showTagline && (
          <small className="text-[#FF8A00] text-[9.5px] font-extrabold tracking-widest uppercase mt-1 drop-shadow-[0_0_6px_rgba(255,138,0,0.8)]">
            Everything Around You, Smarter.
          </small>
        )}
      </span>
    </span>
  );
}
