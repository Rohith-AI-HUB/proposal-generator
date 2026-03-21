"use client";

import { SectionCard } from "./shared";
import type { TechChoice } from "@/lib/domain/proposal/schema";

export function TechStackSection({
  techStack,
  id,
}: {
  techStack: TechChoice[];
  id?: string;
}) {
  if (!techStack.length) return null;
  return (
    <SectionCard title="Tech Stack" id={id}>
      <div className="tech-rows">
        {techStack.map((t, i) => (
          <div key={i} className="tech-row">
            <span className="tech-layer">{t.layer}</span>
            <span>
              <span className="tech-choice-name">{t.choice}</span>
              <span className="tech-reason"> — {t.reason}</span>
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
