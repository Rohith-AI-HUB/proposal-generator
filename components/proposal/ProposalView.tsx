"use client";

import { useEffect, useMemo, useState } from "react";
import type { Proposal } from "@/lib/domain/proposal/schema";
import { OverviewSection }     from "./OverviewSection";
import { FeasibilitySection }  from "./FeasibilitySection";
import { ScopeSection }        from "./ScopeSection";
import { DeliverablesSection } from "./DeliverablesSection";
import { TimelineSection }     from "./TimelineSection";
import { PricingSection }      from "./PricingSection";
import { TechStackSection }    from "./TechStackSection";
import { BoundariesSection }   from "./BoundariesSection";
import { RisksSection }        from "./RisksSection";
import { AssumptionsSection }  from "./AssumptionsSection";
import { NextStepsSection }    from "./NextStepsSection";
import { ClientCostsSection }  from "./ClientCostsSection";

// ---------------------------------------------------------------------------
// Visibility table
//
// Every conditional section has one entry here.
// The nav filter and the JSX renders BOTH read from this object -- they
// cannot drift from each other. Always-present sections (Overview, Scope,
// Timeline, Pricing) are not listed -- they are never hidden.
// ---------------------------------------------------------------------------

interface VisibilityMap {
  feasibility:  boolean;
  deliverables: boolean;
  clientCosts:  boolean;
  techStack:    boolean;
  boundaries:   boolean;
  risks:        boolean;
  assumptions:  boolean;
  nextSteps:    boolean;
}

function computeVisibility(proposal: Proposal): VisibilityMap {
  return {
    feasibility:  proposal.overview.feasibility !== "green" && !!proposal.overview.feasibilityNote,
    deliverables: proposal.deliverables.length > 0,
    clientCosts:  proposal.clientCosts.length > 0,
    techStack:    proposal.techStack.length > 0,
    boundaries:   proposal.boundaries.length > 0,
    risks:        proposal.risks.length > 0,
    assumptions:  proposal.assumptions.length > 0,
    nextSteps:    proposal.nextSteps.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Nav definition
//
// Always-present items carry visKey: "always".
// Conditional items carry the VisibilityMap key that controls them.
// Both the filter and the JSX conditional renders reference the same vis
// object, so nav items and rendered sections are always in sync.
// ---------------------------------------------------------------------------

type NavKey = keyof VisibilityMap | "always";

interface NavItem {
  id:     string;
  label:  string;
  visKey: NavKey;
}

const NAV_ITEMS: NavItem[] = [
  { id: "s-overview",     label: "Overview",     visKey: "always"       },
  { id: "s-feasibility",  label: "Feasibility",  visKey: "feasibility"  },
  { id: "s-scope",        label: "Scope",        visKey: "always"       },
  { id: "s-deliverables", label: "Deliverables", visKey: "deliverables" },
  { id: "s-timeline",     label: "Timeline",     visKey: "always"       },
  { id: "s-pricing",      label: "Pricing",      visKey: "always"       },
  { id: "s-client-costs", label: "Client Costs", visKey: "clientCosts"  },
  { id: "s-tech",         label: "Tech Stack",   visKey: "techStack"    },
  { id: "s-boundaries",   label: "Boundaries",   visKey: "boundaries"   },
  { id: "s-risks",        label: "Risks",        visKey: "risks"        },
  { id: "s-assumptions",  label: "Assumptions",  visKey: "assumptions"  },
  { id: "s-next",         label: "Next Steps",   visKey: "nextSteps"    },
];

// ---------------------------------------------------------------------------
// Props -- renderedText removed; used only by handleCopy in page.tsx
// ---------------------------------------------------------------------------

interface ProposalViewProps {
  proposal:     Proposal;
  loading:      boolean;
  copied:       boolean;
  onRegenerate: () => void;
  onCopy:       () => void;
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

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((item) => item.visKey === "always" || vis[item.visKey]),
    [vis]
  );

  // IntersectionObserver -- track which section is currently in view.
  // Re-runs whenever visibleNav changes (i.e. when a different proposal loads).
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    visibleNav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [visibleNav]);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      {/* Section nav */}
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

      {/* Proposal sections
          Always-visible sections render unconditionally.
          Conditional sections are gated on the same vis.* flag that controls
          their nav item -- a section is in the DOM if and only if it has a
          nav entry, and vice versa. */}
      <div className="proposal-view">
        <OverviewSection     overview={proposal.overview}         id="s-overview"     />
        {vis.feasibility  && <FeasibilitySection  overview={proposal.overview}         id="s-feasibility"  />}
        <ScopeSection        scope={proposal.scope}               id="s-scope"        />
        {vis.deliverables && <DeliverablesSection deliverables={proposal.deliverables} id="s-deliverables" />}
        <TimelineSection     timeline={proposal.timeline}         id="s-timeline"     />
        <PricingSection      pricing={proposal.pricing}           id="s-pricing"      />
        {vis.clientCosts  && <ClientCostsSection clientCosts={proposal.clientCosts}   id="s-client-costs" />}
        {vis.techStack    && <TechStackSection    techStack={proposal.techStack}       id="s-tech"         />}
        {vis.boundaries   && <BoundariesSection   boundaries={proposal.boundaries}     id="s-boundaries"   />}
        {vis.risks        && <RisksSection        risks={proposal.risks}               id="s-risks"        />}
        {vis.assumptions  && <AssumptionsSection  assumptions={proposal.assumptions}   id="s-assumptions"  />}
        {vis.nextSteps    && <NextStepsSection     nextSteps={proposal.nextSteps}       id="s-next"         />}
      </div>

      {/* Action bar */}
      <div className="action-bar">
        <button className="btn-primary" onClick={onCopy}>
          {copied ? "Copied to clipboard" : "Copy proposal"}
        </button>
        <button
          className="btn-ghost"
          onClick={onRegenerate}
          disabled={loading}
        >
          {loading ? "Regenerating…" : "Regenerate"}
        </button>
      </div>
    </>
  );
}
