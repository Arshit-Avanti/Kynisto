type KynistoLogoProps = {
  className?: string;
  showTagline?: boolean;
};

export function KynistoLogo({ className = "", showTagline = false }: KynistoLogoProps) {
  return (
    <span className={`kynistoLogo ${className}`.trim()} aria-label="Kynisto">
      <svg className="kynistoMark" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill="currentColor" />
        <path d="M20 15v34" fill="none" stroke="white" strokeLinecap="round" strokeWidth="8" />
        <path d="m25 32 18-17" fill="none" stroke="#30d8f2" strokeLinecap="round" strokeWidth="8" />
        <path d="m26 33 19 17" fill="none" stroke="white" strokeLinecap="round" strokeWidth="8" />
      </svg>
      <span className="kynistoWordmark">
        <b>Kynisto</b>
        {showTagline && <small>Everything Around You, Smarter.</small>}
      </span>
    </span>
  );
}
