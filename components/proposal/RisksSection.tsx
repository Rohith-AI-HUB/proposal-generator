"use client";

import { SectionCard, NumberedList } from "./shared";

export function RisksSection({ risks }: { risks: string[] }) {
  if (!risks.length) return null;
  return (
    <SectionCard title="Risk Signals">
      <NumberedList items={risks} />
    </SectionCard>
  );
}
