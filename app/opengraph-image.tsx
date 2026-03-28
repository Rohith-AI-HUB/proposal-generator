import { ImageResponse } from "next/og";

export const alt = "ProposaIQ Upwork reply-rate preview";
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
            "radial-gradient(circle at top left, rgba(216,164,94,0.28), transparent 28%), linear-gradient(135deg, #15110f 0%, #1c1613 54%, #251d17 100%)",
          color: "#f3ebde",
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
            border: "1px solid rgba(216,164,94,0.3)",
            borderRadius: 28,
            padding: "42px 48px",
            background: "rgba(26, 21, 18, 0.82)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontFamily: "Arial, sans-serif",
              color: "#d8a45e",
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
                background: "#d8a45e",
                boxShadow: "0 0 30px rgba(216,164,94,0.45)",
              }}
            />
            Upwork reply sprint
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                fontSize: 76,
                lineHeight: 1.02,
                letterSpacing: -2.8,
                maxWidth: 930,
              }}
            >
              Your proposal is losing in the preview before the client even clicks.
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Arial, sans-serif",
                fontSize: 30,
                lineHeight: 1.35,
                color: "#d0c3b2",
                maxWidth: 900,
              }}
            >
              Paste the job post, add one proof point, and get three sharper hooks
              plus a reply-focused draft built to earn a response.
            </div>
          </div>

          <div style={{ display: "flex", gap: 18, fontFamily: "Arial, sans-serif" }}>
            {[
              "3 ranked hooks",
              "1 matched proof",
              "Paste-ready reply",
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px 22px",
                  borderRadius: 999,
                  border: "1px solid rgba(216,164,94,0.24)",
                  background: "rgba(216,164,94,0.08)",
                  fontSize: 24,
                  color: "#f3ebde",
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
