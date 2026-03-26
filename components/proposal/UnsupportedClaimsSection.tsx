"use client";

import type { ProposalUnsupportedClaim } from "@/lib/domain/proposal/schema";
import { SectionCard } from "./shared";

export function UnsupportedClaimsSection({
  unsupportedClaims,
  id,
}: {
  unsupportedClaims: ProposalUnsupportedClaim[];
  id?: string;
}) {
  if (!unsupportedClaims.length) return null;

  return (
    <SectionCard title="Uncertainty" id={id} confidenceLevel="low">
      <div className="tech-rows">
        {unsupportedClaims.map((item, i) => (
          <div key={`${item.claim}-${i}`} className="tech-row">
            <span className="tech-layer">estimate</span>
            <span>
              <span className="tech-choice-name">{item.claim}</span>
              <span className="tech-reason"> - {item.reason}</span>
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
