"use client";

import { SectionCard } from "./shared";
import { FEASIBILITY_CONFIG } from "@/lib/domain/proposal/constants";
import type { ProposalOverview } from "@/lib/domain/proposal/schema";

export function FeasibilitySection({
  overview,
  id,
}: {
  overview: ProposalOverview;
  id?: string;
}) {
  if (overview.feasibility === "green" || !overview.feasibilityNote) return null;
  const cfg = FEASIBILITY_CONFIG[overview.feasibility];
  return (
    <SectionCard title="Feasibility Note" id={id}>
      <p
        className="feasibility-note-text"
        style={{ color: cfg.color }}
      >
        {overview.feasibilityNote}
      </p>
    </SectionCard>
  );
}
