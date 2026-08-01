"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  /** Fallback href when there's no navigation history (e.g. direct link). */
  fallback?: string;
  /** Optional label text. Defaults to "Back". */
  label?: string;
  /** Extra inline styles to merge onto the button. */
  style?: React.CSSProperties;
  /** Extra class names. */
  className?: string;
}

/**
 * A smart back-navigation button.
 * – Uses router.back() if the user arrived via in-app navigation.
 * – Falls back to `fallback` href (default "/") when history length <= 1
 *   (i.e. the page was opened directly or in a new tab).
 */
export function BackButton({
  fallback = "/",
  label = "Back",
  style,
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      aria-label="Go back"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "12px",
        border: "1px solid rgba(255,255,255,0.18)",
        background: "rgba(255,255,255,0.08)",
        color: "#FFFFFF",
        fontSize: "13px",
        fontWeight: 600,
        cursor: "pointer",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transition: "background 0.18s, transform 0.15s, box-shadow 0.15s",
        textShadow: "0 1px 6px rgba(0,0,0,0.8)",
        lineHeight: 1,
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.15)";
        (e.currentTarget as HTMLButtonElement).style.transform =
          "translateY(-1px)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 4px 16px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(255,255,255,0.08)";
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {/* Left arrow SVG */}
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
      {label}
    </button>
  );
}
