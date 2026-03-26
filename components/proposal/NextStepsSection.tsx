"use client";

import { SectionCard, BulletList } from "./shared";
import type { ConfidenceLevel } from "@/lib/domain/proposal/schema";

export function NextStepsSection({
  nextSteps,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  nextSteps: string[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!nextSteps.length) return null;
  return (
    <SectionCard
      title="Next Steps"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <BulletList items={nextSteps} />
    </SectionCard>
  );
}
