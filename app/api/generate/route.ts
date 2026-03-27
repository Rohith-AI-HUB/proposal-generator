import { NextRequest, NextResponse } from "next/server";
import { generateProposal, GenerationError } from "@/lib/server/generation";
import { checkRateLimit } from "@/lib/server/ratelimit";
import { createRequestLog, emitLog } from "@/lib/server/logger";
import {
  MIN_REQUIREMENT_LENGTH,
  MAX_REQUIREMENT_LENGTH,
  ERROR_MESSAGES,
} from "@/lib/domain/proposal/constants";
import type {
  DraftMode,
  GenerateResponse,
  GenerateErrorResponse,
  ErrorCode,
  ProofPack,
} from "@/lib/domain/proposal/schema";

const STATUS_MAP: Record<ErrorCode, number> = {
  INVALID_BODY: 400,
  INPUT_TOO_SHORT: 400,
  INPUT_TOO_LONG: 413,
  RATE_LIMITED: 429,
  CONFIG_ERROR: 500,
  MODEL_ERROR: 502,
  PARSE_ERROR: 502,
  VALIDATION_ERROR: 502,
  REPAIR_FAILED: 502,
};

function extractIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function errorResponse(message: string, code: ErrorCode): NextResponse {
  const body: GenerateErrorResponse = { error: message, code };
  return NextResponse.json(body, { status: STATUS_MAP[code] ?? 500 });
}

function parseProofPack(value: unknown): ProofPack {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid proof pack");
  }

  const raw = value as Record<string, unknown>;
  const specialty =
    typeof raw.specialty === "string" ? raw.specialty.trim() : "";
  const portfolioUrl =
    typeof raw.portfolioUrl === "string" ? raw.portfolioUrl.trim() : "";
  const proofPoints = Array.isArray(raw.proofPoints)
    ? raw.proofPoints
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
        .slice(0, 3)
    : [];

  if (!specialty || !portfolioUrl || proofPoints.length !== 3) {
    throw new Error("invalid proof pack");
  }

  return {
    specialty,
    proofPoints,
    portfolioUrl,
  };
}

export async function POST(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const ip = extractIp(req);
  const log = createRequestLog(requestId, ip);
  const wallStart = Date.now();

  if (!process.env.GROQ_API_KEY) {
    log.status = 500;
    log.failureClass = "CONFIG_ERROR";
    log.latencyMs = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.CONFIG_ERROR, "CONFIG_ERROR");
  }

  const rl = await checkRateLimit(ip);
  if (!rl.allowed) {
    log.status = 429;
    log.failureClass = "RATE_LIMITED";
    log.latencyMs = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.RATE_LIMITED, "RATE_LIMITED");
  }

  let jobPost: string;
  let proofPack: ProofPack;
  let mode: DraftMode;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    jobPost =
      typeof body.jobPost === "string"
        ? body.jobPost.trim()
        : typeof body.requirement === "string"
          ? body.requirement.trim()
          : "";
    proofPack = parseProofPack(body.proofPack);
    mode = body.mode === "full_proposal" ? "full_proposal" : "quick_reply";
  } catch {
    log.status = 400;
    log.failureClass = "INVALID_BODY";
    log.latencyMs = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.INVALID_BODY, "INVALID_BODY");
  }

  if (jobPost.length < MIN_REQUIREMENT_LENGTH) {
    log.status = 400;
    log.failureClass = "INPUT_TOO_SHORT";
    log.latencyMs = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.INPUT_TOO_SHORT, "INPUT_TOO_SHORT");
  }

  if (jobPost.length > MAX_REQUIREMENT_LENGTH) {
    log.status = 413;
    log.failureClass = "INPUT_TOO_LONG";
    log.latencyMs = Date.now() - wallStart;
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.INPUT_TOO_LONG, "INPUT_TOO_LONG");
  }

  try {
    const result = await generateProposal({ jobPost, proofPack, mode });
    const { meta } = result;

    log.status = 200;
    log.latencyMs = meta.latencyMs;
    log.inputTokens = meta.inputTokens;
    log.outputTokens = meta.outputTokens;
    log.repairUsed = meta.repairUsed;
    log.hookCount = meta.hookCount;
    if (meta.repairUsed && meta.firstFailReason) {
      log.validationFailReason = meta.firstFailReason;
    }
    emitLog(log);

    const body: GenerateResponse = {
      status: "ready",
      draft: result.draft,
      renderedText: result.renderedText,
    };
    return NextResponse.json(body);
  } catch (err) {
    log.latencyMs = Date.now() - wallStart;

    if (err instanceof GenerationError) {
      log.status = STATUS_MAP[err.code] ?? 500;
      log.failureClass = err.code;

      if (err.code === "PARSE_ERROR") log.parseFailReason = err.message;
      if (err.code === "VALIDATION_ERROR") log.validationFailReason = err.message;
      if (err.code === "REPAIR_FAILED") log.repairFailReason = err.message;

      emitLog(log);
      return errorResponse(err.message, err.code);
    }

    console.error("[POST /api/generate] unexpected error:", err);
    log.status = 500;
    log.failureClass = "MODEL_ERROR";
    emitLog(log);
    return errorResponse(ERROR_MESSAGES.MODEL_ERROR, "MODEL_ERROR");
  }
}
