// Orchestrates the full generation pipeline.
// route.ts calls generateProposal() and nothing else.

import { buildSystemPrompt, buildUserMessage } from "./prompt";
import { callModel } from "./model";
import { validateProposal } from "./validator";
import { normalizeProposal } from "@/lib/domain/proposal/normalizer";
import { renderProposalText } from "@/lib/server/rendering";
import type { Proposal } from "@/lib/domain/proposal/schema";
import type { ErrorCode } from "@/lib/domain/proposal/schema";
import { ERROR_MESSAGES } from "@/lib/domain/proposal/constants";

export class GenerationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export interface GenerationResult {
  proposal: Proposal;
  renderedText: string;
}

export async function generateProposal(
  requirement: string
): Promise<GenerationResult> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(requirement);

  // Model call
  let rawText: string;
  try {
    const response = await callModel(systemPrompt, userMessage);
    rawText = response.text;
  } catch (err) {
    console.error("[generateProposal] model error:", err);
    throw new GenerationError("MODEL_ERROR", ERROR_MESSAGES.MODEL_ERROR);
  }

  // Parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    console.error("[generateProposal] parse error. Raw:", rawText, err);
    throw new GenerationError("PARSE_ERROR", ERROR_MESSAGES.PARSE_ERROR);
  }

  // Validate
  if (!validateProposal(parsed)) {
    console.error("[generateProposal] validation error. Parsed:", JSON.stringify(parsed, null, 2));
    throw new GenerationError("VALIDATION_ERROR", ERROR_MESSAGES.VALIDATION_ERROR);
  }

  // Normalize
  const proposal = normalizeProposal(parsed);

  // Render
  const renderedText = renderProposalText(proposal);

  return { proposal, renderedText };
}
