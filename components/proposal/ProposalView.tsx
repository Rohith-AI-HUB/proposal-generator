"use client";

import { useEffect, useMemo, useState } from "react";
import type { Proposal, ProposalSectionConfidence } from "@/lib/domain/proposal/schema";
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
import { ClientCostsSection } from "./ClientCostsSection";
import { SourcesSection } from "./SourcesSection";
import { TrustSummarySection } from "./TrustSummarySection";
import { EvidenceSection } from "./EvidenceSection";
import { UnsupportedClaimsSection } from "./UnsupportedClaimsSection";

interface VisibilityMap {
  trust: boolean;
  feasibility: boolean;
  deliverables: boolean;
  evidence: boolean;
  unsupportedClaims: boolean;
  clientCosts: boolean;
  techStack: boolean;
  boundaries: boolean;
  risks: boolean;
  assumptions: boolean;
  nextSteps: boolean;
  sources: boolean;
}

function computeVisibility(proposal: Proposal): VisibilityMap {
  return {
    trust: true,
    feasibility:
      proposal.overview.feasibility !== "green" && !!proposal.overview.feasibilityNote,
    deliverables: proposal.deliverables.length > 0,
    evidence: proposal.evidence.length > 0,
    unsupportedClaims: proposal.unsupportedClaims.length > 0,
    clientCosts: proposal.clientCosts.length > 0,
    techStack: proposal.techStack.length > 0,
    boundaries: proposal.boundaries.length > 0,
    risks: proposal.risks.length > 0,
    assumptions: proposal.assumptions.length > 0,
    nextSteps: proposal.nextSteps.length > 0,
    sources: proposal.sources.length > 0,
  };
}

type NavKey = keyof VisibilityMap | "always";

interface NavItem {
  id: string;
  label: string;
  visKey: NavKey;
}

const NAV_ITEMS: NavItem[] = [
  { id: "s-overview", label: "Overview", visKey: "always" },
  { id: "s-trust", label: "Trust", visKey: "trust" },
  { id: "s-feasibility", label: "Feasibility", visKey: "feasibility" },
  { id: "s-scope", label: "Scope", visKey: "always" },
  { id: "s-deliverables", label: "Deliverables", visKey: "deliverables" },
  { id: "s-timeline", label: "Timeline", visKey: "always" },
  { id: "s-pricing", label: "Pricing", visKey: "always" },
  { id: "s-evidence", label: "Facts", visKey: "evidence" },
  { id: "s-uncertainty", label: "Uncertainty", visKey: "unsupportedClaims" },
  { id: "s-client-costs", label: "Client Costs", visKey: "clientCosts" },
  { id: "s-tech", label: "Tech Stack", visKey: "techStack" },
  { id: "s-boundaries", label: "Boundaries", visKey: "boundaries" },
  { id: "s-risks", label: "Risks", visKey: "risks" },
  { id: "s-assumptions", label: "Assumptions", visKey: "assumptions" },
  { id: "s-next", label: "Next Steps", visKey: "nextSteps" },
  { id: "s-sources", label: "Sources", visKey: "sources" },
];

interface ProposalViewProps {
  proposal: Proposal;
  loading: boolean;
  copied: boolean;
  onRegenerate: () => void;
  onCopy: () => void;
}

function buildConfidenceMap(proposal: Proposal): Map<string, ProposalSectionConfidence> {
  return new Map(
    proposal.confidence.sections.map((section) => [section.section, section])
  );
}

