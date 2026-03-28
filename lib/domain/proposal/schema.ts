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

export type GenerateResponse = GenerateReadyResponse;

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
