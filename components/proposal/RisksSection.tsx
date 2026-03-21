"use client";

import { SectionCard, NumberedList } from "./shared";

export function RisksSection({
  risks,
  id,
}: {
  risks: string[];
  id?: string;
}) {
  if (!risks.length) return null;
  return (
    <SectionCard title="Risk Signals" id={id}>
      <NumberedList items={risks} />
    </SectionCard>
  );
}
