import type { Proposal } from "@/lib/domain/proposal/schema";
import type { PricingContext } from "@/lib/server/generation/prompt";
import type { ResearchPacket } from "@/lib/server/generation/research";
import type { ModelResponse } from "@/lib/server/generation/model";

export function buildPricingContext(
  overrides: Partial<PricingContext> = {}
): PricingContext {
  const clientType = overrides.clientType ?? "international";

  return {
    clientType,
    currency:
      overrides.currency ?? (clientType === "domestic" ? "INR" : "USD"),
    currencySymbol:
      overrides.currencySymbol ?? (clientType === "domestic" ? "Rs" : "$"),
    dayRate:
      overrides.dayRate ?? (clientType === "domestic" ? 5000 : 120),
  };
}

export function buildProposalFixture(
  overrides: Partial<Proposal> = {}
): Proposal {
  const base: Proposal = {
    overview: {
      summary:
        "Build a focused booking workflow and admin dashboard for a small service business.",
      outcome:
        "This draft is intended to help the client launch a reliable first version without overcommitting scope.",
      feasibility: "green",
      feasibilityNote: null,
    },
    scope: {
      core: [
        "Public booking flow with lead capture",
        "Admin dashboard for schedule and request management",
      ],
      extended: ["Automated reminder templates for repeatable follow-up"],
    },
    deliverables: [
      "Responsive booking website",
      "Admin dashboard",
      "Basic QA and deployment handoff",
    ],
    timeline: {
      phases: [
        {
          name: "Discovery and setup",
          days: 4,
          notes: "Lock the workflow, content structure, and delivery plan.",
        },
        {
          name: "Build and QA",
          days: 8,
          notes: "Implement the core workflow, then test and polish it.",
        },
      ],
      totalDays: 12,
      dependencies: ["Client signs off on scope and supplies content on time."],
    },
    pricing: {
      totalMin: 1440,
      totalMax: 1800,
      currency: "USD",
      modules: [
        {
          module: "Discovery and setup",
          rationale: "Covers the initial planning, wireframing, and setup work.",
          cost: "4 days x $120 = $480",
        },
        {
          module: "Build and QA",
          rationale:
            "Covers implementation, testing, revisions, and launch preparation.",
          cost: "8 days x $120 = $960",
        },
      ],
      rationale:
        "The estimate follows the phase plan and reflects a lean first release instead of a full custom platform build.",
      valueJustification:
        "This keeps the first launch small enough to deliver quickly while still covering the client's revenue-critical workflow.",
      variabilityNote:
        "The estimate will change if the client adds custom integrations, extra roles, or a tighter delivery window.",
    },
    clientCosts: [],
    techStack: [],
    boundaries: [
      "This draft does not include ongoing marketing operations or long-term content management.",
    ],
    risks: [
      "Third-party vendor policies or pricing can change after discovery and may affect the final plan.",
    ],
    assumptions: ["Client will provide branding copy and policy content."],
    nextSteps: [
      "Confirm the must-have scope for version one.",
      "Approve the estimate so discovery can start.",
    ],
    confidence: {
      overall: "high",
      note:
        "This draft is grounded well enough for review, but it still represents an estimate rather than a commitment.",
      sections: [],
    },
    evidence: [],
    unsupportedClaims: [],
    sources: [],
  };

  return {
    ...base,
    ...overrides,
    overview: { ...base.overview, ...overrides.overview },
    scope: { ...base.scope, ...overrides.scope },
    timeline: {
      ...base.timeline,
      ...overrides.timeline,
      phases: overrides.timeline?.phases ?? base.timeline.phases,
      dependencies: overrides.timeline?.dependencies ?? base.timeline.dependencies,
    },
    pricing: {
      ...base.pricing,
      ...overrides.pricing,
      modules: overrides.pricing?.modules ?? base.pricing.modules,
    },
    clientCosts: overrides.clientCosts ?? base.clientCosts,
    techStack: overrides.techStack ?? base.techStack,
    boundaries: overrides.boundaries ?? base.boundaries,
    risks: overrides.risks ?? base.risks,
    assumptions: overrides.assumptions ?? base.assumptions,
    nextSteps: overrides.nextSteps ?? base.nextSteps,
    confidence: { ...base.confidence, ...overrides.confidence },
    evidence: overrides.evidence ?? base.evidence,
    unsupportedClaims: overrides.unsupportedClaims ?? base.unsupportedClaims,
    sources: overrides.sources ?? base.sources,
  };
}

export function buildResearchFixture(
  overrides: Partial<ResearchPacket> = {}
): ResearchPacket {
  const base: ResearchPacket = {
    summary: "Primary vendor documentation was available for the core dependency checks.",
    dataQuality: "high",
    caveat: "Current vendor docs were available for the key client-borne dependencies.",
    evidence: [],
    vendorCosts: [],
    openQuestions: [],
    sources: [],
  };

  return {
    ...base,
    ...overrides,
    evidence: overrides.evidence ?? base.evidence,
    vendorCosts: overrides.vendorCosts ?? base.vendorCosts,
    openQuestions: overrides.openQuestions ?? base.openQuestions,
    sources: overrides.sources ?? base.sources,
  };
}

export function buildModelResponse(proposal: Proposal): ModelResponse {
  return {
    text: JSON.stringify(proposal),
    latencyMs: 5,
    inputTokens: 100,
    outputTokens: 200,
  };
}

export function buildClarificationAnswers(): Record<string, string> {
  return {
    budget: "$4k-$6k",
    deadline: "Launch within 8 weeks",
    user_scope: "1 admin and 4 staff users",
    operating_region: "India",
    payment_flow: "Collect one-time booking payments online",
    notification_volume: "Roughly 300 WhatsApp reminders per month",
    compliance_constraints: "No special compliance requirement is confirmed yet",
  };
}
