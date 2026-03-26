import type {
  ClientCostItem,
  ConfidenceLevel,
  Proposal,
  ProposalConfidence,
  ProposalSectionConfidence,
  ProposalSectionId,
  ProposalUnsupportedClaim,
} from "@/lib/domain/proposal/schema";
import type { RequirementSignals } from "./preprocessor";
import type { ResearchPacket } from "./research";

const NUMERIC_COST_PATTERN = /\d|%/;

const TECH_EXPLICIT_PATTERNS = [
  /\b(?:react|next\.?js|node|express|laravel|django|wordpress|flutter|react native|ios|android)\b/i,
  /\b(?:real.?time|websocket|pwa|native app|server.?side rendering|ssr|cms|existing api|integration)\b/i,
];

function mergeUnique(items: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of items) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

function sanitizeClientCosts(costs: ClientCostItem[]): ClientCostItem[] {
  return costs.map((cost) => {
    const hasNumericCost = NUMERIC_COST_PATTERN.test(cost.estimatedCost);
    const hasSourceMeta =
      !!cost.sourceTitle && !!cost.sourceUrl && !!cost.sourceRationale;

    if (!hasNumericCost || hasSourceMeta) {
      return cost;
    }

    const notes = mergeUnique([
      cost.notes ?? "",
      "Current vendor pricing was not grounded to a credible source for this run.",
    ]);

    return {
      ...cost,
      estimatedCost: "Varies - verify current vendor pricing.",
      notes: notes.join(" "),
      sourceTitle: null,
      sourceUrl: null,
      sourceRationale: null,
      confidence: "low",
    };
  });
}

function hasExplicitTechNeed(requirement: string): boolean {
  return TECH_EXPLICIT_PATTERNS.some((pattern) => pattern.test(requirement));
}

function buildUnsupportedClaims(
  signals: RequirementSignals,
  research: ResearchPacket | null,
  clientCosts: ClientCostItem[]
): ProposalUnsupportedClaim[] {
  const claims: ProposalUnsupportedClaim[] = [];

  if (!signals.hasBudget) {
    claims.push({
      claim: "Pricing is directional rather than budget-anchored.",
      reason: "No budget was provided in the brief.",
    });
  }

  if (!signals.hasDeadline) {
    claims.push({
      claim: "Timeline is a planning estimate rather than a deadline-backed commitment.",
      reason: "No launch date or delivery window was provided.",
    });
  }

  if (research?.dataQuality !== "high") {
    claims.push({
      claim: "Some external costs or platform assumptions remain weakly verified.",
      reason: research?.caveat ?? "Live research did not reach high confidence.",
    });
  }

  if (clientCosts.some((cost) => !cost.sourceUrl)) {
    claims.push({
      claim: "At least one client-borne cost is shown as a non-numeric placeholder.",
      reason: "Usage-based or region-specific pricing could not be grounded safely.",
    });
  }

  research?.openQuestions.forEach((question) => {
    claims.push({
      claim: "Open external dependency remains unresolved.",
      reason: question,
    });
  });

  return claims.slice(0, 6);
}

function levelFromPenalty(penalty: number): ConfidenceLevel {
  if (penalty <= 1) return "high";
  if (penalty <= 3) return "medium";
  return "low";
}

function buildSectionConfidence(
  section: ProposalSectionId,
  penalty: number,
  reason: string
): ProposalSectionConfidence {
  return {
    section,
    level: levelFromPenalty(penalty),
    reason,
  };
}

