"use client";

import { SectionCard } from "./shared";
import { FEASIBILITY_CONFIG } from "@/lib/domain/proposal/constants";
import type { ProposalOverview, FeasibilityLevel } from "@/lib/domain/proposal/schema";

export function FeasibilitySection({ overview, id }: { overview: ProposalOverview; id?: string }) {
  if (overview.feasibility === "green" || !overview.feasibilityNote) return null;
  const color = FEASIBILITY_CONFIG[overview.feasibility as FeasibilityLevel].color;
  return (
    <SectionCard title="Feasibility Note" id={id}>
      <p style={{ color, fontSize: "13.5px", lineHeight: 1.75 }}>{overview.feasibilityNote}</p>
    </SectionCard>
  );
}
