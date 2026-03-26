"use client";

import { SectionCard } from "./shared";
import type { ConfidenceLevel, TechChoice } from "@/lib/domain/proposal/schema";

export function TechStackSection({
  techStack,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  techStack: TechChoice[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!techStack.length) return null;
  return (
    <SectionCard
      title="Tech Stack"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <div className="tech-rows">
        {techStack.map((t, i) => (
          <div key={i} className="tech-row">
            <span className="tech-layer">{t.layer}</span>
            <span>
              <span className="tech-choice-name">{t.choice}</span>
              <span className="tech-reason"> - {t.reason}</span>
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
