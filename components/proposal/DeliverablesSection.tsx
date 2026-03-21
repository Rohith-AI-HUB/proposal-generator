"use client";

import { SectionCard, BulletList } from "./shared";

export function DeliverablesSection({
  deliverables,
  id,
}: {
  deliverables: string[];
  id?: string;
}) {
  if (!deliverables.length) return null;
  return (
    <SectionCard title="Deliverables" id={id}>
      <BulletList items={deliverables} />
    </SectionCard>
  );
}
