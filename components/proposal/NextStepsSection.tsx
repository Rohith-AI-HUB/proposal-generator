"use client";

import { SectionCard, BulletList } from "./shared";

export function NextStepsSection({ nextSteps }: { nextSteps: string[] }) {
  return (
    <SectionCard title="Next Steps">
      <BulletList items={nextSteps} />
    </SectionCard>
  );
}
