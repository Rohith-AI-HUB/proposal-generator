"use client";

import { SectionCard } from "./shared";
import type { TechChoice } from "@/lib/domain/proposal/schema";

export function TechStackSection({ techStack }: { techStack: TechChoice[] }) {
  return (
    <SectionCard title="Tech Stack">
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {techStack.map((t, i) => (
          <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <span style={{
              color: "#64748b",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              minWidth: "80px",
              flexShrink: 0,
              paddingTop: "2px",
            }}>
              {t.layer}
            </span>
            <span>
              <span style={{ fontWeight: 600, color: "#f1f5f9" }}>{t.choice}</span>
              <span style={{ color: "#64748b" }}> — {t.reason}</span>
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
