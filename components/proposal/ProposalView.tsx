"use client";

import type { Proposal } from "@/lib/domain/proposal/schema";
import { OverviewSection } from "./OverviewSection";
import { FeasibilitySection } from "./FeasibilitySection";
import { ScopeSection } from "./ScopeSection";
import { DeliverablesSection } from "./DeliverablesSection";
import { TimelineSection } from "./TimelineSection";
import { PricingSection } from "./PricingSection";
import { TechStackSection } from "./TechStackSection";
import { BoundariesSection } from "./BoundariesSection";
import { RisksSection } from "./RisksSection";
import { AssumptionsSection } from "./AssumptionsSection";
import { NextStepsSection } from "./NextStepsSection";

interface ProposalViewProps {
  proposal: Proposal;
}

export function ProposalView({ proposal }: ProposalViewProps) {
  return (
    <div style={{
      width: "100%",
      maxWidth: "680px",
      display: "flex",
      flexDirection: "column",
      gap: "12px",
    }}>
      <OverviewSection overview={proposal.overview} />
      <FeasibilitySection overview={proposal.overview} />
      <ScopeSection scope={proposal.scope} />
      <DeliverablesSection deliverables={proposal.deliverables} />
      <TimelineSection timeline={proposal.timeline} />
      <PricingSection pricing={proposal.pricing} />
      <TechStackSection techStack={proposal.techStack} />
      <BoundariesSection boundaries={proposal.boundaries} />
      <RisksSection risks={proposal.risks} />
      <AssumptionsSection assumptions={proposal.assumptions} />
      <NextStepsSection nextSteps={proposal.nextSteps} />
    </div>
  );
}
