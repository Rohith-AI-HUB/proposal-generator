"use client";

import { SectionCard } from "./shared";
import { FEASIBILITY_CONFIG } from "@/lib/domain/proposal/constants";
import type { ConfidenceLevel, ProposalOverview } from "@/lib/domain/proposal/schema";

export function FeasibilitySection({
  overview,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  overview: ProposalOverview;
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (overview.feasibility === "green" || !overview.feasibilityNote) return null;
  const cfg = FEASIBILITY_CONFIG[overview.feasibility];
  return (
    <SectionCard
      title="Feasibility Note"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <p
        className="feasibility-note-text"
        style={{ color: cfg.color }}
      >
        {overview.feasibilityNote}
      </p>
    </SectionCard>
  );
}
