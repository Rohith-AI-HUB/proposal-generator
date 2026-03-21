// Orchestrates the full generation pipeline.
// route.ts calls generateProposal() and nothing else.
//
// Retry contract:
//   1. First attempt: full system prompt + user message with signals.
//   2. On JSON parse or schema validation failure: one repair attempt using
//      a terse prompt with the raw output and the failure reason.
//   3. If repair also fails: throw GenerationError("REPAIR_FAILED"). Done.
//
// Normalization:
//   The Zod schema in validateProposal trims, clamps, filters blanks, and
//   derives totalDays. normalizeProposal is not called separately.
//
// Meta:
//   attempt() accumulates model latency and token counts.
//   generateProposal() returns GenerationResult.meta so route.ts can emit
//   a structured log without coupling the logger to this module.
//   meta is internal only -- it is never included in the API response payload.

import { buildSystemPrompt, buildUserMessage, buildRepairMessage } from "./prompt";
import { preprocessRequirement } from "./preprocessor";
import { callModel } from "./model";
import { validateProposal } from "./validator";
import { renderProposalText } from "@/lib/server/rendering";
import type { Proposal, ErrorCode } from "@/lib/domain/proposal/schema";
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

// GenerationMeta is returned alongside the proposal so route.ts can build
// a structured log entry without needing to know about model internals.
export interface GenerationMeta {
  latencyMs:        number;  // wall-clock ms for all model calls combined
  inputTokens:      number;  // total across first attempt + repair (if used)
  outputTokens:     number;  // total across first attempt + repair (if used)
  repairUsed:       boolean;
  firstFailReason?: string;  // reason string from first attempt if it failed
  repairFailReason?: string; // reason string from repair attempt if it also failed
}

export interface GenerationResult {
  proposal:     Proposal;
  renderedText: string;
  meta:         GenerationMeta;
}

// --- Internal attempt result -------------------------------------------------

interface ModelMeta {
  latencyMs:    number;
  inputTokens:  number;
  outputTokens: number;
}

type AttemptOk   = { ok: true;  proposal: Proposal; modelMeta: ModelMeta };
type AttemptFail = { ok: false; rawText: string; reason: string; modelMeta: ModelMeta };
type AttemptResult = AttemptOk | AttemptFail;

const EMPTY_META: ModelMeta = { latencyMs: 0, inputTokens: 0, outputTokens: 0 };

// --- attempt() ---------------------------------------------------------------
//
// Makes one model call, parses JSON, and validates against the Zod schema.
// Returns a typed discriminated union -- never throws on parse/validation
// failures; only throws GenerationError on a hard model/network error.

async function attempt(
  systemPrompt: string,
  userMessage:  string,
  errorCode:    ErrorCode
): Promise<AttemptResult> {

  // Model call
  let modelMeta: ModelMeta = EMPTY_META;
  let rawText: string;
  try {
    const response = await callModel(systemPrompt, userMessage);
    rawText  = response.text;
    modelMeta = {
      latencyMs:    response.latencyMs,
      inputTokens:  response.inputTokens  ?? 0,
      outputTokens: response.outputTokens ?? 0,
    };
  } catch (err) {
    console.error("[attempt] model error:", err);
    throw new GenerationError(errorCode, ERROR_MESSAGES.MODEL_ERROR);
  }

  // JSON parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.warn("[attempt] JSON parse failed. Raw length:", rawText.length);
    return { ok: false, rawText, reason: "Response was not valid JSON.", modelMeta };
  }

  // Schema validation + normalization
  const result = validateProposal(parsed);
  if (!result.success) {
    console.warn("[attempt] schema validation failed:", result.reason);
    return { ok: false, rawText, reason: result.reason, modelMeta };
  }

  return { ok: true, proposal: result.data, modelMeta };
}

// --- generateProposal() ------------------------------------------------------

export async function generateProposal(
  requirement: string
): Promise<GenerationResult> {
  const systemPrompt = buildSystemPrompt();
  const signals      = preprocessRequirement(requirement);
  const userMessage  = buildUserMessage(requirement, signals);

  // First attempt
  const first = await attempt(systemPrompt, userMessage, "MODEL_ERROR");

  if (first.ok) {
    return {
      proposal:     first.proposal,
      renderedText: renderProposalText(first.proposal),
      meta: {
        latencyMs:    first.modelMeta.latencyMs,
        inputTokens:  first.modelMeta.inputTokens,
        outputTokens: first.modelMeta.outputTokens,
        repairUsed:   false,
      },
    };
  }

  // Repair attempt
  console.warn(
    "[generateProposal] first attempt failed -- attempting repair. Reason:",
    first.reason
  );

  const repairMessage = buildRepairMessage(first.rawText, first.reason);
  const repair = await attempt(systemPrompt, repairMessage, "REPAIR_FAILED");

  // Accumulate tokens across both attempts
  const totalLatencyMs    = first.modelMeta.latencyMs    + repair.modelMeta.latencyMs;
  const totalInputTokens  = first.modelMeta.inputTokens  + repair.modelMeta.inputTokens;
  const totalOutputTokens = first.modelMeta.outputTokens + repair.modelMeta.outputTokens;

  if (repair.ok) {
    return {
      proposal:     repair.proposal,
      renderedText: renderProposalText(repair.proposal),
      meta: {
        latencyMs:       totalLatencyMs,
        inputTokens:     totalInputTokens,
        outputTokens:    totalOutputTokens,
        repairUsed:      true,
        firstFailReason: first.reason,
      },
    };
  }

  // Both attempts exhausted -- hard fail
  console.error("[generateProposal] repair attempt also failed:", repair.reason);
  throw new GenerationError("REPAIR_FAILED", ERROR_MESSAGES.REPAIR_FAILED);
}