function buildConfidence(
  signals: RequirementSignals,
  research: ResearchPacket | null,
  unsupportedClaims: ProposalUnsupportedClaim[],
  clientCosts: ClientCostItem[],
  techStackShown: boolean,
  techStackExplicit: boolean
): ProposalConfidence {
  const sourcedCostCount = clientCosts.filter((cost) => !!cost.sourceUrl).length;
  const sourcePenalty =
    clientCosts.length === 0 ? 2 : sourcedCostCount === clientCosts.length ? 0 : 2;
  const researchPenalty =
    research?.dataQuality === "high" ? 0 : research?.dataQuality === "medium" ? 1 : 2;
  const scopePenalty = signals.specificity === "high" ? 0 : signals.specificity === "medium" ? 1 : 2;

  const sections: ProposalSectionConfidence[] = [
    buildSectionConfidence(
      "overview",
      scopePenalty + (unsupportedClaims.length > 0 ? 1 : 0),
      signals.specificity === "high"
        ? "The brief is specific enough to describe the project confidently."
        : "The brief still leaves meaningful ambiguity in goals or scope."
    ),
    buildSectionConfidence(
      "scope",
      scopePenalty,
      signals.specificity === "high"
        ? "Core scope is reasonably supported by the provided details."
        : "Scope remains partially inferred from a limited brief."
    ),
    buildSectionConfidence(
      "deliverables",
      scopePenalty,
      signals.specificity === "high"
        ? "Deliverables track explicit features in the brief."
        : "Deliverables are directionally useful but still assumption-heavy."
    ),
    buildSectionConfidence(
      "timeline",
      scopePenalty + (signals.hasDeadline ? 0 : 2),
      signals.hasDeadline
        ? "A stated deadline helps anchor the delivery estimate."
        : "No deadline was provided, so the timeline is a directional estimate."
    ),
    buildSectionConfidence(
      "pricing",
      scopePenalty + (signals.hasBudget ? 0 : 2),
      signals.hasBudget
        ? "A stated budget improves pricing confidence."
        : "No budget was provided, so pricing is not tightly calibrated."
    ),
    buildSectionConfidence(
      "clientCosts",
      sourcePenalty + researchPenalty,
      sourcedCostCount === clientCosts.length && clientCosts.length > 0
        ? "External costs are backed by source metadata."
        : "Some external costs vary by usage or were not source-backed strongly enough."
    ),
    buildSectionConfidence(
      "techStack",
      techStackShown ? (techStackExplicit ? 0 : 2) : 1,
      techStackShown
        ? "Tech choices are shown only where the brief or research supports them."
        : "Tech stack detail was intentionally minimized to avoid bluffing."
    ),
    buildSectionConfidence(
      "boundaries",
      scopePenalty,
      "Boundaries depend on how complete the scope description is."
    ),
    buildSectionConfidence(
      "risks",
      researchPenalty,
      research?.dataQuality === "high"
        ? "Risks are grounded in current dependency context."
        : "Some risks are still based on partial information."
    ),
    buildSectionConfidence(
      "assumptions",
      0,
      "Assumptions are explicit by design in this trust-first draft."
    ),
    buildSectionConfidence(
      "nextSteps",
      1,
      "Next steps are actionable but still depend on client confirmation."
    ),
  ];

  const overallPenalty =
    scopePenalty +
    researchPenalty +
    (signals.hasBudget ? 0 : 1) +
    (signals.hasDeadline ? 0 : 1) +
    (unsupportedClaims.length >= 2 ? 1 : 0);

  const overall = levelFromPenalty(overallPenalty);
  const note =
    overall === "high"
      ? "This draft is reasonably grounded, but it still contains estimates rather than fixed commitments."
      : overall === "medium"
        ? "This draft is useful, but key sections still rely on assumptions and should be reviewed before sending."
        : "This draft should not be sent as-is. It contains meaningful uncertainty in scope, timeline, pricing, or external costs.";

  return {
    overall,
    note,
    sections,
  };
}

export function applyTrustContext(
  draft: Proposal,
  requirement: string,
  signals: RequirementSignals,
  research: ResearchPacket | null
): Proposal {
  const techStackExplicit = hasExplicitTechNeed(requirement);
  const clientCosts = sanitizeClientCosts(
    research?.vendorCosts.length ? research.vendorCosts : draft.clientCosts
  );

  const evidence = research?.evidence ?? draft.evidence ?? [];
  const unsupportedClaims = buildUnsupportedClaims(signals, research, clientCosts);
  const techStack = techStackExplicit ? draft.techStack : [];
  const confidence = buildConfidence(
    signals,
    research,
    unsupportedClaims,
    clientCosts,
    techStack.length > 0,
    techStackExplicit
  );

  const assumptions = mergeUnique([
    ...draft.assumptions,
    ...(confidence.overall === "high"
      ? []
      : [
          "This draft separates sourced facts from estimates and should be reviewed before sending.",
        ]),
    ...(research?.dataQuality && research.dataQuality !== "high"
      ? [research.caveat]
      : []),
  ]);

  return {
    ...draft,
    clientCosts,
    techStack,
    assumptions,
    confidence,
    evidence,
    unsupportedClaims,
    sources: research?.sources ?? draft.sources ?? [],
  };
}
