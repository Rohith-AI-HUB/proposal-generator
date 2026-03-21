type LogoProps = {
  size?: "sm" | "md" | "lg";
};

const SIZE_MAP = {
  sm: { text: "15px", gap: "10px", markSize: 22 },
  md: { text: "18px", gap: "12px", markSize: 26 },
  lg: { text: "24px", gap: "14px", markSize: 32 },
} as const;

export default function Logo({ size = "md" }: LogoProps) {
  const s = SIZE_MAP[size];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: s.gap }}>
      {/* Mark — a minimal document corner-fold icon in the accent colour */}
      <svg
        width={s.markSize}
        height={s.markSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <rect x="3" y="1" width="13" height="17" rx="2"
          stroke="var(--border-strong)" strokeWidth="1.5" />
        <path d="M16 1 L16 6 L21 6"
          stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 1 L3 18 L21 18 L21 6 L16 1 Z"
          stroke="var(--border-strong)" strokeWidth="1.5" strokeLinejoin="round" />
        <line x1="7" y1="9"  x2="14" y2="9"  stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7" y1="12" x2="12" y2="12" stroke="var(--text-3)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* Wordmark */}
      <span style={{
        fontFamily: "var(--font-body)",
        fontSize: s.text,
        fontWeight: 600,
        color: "var(--text-1)",
        letterSpacing: "-0.02em",
        lineHeight: 1,
      }}>
        Proposa<span style={{ color: "var(--accent)" }}>IQ</span>
      </span>
    </div>
  );
}
