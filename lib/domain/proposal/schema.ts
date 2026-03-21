// All Proposal types. Single source of truth for domain, server, and UI.

export type FeasibilityLevel = "green" | "amber" | "orange" | "red";

export interface TimelinePhase {
  name: string;
  days: number;
  notes: string | null;
}

export interface PricingModule {
  module: string;
  rationale: string;
  cost: string;
}

export interface TechChoice {
  layer: string;
  choice: string;
  reason: string;
}

export interface ProposalOverview {
  summary: string;
  outcome: string;
  feasibility: FeasibilityLevel;
  feasibilityNote: string | null;
}

export interface ProposalScope {
  core: string[];
  extended: string[];
}

export interface ProposalTimeline {
  phases: TimelinePhase[];
  totalDays: number;
  dependencies: string[];
}

export interface ProposalPricing {
  totalMin: number;
  totalMax: number;
  currency: string;
  modules: PricingModule[];
  rationale: string;
  valueJustification: string;
  variabilityNote: string;
}

export interface Proposal {
  overview: ProposalOverview;
  scope: ProposalScope;
  deliverables: string[];
  timeline: ProposalTimeline;
  pricing: ProposalPricing;
  techStack: TechChoice[];
  boundaries: string[];
  risks: string[];
  assumptions: string[];
  nextSteps: string[];
}

// ─── API contract ─────────────────────────────────────────────────────────────

export interface GenerateResponse {
  proposal: Proposal;
  renderedText: string;
}

export type ErrorCode =
  | "INPUT_TOO_SHORT"
  | "INPUT_TOO_LONG"
  | "MODEL_ERROR"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "CONFIG_ERROR";

export interface GenerateErrorResponse {
  error: string;
  code: ErrorCode;
}
