import { buildSystemPrompt, buildUserMessage, buildRepairMessage } from "./prompt";
import { applyPricingContext } from "./pricing";
import type { PricingContext } from "./prompt";
import { callModel, type ModelResponse } from "./model";
import { researchRequirement, type ResearchPacket } from "./research";
import { validateProposal } from "./validator";
import { renderProposalText } from "@/lib/server/rendering";
import type {
  ClarificationQuestion,
  ErrorCode,
  Proposal,
  ProposalSource,
} from "@/lib/domain/proposal/schema";
import { ERROR_MESSAGES } from "@/lib/domain/proposal/constants";
import { evaluateClarifications } from "./clarification";
import { applyTrustContext } from "./trust";

export class GenerationError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export interface GenerationMeta {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  repairUsed: boolean;
  clarificationIssued: boolean;
  clarificationCount: number;
  sourceCount: number;
  unsupportedClaimCount: number;
  sourceDomainQuality: "strong" | "mixed" | "weak" | null;
  firstFailReason?: string;
  repairFailReason?: string;
}

export type GenerationResult =
  | {
      status: "ready";
      proposal: Proposal;
      renderedText: string;
      meta: GenerationMeta;
    }
  | {
      status: "needs_clarification";
      summary: string;
      questions: ClarificationQuestion[];
      meta: GenerationMeta;
    };

