"use client";

import { SectionCard } from "./shared";

export function AssumptionsSection({ assumptions }: { assumptions: string[] }) {
  if (!assumptions.length) return null;
  return (
    <SectionCard title="Assumptions">
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {assumptions.map((a, i) => (
          <div key={i} style={{ display: "flex", gap: "10px" }}>
            <span style={{ color: "#6366f1", flexShrink: 0, marginTop: "2px" }}>–</span>
            <span>
              <span style={{
                color: "#64748b",
                fontSize: "11px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginRight: "6px",
              }}>
                Assumed:
              </span>
              {a}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
