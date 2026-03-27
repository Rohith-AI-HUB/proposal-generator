import { buildRepairMessage, buildSystemPrompt, buildUserMessage } from "./prompt";
import { callModel, type ModelResponse } from "./model";
import { validateReplyDraft } from "./validator";
import { renderReplyDraftText } from "@/lib/server/rendering";
import type {
  DraftMode,
  ErrorCode,
  ProofPack,
  ReplyDraft,
} from "@/lib/domain/proposal/schema";
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

export interface GenerationMeta {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  repairUsed: boolean;
  hookCount: number;
  firstFailReason?: string;
}

export interface GenerationResult {
  status: "ready";
  draft: ReplyDraft;
  renderedText: string;
  meta: GenerationMeta;
}

interface ModelMeta {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
}

type AttemptOk = { ok: true; draft: ReplyDraft; modelMeta: ModelMeta };
type AttemptFail = { ok: false; rawText: string; reason: string; modelMeta: ModelMeta };
type AttemptResult = AttemptOk | AttemptFail;

const EMPTY_META: ModelMeta = { latencyMs: 0, inputTokens: 0, outputTokens: 0 };

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

  const result = validateReplyDraft(parsed);
  if (!result.success) {
    console.warn("[attempt] reply draft validation failed:", result.reason);
    return { ok: false, rawText, reason: result.reason, modelMeta };
  }

  return { ok: true, draft: result.data, modelMeta };
}

export interface GenerateInput {
  jobPost: string;
  proofPack: ProofPack;
  mode: DraftMode;
}

export interface GenerationDependencies {
  callModel: (
    systemPrompt: string,
    userMessage: string
  ) => Promise<ModelResponse>;
}

const DEFAULT_DEPENDENCIES: GenerationDependencies = {
  callModel,
};

export async function generateProposal(
  input: GenerateInput,
  deps: GenerationDependencies = DEFAULT_DEPENDENCIES
): Promise<GenerationResult> {
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(input.jobPost, input.proofPack, input.mode);

  const first = await attempt(
    systemPrompt,
    userMessage,
    "MODEL_ERROR",
    deps.callModel
  );

  if (first.ok) {
    return {
      status: "ready",
      draft: first.draft,
      renderedText: renderReplyDraftText(first.draft),
      meta: {
        latencyMs: first.modelMeta.latencyMs,
        inputTokens: first.modelMeta.inputTokens,
        outputTokens: first.modelMeta.outputTokens,
        repairUsed: false,
        hookCount: first.draft.hookOptions.length,
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

  if (repair.ok) {
    return {
      status: "ready",
      draft: repair.draft,
      renderedText: renderReplyDraftText(repair.draft),
      meta: {
        latencyMs: first.modelMeta.latencyMs + repair.modelMeta.latencyMs,
        inputTokens: first.modelMeta.inputTokens + repair.modelMeta.inputTokens,
        outputTokens: first.modelMeta.outputTokens + repair.modelMeta.outputTokens,
        repairUsed: true,
        hookCount: repair.draft.hookOptions.length,
        firstFailReason: first.reason,
      },
    };
  }

  console.error("[generateProposal] repair attempt also failed:", repair.reason);
  throw new GenerationError("REPAIR_FAILED", ERROR_MESSAGES.REPAIR_FAILED);
}
