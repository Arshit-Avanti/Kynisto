type KynistoLogoProps = {
  className?: string;
  showTagline?: boolean;
  /** 'default' = white wordmark (dark backgrounds), 'dark' = navy wordmark (light backgrounds), 'gradient' = blue gradient wordmark */
  variant?: "default" | "dark" | "gradient";
};

export function KynistoLogo({ className = "", showTagline = false, variant = "default" }: KynistoLogoProps) {
  const wordmarkClass = variant === "dark"
    ? "kynistoWordmark kynistoWordmarkDark"
    : variant === "gradient"
    ? "kynistoWordmark kynistoWordmarkGradient"
    : "kynistoWordmark";
  return (
    <span className={`kynistoLogo ${className}`.trim()} aria-label="Kynisto">
      <svg className="kynistoMark" viewBox="0 0 40 40" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="8" fill="#2563eb" />
        <path d="M14 10v20M14 20l12-10M16 20l10 10" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={wordmarkClass}>
        <b>Kynisto</b>
        {showTagline && <small>Everything Around You, Smarter.</small>}
      </span>
    </span>
  );
}
