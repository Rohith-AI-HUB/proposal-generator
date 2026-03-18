"use client";

const VERSION = "v1.0.0";
const PHASE = "Phase 1 — Core Tool";

export default function VersionBadge() {
  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        background: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: "999px",
        padding: "6px 14px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
        userSelect: "none",
      }}
    >
      {/* Pulsing dot */}
      <span
        style={{
          width: "7px",
          height: "7px",
          borderRadius: "50%",
          background: "#6366f1",
          boxShadow: "0 0 6px #6366f1",
          animation: "pulse 2s infinite",
          display: "inline-block",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.04em",
          fontFamily: "monospace",
        }}
      >
        {PHASE}
      </span>

      <span
        style={{
          width: "1px",
          height: "12px",
          background: "rgba(255,255,255,0.12)",
          flexShrink: 0,
        }}
      />

      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#6366f1",
          letterSpacing: "0.04em",
          fontFamily: "monospace",
        }}
      >
        {VERSION}
      </span>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
