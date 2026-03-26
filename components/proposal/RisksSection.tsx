"use client";

import { SectionCard, NumberedList } from "./shared";
import type { ConfidenceLevel } from "@/lib/domain/proposal/schema";

export function RisksSection({
  risks,
  id,
  confidenceLevel,
  confidenceReason,
}: {
  risks: string[];
  id?: string;
  confidenceLevel?: ConfidenceLevel;
  confidenceReason?: string;
}) {
  if (!risks.length) return null;
  return (
    <SectionCard
      title="Risk Signals"
      id={id}
      confidenceLevel={confidenceLevel}
      confidenceReason={confidenceReason}
    >
      <NumberedList items={risks} />
    </SectionCard>
  );
}
