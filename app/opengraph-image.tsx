import { ImageResponse } from "next/og";

export const alt = "ProposaIQ trust-first proposal drafting preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top left, #f3e3c7 0, rgba(243,227,199,0.12) 28%, transparent 45%), linear-gradient(135deg, #19140f 0%, #201913 55%, #2b2218 100%)",
          color: "#ede7db",
          padding: "56px 64px",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            border: "1px solid rgba(196, 154, 94, 0.35)",
            borderRadius: 28,
            padding: "44px 48px",
            background: "rgba(20, 16, 12, 0.7)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: "Arial, sans-serif",
              color: "#c49a5e",
              fontSize: 28,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "#c49a5e",
                boxShadow: "0 0 32px rgba(196, 154, 94, 0.5)",
              }}
            />
            Trust-first proposal drafts
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                lineHeight: 1.03,
                letterSpacing: -2.8,
                maxWidth: 920,
              }}
            >
              Turn messy client briefs into drafts you can defend.
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Arial, sans-serif",
                fontSize: 30,
                lineHeight: 1.4,
                color: "#cfc4b5",
                maxWidth: 900,
              }}
            >
              ProposaIQ asks follow-up questions first, separates cited facts from
              estimates, and makes uncertainty explicit before you send.
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, fontFamily: "Arial, sans-serif" }}>
            {[
              "Clarify vague briefs",
              "Cited facts and costs",
              "Explicit assumptions",
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 22px",
                  borderRadius: 999,
                  border: "1px solid rgba(196, 154, 94, 0.28)",
                  background: "rgba(196, 154, 94, 0.08)",
                  fontSize: 24,
                  color: "#f3ebdf",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size
  );
}
