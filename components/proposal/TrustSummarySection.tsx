"use client";

import type { ProposalConfidence } from "@/lib/domain/proposal/schema";
import { SectionCard } from "./shared";

export function TrustSummarySection({
  confidence,
  id,
}: {
  confidence: ProposalConfidence;
  id?: string;
}) {
  return (
    <SectionCard
      title="Trust Summary"
      id={id}
      confidenceLevel={confidence.overall}
      confidenceReason={confidence.note}
    >
      <div className="trust-summary">
        {confidence.sections.map((section) => (
          <div key={section.section} className="trust-summary-row">
            <span className="trust-summary-name">{section.section}</span>
            <span className={`confidence-pill confidence-pill--${section.level}`}>
              {section.level}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