interface ModelMeta {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

type AttemptOk = { ok: true; proposal: Proposal; modelMeta: ModelMeta };
type AttemptFail = { ok: false; rawText: string; reason: string; modelMeta: ModelMeta };
type AttemptResult = AttemptOk | AttemptFail;

const EMPTY_META: ModelMeta = { latencyMs: 0, inputTokens: 0, outputTokens: 0 };

function assessSourceDomainQuality(
  sources: ProposalSource[]
): "strong" | "mixed" | "weak" | null {
  if (sources.length === 0) return "weak";

  let strongCount = 0;

  for (const source of sources) {
    try {
      const url = new URL(source.url);
      const host = url.hostname.replace(/^www\./i, "");
      const path = url.pathname.toLowerCase();
      const strong =
        /(?:docs|help|api|pricing)/.test(path) ||
        host.split(".").length <= 2 ||
        host.startsWith("docs.") ||
        host.startsWith("help.");

      if (strong) strongCount += 1;
    } catch {
      // Ignore parse failures and let them drag the quality down.
    }
  }

  if (strongCount === sources.length) return "strong";
  if (strongCount > 0) return "mixed";
  return "weak";
}

async function attempt(
  systemPrompt: string,
  userMessage: string,
  errorCode: ErrorCode,
  modelCaller: (
    systemPrompt: string,
    userMessage: string
  ) => Promise<ModelResponse>
): Promise<AttemptResult> {
  let modelMeta: ModelMeta = EMPTY_META;
  let rawText: string;

  try {
    const response = await modelCaller(systemPrompt, userMessage);
    rawText = response.text;
    modelMeta = {
      latencyMs: response.latencyMs,
      inputTokens: response.inputTokens ?? 0,
      outputTokens: response.outputTokens ?? 0,
    };
  } catch (err) {
    console.error("[attempt] model error:", err);
    throw new GenerationError(errorCode, ERROR_MESSAGES.MODEL_ERROR);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    console.warn("[attempt] JSON parse failed. Raw length:", rawText.length);
    return { ok: false, rawText, reason: "Response was not valid JSON.", modelMeta };
  }

  const result = validateProposal(parsed);
  if (!result.success) {
    console.warn("[attempt] schema validation failed:", result.reason);
    return { ok: false, rawText, reason: result.reason, modelMeta };
  }

  return { ok: true, proposal: result.data, modelMeta };
}

function buildClarificationMeta(
  questionCount: number
): GenerationMeta {
  return {
    latencyMs: 0,
    inputTokens: 0,
    outputTokens: 0,
    repairUsed: false,
    clarificationIssued: true,
    clarificationCount: questionCount,
    sourceCount: 0,
    unsupportedClaimCount: 0,
    sourceDomainQuality: null,
  };
}

export interface GenerateInput {
  requirement: string;
  pricingCtx: PricingContext;
  clarificationAnswers?: Record<string, string>;
}

export interface GenerationDependencies {
  callModel: (
    systemPrompt: string,
    userMessage: string
  ) => Promise<ModelResponse>;
  researchRequirement: (
    requirement: string,
    pricingCtx: PricingContext
  ) => Promise<ResearchPacket>;
}

const DEFAULT_DEPENDENCIES: GenerationDependencies = {
  callModel,
  researchRequirement,
};

export async function generateProposal(
  input: GenerateInput,
  deps: GenerationDependencies = DEFAULT_DEPENDENCIES
): Promise<GenerationResult> {
  const { requirement, pricingCtx, clarificationAnswers = {} } = input;

  const clarification = evaluateClarifications(requirement, clarificationAnswers);

  if (clarification.needsClarification) {
    return {
      status: "needs_clarification",
      summary: clarification.summary,
      questions: clarification.questions,
      meta: buildClarificationMeta(clarification.questions.length),
    };
  }

  const enrichedRequirement = clarification.enrichedRequirement;
  const signals = clarification.signals;
  const systemPrompt = buildSystemPrompt(pricingCtx);

  let research: ResearchPacket | null = null;
  let researchLatencyMs = 0;

  try {
    const researchStart = Date.now();
    research = await deps.researchRequirement(enrichedRequirement, pricingCtx);
    researchLatencyMs = Date.now() - researchStart;
  } catch (err) {
    console.warn("[generateProposal] research stage failed:", err);
  }

  const userMessage = buildUserMessage(
    enrichedRequirement,
    pricingCtx,
    signals,
    research
  );

  const first = await attempt(
    systemPrompt,
    userMessage,
    "MODEL_ERROR",
    deps.callModel
  );

  if (first.ok) {
    const proposal = applyTrustContext(
      applyPricingContext(first.proposal, pricingCtx),
      enrichedRequirement,
      signals,
      research
    );

    return {
      status: "ready",
      proposal,
      renderedText: renderProposalText(proposal),
      meta: {
        latencyMs: researchLatencyMs + first.modelMeta.latencyMs,
        inputTokens: first.modelMeta.inputTokens,
        outputTokens: first.modelMeta.outputTokens,
        repairUsed: false,
        clarificationIssued: false,
        clarificationCount: 0,
        sourceCount: proposal.sources.length,
        unsupportedClaimCount: proposal.unsupportedClaims.length,
        sourceDomainQuality: assessSourceDomainQuality(proposal.sources),
      },
    };
  }

  console.warn(
    "[generateProposal] first attempt failed -- attempting repair. Reason:",
    first.reason
  );

  const repairMessage = buildRepairMessage(first.rawText, first.reason);
  const repair = await attempt(
    systemPrompt,
    repairMessage,
    "REPAIR_FAILED",
    deps.callModel
  );

  const totalLatencyMs =
    researchLatencyMs + first.modelMeta.latencyMs + repair.modelMeta.latencyMs;
  const totalInputTokens =
    first.modelMeta.inputTokens + repair.modelMeta.inputTokens;
  const totalOutputTokens =
    first.modelMeta.outputTokens + repair.modelMeta.outputTokens;

  if (repair.ok) {
    const proposal = applyTrustContext(
      applyPricingContext(repair.proposal, pricingCtx),
      enrichedRequirement,
      signals,
      research
    );

    return {
      status: "ready",
      proposal,
      renderedText: renderProposalText(proposal),
      meta: {
        latencyMs: totalLatencyMs,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        repairUsed: true,
        clarificationIssued: false,
        clarificationCount: 0,
        sourceCount: proposal.sources.length,
        unsupportedClaimCount: proposal.unsupportedClaims.length,
        sourceDomainQuality: assessSourceDomainQuality(proposal.sources),
        firstFailReason: first.reason,
      },
    };
  }

  console.error("[generateProposal] repair attempt also failed:", repair.reason);
  throw new GenerationError("REPAIR_FAILED", ERROR_MESSAGES.REPAIR_FAILED);
}
