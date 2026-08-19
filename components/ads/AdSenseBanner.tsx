"use client";

import { useEffect, useRef } from "react";

interface AdSenseBannerProps {
  slotId?: string;
  format?: "auto" | "fluid" | "rectangle" | "horizontal";
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function AdSenseBanner({
  slotId,
  format = "auto",
  responsive = true,
  className = "",
  style = {},
}: AdSenseBannerProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || pushedRef.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        pushedRef.current = true;
      }
    } catch {
      // Ignore initial render push race
    }
  }, []);

  return (
    <div className={`adsense-wrapper overflow-hidden my-4 text-center ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minHeight: "90px", ...style }}
        data-ad-client="ca-pub-9178031569606873"
        data-ad-slot={slotId || ""}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
