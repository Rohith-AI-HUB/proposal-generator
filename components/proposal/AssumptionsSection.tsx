"use client";

import { SectionCard } from "./shared";

export function AssumptionsSection({
  assumptions,
  id,
}: {
  assumptions: string[];
  id?: string;
}) {
  if (!assumptions.length) return null;
  return (
    <SectionCard title="Assumptions" id={id}>
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