export function ProposalView({
  proposal,
  loading,
  copied,
  onRegenerate,
  onCopy,
}: ProposalViewProps) {
  const [activeId, setActiveId] = useState<string>("s-overview");

  const vis = useMemo(() => computeVisibility(proposal), [proposal]);
  const confidenceMap = useMemo(() => buildConfidenceMap(proposal), [proposal]);
  const visibleNav = useMemo(
    () =>
      NAV_ITEMS.filter((item) => item.visKey === "always" || vis[item.visKey]),
    [vis]
  );

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    visibleNav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [visibleNav]);

  function scrollTo(id: string) {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const overallNeedsReview =
    proposal.confidence.overall !== "high" || proposal.unsupportedClaims.length > 0;

  const section = (key: string) => confidenceMap.get(key);

  return (
    <>
      {overallNeedsReview && (
        <div className={`trust-banner trust-banner--${proposal.confidence.overall}`}>
          <span className="trust-banner-label">Review before sending</span>
          <span className="trust-banner-text">{proposal.confidence.note}</span>
        </div>
      )}

      <nav className="section-nav" aria-label="Proposal sections">
        {visibleNav.map((item) => (
          <button
            key={item.id}
            className={`section-nav-item${activeId === item.id ? " active" : ""}`}
            onClick={() => scrollTo(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="proposal-view">
        <OverviewSection
          overview={proposal.overview}
          id="s-overview"
          confidenceLevel={section("overview")?.level}
          confidenceReason={section("overview")?.reason}
        />
        <TrustSummarySection confidence={proposal.confidence} id="s-trust" />
        {vis.feasibility && (
          <FeasibilitySection
            overview={proposal.overview}
            id="s-feasibility"
            confidenceLevel={section("overview")?.level}
            confidenceReason={section("overview")?.reason}
          />
        )}
        <ScopeSection
          scope={proposal.scope}
          id="s-scope"
          confidenceLevel={section("scope")?.level}
          confidenceReason={section("scope")?.reason}
        />
        {vis.deliverables && (
          <DeliverablesSection
            deliverables={proposal.deliverables}
            id="s-deliverables"
            confidenceLevel={section("deliverables")?.level}
            confidenceReason={section("deliverables")?.reason}
          />
        )}
        <TimelineSection
          timeline={proposal.timeline}
          id="s-timeline"
          confidenceLevel={section("timeline")?.level}
          confidenceReason={section("timeline")?.reason}
        />
        <PricingSection
          pricing={proposal.pricing}
          id="s-pricing"
          confidenceLevel={section("pricing")?.level}
          confidenceReason={section("pricing")?.reason}
        />
        {vis.evidence && <EvidenceSection evidence={proposal.evidence} id="s-evidence" />}
        {vis.unsupportedClaims && (
          <UnsupportedClaimsSection
            unsupportedClaims={proposal.unsupportedClaims}
            id="s-uncertainty"
          />
        )}
        {vis.clientCosts && (
          <ClientCostsSection
            clientCosts={proposal.clientCosts}
            id="s-client-costs"
            confidenceLevel={section("clientCosts")?.level}
            confidenceReason={section("clientCosts")?.reason}
          />
        )}
        {vis.techStack && (
          <TechStackSection
            techStack={proposal.techStack}
            id="s-tech"
            confidenceLevel={section("techStack")?.level}
            confidenceReason={section("techStack")?.reason}
          />
        )}
        {vis.boundaries && (
          <BoundariesSection
            boundaries={proposal.boundaries}
            id="s-boundaries"
            confidenceLevel={section("boundaries")?.level}
            confidenceReason={section("boundaries")?.reason}
          />
        )}
        {vis.risks && (
          <RisksSection
            risks={proposal.risks}
            id="s-risks"
            confidenceLevel={section("risks")?.level}
            confidenceReason={section("risks")?.reason}
          />
        )}
        {vis.assumptions && (
          <AssumptionsSection
            assumptions={proposal.assumptions}
            id="s-assumptions"
            confidenceLevel={section("assumptions")?.level}
            confidenceReason={section("assumptions")?.reason}
          />
        )}
        {vis.nextSteps && (
          <NextStepsSection
            nextSteps={proposal.nextSteps}
            id="s-next"
            confidenceLevel={section("nextSteps")?.level}
            confidenceReason={section("nextSteps")?.reason}
          />
        )}
        {vis.sources && (
          <SourcesSection
            sources={proposal.sources}
            id="s-sources"
            confidenceLevel={proposal.confidence.overall}
            confidenceReason={proposal.confidence.note}
          />
        )}
      </div>

      <div className="action-bar">
        <button className="btn-primary" onClick={onCopy}>
          {copied ? "Copied to clipboard" : "Copy draft"}
        </button>
        <button className="btn-ghost" onClick={onRegenerate} disabled={loading}>
          {loading ? "Regenerating..." : "Regenerate"}
        </button>
      </div>
    </>
  );
}
