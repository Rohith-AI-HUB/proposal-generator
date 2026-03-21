"use client";

import { SectionCard, BulletList, SubHeading } from "./shared";
import type { ProposalScope } from "@/lib/domain/proposal/schema";

export function ScopeSection({ scope, id }: { scope: ProposalScope; id?: string }) {
  return (
    <SectionCard title="Scope of Work" id={id}>
      <SubHeading>Phase 1 — Core</SubHeading>
      <BulletList items={scope.core} />
      {scope.extended.length > 0 && (
        <>
          <SubHeading>Phase 2 — Extended</SubHeading>
          <BulletList items={scope.extended} />
        </>
      )}
    </SectionCard>
  );
}
