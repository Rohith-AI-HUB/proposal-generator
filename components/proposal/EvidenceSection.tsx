"use client";

import type { ProposalEvidence } from "@/lib/domain/proposal/schema";
import { SectionCard } from "./shared";

export function EvidenceSection({
  evidence,
  id,
}: {
  evidence: ProposalEvidence[];
  id?: string;
}) {
  if (!evidence.length) return null;

  return (
    <SectionCard title="Verified Facts" id={id}>
      <div className="tech-rows">
        {evidence.map((item, i) => (
          <div key={`${item.claim}-${i}`} className="tech-row">
            <span className="tech-layer">{item.section}</span>
            <span>
              <span className="tech-choice-name">{item.claim}</span>
              <span className="cost-source">
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                  {item.sourceTitle}
                </a>
                <span className="tech-reason"> - {item.sourceRationale}</span>
              </span>
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
