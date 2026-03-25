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

export interface ClientCostItem {
  item: string;           // e.g. "Razorpay payment gateway"
  category: string;       // e.g. "Payment Gateway"
  estimatedCost: string;  // e.g. "2% per transaction" or "~₹800/month"
  mandatory: boolean;     // true = project cannot function without it
  notes: string | null;   // optional clarification
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
  clientCosts: ClientCostItem[];
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
  | "INVALID_BODY"
  | "INPUT_TOO_SHORT"
  | "INPUT_TOO_LONG"
  | "RATE_LIMITED"
  | "MODEL_ERROR"
  | "PARSE_ERROR"
  | "VALIDATION_ERROR"
  | "REPAIR_FAILED"
  | "CONFIG_ERROR";

export interface GenerateErrorResponse {
  error: string;
  code: ErrorCode;
}
