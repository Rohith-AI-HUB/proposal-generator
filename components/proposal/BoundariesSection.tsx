"use client";

import { SectionCard, BulletList } from "./shared";

export function BoundariesSection({ boundaries }: { boundaries: string[] }) {
  return (
    <SectionCard title="Scope Boundaries">
      <BulletList items={boundaries} />
    </SectionCard>
  );
}
