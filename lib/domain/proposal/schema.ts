// All Proposal types. Single source of truth for domain, server, and UI.

export type FeasibilityLevel = "green" | "amber" | "orange" | "red";
export type ConfidenceLevel = "high" | "medium" | "low";

export type ProposalSectionId =
  | "overview"
  | "scope"
  | "deliverables"
  | "timeline"
  | "pricing"
  | "clientCosts"
  | "techStack"
  | "boundaries"
  | "risks"
  | "assumptions"
  | "nextSteps";

export interface ClarificationQuestion {
  id: string;
  label: string;
  question: string;
  placeholder: string;
  reason: string;
}

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
  item: string;
  category: string;
  estimatedCost: string;
  mandatory: boolean;
  notes: string | null;
  sourceTitle: string | null;
  sourceUrl: string | null;
  sourceRationale: string | null;
  confidence: ConfidenceLevel;
}

export interface ProposalSource {
  title: string;
  url: string;
  snippet: string | null;
}

export interface ProposalEvidence {
  claim: string;
  section: ProposalSectionId | "overview";
  sourceTitle: string;
  sourceUrl: string;
  sourceRationale: string;
}

export interface ProposalUnsupportedClaim {
  claim: string;
  reason: string;
}

export interface ProposalSectionConfidence {
  section: ProposalSectionId;
  level: ConfidenceLevel;
  reason: string;
}

export interface ProposalConfidence {
  overall: ConfidenceLevel;
  note: string;
  sections: ProposalSectionConfidence[];
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
  confidence: ProposalConfidence;
  evidence: ProposalEvidence[];
  unsupportedClaims: ProposalUnsupportedClaim[];
  sources: ProposalSource[];
}

export interface ProofPack {
  specialty: string;
  proofPoints: string[];
  portfolioUrl: string;
}

export type DraftMode = "quick_reply" | "full_proposal";

export interface HookOption {
  rank: 1 | 2 | 3;
  hook: string;
  rationale: string;
}

export interface ReplyDraft {
  mode: DraftMode;
  finalProposal: string;
  hookOptions: HookOption[];
  matchedProof: string;
}

export interface GenerateReadyResponse {
  status: "ready";
  draft: ReplyDraft;
  renderedText: string;
}

export interface GenerateClarificationResponse {
  status: "needs_clarification";
  summary: string;
  questions: ClarificationQuestion[];
}

export type GenerateResponse =
  | GenerateReadyResponse;

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
