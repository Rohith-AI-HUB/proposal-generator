"use client";

import { SectionCard, BulletList, SubHeading } from "./shared";
import type { ProposalTimeline } from "@/lib/domain/proposal/schema";

export function TimelineSection({ timeline }: { timeline: ProposalTimeline }) {
  return (
    <SectionCard title="Timeline">
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {timeline.phases.map((ph, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
            <span>
              {ph.name}
              {ph.notes && (
                <span style={{ color: "#64748b", fontSize: "12.5px" }}> — {ph.notes}</span>
              )}
            </span>
            <span style={{ flexShrink: 0, fontWeight: 700, color: "#f1f5f9" }}>{ph.days}d</span>
          </div>
        ))}
        <div style={{
          marginTop: "8px", paddingTop: "10px",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          display: "flex", justifyContent: "space-between", fontWeight: 700,
        }}>
          <span>Total</span>
          <span style={{ color: "#6366f1" }}>{timeline.totalDays} days</span>
        </div>
      </div>
      {timeline.dependencies.length > 0 && (
        <div style={{ marginTop: "14px" }}>
          <SubHeading>Dependencies</SubHeading>
          <BulletList items={timeline.dependencies} />
        </div>
      )}
    </SectionCard>
  );
}
