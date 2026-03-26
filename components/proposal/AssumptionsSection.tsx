"use client";

import { SectionCard } from "./shared";
import type { ConfidenceLevel } from "@/lib/domain/proposal/schema";

export function AssumptionsSection({
  assumptions,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  assumptions: string[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!assumptions.length) return null;
  return (
    <SectionCard
      title="Assumptions"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <div className="assumptions-list">
        {assumptions.map((a, i) => (
          <div key={i} className="assumption-row">
            <span className="assumption-tag">Assumed</span>
            <span>{a}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
