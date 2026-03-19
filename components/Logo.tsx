type LogoProps = {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
};

const SIZE_MAP = {
  sm: {
    mark: 42,
    name: "1.1rem",
    tagline: "0.58rem",
    gap: "0.8rem",
  },
  md: {
    mark: 50,
    name: "1.4rem",
    tagline: "0.65rem",
    gap: "0.95rem",
  },
  lg: {
    mark: 62,
    name: "1.85rem",
    tagline: "0.74rem",
    gap: "1.05rem",
  },
} as const;

export default function Logo({
  size = "md",
  showTagline = false,
}: LogoProps) {
  const config = SIZE_MAP[size];

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: config.gap,
      }}
    >
      <svg
        width={config.mark}
        height={config.mark}
        viewBox="0 0 72 72"
        role="img"
        aria-label="ProposaIQ logo mark"
        style={{ flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="proposaiqLogoBg" x1="10" y1="8" x2="62" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#1e1b4b" />
            <stop offset="0.55" stopColor="#3730a3" />
            <stop offset="1" stopColor="#4f46e5" />
          </linearGradient>
          <radialGradient id="proposaiqLogoGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(54 18) rotate(136.169) scale(31.1127)">
            <stop stopColor="#22d3ee" stopOpacity="0.65" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x="4" y="4" width="64" height="64" rx="18" fill="url(#proposaiqLogoBg)" />
        <rect x="4" y="4" width="64" height="64" rx="18" fill="url(#proposaiqLogoGlow)" />
        <rect x="5" y="5" width="62" height="62" rx="17" fill="none" stroke="rgba(255,255,255,0.12)" />

        <rect x="18" y="17" width="27" height="33" rx="8" fill="rgba(226,232,240,0.08)" stroke="rgba(226,232,240,0.18)" />

        <rect x="24" y="20" width="29" height="36" rx="9" fill="#f8fafc" />
        <path d="M45 20 L53 28 H47 C45.895 28 45 27.105 45 26 V20Z" fill="#c7d2fe" />

        <line x1="30" y1="31" x2="45" y2="31" stroke="#4338ca" strokeWidth="2.7" strokeLinecap="round" />
        <line x1="30" y1="37" x2="41" y2="37" stroke="#6366f1" strokeWidth="2.7" strokeLinecap="round" />

        <path
          d="M30 46 L36 40 L40 44 L47 36"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="47" cy="36" r="2.4" fill="#06b6d4" />
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.18rem" }}>
        <span
          style={{
            color: "#f8fafc",
            fontSize: config.name,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          Proposa
          <span style={{ color: "#a5b4fc" }}>IQ</span>
        </span>

        {showTagline ? (
          <span
            style={{
              color: "rgba(148, 163, 184, 0.92)",
              fontSize: config.tagline,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              lineHeight: 1.2,
            }}
          >
            AI Proposal Generator
          </span>
        ) : null}
      </div>
    </div>
  );
}
