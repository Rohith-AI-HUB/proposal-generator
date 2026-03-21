"use client";

import { SectionCard, BulletList } from "./shared";

export function NextStepsSection({
  nextSteps,
  id,
}: {
  nextSteps: string[];
  id?: string;
}) {
  if (!nextSteps.length) return null;
  return (
    <SectionCard title="Next Steps" id={id}>
      <BulletList items={nextSteps} />
    </SectionCard>
  );
}
