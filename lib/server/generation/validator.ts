// Validates and normalizes raw model output via the Zod ProposalSchema.
//
// Returns a discriminated union:
//   { success: true,  data: Proposal }          -- valid, already normalized
//   { success: false, reason: string }           -- failure reason for repair prompt
//
// All semantic rules (non-empty scope.core, >= 2 pricing modules, rationale length,
// feasibilityNote required for orange/red, totalMax >= totalMin, totalDays derived
// from phases, blank string filtering) are enforced inside ProposalSchema.
// Nothing is duplicated here.

import {
  ProposalSchema,
  ReplyDraftSchema,
} from "@/lib/domain/proposal/proposalSchema";
import type { Proposal, ReplyDraft } from "@/lib/domain/proposal/schema";

export type ValidateResult =
  | { success: true; data: Proposal }
  | { success: false; reason: string };

export type ValidateReplyDraftResult =
  | { success: true; data: ReplyDraft }
  | { success: false; reason: string };

export function validateProposal(raw: unknown): ValidateResult {
  const result = ProposalSchema.safeParse(raw);

  if (result.success) {
    // Cast is safe: ParsedProposal output type is structurally identical to Proposal.
    return { success: true, data: result.data as unknown as Proposal };
  }

  const reason = result.error.errors
    .map((e) => {
      const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
      return `${path}${e.message}`;
    })
    .join("; ");

  console.warn("[validateProposal] rejected:", reason);
  return { success: false, reason };
}

export function validateReplyDraft(raw: unknown): ValidateReplyDraftResult {
  const result = ReplyDraftSchema.safeParse(raw);

  if (result.success) {
    return { success: true, data: result.data as unknown as ReplyDraft };
  }

  const reason = result.error.errors
    .map((e) => {
      const path = e.path.length > 0 ? `${e.path.join(".")}: ` : "";
      return `${path}${e.message}`;
    })
    .join("; ");

  console.warn("[validateReplyDraft] rejected:", reason);
  return { success: false, reason };
}
