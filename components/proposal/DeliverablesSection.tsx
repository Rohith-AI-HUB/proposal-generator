"use client";

import { SectionCard, BulletList } from "./shared";
import type { ConfidenceLevel } from "@/lib/domain/proposal/schema";

export function DeliverablesSection({
  deliverables,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  deliverables: string[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!deliverables.length) return null;
  return (
    <SectionCard
      title="Deliverables"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <BulletList items={deliverables} />
    </SectionCard>
  );
}
