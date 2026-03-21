"use client";

import { SectionCard, BulletList } from "./shared";

export function BoundariesSection({
  boundaries,
  id,
}: {
  boundaries: string[];
  id?: string;
}) {
  if (!boundaries.length) return null;
  return (
    <SectionCard title="Scope Boundaries" id={id}>
      <BulletList items={boundaries} />
    </SectionCard>
  );
}
