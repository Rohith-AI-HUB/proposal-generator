"use client";

import { SectionCard, BulletList } from "./shared";
import type { ConfidenceLevel } from "@/lib/domain/proposal/schema";

export function BoundariesSection({
  boundaries,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  boundaries: string[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!boundaries.length) return null;
  return (
    <SectionCard
      title="Scope Boundaries"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <BulletList items={boundaries} />
    </SectionCard>
  );
}
