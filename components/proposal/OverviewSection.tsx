"use client";

import { SectionCard } from "./shared";
import { FEASIBILITY_CONFIG } from "@/lib/domain/proposal/constants";
import type { ConfidenceLevel, ProposalOverview } from "@/lib/domain/proposal/schema";

export function OverviewSection({
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
  const cfg = FEASIBILITY_CONFIG[overview.feasibility];
  return (
    <SectionCard
      title="Project Overview"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <p className="overview-summary">{overview.summary}</p>
      <p className="overview-outcome">{overview.outcome}</p>
      <div
        className="feasibility-badge"
        style={{
          color: cfg.color,
          borderColor: `${cfg.color}38`,
          background: `${cfg.color}0f`,
        }}
      >
        <span className="badge-dot" style={{ background: cfg.color }} />
        {cfg.label}
      </div>
    </SectionCard>
  );
}
