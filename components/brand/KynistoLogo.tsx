import React from "react";

type KynistoLogoProps = {
  className?: string;
  showTagline?: boolean;
  variant?: "default" | "dark" | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
};

export function KynistoLogo({ className = "", showTagline = false, size = "md" }: KynistoLogoProps) {
  const isLarge = size === "lg" || size === "xl";
  const iconDimensions = isLarge ? "h-14 w-14" : "h-11 w-11";
  const textDimensions = isLarge ? "text-[28px]" : "text-[24px]";

  return (
    <span className={`kynistoLogo inline-flex items-center gap-3 ${className}`.trim()} aria-label="Kynisto">
      {/* Clean Transparent App Logo Icon */}
      <img 
        src="/logo.png" 
        alt="Kynisto App Logo" 
        className={`${iconDimensions} object-contain transition-transform hover:scale-105 duration-300 drop-shadow-[0_0_15px_rgba(255,87,34,0.4)]`}
      />

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
