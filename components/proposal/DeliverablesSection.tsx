"use client";

import { SectionCard, BulletList } from "./shared";

export function DeliverablesSection({ deliverables }: { deliverables: string[] }) {
  return (
    <SectionCard title="Deliverables">
      <BulletList items={deliverables} />
    </SectionCard>
  );
}
